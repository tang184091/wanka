const {
  db,
  _,
  DEFAULT_AVATAR,
  success,
  fail,
  getCurrentUser,
  normalizeUserBrief,
  normalizeParticipants,
  enrichGame,
  addActivity
} = require('./shared')

async function createGame(data, wxContext) {
  const payload = data || {}
  const gameData = payload.gameData
  if (!gameData) return fail(400, '缺少游戏数据')

  const type = gameData.type || 'mahjong'
  const maxPlayers = Number(gameData.maxPlayers || 0)
  const playerRange = {
    mahjong: [3, 4],
    boardgame: [2, 10],
    videogame: [2, 8],
    competition: [4, 32]
  }
  const [minAllowed, maxAllowed] = playerRange[type] || [2, 20]
  if (maxPlayers < minAllowed || maxPlayers > maxAllowed) {
    return fail(400, `该活动类型人数需在${minAllowed}-${maxAllowed}之间`)
  }

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在，请先登录')

  const creatorInfo = normalizeUserBrief(currentUser)
  const now = new Date()
  const game = {
    ...gameData,
    creatorId: currentUser._id,
    creatorInfo,
    participants: [],
    currentPlayers: 1,
    status: 'pending',
    isFull: false,
    createdAt: now,
    updatedAt: now
  }

  const addRes = await db.collection('games').add({ data: game })

  await db.collection('participations').add({
    data: {
      gameId: addRes._id,
      userId: currentUser._id,
      userName: creatorInfo.nickname,
      userAvatar: creatorInfo.avatar,
      createdAt: now
    }
  })

  await addActivity(addRes._id, 'create', currentUser, `${creatorInfo.nickname} 创建了此组局`)

  return success({ id: addRes._id, ...game }, '创建成功')
}

async function getGameList(data, wxContext) {
  const { page = 1, pageSize = 10, type, status = 'pending' } = data || {}

  const cond = { status }
  if (type && type !== 'all') cond.type = type

  const query = db.collection('games').where(cond)
  const [totalRes, listRes] = await Promise.all([
    query.count(),
    query.orderBy('time', 'asc').skip((page - 1) * pageSize).limit(pageSize).get()
  ])

  const user = await getCurrentUser(wxContext)
  const viewerUserId = user ? user._id : ''

  const list = []
  for (const game of listRes.data || []) {
    list.push(await enrichGame(game, viewerUserId))
  }

  return success({
    list,
    total: totalRes.total || 0,
    page,
    pageSize,
    hasMore: page * pageSize < (totalRes.total || 0)
  }, '获取成功')
}

async function getGameDetail(data, wxContext) {
  const { gameId } = data || {}
  if (!gameId) return fail(400, '缺少组局ID')

  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')

  const user = await getCurrentUser(wxContext)
  const detail = await enrichGame(gameRes.data, user ? user._id : '')

  const activitiesRes = await db.collection('activities')
    .where({ gameId })
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get()

  detail.activities = activitiesRes.data || []

  return success(detail, '获取成功')
}

async function updateGame(data, wxContext) {
  const { gameId, updates } = data || {}
  if (!gameId || !updates) return fail(400, '缺少必要参数')

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在')

  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')
  if (gameRes.data.creatorId !== currentUser._id) return fail(403, '只有创建者可以修改组局')

  if (updates.time && new Date(updates.time) <= new Date()) {
    return fail(400, '活动时间必须是将来的时间')
  }

  if (updates.maxPlayers) {
    const maxPlayers = Number(updates.maxPlayers)
    const gameType = updates.type || gameRes.data.type
    const maxAllowed = gameType === 'competition' ? 32 : 20
    const minAllowed = gameType === 'competition' ? 4 : 2
    if (maxPlayers < minAllowed || maxPlayers > maxAllowed) {
      return fail(400, `参与人数必须在${minAllowed}-${maxAllowed}人之间`)
    }

    const participants = await normalizeParticipants(gameRes.data.participants || [])
    const currentPlayers = participants.length + 1
    if (currentPlayers > maxPlayers) {
      return fail(400, `当前已有${currentPlayers}人参与，不能设置少于当前人数的最大人数`)
    }
  }

  await db.collection('games').doc(gameId).update({
    data: {
      ...updates,
      updatedAt: new Date()
    }
  })

  await addActivity(gameId, 'update', currentUser, `${currentUser.nickname || '未知用户'} 更新了组局信息`)
  return success(null, '更新成功')
}

async function deleteGame(data, wxContext) {
  const { gameId } = data || {}
  if (!gameId) return fail(400, '缺少组局ID')

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在')

  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')
  if (gameRes.data.creatorId !== currentUser._id) return fail(403, '只有创建者可以取消组局')

  await db.collection('games').doc(gameId).update({
    data: {
      status: 'cancelled',
      updatedAt: new Date()
    }
  })

  await addActivity(gameId, 'cancel', currentUser, `${currentUser.nickname || '未知用户'} 取消了此组局`)
  return success(null, '组局已取消')
}

