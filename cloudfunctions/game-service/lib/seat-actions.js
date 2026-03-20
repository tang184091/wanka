const { db, success, fail, getCurrentUser } = require('./shared')
const _ = db.command

function normalizeLocationName(name = '') {
  return String(name).replace(/\s+/g, '').trim()
}

function parseQueryDate(input) {
  if (!input) return null
  const text = String(input).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const date = new Date(`${text}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDateRange(queryDateInput) {
  const selected = parseQueryDate(queryDateInput) || new Date()
  const dayStart = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 0, 0, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
  return {
    dayStart,
    dayEnd,
    date: toYmd(dayStart),
    key: `day:${toYmd(dayStart)}`
  }
}

function shouldAutoReleaseOccupiedAt18(dateStr, now = new Date()) {
  const selected = parseQueryDate(dateStr)
  if (!selected) return false
  if (now.getHours() < 18) return false
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  return selected.getTime() <= todayStart.getTime()
}

function normalizeOverrideMap(raw = {}) {
  const normalized = {}
  Object.keys(raw || {}).forEach((location) => {
    const locationKey = normalizeLocationName(location)
    if (!locationKey) return
    normalized[locationKey] = raw[location]
  })
  return normalized
}

async function getOverrideRowByKey(key) {
  const res = await db.collection('seat_status_overrides').where({ key }).limit(1).get()
  const row = ((res.data || [])[0]) || null
  const overrides = normalizeOverrideMap((row && row.overrides) || {})
  return { row, overrides }
}

async function fetchActiveGamesByDate(dayStart, dayEnd) {
  const inactiveStatus = ['cancelled', 'finished', 'completed']
  const query = db.collection('games').where({
    status: _.nin(inactiveStatus)
  })

  const totalRes = await query.count()
  const total = totalRes.total || 0
  const pageSize = 100
  const games = []

  for (let offset = 0; offset < total; offset += pageSize) {
    const pageRes = await query.skip(offset).limit(pageSize).get()
    ;(pageRes.data || []).forEach((game) => {
      const gameTime = new Date(game.time)
      if (Number.isNaN(gameTime.getTime())) return
      if (gameTime < dayStart || gameTime >= dayEnd) return
      games.push(game)
    })
  }

  return games
}

function buildGameStatusByLocation(games, now, dayEnd) {
  const priority = { available: 0, reserved: 1, occupied: 2 }
  const gameStatusByLocation = {}
  const isPastDay = dayEnd <= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)

  games.forEach((game) => {
    if (!game.location || !game.time) return
    const gameTime = new Date(game.time)
    if (Number.isNaN(gameTime.getTime())) return

    const locationKey = normalizeLocationName(game.location)
    if (!locationKey) return

    let status = 'reserved'
    if (game.status === 'ongoing' || isPastDay || gameTime <= now) {
      status = 'occupied'
    }

    const current = gameStatusByLocation[locationKey] || 'available'
    if (priority[status] > priority[current]) {
      gameStatusByLocation[locationKey] = status
    }
  })

  return gameStatusByLocation
}

function mergeSeatStatus({
  gameStatusByLocation,
  manualOverrideByLocation,
  forceClearOccupied,
  autoReleaseOccupied
}) {
  const mergedStatusByLocation = {}
  const sourceByLocation = {}
  const allLocations = new Set([
    ...Object.keys(gameStatusByLocation || {}),
    ...Object.keys(manualOverrideByLocation || {})
  ])

  allLocations.forEach((locationKey) => {
    const gameStatus = gameStatusByLocation[locationKey] || 'available'
    const manualStatus = manualOverrideByLocation[locationKey] || 'available'

    let status = 'available'
    let source = ''
    if (gameStatus !== 'available') {
      status = gameStatus
      source = 'game'
    } else if (manualStatus !== 'available') {
      status = manualStatus
      source = 'manual'
    }

    if ((forceClearOccupied || autoReleaseOccupied) && status === 'occupied') {
      status = 'available'
      source = ''
    }

    if (status !== 'available') {
      mergedStatusByLocation[locationKey] = status
      sourceByLocation[locationKey] = source
    }
  })

  return { mergedStatusByLocation, sourceByLocation }
}

async function getSeatStatus(data = {}) {
  const now = new Date()
  const { dayStart, dayEnd, date, key } = getDateRange(data.date)
  const games = await fetchActiveGamesByDate(dayStart, dayEnd)
  const gameStatusByLocation = buildGameStatusByLocation(games, now, dayEnd)

  const [globalRow, dayRow] = await Promise.all([
    getOverrideRowByKey('global'),
    getOverrideRowByKey(key)
  ])

  // global override only allows occupied to avoid stale reserved for all days
  const globalOverrideByLocation = {}
  Object.keys(globalRow.overrides || {}).forEach((locationKey) => {
    if (globalRow.overrides[locationKey] === 'occupied') {
      globalOverrideByLocation[locationKey] = 'occupied'
    }
  })

  const manualOverrideByLocation = {
    ...globalOverrideByLocation,
    ...(dayRow.overrides || {})
  }
  const forceClearOccupied = !!(dayRow.row && dayRow.row.clearOccupied)
  const autoReleaseOccupied = shouldAutoReleaseOccupiedAt18(date, now)
  const { mergedStatusByLocation, sourceByLocation } = mergeSeatStatus({
    gameStatusByLocation,
    manualOverrideByLocation,
    forceClearOccupied,
    autoReleaseOccupied
  })

  return success({
    date,
    key,
    gameStatusByLocation,
    manualOverrideByLocation,
    sourceByLocation,
    forceClearOccupied,
    autoReleaseOccupied,
    statusByLocation: mergedStatusByLocation,
    totalActiveGames: games.length
  }, '获取座位状态成功')
}

async function getSeatStatusOverrides(data = {}) {
  const { key } = getDateRange(data.date)
  const [globalRow, dayRow] = await Promise.all([
    getOverrideRowByKey('global'),
    getOverrideRowByKey(key)
  ])

  return success({
    key,
    globalOverrides: globalRow.overrides || {},
    dayOverrides: dayRow.overrides || {},
    clearOccupied: !!(dayRow.row && dayRow.row.clearOccupied)
  }, '获取成功')
}

async function setSeatStatusOverrides(data, wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser || !currentUser.isAdmin) return fail(403, '仅管理员可操作')

  const rawOverrides = (data && data.overrides) || {}
  const clearOccupied = !!(data && data.clearOccupied)
  const scope = String((data && data.scope) || '').trim()
  const { dayStart, dayEnd, key } = scope === 'global'
    ? { dayStart: null, dayEnd: null, key: 'global' }
    : getDateRange((data && data.date) || '')

  const validStatuses = new Set(['available', 'reserved', 'occupied'])
  const normalizedOverrides = {}
  Object.keys(rawOverrides).forEach((location) => {
    const locationKey = normalizeLocationName(location)
    const status = String(rawOverrides[location] || '').trim()
    if (!locationKey || !validStatuses.has(status)) return
    normalizedOverrides[locationKey] = status
  })

  // online reservation always wins: only save manual status that differs from online status
  const onlineMap = {}
  if (scope !== 'global') {
    const games = await fetchActiveGamesByDate(dayStart, dayEnd)
    Object.assign(onlineMap, buildGameStatusByLocation(games, new Date(), dayEnd))
  }

  const overrides = {}
  Object.keys(normalizedOverrides).forEach((locationKey) => {
    const manualStatus = normalizedOverrides[locationKey]
    const onlineStatus = onlineMap[locationKey] || 'available'
    if (manualStatus === 'available') return
    if (scope === 'global' && manualStatus !== 'occupied') return
    if (manualStatus === onlineStatus) return
    overrides[locationKey] = manualStatus
  })

  const existed = await db.collection('seat_status_overrides').where({ key }).limit(1).get()
  const docData = {
    overrides,
    clearOccupied: scope === 'global' ? false : clearOccupied,
    updatedAt: new Date(),
    updatedBy: currentUser._id
  }

  if ((existed.data || []).length) {
    await db.collection('seat_status_overrides').doc(existed.data[0]._id).update({
      data: docData
    })
  } else {
    await db.collection('seat_status_overrides').add({
      data: {
        key,
        ...docData
      }
    })
  }

  return success({ key, overrides, clearOccupied: docData.clearOccupied }, '保存成功')
}

module.exports = {
  getSeatStatus,
  getSeatStatusOverrides,
  setSeatStatusOverrides
}
