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
      case 'getSeatStatus':
        return await getSeatStatus(data, wxContext)
      case 'getMahjongRecords':
        return await getMahjongRecords(data, wxContext)
<<<<<<< ours
=======
      case 'getMahjongRecordDetail':
        return await getMahjongRecordDetail(data, wxContext)
>>>>>>> theirs
      case 'createMahjongRecord':
        return await createMahjongRecord(data, wxContext)
      case 'getSeatStatusOverrides':
        return await getSeatStatusOverrides(data, wxContext)
      case 'setSeatStatusOverrides':
        return await setSeatStatusOverrides(data, wxContext)
      default:
        return { 
          code: 400, 
          message: '未知操作',
          data: null
        }
    }
  } catch (error) {
    console.error('game-service 错误:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message,
      data: null
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

// 在 createGame 函数中修改
async function createGame(data, wxContext) {
  console.log('createGame 函数收到的 data 参数:', data)
  console.log('openid:', wxContext.OPENID)
  
  // 验证 data 参数是否存在
  if (!data) {
    console.error('❌ 错误: data 参数为 undefined 或 null')
    return { 
      code: 400, 
      message: '请求参数格式错误',
      tip: '请确保传递了 { gameData: {...} } 格式的数据',
      data: null
    }
  }
  
  // 验证 gameData 是否存在
  if (!data.gameData) {
    console.error('❌ 错误: data.gameData 为 undefined 或 null')
    return { 
      code: 400, 
      message: '缺少游戏数据',
      tip: '请在data参数中包含gameData字段，格式: { gameData: {...} }',
      data: null
    }
  }
  
  const { gameData, userInfo } = data
  
  try {
    // 如果传递了 userInfo，使用传递的用户信息
    // 否则从数据库查询用户信息
    let creatorInfo
    if (userInfo) {
      creatorInfo = {
        id: userInfo.id,
        nickname: userInfo.nickname || '未知用户',
        avatar: userInfo.avatar || 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png',
        tags: userInfo.tags || [],
        gender: userInfo.gender || 0
      }
    } else {
      // 获取当前用户信息
      const userQuery = await db.collection('users')
        .where({ openid: wxContext.OPENID })
        .get()
      
      if (userQuery.data.length === 0) {
        return {
          code: 401,
          message: '用户不存在，请先登录',
          data: null
        }
      }
      
      const user = userQuery.data[0]
      creatorInfo = {
        id: user._id,
        nickname: user.nickname || '未知用户',
        avatar: user.avatar || 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png',
        tags: user.tags || [],
        gender: user.gender || 0
      }
    }
    
    // 创建组局
    const game = {
      ...gameData,
      creatorId: creatorInfo.id,
      creatorInfo: creatorInfo,
      participants: [], // 初始为空数组
      currentPlayers: 1,
      status: 'pending',
      isFull: false,
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
        userId: creatorInfo.id,
        userName: creatorInfo.nickname,
        userAvatar: creatorInfo.avatar,
        createdAt: new Date()
      }
    })
    
    // 创建活动记录
    await db.collection('activities').add({
      data: {
        gameId: gameId,
        type: 'create',
        userId: creatorInfo.id,
        userName: creatorInfo.nickname,
        text: `${creatorInfo.nickname} 创建了此组局`,
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
      error: error.message,
      data: null
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
    const games = await Promise.all(listRes.data.map(async (game) => {
      // 确保creatorInfo存在
      let creatorInfo = game.creatorInfo || { nickname: '未知用户', avatar: '' }
      
      // 如果creatorInfo是字符串，尝试从users集合获取
      if (typeof creatorInfo === 'string') {
        try {
          const userRes = await db.collection('users').doc(creatorInfo).get()
          if (userRes.data) {
            creatorInfo = {
              id: userRes.data._id,
              nickname: userRes.data.nickname || '未知用户',
              avatar: userRes.data.avatar || '',
              tags: userRes.data.tags || []
            }
          }
        } catch (err) {
          console.error('获取创建者信息失败:', err)
        }
      }
      
      // 确保participants存在
      let participants = game.participants || []
      
      // 如果participants是字符串数组，转换为对象数组
      if (Array.isArray(participants) && participants.length > 0 && typeof participants[0] === 'string') {
        try {
          const usersRes = await db.collection('users')
            .where({ _id: _.in(participants) })
            .get()
          
          participants = usersRes.data.map(user => ({
            id: user._id,
            nickname: user.nickname || '未知用户',
            avatar: user.avatar || ''
          }))
        } catch (err) {
          console.error('获取参与者信息失败:', err)
          participants = participants.map(id => ({
            id,
            nickname: '未知用户',
            avatar: ''
          }))
        }
      }
      
      const isJoined = userId ? participants.some(p => p.id === userId) : false
      const isCreator = game.creatorId === userId
      
      return {
        ...game,
        id: game._id,
        creatorInfo,
        participants,
        isJoined: isJoined,
        isCreator: isCreator,
        currentPlayers: participants.length + 1,
        isFull: (participants.length + 1) >= (game.maxPlayers || 4)
      }
    }))
    
    return {
      code: 0,
      data: {
        list: games,
        total: totalRes.total,
        page: page,
        pageSize: pageSize,
        hasMore: page * pageSize < totalRes.total
      },
      message: '获取成功'
    }
  } catch (error) {
    console.error('获取组局列表错误:', error)
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    }
  }
}

// 获取组局详情 - 修复版
async function getGameDetail(data, wxContext) {
  const { gameId } = data
  
  if (!gameId) {
    return { 
      code: 400, 
      message: '缺少组局ID',
      data: null
    }
  }
  
  try {
    console.log('获取组局详情:', gameId)
    
    const gameRes = await db.collection('games').doc(gameId).get()
    
    if (!gameRes.data) {
      return { 
        code: 404, 
        message: '组局不存在',
        data: null
      }
    }
    
    const game = gameRes.data
    console.log('原始游戏数据:', game)
    
    // 获取创建者信息
    let creatorInfo = game.creatorInfo || { nickname: '未知用户', avatar: '', tags: [] }
    
    // 如果creatorInfo是字符串（用户ID），从users集合获取
    if (typeof creatorInfo === 'string') {
      try {
        const userRes = await db.collection('users').doc(creatorInfo).get()
        if (userRes.data) {
          creatorInfo = {
            id: userRes.data._id,
            nickname: userRes.data.nickname || '未知用户',
            avatar: userRes.data.avatar || 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png',
            tags: userRes.data.tags || []
          }
        }
      } catch (userErr) {
        console.error('获取创建者信息失败:', userErr)
      }
    }
    
    // 获取参与者信息
    let participants = game.participants || []
    
    // 如果participants是字符串数组，从users集合获取
    if (Array.isArray(participants) && participants.length > 0) {
      if (typeof participants[0] === 'string') {
        try {
          const usersRes = await db.collection('users')
            .where({ _id: _.in(participants) })
            .get()
          
          participants = usersRes.data.map(user => ({
            id: user._id,
            nickname: user.nickname || '未知用户',
            avatar: user.avatar || 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png'
          }))
        } catch (err) {
          console.error('获取参与者信息失败:', err)
          participants = participants.map(id => ({
            id,
            nickname: '未知用户',
            avatar: 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png'
          }))
        }
      }
    }
    
    // 获取活动记录
    let activities = []
    try {
      const activitiesRes = await db.collection('activities')
        .where({ gameId: gameId })
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get()
      
      activities = activitiesRes.data || []
    } catch (activityErr) {
      console.error('获取活动记录失败:', activityErr)
    }
    
    // 检查当前用户是否已加入
    let isJoined = false
    let isCreator = false
    
    if (wxContext.OPENID) {
      const userRes = await db.collection('users')
        .where({ openid: wxContext.OPENID })
        .get()
      
      if (userRes.data.length > 0) {
        const userId = userRes.data[0]._id
        isJoined = participants.some(p => p.id === userId)
        isCreator = game.creatorId === userId
      }
    }
    
    const result = {
      ...game,
      id: game._id,
      creatorInfo,
      participants,
      activities,
      isJoined: isJoined,
      isCreator: isCreator,
      currentPlayers: participants.length + 1,
      isFull: (participants.length + 1) >= (game.maxPlayers || 4)
    }
    
    console.log('处理后的游戏详情:', result)
    
    return {
      code: 0,
      message: '获取成功',
      data: result
    }
  } catch (error) {
    console.error('获取组局详情错误:', error)
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    }
  }
}

// 更新组局
async function updateGame(data, wxContext) {
  const { gameId, updates } = data
  
  if (!gameId || !updates) {
    return { 
      code: 400, 
      message: '缺少必要参数',
      data: null
    }
  }
  
  try {
    // 获取当前用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userRes.data.length === 0) {
      return { 
        code: 401, 
        message: '用户不存在',
        data: null
      }
    }
    
    const userId = userRes.data[0]._id
    
    // 检查是否是创建者
    const gameRes = await db.collection('games').doc(gameId).get()
    
    if (!gameRes.data) {
      return { 
        code: 404, 
        message: '组局不存在',
        data: null
      }
    }
    
    if (gameRes.data.creatorId !== userId) {
      return { 
        code: 403, 
        message: '只有创建者可以修改组局',
        data: null
      }
    }
    
    // 验证时间更新
    if (updates.time) {
      const gameTime = new Date(updates.time)
      const now = new Date()
      if (gameTime <= now) {
        return {
          code: 400,
          message: '活动时间必须是将来的时间',
          data: null
        }
      }
    }
    
    // 验证最大人数更新
    if (updates.maxPlayers) {
      if (updates.maxPlayers < 2 || updates.maxPlayers > 20) {
        return {
          code: 400,
          message: '参与人数必须在2-20人之间',
          data: null
        }
      }
      
      // 检查当前人数是否超过新的最大人数
      const currentPlayers = gameRes.data.participants ? gameRes.data.participants.length + 1 : 1
      if (currentPlayers > updates.maxPlayers) {
        return {
          code: 400,
          message: `当前已有${currentPlayers}人参与，不能设置少于当前人数的最大人数`,
          data: null
        }
      }
    }
    
    // 更新组局
    await db.collection('games').doc(gameId).update({
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })
    
    // 创建活动记录
    await db.collection('activities').add({
      data: {
        gameId: gameId,
        type: 'update',
        userId: userId,
        userName: userRes.data[0].nickname || '未知用户',
        text: `${userRes.data[0].nickname || '未知用户'} 更新了组局信息`,
        createdAt: new Date()
      }
    })
    
    return {
      code: 0,
      message: '更新成功',
      data: null
    }
  } catch (error) {
    console.error('更新组局错误:', error)
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    }
  }
}