async function joinGame(data, wxContext) {
  const { gameId, userId } = data || {}
  if (!gameId || !userId) return fail(400, '缺少必要参数')

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在')
  if (currentUser._id !== userId) return fail(403, '无权操作其他用户')

  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')

  const game = gameRes.data
  if (game.status !== 'pending') return fail(400, '此组局已不可加入')
  if (game.creatorId === userId) return fail(400, '您是本组局的创建者')

  const participants = await normalizeParticipants(game.participants || [])
  if (participants.some((p) => p.id === userId)) return fail(400, '您已加入此组局')

  const currentPlayers = participants.length + 1
  if (currentPlayers >= (game.maxPlayers || 4)) return fail(400, '组局已满员')

  const newParticipant = {
    id: currentUser._id,
    nickname: currentUser.nickname || '未知用户',
    avatar: currentUser.avatar || DEFAULT_AVATAR
  }

  await db.collection('games').doc(gameId).update({
    data: {
      participants: _.push(newParticipant),
      isFull: (currentPlayers + 1) >= (game.maxPlayers || 4),
      updatedAt: new Date()
    }
  })

  await db.collection('participations').add({
    data: {
      gameId,
      userId,
      createdAt: new Date()
    }
  })

  await addActivity(gameId, 'join', currentUser, `${currentUser.nickname || '未知用户'} 加入了组局`)

  return success({
    currentPlayers: currentPlayers + 1,
    isFull: (currentPlayers + 1) >= (game.maxPlayers || 4)
  }, '加入成功')
}

async function quitGame(data, wxContext) {
  const { gameId, userId } = data || {}
  if (!gameId || !userId) return fail(400, '缺少必要参数')

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在')
  if (currentUser._id !== userId) return fail(403, '无权操作其他用户')

  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')

  if (gameRes.data.creatorId === userId) return fail(400, '创建者不能退出，请取消组局')

  const participants = await normalizeParticipants(gameRes.data.participants || [])
  const filtered = participants.filter((p) => p.id !== userId)
  if (filtered.length === participants.length) return fail(400, '您未加入此组局')

  await db.collection('games').doc(gameId).update({
    data: {
      participants: filtered,
      isFull: false,
      updatedAt: new Date()
    }
  })

  await db.collection('participations').where({ gameId, userId }).remove()
  await addActivity(gameId, 'quit', currentUser, `${currentUser.nickname || '未知用户'} 退出了组局`)

  return success({ currentPlayers: filtered.length + 1 }, '已退出组局')
}

async function getMyGames(data, wxContext) {
  const { type = 'all' } = data || {}

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在，请先登录', [])

  const userId = currentUser._id
  const gameMap = {}

  if (type === 'created' || type === 'all') {
    const createdRes = await db.collection('games')
      .where({ creatorId: userId, status: 'pending' })
      .orderBy('createdAt', 'desc')
      .get()
    ;(createdRes.data || []).forEach((item) => {
      gameMap[item._id] = item
    })
  }

  if (type === 'joined' || type === 'all') {
    const joinedRes = await db.collection('games')
      .where({ status: 'pending', 'participants.id': userId })
      .orderBy('createdAt', 'desc')
      .get()
    ;(joinedRes.data || []).forEach((item) => {
      gameMap[item._id] = item
    })
  }

  const result = []
  for (const gameId of Object.keys(gameMap)) {
    result.push(await enrichGame(gameMap[gameId], userId))
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return success(result, '获取成功')
}

async function getCreatedGames(data) {
  const { userId } = data || {}
  if (!userId) return fail(400, '缺少用户ID', [])

  const gamesRes = await db.collection('games')
    .where({ creatorId: userId, status: 'pending' })
    .orderBy('createdAt', 'desc')
    .get()

  return success(gamesRes.data || [], '获取成功')
}

async function getJoinedGames(data) {
  const { userId } = data || {}
  if (!userId) return fail(400, '缺少用户ID', [])

  const participationsRes = await db.collection('participations').where({ userId }).get()
  const gameIds = [...new Set((participationsRes.data || []).map((p) => p.gameId).filter(Boolean))]

  if (!gameIds.length) return success([], '暂无参与组局')

  const gamesRes = await db.collection('games')
    .where({ _id: _.in(gameIds), status: 'pending' })
    .orderBy('time', 'asc')
    .get()

  return success(gamesRes.data || [], '获取成功')
}

async function searchGames(data) {
  const { keyword = '', type = 'all', location = '' } = data || {}
  if (!keyword && !location && (!type || type === 'all')) return fail(400, '缺少搜索条件', [])

  const where = { status: 'pending' }
  if (type && type !== 'all') where.type = type
  if (keyword) {
    where.title = db.RegExp({ regexp: keyword, options: 'i' })
  }
  if (location) {
    where.location = db.RegExp({ regexp: location, options: 'i' })
  }

  const gamesRes = await db.collection('games')
    .where(where)
    .orderBy('time', 'asc')
    .limit(50)
    .get()

  return success(gamesRes.data || [], '搜索成功')
}

module.exports = {
  createGame,
  getGameList,
  getGameDetail,
  updateGame,
  deleteGame,
  joinGame,
  quitGame,
  getMyGames,
  getCreatedGames,
  getJoinedGames,
  searchGames
}
