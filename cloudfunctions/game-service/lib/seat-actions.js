const { db, success, fail, getCurrentUser } = require('./shared')

async function getSeatStatus() {
  const now = new Date()
  const inactiveStatus = new Set(['cancelled', 'finished', 'completed'])
  const totalRes = await db.collection('games').count()
  const total = totalRes.total || 0
  const pageSize = 100
  const games = []

  for (let offset = 0; offset < total; offset += pageSize) {
    const pageRes = await db.collection('games').skip(offset).limit(pageSize).get()
    const pageGames = (pageRes.data || []).filter((game) => !inactiveStatus.has(game.status))
    games.push(...pageGames)
  }

  const priority = { available: 0, reserved: 1, occupied: 2 }
  const statusByLocation = {}
  const normalizeLocationName = (name = '') => String(name).replace(/\s+/g, '').trim()

  games.forEach((game) => {
    if (!game.location) return
    const locationKey = normalizeLocationName(game.location)
    if (!locationKey) return

    let status = 'reserved'
    const gameTime = game.time ? new Date(game.time) : null
    if (game.status === 'ongoing' || (gameTime && gameTime <= now)) {
      status = 'occupied'
    }

    const current = statusByLocation[locationKey] || 'available'
    if (priority[status] > priority[current]) {
      statusByLocation[locationKey] = status
    }
  })

  const overrideRes = await db.collection('seat_status_overrides').where({ key: 'global' }).limit(1).get()
  const overrideMapRaw = (((overrideRes.data || [])[0]) || {}).overrides || {}
  const overrideMap = {}
  Object.keys(overrideMapRaw).forEach((key) => {
    const locationKey = normalizeLocationName(key)
    if (locationKey) {
      overrideMap[locationKey] = overrideMapRaw[key]
    }
  })

  const mergedStatusByLocation = { ...statusByLocation }
  Object.keys(overrideMap).forEach((locationKey) => {
    const current = mergedStatusByLocation[locationKey] || 'available'
    const override = overrideMap[locationKey] || 'available'
    mergedStatusByLocation[locationKey] = (priority[override] > priority[current]) ? override : current
  })

  return success({
    statusByLocation: mergedStatusByLocation,
    totalActiveGames: games.length
  }, '获取座位状态成功')
}

async function getSeatStatusOverrides() {
  const res = await db.collection('seat_status_overrides').where({ key: 'global' }).limit(1).get()
  const row = ((res.data || [])[0]) || {}
  return success({ overrides: row.overrides || {} }, '获取成功')
}

async function setSeatStatusOverrides(data, wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser || !currentUser.isAdmin) return fail(403, '仅管理员可操作')

  const overrides = (data && data.overrides) || {}
  const existed = await db.collection('seat_status_overrides').where({ key: 'global' }).limit(1).get()

  if ((existed.data || []).length) {
    await db.collection('seat_status_overrides').doc(existed.data[0]._id).update({
      data: {
        overrides,
        updatedAt: new Date(),
        updatedBy: currentUser._id
      }
    })
  } else {
    await db.collection('seat_status_overrides').add({
      data: {
        key: 'global',
        overrides,
        updatedAt: new Date(),
        updatedBy: currentUser._id
      }
    })
  }

  return success({ overrides }, '保存成功')
}

module.exports = {
  getSeatStatus,
  getSeatStatusOverrides,
  setSeatStatusOverrides
}
