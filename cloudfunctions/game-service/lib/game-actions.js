const {
  db,
  _,
  DEFAULT_AVATAR,
  success,
  fail,
  getCurrentUser,
  ensureUserAvailable,
  normalizeUserBrief,
  normalizeParticipants,
  enrichGame,
  addActivity,
  checkTextSecurityBatch
} = require('./shared')

const INACTIVE_STATUS = ['cancelled', 'finished', 'completed']
const LIST_HIDDEN_STATUS = ['cancelled', 'finished']
const PAGE_BATCH_SIZE = 100
const AUTO_COMPLETE_HOURS = 12
const COMPLETED_RETAIN_DAYS = 365
const GAME_STATUS_PRIORITY = {
  pending: 0,
  ongoing: 1,
  completed: 2,
  cancelled: 3,
  finished: 4
}

function parseGameTime(input) {
  if (!input) return null
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input

  const text = String(input).trim()
  if (!text) return null

  // Force Asia/Shanghai(+08:00) parse for strings without timezone.
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/)
  if (match) {
    const [, y, m, d, hh = '0', mm = '0', ss = '0'] = match
    const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}+08:00`
    const cnDate = new Date(iso)
    return Number.isNaN(cnDate.getTime()) ? null : cnDate
  }

  const normalized = text.includes(' ') ? text.replace(' ', 'T') : text
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function sortGamesForLobby(games = []) {
  return [...games].sort((a, b) => {
    const statusDiff =
      (GAME_STATUS_PRIORITY[a?.status] ?? 99) - (GAME_STATUS_PRIORITY[b?.status] ?? 99)
    if (statusDiff !== 0) return statusDiff

    const timeA = parseGameTime(a?.time)
    const timeB = parseGameTime(b?.time)
    if (timeA && timeB) return timeA.getTime() - timeB.getTime()
    if (timeA) return -1
    if (timeB) return 1

    const createdA = parseGameTime(a?.createdAt)
    const createdB = parseGameTime(b?.createdAt)
    if (createdA && createdB) return createdB.getTime() - createdA.getTime()
    return 0
  })
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

async function promoteDuePendingGames(now = new Date()) {
  const query = db.collection('games').where({ status: 'pending' })
  const list = await readAllByQuery(query)
  const dueList = list.filter((game) => {
    const gameTime = parseGameTime(game.time)
    return !!gameTime && gameTime.getTime() <= now.getTime()
  })

  if (!dueList.length) return
  await Promise.all(dueList.map(async (game) => {
    try {
      await db.collection('games').doc(game._id).update({
        data: { status: 'ongoing', updatedAt: new Date() }
      })
    } catch (error) {
      console.error('promoteDuePendingGames failed:', game._id, error)
    }
  }))
}

async function completeOvertimeOngoingGames(now = new Date()) {
  const query = db.collection('games').where({ status: 'ongoing' })
  const list = await readAllByQuery(query)
  const thresholdTs = now.getTime() - AUTO_COMPLETE_HOURS * 60 * 60 * 1000

  const overtimeList = list.filter((game) => {
    const gameTime = parseGameTime(game.time)
    if (!gameTime) return false
    return gameTime.getTime() <= thresholdTs
  })

  if (!overtimeList.length) return
  await Promise.all(overtimeList.map(async (game) => {
    try {
      await db.collection('games').doc(game._id).update({
        data: { status: 'completed', updatedAt: new Date() }
      })
    } catch (error) {
      console.error('completeOvertimeOngoingGames failed:', game._id, error)
    }
  }))
}

async function removeRelatedRecords(gameIds = []) {
  const valid = [...new Set(gameIds.filter(Boolean))]
  if (!valid.length) return

  for (let i = 0; i < valid.length; i += PAGE_BATCH_SIZE) {
    const chunk = valid.slice(i, i + PAGE_BATCH_SIZE)
    await Promise.all([
      db.collection('participations').where({ gameId: _.in(chunk) }).remove().catch((error) => {
        console.error('remove participations failed:', chunk, error)
      }),
      db.collection('activities').where({ gameId: _.in(chunk) }).remove().catch((error) => {
        console.error('remove activities failed:', chunk, error)
      })
    ])
    await db.collection('games').where({ _id: _.in(chunk) }).remove().catch((error) => {
      console.error('remove games failed:', chunk, error)
    })
  }
}

async function purgeExpiredCompletedGames(now = new Date()) {
  const query = db.collection('games').where({ status: 'completed' })
  const completedList = await readAllByQuery(query)
  if (!completedList.length) return

  const cutoffTs = now.getTime() - COMPLETED_RETAIN_DAYS * 24 * 60 * 60 * 1000
  const expiredIds = completedList
    .filter((game) => {
      const refTime = parseGameTime(game.updatedAt) || parseGameTime(game.time) || parseGameTime(game.createdAt)
      return refTime && refTime.getTime() <= cutoffTs
    })
    .map((game) => game._id)

  await removeRelatedRecords(expiredIds)
}

async function autoMaintainGameLifecycle() {
  const now = new Date()
  await promoteDuePendingGames(now)
  await completeOvertimeOngoingGames(now)
  await purgeExpiredCompletedGames(now)
}

async function syncGameToOngoingIfDue(game) {
  if (!game || game.status !== 'pending') return game
  const gameTime = parseGameTime(game.time)
  if (!gameTime || gameTime > new Date()) return game

  try {
    await db.collection('games').doc(game._id).update({
      data: {
        status: 'ongoing',
        updatedAt: new Date()
      }
    })
    return { ...game, status: 'ongoing' }
  } catch (error) {
    console.error('syncGameToOngoingIfDue failed:', game._id, error)
    return game
  }
}

async function createGame(data, wxContext) {
  const payload = data || {}
  const gameData = payload.gameData
  if (!gameData) return fail(400, '缺少组局数据')

  const createSecurityRes = await checkTextSecurityBatch([
    { title: '活动标题', text: gameData.title },
    { title: '具体项目', text: gameData.project },
    { title: '活动地点', text: gameData.location },
    { title: '补充说明', text: gameData.description }
  ])
  if (!createSecurityRes.ok) return fail(createSecurityRes.code || 422, createSecurityRes.message || '内容包含敏感信息')

  const type = gameData.type || 'mahjong'
  const maxPlayers = Number(gameData.maxPlayers || 0)
  const playerRange = {
    mahjong: [3, 4],
    boardgame: [2, 10],
    videogame: [2, 8],
    cardgame: [2, 8],
    competition: [4, 32]
  }
  const [minAllowed, maxAllowed] = playerRange[type] || [2, 20]
  if (!Number.isFinite(maxPlayers) || maxPlayers < minAllowed || maxPlayers > maxAllowed) {
    return fail(400, `该活动类型人数需在${minAllowed}-${maxAllowed}之间`)
  }

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在，请先登录')
  {
    const availableError = ensureUserAvailable(currentUser, '创建组局')
    if (availableError) return availableError
  }

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
  const { page = 1, pageSize = 10, type, status = 'all' } = data || {}
  await autoMaintainGameLifecycle()

  const cond = {}
  if (['pending', 'ongoing', 'completed', 'cancelled'].includes(status)) {
    cond.status = status
  } else if (status === 'all') {
    cond.status = _.nin(LIST_HIDDEN_STATUS)
  } else {
    cond.status = 'pending'
  }
  if (type && type !== 'all') cond.type = type

  const query = db.collection('games').where(cond).orderBy('createdAt', 'desc')
  const rawList = await readAllByQuery(query)
  const normalizedList = sortGamesForLobby(rawList)

  const start = (Number(page) - 1) * Number(pageSize)
  const end = start + Number(pageSize)
  const pageList = normalizedList.slice(start, end)

  const user = await getCurrentUser(wxContext)
  const viewerUserId = user ? user._id : ''
  const list = []
  for (const game of pageList) {
    list.push(await enrichGame(game, viewerUserId))
  }

  const total = normalizedList.length
  return success({
    list,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    hasMore: Number(page) * Number(pageSize) < total
  }, '获取成功')
}

async function getGameDetail(data, wxContext) {
  const { gameId } = data || {}
  if (!gameId) return fail(400, '缺少组局ID')

  await autoMaintainGameLifecycle()
  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')

  const user = await getCurrentUser(wxContext)
  const syncedGame = await syncGameToOngoingIfDue(gameRes.data)
  const detail = await enrichGame(syncedGame, user ? user._id : '')

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
  {
    const availableError = ensureUserAvailable(currentUser, '编辑组局')
    if (availableError) return availableError
  }

  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')
  if (gameRes.data.creatorId !== currentUser._id) return fail(403, '只有创建者可编辑组局')

  if (updates.time) {
    const updateTime = parseGameTime(updates.time)
    if (!updateTime) return fail(400, '活动时间格式错误')
    if (updateTime <= new Date()) return fail(400, '活动时间必须是将来的时间')
  }

  const updateSecurityRes = await checkTextSecurityBatch([
    { title: '活动标题', text: updates.title },
    { title: '具体项目', text: updates.project },
    { title: '活动地点', text: updates.location },
    { title: '补充说明', text: updates.description }
  ])
  if (!updateSecurityRes.ok) return fail(updateSecurityRes.code || 422, updateSecurityRes.message || '内容包含敏感信息')

  if (Object.prototype.hasOwnProperty.call(updates, 'maxPlayers')) {
    const maxPlayers = Number(updates.maxPlayers)
    if (!Number.isFinite(maxPlayers) || maxPlayers <= 0) return fail(400, '人数设置不合法')

    const gameType = updates.type || gameRes.data.type
    const playerRange = {
      mahjong: [3, 4],
      boardgame: [2, 10],
      videogame: [2, 8],
      cardgame: [2, 8],
      competition: [4, 32]
    }
    const [minAllowed, maxAllowed] = playerRange[gameType] || [2, 20]
    if (maxPlayers < minAllowed || maxPlayers > maxAllowed) {
      return fail(400, `该活动类型人数需在${minAllowed}-${maxAllowed}之间`)
    }

    const participants = await normalizeParticipants(gameRes.data.participants || [])
    const currentPlayers = participants.length + 1
    if (currentPlayers > maxPlayers) {
      return fail(400, `当前已加入${currentPlayers}人，人数不能低于已加入人数`)
    }
  }

  await db.collection('games').doc(gameId).update({
    data: {
      ...updates,
      updatedAt: new Date()
    }
  })

  await addActivity(gameId, 'update', currentUser, `${currentUser.nickname || '用户'} 更新了组局信息`)
  return success(null, '更新成功')
}

async function deleteGame(data, wxContext) {
  const { gameId } = data || {}
  if (!gameId) return fail(400, '缺少组局ID')

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在')
  {
    const availableError = ensureUserAvailable(currentUser, '取消组局')
    if (availableError) return availableError
  }

  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')
  if (gameRes.data.creatorId !== currentUser._id) return fail(403, '只有创建者可取消组局')

  await db.collection('games').doc(gameId).update({
    data: {
      status: 'cancelled',
      updatedAt: new Date()
    }
  })
  await addActivity(gameId, 'cancel', currentUser, `${currentUser.nickname || '用户'} 取消了此组局`)
  return success(null, '组局已取消')
}

async function joinGame(data, wxContext) {
  const { gameId, userId } = data || {}
  if (!gameId || !userId) return fail(400, '缺少必要参数')

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在')
  {
    const availableError = ensureUserAvailable(currentUser, '加入组局')
    if (availableError) return availableError
  }
  if (currentUser._id !== userId) return fail(403, '无权操作其他用户')

  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')
  const game = await syncGameToOngoingIfDue(gameRes.data)

  if (game.status !== 'pending') return fail(400, '此组局已开始，无法加入')
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
  await addActivity(gameId, 'join', currentUser, `${currentUser.nickname || '用户'} 加入了组局`)

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
  {
    const availableError = ensureUserAvailable(currentUser, '退出组局')
    if (availableError) return availableError
  }
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
  await addActivity(gameId, 'quit', currentUser, `${currentUser.nickname || '用户'} 退出了组局`)

  return success({ currentPlayers: filtered.length + 1 }, '已退出组局')
}

async function removeParticipant(data, wxContext) {
  const { gameId, targetUserId } = data || {}
  if (!gameId || !targetUserId) return fail(400, '缺少必要参数')

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在')
  {
    const availableError = ensureUserAvailable(currentUser, '移除玩家')
    if (availableError) return availableError
  }

  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')

  const game = gameRes.data
  if (game.creatorId !== currentUser._id) return fail(403, '只有创建者可移除玩家')
  if (game.status !== 'pending') return fail(400, '当前状态不可移除玩家')
  if (String(targetUserId) === String(game.creatorId)) return fail(400, '不能移除创建者')

  const participants = await normalizeParticipants(game.participants || [])
  const target = participants.find((p) => String(p.id) === String(targetUserId))
  if (!target) return fail(404, '目标玩家不在组局中')

  const filtered = participants.filter((p) => String(p.id) !== String(targetUserId))
  const currentPlayers = filtered.length + 1

  await db.collection('games').doc(gameId).update({
    data: {
      participants: filtered,
      isFull: currentPlayers >= (game.maxPlayers || 4),
      updatedAt: new Date()
    }
  })
  await db.collection('participations').where({ gameId, userId: targetUserId }).remove()
  await addActivity(gameId, 'kick', currentUser, `${currentUser.nickname || '创建者'} 移除了 ${target.nickname || '玩家'}`)

  return success({ currentPlayers }, '已移除玩家')
}

async function completeGame(data, wxContext) {
  const { gameId } = data || {}
  if (!gameId) return fail(400, '缺少组局ID')

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在')
  {
    const availableError = ensureUserAvailable(currentUser, '结束组局')
    if (availableError) return availableError
  }

  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')

  const game = gameRes.data
  if (game.status === 'completed') return success({ gameId }, '组局已完成')
  if (game.status !== 'ongoing') return fail(400, '仅进行中的组局可标记完成')

  const participants = await normalizeParticipants(game.participants || [])
  const isParticipant = participants.some((p) => String(p.id) === String(currentUser._id))
  const isCreator = String(game.creatorId || '') === String(currentUser._id)
  const isAdmin = !!currentUser.isAdmin

  if (!(isAdmin || isCreator || isParticipant)) {
    return fail(403, '仅管理员、创建者或参与者可操作')
  }

  await db.collection('games').doc(gameId).update({
    data: {
      status: 'completed',
      updatedAt: new Date()
    }
  })
  await addActivity(gameId, 'complete', currentUser, `${currentUser.nickname || '用户'} 标记组局已完成`)

  return success({ gameId, status: 'completed' }, '已标记完成')
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
    ;(createdRes.data || []).forEach((item) => { gameMap[item._id] = item })
  }

  if (type === 'joined' || type === 'all') {
    const joinedRes = await db.collection('games')
      .where({ status: 'pending', 'participants.id': userId })
      .orderBy('createdAt', 'desc')
      .get()
    ;(joinedRes.data || []).forEach((item) => { gameMap[item._id] = item })
  }

  const result = []
  for (const gid of Object.keys(gameMap)) {
    result.push(await enrichGame(gameMap[gid], userId))
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
  if (keyword) where.title = db.RegExp({ regexp: keyword, options: 'i' })
  if (location) where.location = db.RegExp({ regexp: location, options: 'i' })

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
  removeParticipant,
  completeGame,
  getMyGames,
  getCreatedGames,
  getJoinedGames,
  searchGames
}