// 删除/取消组局
async function deleteGame(data, wxContext) {
  const { gameId } = data
  
  if (!gameId) {
    return { 
      code: 400, 
      message: '缺少组局ID',
      data: null
    }
  }
  
  try {
    // 获取当前用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userRes.data.length === 0) {
      return { 
        code: 401, 
        message: '用户不存在',
        data: null
      }
    }
    
    const userId = userRes.data[0]._id
    
    // 检查是否是创建者
    const gameRes = await db.collection('games').doc(gameId).get()
    
    if (!gameRes.data) {
      return { 
        code: 404, 
        message: '组局不存在',
        data: null
      }
    }
    
    if (gameRes.data.creatorId !== userId) {
      return { 
        code: 403, 
        message: '只有创建者可以取消组局',
        data: null
      }
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
        userName: userRes.data[0].nickname || '未知用户',
        text: `${userRes.data[0].nickname || '未知用户'} 取消了此组局`,
        createdAt: new Date()
      }
    })
    
    return {
      code: 0,
      message: '组局已取消',
      data: null
    }
  } catch (error) {
    console.error('取消组局错误:', error)
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    }
  }
}

// 加入组局 - 修复版
async function joinGame(data, wxContext) {
  const { gameId, userId } = data
  
  if (!gameId || !userId) {
    return { 
      code: 400, 
      message: '缺少必要参数',
      data: null
    }
  }
  
  try {
    console.log('加入组局:', { gameId, userId, openid: wxContext.OPENID })
    
    // 获取当前用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userRes.data.length === 0) {
      return { 
        code: 401, 
        message: '用户不存在',
        data: null
      }
    }
    
    const currentUser = userRes.data[0]
    
    // 验证用户ID匹配
    if (currentUser._id !== userId) {
      return { 
        code: 403, 
        message: '无权操作其他用户',
        data: null
      }
    }
    
    // 获取组局信息
    const gameRes = await db.collection('games').doc(gameId).get()
    
    if (!gameRes.data) {
      return { 
        code: 404, 
        message: '组局不存在',
        data: null
      }
    }
    
    const game = gameRes.data
    console.log('组局当前信息:', game)
    
    // 检查组局状态
    if (game.status !== 'pending') {
      return { 
        code: 400, 
        message: '此组局已不可加入',
        data: null
      }
    }
    
    // 检查是否已满员
    const participants = game.participants || []
    const currentPlayers = participants.length + 1 // 创建者 + 参与者
    
    if (currentPlayers >= game.maxPlayers) {
      return { 
        code: 400, 
        message: '组局已满员',
        data: null
      }
    }
    
    // 检查是否已加入
    const isJoined = participants.some(p => {
      if (typeof p === 'string') {
        return p === userId
      } else if (p && p.id) {
        return p.id === userId
      }
      return false
    })
    
    if (isJoined) {
      return { 
        code: 400, 
        message: '您已加入此组局',
        data: null
      }
    }
    
    // 检查是否是创建者
    if (game.creatorId === userId) {
      return { 
        code: 400, 
        message: '您是本组局的创建者',
        data: null
      }
    }
    
    // 添加参与者信息
    const newParticipant = {
      id: currentUser._id,
      nickname: currentUser.nickname || '未知用户',
      avatar: currentUser.avatar || 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png'
    }
    
    // 更新组局参与者
    await db.collection('games').doc(gameId).update({
      data: {
        participants: _.push(newParticipant),
        isFull: (currentPlayers + 1) >= game.maxPlayers,
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
        userName: currentUser.nickname || '未知用户',
        text: `${currentUser.nickname || '未知用户'} 加入了组局`,
        createdAt: new Date()
      }
    })
    
    return {
      code: 0,
      message: '加入成功',
      data: {
        currentPlayers: currentPlayers + 1,
        isFull: (currentPlayers + 1) >= game.maxPlayers
      }
    }
  } catch (error) {
    console.error('加入组局错误:', error)
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    }
  }
}

