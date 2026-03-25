const { db, success, fail, getCurrentUser } = require('./shared')
const _ = db.command

const PAGE_BATCH_SIZE = 100
const AUTO_COMPLETE_HOURS = 12
const CN_OFFSET_MS = 8 * 60 * 60 * 1000
const VALID_STATUSES = new Set(['available', 'reserved', 'occupied'])

function normalizeLocationName(name = '') {
  return String(name).replace(/\s+/g, '').trim()
}

function parseGameTime(input) {
  if (!input) return null
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input

  const text = String(input).trim()
  if (!text) return null

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/)
  if (match) {
    const [, y, m, d, hh = '0', mm = '0', ss = '0'] = match
    const date = new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}+08:00`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const normalized = text.includes(' ') ? text.replace(' ', 'T') : text
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseQueryDate(input) {
  if (!input) return null
  const text = String(input).trim()
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [, y, m, d] = match
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)) - CN_OFFSET_MS)
  return Number.isNaN(date.getTime()) ? null : date
}

function toYmd(date) {
  const shifted = new Date(date.getTime() + CN_OFFSET_MS)
  const y = shifted.getUTCFullYear()
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const d = String(shifted.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getCnDayStart(date = new Date()) {
  const shifted = new Date(date.getTime() + CN_OFFSET_MS)
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - CN_OFFSET_MS)
}

function getDateRange(queryDateInput) {
  const dayStart = parseQueryDate(queryDateInput) || getCnDayStart(new Date())
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  const date = toYmd(dayStart)
  return {
    dayStart,
    dayEnd,
    date,
    key: `day:${date}`
  }
}

function normalizeStatusMap(raw = {}) {
  const normalized = {}
  Object.keys(raw || {}).forEach((location) => {
    const locationKey = normalizeLocationName(location)
    const status = String(raw[location] || '').trim()
    if (!locationKey || !VALID_STATUSES.has(status)) return
    normalized[locationKey] = status
  })
  return normalized
}

async function getOverrideRowByKey(key) {
  const res = await db.collection('seat_status_overrides').where({ key }).limit(1).get()
  const row = ((res.data || [])[0]) || null
  return {
    row,
    overrides: normalizeStatusMap((row && row.overrides) || {})
  }
}

async function readAllByQuery(query) {
  const totalRes = await query.count()
  const total = totalRes.total || 0
  const list = []
  for (let offset = 0; offset < total; offset += PAGE_BATCH_SIZE) {
    const res = await query.skip(offset).limit(PAGE_BATCH_SIZE).get()
    list.push(...(res.data || []))
  }
  return list
}

async function fetchGamesByDate(dayStart, dayEnd, now = new Date()) {
  const query = db.collection('games').where({
    status: _.nin(['cancelled', 'finished'])
  })
  const allGames = await readAllByQuery(query)
  const inDayGames = []

  ;(allGames || []).forEach((game) => {
    if (!game || !game.time) return
    const gameTime = parseGameTime(game.time)
    if (!gameTime) return

    if (
      game.status === 'ongoing' &&
      now >= dayStart &&
      now < dayEnd &&
      gameTime < dayStart
    ) {
      inDayGames.push(game)
      return
    }

    if (gameTime >= dayStart && gameTime < dayEnd) {
      inDayGames.push(game)
    }
  })

  return inDayGames
}

async function promoteDueGamesToOngoing(games, now) {
  const dueGames = (games || []).filter((game) => {
    if (!game || game.status !== 'pending') return false
    const gameTime = parseGameTime(game.time)
    if (!gameTime) return false
    return gameTime <= now
  })

  if (!dueGames.length) return

  await Promise.all(
    dueGames.map(async (game) => {
      try {
        await db.collection('games').doc(game._id).update({
          data: { status: 'ongoing', updatedAt: new Date() }
        })
        game.status = 'ongoing'
      } catch (error) {
        console.error('promoteDueGamesToOngoing failed:', game._id, error)
      }
    })
  )
}

async function completeOvertimeOngoingGames(games, now) {
  const thresholdTs = now.getTime() - AUTO_COMPLETE_HOURS * 60 * 60 * 1000
  const overtimeGames = (games || []).filter((game) => {
    if (!game || game.status !== 'ongoing') return false
    const gameTime = parseGameTime(game.time)
    if (!gameTime) return false
    return gameTime.getTime() <= thresholdTs
  })

  if (!overtimeGames.length) return

  await Promise.all(
    overtimeGames.map(async (game) => {
      try {
        await db.collection('games').doc(game._id).update({
          data: { status: 'completed', updatedAt: new Date() }
        })
        game.status = 'completed'
      } catch (error) {
        console.error('completeOvertimeOngoingGames failed:', game._id, error)
      }
    })
  )
}

function buildGameSeatMap(games = []) {
  const priority = { available: 0, reserved: 1, occupied: 2 }
  const statusByLocation = {}
  const metaByLocation = {}
  const metaPriority = { ongoing: 2, pending: 1 }

  ;(games || []).forEach((game) => {
    if (!game || !game.location || !game.status) return
    if (!['pending', 'ongoing'].includes(game.status)) return

    const locationKey = normalizeLocationName(game.location)
    if (!locationKey) return

    const nextStatus = game.status === 'ongoing' ? 'occupied' : 'reserved'
    const currentStatus = statusByLocation[locationKey] || 'available'
    if (priority[nextStatus] > priority[currentStatus]) {
      statusByLocation[locationKey] = nextStatus
    }

    const existingMeta = metaByLocation[locationKey]
    const currentMetaPriority = metaPriority[game.status] || 0
    const existingMetaPriority = existingMeta ? (metaPriority[existingMeta.status] || 0) : -1
    const currentTime = parseGameTime(game.time) || new Date(8640000000000000)
    const existingTime = existingMeta ? (parseGameTime(existingMeta.time) || new Date(8640000000000000)) : new Date(8640000000000000)

    if (
      !existingMeta ||
      currentMetaPriority > existingMetaPriority ||
      (currentMetaPriority === existingMetaPriority && currentTime.getTime() < existingTime.getTime())
    ) {
      metaByLocation[locationKey] = {
        id: game._id,
        title: game.title || '',
        project: game.project || '',
        status: game.status,
        time: game.time,
        creatorId: game.creatorId || ''
      }
    }
  })

  return { statusByLocation, metaByLocation }
}

function buildSeatState({ gameStatusByLocation, gameMetaByLocation, manualOverrideByLocation }) {
  const finalStatusByLocation = {}

  const allLocations = new Set([
    ...Object.keys(gameStatusByLocation || {}),
    ...Object.keys(manualOverrideByLocation || {})
  ])

  allLocations.forEach((locationKey) => {
    const hasManual = Object.prototype.hasOwnProperty.call(manualOverrideByLocation || {}, locationKey)
    const gameStatus = gameStatusByLocation[locationKey] || 'available'

    // Simple mode: game status has priority, manual only fills when game is available.
    const manualStatus = hasManual ? manualOverrideByLocation[locationKey] : 'available'
    let status = gameStatus !== 'available' ? gameStatus : manualStatus

    if (status !== 'available') {
      finalStatusByLocation[locationKey] = status
    }
  })

  return {
    statusByLocation: finalStatusByLocation,
    gameMetaByLocation
  }
}

async function loadSeatRuntimeState(dateInput) {
  const now = new Date()
  const { dayStart, dayEnd, date, key } = getDateRange(dateInput)
  const games = await fetchGamesByDate(dayStart, dayEnd, now)

  await promoteDueGamesToOngoing(games, now)
  await completeOvertimeOngoingGames(games, now)

  const { statusByLocation: gameStatusByLocation, metaByLocation: gameMetaByLocation } = buildGameSeatMap(games)
  const dayRow = await getOverrideRowByKey(key)

  const seatState = buildSeatState({
    gameStatusByLocation,
    gameMetaByLocation,
    manualOverrideByLocation: dayRow.overrides || {}
  })

  return {
    date,
    key,
    dayRow,
    gameStatusByLocation,
    seatState,
    totalActiveGames: games.filter((g) => ['pending', 'ongoing'].includes(g.status)).length
  }
}

async function getSeatStatus(data = {}) {
  const runtime = await loadSeatRuntimeState(data.date)
  return success({
    date: runtime.date,
    key: runtime.key,
    gameStatusByLocation: runtime.gameStatusByLocation,
    gameMetaByLocation: runtime.seatState.gameMetaByLocation,
    manualOverrideByLocation: runtime.dayRow.overrides || {},
    statusByLocation: runtime.seatState.statusByLocation,
    totalActiveGames: runtime.totalActiveGames
  }, '获取座位状态成功')
}

async function setSeatStatusOverrides(data = {}, wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser || !currentUser.isAdmin) {
    return fail(403, '仅管理员可操作')
  }

  const { key } = getDateRange(data.date)
  const input = data.overrides || {}
  const normalizedInput = normalizeStatusMap(input)
  const nextOverrides = { ...normalizedInput }

  const existed = await db.collection('seat_status_overrides').where({ key }).limit(1).get()
  const docData = {
    key,
    overrides: nextOverrides,
    updatedAt: new Date(),
    updatedBy: currentUser._id
  }

  if ((existed.data || []).length) {
    await db.collection('seat_status_overrides').doc(existed.data[0]._id).update({ data: docData })
  } else {
    await db.collection('seat_status_overrides').add({ data: docData })
  }

  return success({ key, overrides: nextOverrides }, '保存座位覆盖状态成功')
}

module.exports = {
  getSeatStatus,
  setSeatStatusOverrides
}
