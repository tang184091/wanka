/// 组局服务云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const DEFAULT_AVATAR = 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png'

const success = (data = null, message = 'ok') => ({ code: 0, message, data })
const fail = (code, message, data = null) => ({ code, message, data })

exports.main = async (event) => {
  const { action, data } = event || {}
  const wxContext = cloud.getWXContext()

  console.log('game-service 调用:', { action, openid: wxContext.OPENID })

  try {
    switch (action) {
      case 'test':
        return success({
          timestamp: new Date().toISOString(),
          openid: wxContext.OPENID,
          appid: wxContext.APPID
        }, 'game-service 运行正常')
      case 'createGame':
        return await createGame(data, wxContext)
      case 'getGameList':
        return await getGameList(data, wxContext)
      case 'getGameDetail':
        return await getGameDetail(data, wxContext)
      case 'updateGame':
        return await updateGame(data, wxContext)
      case 'deleteGame':
        return await deleteGame(data, wxContext)
      case 'joinGame':
        return await joinGame(data, wxContext)
      case 'quitGame':
        return await quitGame(data, wxContext)
      case 'getMyGames':
        return await getMyGames(data, wxContext)
      case 'getCreatedGames':
        return await getCreatedGames(data)
      case 'getJoinedGames':
        return await getJoinedGames(data)
      case 'searchGames':
        return await searchGames(data)
      case 'getSeatStatus':
        return await getSeatStatus()
      case 'getMahjongRecords':
        return await getMahjongRecords()
      case 'getMahjongRecordDetail':
        return await getMahjongRecordDetail(data)
      case 'createMahjongRecord':
        return await createMahjongRecord(data, wxContext)
      case 'getSeatStatusOverrides':
        return await getSeatStatusOverrides()
      case 'setSeatStatusOverrides':
        return await setSeatStatusOverrides(data, wxContext)
      default:
        return fail(400, '未知操作')
    }
  } catch (error) {
    console.error('game-service 未捕获错误:', error)
    return fail(500, `服务器内部错误: ${error.message}`)
  }
}

async function getCurrentUser(wxContext) {
  const userRes = await db.collection('users').where({ openid: wxContext.OPENID }).limit(1).get()
  return (userRes.data || [])[0] || null
}

function normalizeUserBrief(user) {
  if (!user) {
    return {
      id: '',
      nickname: '未知用户',
      avatar: DEFAULT_AVATAR,
      tags: [],
      gender: 0
    }
  }

  return {
    id: user.id || user._id || '',
    nickname: user.nickname || '未知用户',
    avatar: user.avatar || DEFAULT_AVATAR,
    tags: user.tags || [],
    gender: user.gender || 0
  }
}

async function getUserMapByIds(ids = []) {
  const distinct = [...new Set(ids.filter(Boolean))]
  if (!distinct.length) return {}

  const map = {}
  for (let i = 0; i < distinct.length; i += 100) {
    const chunk = distinct.slice(i, i + 100)
    const res = await db.collection('users').where({ _id: _.in(chunk) }).get()
    ;(res.data || []).forEach((user) => {
      map[user._id] = user
    })
  }
  return map
}

function participantId(item) {
  if (!item) return ''
  if (typeof item === 'string') return item
  return item.id || item.userId || ''
}

async function normalizeParticipants(participants = []) {
  if (!Array.isArray(participants) || !participants.length) return []

  if (typeof participants[0] !== 'string') {
    return participants.map((p) => ({
      id: participantId(p),
      nickname: p.nickname || '未知用户',
      avatar: p.avatar || DEFAULT_AVATAR
    }))
  }

  const userMap = await getUserMapByIds(participants)
  return participants.map((uid) => {
    const user = userMap[uid]
    return {
      id: uid,
      nickname: (user && user.nickname) || '未知用户',
      avatar: (user && user.avatar) || DEFAULT_AVATAR
    }
  })
}

async function normalizeCreatorInfo(creatorInfo, creatorId) {
  if (creatorInfo && typeof creatorInfo === 'object') return normalizeUserBrief(creatorInfo)

  if (!creatorId) return normalizeUserBrief(null)

  try {
    const userRes = await db.collection('users').doc(creatorId).get()
    return normalizeUserBrief(userRes.data)
  } catch (error) {
    return normalizeUserBrief({ id: creatorId })
  }
}

async function enrichGame(game, viewerUserId) {
  const participants = await normalizeParticipants(game.participants || [])
  const creatorInfo = await normalizeCreatorInfo(game.creatorInfo, game.creatorId)
  const joined = participants.some((p) => p.id === viewerUserId)
  const isCreator = game.creatorId === viewerUserId

  return {
    ...game,
    id: game._id,
    creatorInfo,
    participants,
    currentPlayers: participants.length + 1,
    isFull: (participants.length + 1) >= (game.maxPlayers || 4),
    isJoined: isCreator || joined,
    isCreator
  }
}

async function addActivity(gameId, type, user, text) {
  try {
    await db.collection('activities').add({
      data: {
        gameId,
        type,
        userId: user._id,
        userName: user.nickname || '未知用户',
        text,
        createdAt: new Date()
      }
    })
  } catch (error) {
    console.error('写入活动记录失败:', error)
  }
}

async function createGame(data, wxContext) {
  const payload = data || {}
  const gameData = payload.gameData
  if (!gameData) return fail(400, '缺少游戏数据')

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
    if (maxPlayers < 2 || maxPlayers > 20) return fail(400, '参与人数必须在2-20人之间')

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

async function fillPlayerNicknames(players = []) {
  const userIds = [...new Set(players.map((item) => item.userId).filter(Boolean))]
  const userMap = await getUserMapByIds(userIds)

  return players.map((player) => ({
    ...player,
    nickname: player.nickname || (userMap[player.userId] && userMap[player.userId].nickname) || '未知玩家'
  }))
}

async function getMahjongRecords() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const res = await db.collection('mahjong_records')
    .where({ createdAt: _.gte(sevenDaysAgo) })
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get()

  const list = []
  for (const record of res.data || []) {
    list.push({
      ...record,
      players: await fillPlayerNicknames(record.players || [])
    })
  }

  return success({ list }, '获取成功')
}

async function getMahjongRecordDetail(data) {
  const { recordId } = data || {}
  if (!recordId) return fail(400, '缺少战绩ID')

  const res = await db.collection('mahjong_records').doc(recordId).get()
  if (!res.data) return fail(404, '战绩不存在')

  return success({
    ...res.data,
    players: await fillPlayerNicknames(res.data.players || [])
  }, '获取成功')
}

async function createMahjongRecord(data, wxContext) {
  const players = (data && data.players) || []
  if (!Array.isArray(players) || players.length !== 4) return fail(400, '必须提交4位玩家数据')

  const scores = players.map((item) => Number(item.score || 0))
  const totalScore = scores.reduce((sum, n) => sum + n, 0)
  if (![100000, 1000].includes(totalScore)) return fail(400, '分数总和必须为100000或1000')

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '请先登录')

  const gameId = `mj-${Date.now()}`
  const addRes = await db.collection('mahjong_records').add({
    data: {
      gameId,
      players: players.map((p, idx) => ({
        seat: idx + 1,
        userId: p.userId,
        nickname: p.nickname || '',
        score: Number(p.score || 0)
      })),
      creatorId: currentUser._id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  return success({ id: addRes._id, gameId }, '创建成功')
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