// 退出组局 - 修复版
async function quitGame(data, wxContext) {
  const { gameId, userId } = data
  
  if (!gameId || !userId) {
    return { 
      code: 400, 
      message: '缺少必要参数',
      data: null
    }
  }
  
  try {
    // 获取当前用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userRes.data.length === 0) {
      return { 
        code: 401, 
        message: '用户不存在',
        data: null
      }
    }
    
    const currentUser = userRes.data[0]
    
    // 验证用户ID匹配
    if (currentUser._id !== userId) {
      return { 
        code: 403, 
        message: '无权操作其他用户',
        data: null
      }
    }
    
    // 获取组局信息
    const gameRes = await db.collection('games').doc(gameId).get()
    
    if (!gameRes.data) {
      return { 
        code: 404, 
        message: '组局不存在',
        data: null
      }
    }
    
    const game = gameRes.data
    const participants = game.participants || []
    
    // 检查是否是创建者
    if (game.creatorId === userId) {
      return { 
        code: 400, 
        message: '创建者不能退出，请取消组局',
        data: null
      }
    }
    
    // 检查是否已加入
    const participantIndex = participants.findIndex(p => {
      if (typeof p === 'string') {
        return p === userId
      } else if (p && p.id) {
        return p.id === userId
      }
      return false
    })
    
    if (participantIndex === -1) {
      return { 
        code: 400, 
        message: '您未加入此组局',
        data: null
      }
    }
    
    // 移除参与者
    participants.splice(participantIndex, 1)
    
    // 更新组局
    await db.collection('games').doc(gameId).update({
      data: {
        participants: participants,
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
        userName: currentUser.nickname || '未知用户',
        text: `${currentUser.nickname || '未知用户'} 退出了组局`,
        createdAt: new Date()
      }
    })
    
    return {
      code: 0,
      message: '已退出组局',
      data: {
        currentPlayers: participants.length + 1
      }
    }
  } catch (error) {
    console.error('退出组局错误:', error)
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: null
    }
  }
}

