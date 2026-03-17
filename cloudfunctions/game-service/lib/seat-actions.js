const { db, _, success, fail, getCurrentUser } = require('./shared')

async function getSeatStatus() {
  const now = new Date()
  const where = { status: _.nin(['cancelled', 'finished', 'completed']) }

  const totalRes = await db.collection('games').where(where).count()
  const total = totalRes.total || 0
  const pageSize = 100
  const games = []

  for (let offset = 0; offset < total; offset += pageSize) {
    const pageRes = await db.collection('games').where(where).skip(offset).limit(pageSize).get()
    games.push(...(pageRes.data || []))
  }

  const priority = { available: 0, reserved: 1, occupied: 2 }
  const statusByLocation = {}

  games.forEach((game) => {
    if (!game.location) return

    let status = 'reserved'
    const gameTime = game.time ? new Date(game.time) : null
    if (game.status === 'ongoing' || (gameTime && gameTime <= now)) {
      status = 'occupied'
    }

    const current = statusByLocation[game.location] || 'available'
    if (priority[status] > priority[current]) {
      statusByLocation[game.location] = status
    }
  })

  const overrideRes = await db.collection('seat_status_overrides').where({ key: 'global' }).limit(1).get()
  const overrideMap = (((overrideRes.data || [])[0]) || {}).overrides || {}

  return success({
    statusByLocation: { ...statusByLocation, ...overrideMap },
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
