/// 组局服务云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  
  console.log('game-service 调用:', { action, data, openid: wxContext.OPENID })
  
  try {
    switch (action) {
      case 'test':
        return handleTest(wxContext)
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
        return await getCreatedGames(data, wxContext)
      case 'getJoinedGames':
        return await getJoinedGames(data, wxContext)
      case 'searchGames':
        return await searchGames(data, wxContext)
      default:
        return { code: 400, message: '未知操作' }
    }
  } catch (error) {
    console.error('game-service 错误:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 测试接口
function handleTest(wxContext) {
  return {
    code: 0,
    message: 'game-service 运行正常',
    data: {
      timestamp: new Date().toISOString(),
      openid: wxContext.OPENID,
      appid: wxContext.APPID
    }
  }
}

// 创建组局 - 修复版
async function createGame(data, wxContext) {
  console.log('createGame 函数收到的 data 参数:', data)
  console.log('openid:', wxContext.OPENID)
  
  // ✅ 修复1: 验证 data 参数是否存在
  if (!data) {
    console.error('❌ 错误: data 参数为 undefined 或 null')
    return { 
      code: 400, 
      message: '请求参数格式错误',
      tip: '请确保传递了 { gameData: {...} } 格式的数据'
    }
  }
  
  // ✅ 修复2: 验证 gameData 是否存在
  if (!data.gameData) {
    console.error('❌ 错误: data.gameData 为 undefined 或 null')
    return { 
      code: 400, 
      message: '缺少游戏数据',
      tip: '请在data参数中包含gameData字段，格式: { gameData: {...} }'
    }
  }
  
  const { gameData } = data
  
  console.log('✅ 收到的 gameData:', gameData)
  
  // 验证必要字段
  const required = ['title', 'type', 'time', 'location', 'maxPlayers']
  for (const field of required) {
    if (!gameData[field]) {
      return {
        code: 400,
        message: `缺少必要字段: ${field}`
      }
    }
  }
  
  // 验证时间必须是将来的时间
  const gameTime = new Date(gameData.time)
  const now = new Date()
  if (gameTime <= now) {
    return {
      code: 400,
      message: '活动时间必须是将来的时间'
    }
  }
  
  // 验证最大人数
  if (gameData.maxPlayers < 2 || gameData.maxPlayers > 20) {
    return {
      code: 400,
      message: '参与人数必须在2-20人之间'
    }
  }
  
  try {
    // 获取当前用户信息
    const userQuery = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userQuery.data.length === 0) {
      return {
        code: 401,
        message: '用户不存在，请先登录'
      }
    }
    
    const userId = userQuery.data[0]._id
    const userInfo = userQuery.data[0]
    
    // 创建组局
    const game = {
      ...gameData,
      creatorId: userId,
      creatorInfo: {
        nickname: userInfo.nickname,
        avatar: userInfo.avatar
      },
      currentPlayers: 1,
      status: 'pending',
      isFull: false,
      participants: [userId],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const addRes = await db.collection('games').add({
      data: game
    })
    
    const gameId = addRes._id
    
    // 创建参与记录
    await db.collection('participations').add({
      data: {
        gameId: gameId,
        userId: userId,
        createdAt: new Date()
      }
    })
    
    // 创建活动记录
    await db.collection('activities').add({
      data: {
        gameId: gameId,
        type: 'create',
        userId: userId,
        userName: userInfo.nickname,
        text: `${userInfo.nickname} 创建了此组局`,
        createdAt: new Date()
      }
    })
    
    return {
      code: 0,
      message: '创建成功',
      data: {
        id: gameId,
        ...game
      }
    }
  } catch (error) {
    console.error('创建组局错误:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 获取组局列表
async function getGameList(data, wxContext) {
  // 处理 data 为 undefined 的情况
  const params = data || {}
  const { page = 1, pageSize = 10, type, status = 'pending' } = params
  
  console.log('获取组局列表参数:', { page, pageSize, type, status })
  
  try {
    let query = db.collection('games').where({
      status: status
    })
    
    if (type && type !== 'all') {
      query = query.where({ type: type })
    }
    
    const [totalRes, listRes] = await Promise.all([
      query.count(),
      query
        .orderBy('time', 'asc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
    ])
    
    // 获取当前用户的ID
    let userId = null
    if (wxContext.OPENID) {
      const userRes = await db.collection('users')
        .where({ openid: wxContext.OPENID })
        .get()
      if (userRes.data.length > 0) {
        userId = userRes.data[0]._id
      }
    }
    
    // 处理游戏列表，添加是否已加入的标志
    const games = listRes.data.map(game => {
      const isJoined = userId ? game.participants.includes(userId) : false
      return {
        ...game,
        isJoined: isJoined,
        isCreator: game.creatorId === userId
      }
    })
    
    return {
      code: 0,
      data: {
        list: games,
        total: totalRes.total,
        page: page,
        pageSize: pageSize,
        hasMore: page * pageSize < totalRes.total
      }
    }
  } catch (error) {
    console.error('获取组局列表错误:', error)
    throw error
  }
}

// 获取组局详情
async function getGameDetail(data, wxContext) {
  const { gameId } = data
  
  if (!gameId) {
    return { code: 400, message: '缺少组局ID' }
  }
  
  try {
    const gameRes = await db.collection('games').doc(gameId).get()
    
    if (!gameRes.data) {
      return { code: 404, message: '组局不存在' }
    }
    
    const game = gameRes.data
    
    // 获取参与者信息
    const participationsRes = await db.collection('participations')
      .where({ gameId: gameId })
      .get()
    
    const participantIds = participationsRes.data.map(p => p.userId)
    
    // 获取用户信息
    const usersRes = await db.collection('users')
      .where({ _id: _.in(participantIds) })
      .get()
    
    const usersMap = {}
    usersRes.data.forEach(user => {
      usersMap[user._id] = {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar
      }
    })
    
    // 构建玩家列表
    const players = participationsRes.data
      .map(p => ({
        ...usersMap[p.userId],
        joinTime: p.createdAt
      }))
      .filter(p => p.nickname)
    
    // 获取活动记录
    const activitiesRes = await db.collection('activities')
      .where({ gameId: gameId })
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()
    
    // 检查当前用户是否已加入
    let isJoined = false
    let isCreator = false
    
    if (wxContext.OPENID) {
      const userRes = await db.collection('users')
        .where({ openid: wxContext.OPENID })
        .get()
      
      if (userRes.data.length > 0) {
        const userId = userRes.data[0]._id
        isJoined = participantIds.includes(userId)
        isCreator = game.creatorId === userId
      }
    }
    
    return {
      code: 0,
      data: {
        ...game,
        players: players,
        activities: activitiesRes.data,
        isJoined: isJoined,
        isCreator: isCreator
      }
    }
  } catch (error) {
    console.error('获取组局详情错误:', error)
    throw error
  }
}

// 更新组局
async function updateGame(data, wxContext) {
  const { gameId, updates } = data
  
  if (!gameId || !updates) {
    return { code: 400, message: '缺少必要参数' }
  }
  
  try {
    // 获取当前用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userRes.data.length === 0) {
      return { code: 401, message: '用户不存在' }
    }
    
    const userId = userRes.data[0]._id
    
    // 检查是否是创建者
    const gameRes = await db.collection('games').doc(gameId).get()
    
    if (!gameRes.data) {
      return { code: 404, message: '组局不存在' }
    }
    
    if (gameRes.data.creatorId !== userId) {
      return { code: 403, message: '只有创建者可以修改组局' }
    }
    
    // 更新组局
    await db.collection('games').doc(gameId).update({
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })
    
    return {
      code: 0,
      message: '更新成功'
    }
  } catch (error) {
    console.error('更新组局错误:', error)
    throw error
  }
}

// 删除/取消组局
async function deleteGame(data, wxContext) {
  const { gameId } = data
  
  if (!gameId) {
    return { code: 400, message: '缺少组局ID' }
  }
  
  try {
    // 获取当前用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userRes.data.length === 0) {
      return { code: 401, message: '用户不存在' }
    }
    
    const userId = userRes.data[0]._id
    
    // 检查是否是创建者
    const gameRes = await db.collection('games').doc(gameId).get()
    
    if (!gameRes.data) {
      return { code: 404, message: '组局不存在' }
    }
    
    if (gameRes.data.creatorId !== userId) {
      return { code: 403, message: '只有创建者可以取消组局' }
    }
    
    // 更新组局状态为已取消
    await db.collection('games').doc(gameId).update({
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    })
    
    // 创建活动记录
    await db.collection('activities').add({
      data: {
        gameId: gameId,
        type: 'cancel',
        userId: userId,
        userName: userRes.data[0].nickname,
        text: `${userRes.data[0].nickname} 取消了此组局`,
        createdAt: new Date()
      }
    })
    
    return {
      code: 0,
      message: '组局已取消'
    }
  } catch (error) {
    console.error('取消组局错误:', error)
    throw error
  }
}

// 加入组局
async function joinGame(data, wxContext) {
  const { gameId, userId } = data
  
  if (!gameId || !userId) {
    return { code: 400, message: '缺少必要参数' }
  }
  
  try {
    // 获取当前用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userRes.data.length === 0) {
      return { code: 401, message: '用户不存在' }
    }
    
    const currentUser = userRes.data[0]
    
    // 验证用户ID匹配
    if (currentUser._id !== userId) {
      return { code: 403, message: '无权操作其他用户' }
    }
    
    // 获取组局信息
    const gameRes = await db.collection('games').doc(gameId).get()
    
    if (!gameRes.data) {
      return { code: 404, message: '组局不存在' }
    }
    
    const game = gameRes.data
    
    // 检查组局状态
    if (game.status !== 'pending') {
      return { code: 400, message: '此组局已不可加入' }
    }
    
    // 检查是否已满员
    if (game.currentPlayers >= game.maxPlayers) {
      return { code: 400, message: '组局已满员' }
    }
    
    // 检查是否已加入
    if (game.participants.includes(userId)) {
      return { code: 400, message: '您已加入此组局' }
    }
    
    // 更新组局参与者
    await db.collection('games').doc(gameId).update({
      data: {
        currentPlayers: game.currentPlayers + 1,
        participants: _.push(userId),
        isFull: (game.currentPlayers + 1) >= game.maxPlayers,
        updatedAt: new Date()
      }
    })
    
    // 创建参与记录
    await db.collection('participations').add({
      data: {
        gameId: gameId,
        userId: userId,
        createdAt: new Date()
      }
    })
    
    // 创建活动记录
    await db.collection('activities').add({
      data: {
        gameId: gameId,
        type: 'join',
        userId: userId,
        userName: currentUser.nickname,
        text: `${currentUser.nickname} 加入了组局`,
        createdAt: new Date()
      }
    })
    
    return {
      code: 0,
      message: '加入成功',
      data: {
        currentPlayers: game.currentPlayers + 1,
        isFull: (game.currentPlayers + 1) >= game.maxPlayers
      }
    }
  } catch (error) {
    console.error('加入组局错误:', error)
    throw error
  }
}

// 退出组局
async function quitGame(data, wxContext) {
  const { gameId, userId } = data
  
  if (!gameId || !userId) {
    return { code: 400, message: '缺少必要参数' }
  }
  
  try {
    // 获取当前用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userRes.data.length === 0) {
      return { code: 401, message: '用户不存在' }
    }
    
    const currentUser = userRes.data[0]
    
    // 验证用户ID匹配
    if (currentUser._id !== userId) {
      return { code: 403, message: '无权操作其他用户' }
    }
    
    // 获取组局信息
    const gameRes = await db.collection('games').doc(gameId).get()
    
    if (!gameRes.data) {
      return { code: 404, message: '组局不存在' }
    }
    
    const game = gameRes.data
    
    // 检查是否是创建者
    if (game.creatorId === userId) {
      return { code: 400, message: '创建者不能退出，请取消组局' }
    }
    
    // 检查是否已加入
    if (!game.participants.includes(userId)) {
      return { code: 400, message: '您未加入此组局' }
    }
    
    // 更新组局参与者
    await db.collection('games').doc(gameId).update({
      data: {
        currentPlayers: _.inc(-1),
        participants: _.pull(userId),
        isFull: false,
        updatedAt: new Date()
      }
    })
    
    // 删除参与记录
    await db.collection('participations')
      .where({ gameId: gameId, userId: userId })
      .remove()
    
    // 创建活动记录
    await db.collection('activities').add({
      data: {
        gameId: gameId,
        type: 'quit',
        userId: userId,
        userName: currentUser.nickname,
        text: `${currentUser.nickname} 退出了组局`,
        createdAt: new Date()
      }
    })
    
    return {
      code: 0,
      message: '已退出组局',
      data: {
        currentPlayers: game.currentPlayers - 1
      }
    }
  } catch (error) {
    console.error('退出组局错误:', error)
    throw error
  }
}

// 获取我的组局
async function getMyGames(data, wxContext) {
  const { userId, type = 'all' } = data
  
  if (!userId) {
    return { code: 400, message: '缺少用户ID' }
  }
  
  try {
    let games = []
    
    if (type === 'created') {
      // 获取用户创建的组局
      const createdRes = await db.collection('games')
        .where({ creatorId: userId, status: 'pending' })
        .orderBy('createdAt', 'desc')
        .get()
      
      games = createdRes.data
    } else if (type === 'joined') {
      // 获取用户参与的组局
      // 先获取参与记录
      const participationsRes = await db.collection('participations')
        .where({ userId: userId })
        .get()
      
      const gameIds = participationsRes.data.map(p => p.gameId)
      
      if (gameIds.length > 0) {
        const gamesRes = await db.collection('games')
          .where({ 
            _id: _.in(gameIds),
            status: 'pending',
            creatorId: _.neq(userId) // 排除自己创建的
          })
          .orderBy('time', 'asc')
          .get()
        
        games = gamesRes.data
      }
    } else {
      // 获取所有（已创建+已参与）
      const [createdRes, participationsRes] = await Promise.all([
        db.collection('games')
          .where({ creatorId: userId, status: 'pending' })
          .get(),
        db.collection('participations')
          .where({ userId: userId })
          .get()
      ])
      
      const createdGames = createdRes.data
      const gameIds = participationsRes.data.map(p => p.gameId)
      
      let joinedGames = []
      if (gameIds.length > 0) {
        const gamesRes = await db.collection('games')
          .where({ 
            _id: _.in(gameIds),
            status: 'pending'
          })
          .get()
        
        joinedGames = gamesRes.data.filter(game => game.creatorId !== userId)
      }
      
      games = [...createdGames, ...joinedGames]
    }
    
    return {
      code: 0,
      data: games
    }
  } catch (error) {
    console.error('获取我的组局错误:', error)
    throw error
  }
}

// 获取创建的组局
async function getCreatedGames(data, wxContext) {
  const { userId } = data
  
  if (!userId) {
    return { code: 400, message: '缺少用户ID' }
  }
  
  try {
    const gamesRes = await db.collection('games')
      .where({ creatorId: userId })
      .orderBy('createdAt', 'desc')
      .get()
    
    return {
      code: 0,
      data: gamesRes.data
    }
  } catch (error) {
    console.error('获取创建的组局错误:', error)
    throw error
  }
}

// 获取参与的组局
async function getJoinedGames(data, wxContext) {
  const { userId } = data
  
  if (!userId) {
    return { code: 400, message: '缺少用户ID' }
  }
  
  try {
    // 先获取参与记录
    const participationsRes = await db.collection('participations')
      .where({ userId: userId })
      .get()
    
    const gameIds = participationsRes.data.map(p => p.gameId)
    
    if (gameIds.length === 0) {
      return { code: 0, data: [] }
    }
    
    const gamesRes = await db.collection('games')
      .where({ _id: _.in(gameIds) })
      .orderBy('time', 'asc')
      .get()
    
    return {
      code: 0,
      data: gamesRes.data
    }
  } catch (error) {
    console.error('获取参与的组局错误:', error)
    throw error
  }
}

// 搜索组局
async function searchGames(data, wxContext) {
  const { keyword, filters = {} } = data
  
  if (!keyword && Object.keys(filters).length === 0) {
    return { code: 400, message: '缺少搜索条件' }
  }
  
  try {
    let query = db.collection('games').where({ status: 'pending' })
    
    if (keyword) {
      query = query.where({
        title: db.RegExp({
          regexp: keyword,
          options: 'i'
        })
      })
    }
    
    if (filters.type && filters.type !== 'all') {
      query = query.where({ type: filters.type })
    }
    
    if (filters.location) {
      query = query.where({
        location: db.RegExp({
          regexp: filters.location,
          options: 'i'
        })
      })
    }
    
    const gamesRes = await query
      .orderBy('time', 'asc')
      .limit(50)
      .get()
    
    return {
      code: 0,
      data: gamesRes.data
    }
  } catch (error) {
    console.error('搜索组局错误:', error)
    throw error
  }
}