<<<<<<< ours
=======


async function fillPlayerNicknames(players = []) {
  const userIds = [...new Set(players.map(item => item.userId).filter(Boolean))]
  if (!userIds.length) return players

  const userRes = await db.collection('users').where({ _id: _.in(userIds) }).get()
  const nameMap = {}
  ;(userRes.data || []).forEach(user => {
    nameMap[user._id] = user.nickname || ''
  })

  return players.map(player => ({
    ...player,
    nickname: player.nickname || nameMap[player.userId] || '未知玩家'
  }))
}

>>>>>>> theirs
// 获取座位状态（根据云端组局实时计算）
async function getSeatStatus(data, wxContext) {
  try {
    const now = new Date()

    // 仅统计未取消/未结束的组局（分页查询，避免漏数据）
    const baseWhere = {
      status: _.nin(['cancelled', 'finished', 'completed'])
    }

    const totalRes = await db.collection('games').where(baseWhere).count()
    const total = totalRes.total || 0
    const pageSize = 100
    const games = []

    for (let offset = 0; offset < total; offset += pageSize) {
      const pageRes = await db.collection('games')
        .where(baseWhere)
        .skip(offset)
        .limit(pageSize)
        .get()
      games.push(...(pageRes.data || []))
    }

    const priority = { available: 0, reserved: 1, occupied: 2 }
    const statusByLocation = {}

    for (const game of games) {
      if (!game || !game.location) continue

      let calculatedStatus = 'reserved'
      const gameTime = game.time ? new Date(game.time) : null

      // 若已开局时间或标记进行中，判定为使用中
      if (game.status === 'ongoing' || (gameTime && gameTime <= now)) {
        calculatedStatus = 'occupied'
      }

      const current = statusByLocation[game.location] || 'available'
      if (priority[calculatedStatus] > priority[current]) {
        statusByLocation[game.location] = calculatedStatus
      }
    }
<<<<<<< ours
    const overrideRes = await db.collection('seat_status_overrides').where({ key: 'global' }).limit(1).get()
    const overrideMap = (overrideRes.data && overrideRes.data[0] && overrideRes.data[0].overrides) || {}
    const mergedStatus = { ...statusByLocation, ...overrideMap }
=======

    const overrideRes = await db.collection('seat_status_overrides').where({ key: 'global' }).limit(1).get()
    const overrideMap = (overrideRes.data && overrideRes.data[0] && overrideRes.data[0].overrides) || {}
    const mergedStatus = { ...statusByLocation, ...overrideMap }

>>>>>>> theirs
    return {
      code: 0,
      message: '获取座位状态成功',
      data: {
        statusByLocation: mergedStatus,
        totalActiveGames: games.length
      }
    }
  } catch (error) {
    console.error('获取座位状态失败:', error)
    return {
      code: 500,
      message: '获取座位状态失败: ' + error.message,
      data: {
        statusByLocation: {}
      }
    }
  }
}
<<<<<<< ours
=======



>>>>>>> theirs
async function getMahjongRecords(data, wxContext) {
  try {
    const now = Date.now()
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const res = await db.collection('mahjong_records')
      .where({ createdAt: _.gte(sevenDaysAgo) })
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get()

<<<<<<< ours
    return { code: 0, message: '获取成功', data: { list: res.data || [] } }
=======
    const list = await Promise.all((res.data || []).map(async (record) => ({
      ...record,
      players: await fillPlayerNicknames(record.players || [])
    })))

    return { code: 0, message: '获取成功', data: { list } }
>>>>>>> theirs
  } catch (error) {
    return { code: 500, message: '获取战绩失败: ' + error.message, data: { list: [] } }
  }
}

<<<<<<< ours
=======
async function getMahjongRecordDetail(data, wxContext) {
  try {
    const recordId = data && data.recordId
    if (!recordId) {
      return { code: 400, message: '缺少战绩ID', data: null }
    }

    const recordRes = await db.collection('mahjong_records').doc(recordId).get()
    if (!recordRes.data) {
      return { code: 404, message: '战绩不存在', data: null }
    }

    const detail = {
      ...recordRes.data,
      players: await fillPlayerNicknames(recordRes.data.players || [])
    }

    return { code: 0, message: '获取成功', data: detail }
  } catch (error) {
    return { code: 500, message: '获取战绩详情失败: ' + error.message, data: null }
  }
}

>>>>>>> theirs
async function createMahjongRecord(data, wxContext) {
  try {
    const players = (data && data.players) || []
    if (!Array.isArray(players) || players.length !== 4) {
      return { code: 400, message: '必须提交4位玩家数据' }
    }

    const scores = players.map(item => Number(item.score || 0))
    const total = scores.reduce((sum, n) => sum + n, 0)
    if (![100000, 1000].includes(total)) {
      return { code: 400, message: '分数总和必须为100000或1000' }
    }

    const creatorRes = await db.collection('users').where({ openid: wxContext.OPENID }).get()
    if (!creatorRes.data.length) {
      return { code: 401, message: '请先登录' }
    }

    const creatorId = creatorRes.data[0]._id
    const gameId = `mj-${Date.now()}`

    const addRes = await db.collection('mahjong_records').add({
      data: {
        gameId,
        players: players.map((p, i) => ({
          seat: i + 1,
          userId: p.userId,
          nickname: p.nickname || '',
          score: Number(p.score || 0)
        })),
        creatorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return { code: 0, message: '创建成功', data: { id: addRes._id, gameId } }
  } catch (error) {
    return { code: 500, message: '创建战绩失败: ' + error.message }
  }
}

async function getSeatStatusOverrides(data, wxContext) {
  try {
    const res = await db.collection('seat_status_overrides').where({ key: 'global' }).limit(1).get()
    const row = (res.data || [])[0] || {}
    return { code: 0, message: '获取成功', data: { overrides: row.overrides || {} } }
  } catch (error) {
    return { code: 500, message: '获取失败: ' + error.message, data: { overrides: {} } }
  }
}

async function setSeatStatusOverrides(data, wxContext) {
  try {
    const userRes = await db.collection('users').where({ openid: wxContext.OPENID }).limit(1).get()
    if (!userRes.data.length || !userRes.data[0].isAdmin) {
      return { code: 403, message: '仅管理员可操作' }
    }

    const overrides = (data && data.overrides) || {}
    const existed = await db.collection('seat_status_overrides').where({ key: 'global' }).limit(1).get()
    if (existed.data.length) {
      await db.collection('seat_status_overrides').doc(existed.data[0]._id).update({
        data: { overrides, updatedAt: new Date(), updatedBy: userRes.data[0]._id }
      })
    } else {
      await db.collection('seat_status_overrides').add({
        data: { key: 'global', overrides, updatedAt: new Date(), updatedBy: userRes.data[0]._id }
      })
    }

    return { code: 0, message: '保存成功', data: { overrides } }
  } catch (error) {
    return { code: 500, message: '保存失败: ' + error.message }
  }
}
<<<<<<< ours
=======

>>>>>>> theirs
// 获取我的组局 - 修复版
async function getMyGames(data, wxContext) {
  console.log('getMyGames 调用开始，参数:', { data, openid: wxContext.OPENID })
  
  // 修复：添加对 data 的空值检查
  if (!data) {
    console.log('getMyGames: data 参数为 undefined 或 null，使用默认值')
    data = {}
  }
  
  const { type = 'all' } = data
  
  console.log('getMyGames 参数解构后:', { type, openid: wxContext.OPENID })
  
  try {
    // 获取当前用户
    console.log('查询用户信息，openid:', wxContext.OPENID)
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    console.log('用户查询结果:', userRes)
    
    if (userRes.data.length === 0) {
      console.log('用户不存在')
      return { 
        code: 401, 
        message: '用户不存在，请先登录',
        data: []
      }
    }
    
    const userId = userRes.data[0]._id
    console.log('当前用户ID:', userId)
    
    let games = []
    
    if (type === 'created') {
      // 修复：只获取pending状态的已创建组局
      console.log('查询创建的组局...')
      const createdRes = await db.collection('games')
        .where({ 
          creatorId: userId,
          status: 'pending'  // 只返回进行中的组局
        })
        .orderBy('createdAt', 'desc')
        .get()
      
      console.log('创建的组局结果:', createdRes.data.length)
      games = createdRes.data
      
    } else if (type === 'joined') {
      // 修复：只获取pending状态的已参与组局
      console.log('查询参与的组局...')
      
      // 先获取所有pending状态的组局
      const allGamesRes = await db.collection('games')
        .where({ 
          status: 'pending',  // 只查询进行中的组局
          'participants.id': userId  // 使用点表示法查询数组对象中的字段
        })
        .orderBy('createdAt', 'desc')
        .get()
      
      console.log('用户参与的组局:', allGamesRes.data.length)
      games = allGamesRes.data
      
    } else {
      // 修复：获取所有（已创建+已参与）的进行中组局
      console.log('查询所有组局（已创建+已参与）...')
      
      // 获取用户创建的组局
      const createdRes = await db.collection('games')
        .where({ 
          creatorId: userId,
          status: 'pending'
        })
        .get()
      
      console.log('创建的组局数量:', createdRes.data.length)
      
      // 获取用户参与的组局（排除自己创建的）
      const joinedRes = await db.collection('games')
        .where({ 
          status: 'pending',
          'participants.id': userId,
          creatorId: _.neq(userId)  // 排除自己创建的
        })
        .get()
      
      console.log('参与的组局数量:', joinedRes.data.length)
      
      games = [...createdRes.data, ...joinedRes.data]
      console.log('总组局数:', games.length)
    }
    
    // 处理游戏数据
    const processedGames = await Promise.all(games.map(async (game) => {
      // 确保creatorInfo存在
      let creatorInfo = game.creatorInfo || { nickname: '未知用户', avatar: '' }
      
      // 如果creatorInfo是字符串，尝试从users集合获取
      if (typeof creatorInfo === 'string') {
        try {
          const creatorRes = await db.collection('users').doc(creatorInfo).get()
          if (creatorRes.data) {
            creatorInfo = {
              id: creatorRes.data._id,
              nickname: creatorRes.data.nickname || '未知用户',
              avatar: creatorRes.data.avatar || 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png',
              tags: creatorRes.data.tags || []
            }
          }
        } catch (err) {
          console.error('获取创建者信息失败:', err)
        }
      }
      
      // 确保participants存在
      let participants = game.participants || []
      
      // 如果participants是字符串数组，转换为对象数组
      if (Array.isArray(participants) && participants.length > 0 && typeof participants[0] === 'string') {
        try {
          const usersRes = await db.collection('users')
            .where({ _id: _.in(participants) })
            .get()
          
          participants = usersRes.data.map(user => ({
            id: user._id,
            nickname: user.nickname || '未知用户',
            avatar: user.avatar || 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png'
          }))
        } catch (err) {
          console.error('获取参与者信息失败:', err)
          participants = participants.map(id => ({
            id,
            nickname: '未知用户',
            avatar: 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png'
          }))
        }
      }
      
      return {
        ...game,
        id: game._id,
        creatorInfo,
        participants,
        currentPlayers: participants.length + 1,
        isFull: (participants.length + 1) >= (game.maxPlayers || 4),
        isCreator: game.creatorId === userId,
        isJoined: participants.some(p => p.id === userId) || game.creatorId === userId
      }
    }))
    
    // 按创建时间排序
    processedGames.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    console.log('最终返回的游戏数据:', processedGames.length, processedGames)
    
    return {
      code: 0,
      message: '获取成功',
      data: processedGames
    }
    
  } catch (error) {
    console.error('获取我的组局错误:', error)
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: []
    }
  }
}

// 获取创建的组局
async function getCreatedGames(data, wxContext) {
  const { userId } = data
  
  if (!userId) {
    return { 
      code: 400, 
      message: '缺少用户ID',
      data: []
    }
  }
  
  try {
    const gamesRes = await db.collection('games')
      .where({ creatorId: userId, status: 'pending' })
      .orderBy('createdAt', 'desc')
      .get()
    
    return {
      code: 0,
      message: '获取成功',
      data: gamesRes.data
    }
  } catch (error) {
    console.error('获取创建的组局错误:', error)
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: []
    }
  }
}

// 获取参与的组局
async function getJoinedGames(data, wxContext) {
  const { userId } = data
  
  if (!userId) {
    return { 
      code: 400, 
      message: '缺少用户ID',
      data: []
    }
  }
  
  try {
    // 先获取参与记录
    const participationsRes = await db.collection('participations')
      .where({ userId: userId })
      .get()
    
    const gameIds = participationsRes.data.map(p => p.gameId)
    
    if (gameIds.length === 0) {
      return { 
        code: 0, 
        message: '暂无参与组局',
        data: [] 
      }
    }
    
    const gamesRes = await db.collection('games')
      .where({ 
        _id: _.in(gameIds),
        status: 'pending'
      })
      .orderBy('time', 'asc')
      .get()
    
    return {
      code: 0,
      message: '获取成功',
      data: gamesRes.data
    }
  } catch (error) {
    console.error('获取参与的组局错误:', error)
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: []
    }
  }
}

// 搜索组局
async function searchGames(data, wxContext) {
  const { keyword, filters = {} } = data
  
  if (!keyword && Object.keys(filters).length === 0) {
    return { 
      code: 400, 
      message: '缺少搜索条件',
      data: []
    }
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
      message: '搜索成功',
      data: gamesRes.data
    }
  } catch (error) {
    console.error('搜索组局错误:', error)
    return {
      code: 500,
      message: '服务器内部错误: ' + error.message,
      data: []
    }
  }
}