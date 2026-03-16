// 用户服务云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  
  console.log('user-service 调用:', { action, data, openid: wxContext.OPENID })
  
  try {
    switch (action) {
      case 'test':
        return handleTest(wxContext)
      case 'login':
        return await handleLogin(data, wxContext)
      case 'getUserInfo':
        return await getUserInfo(data, wxContext)
      case 'updateUserInfo':
        return await updateUserInfo(data, wxContext)
      case 'updateUserTags':
        return await updateUserTags(data, wxContext)
      case 'updateUserGames':
        return await updateUserGames(data, wxContext)
      case 'updateUserAvatar':
        return await updateUserAvatar(data, wxContext)
      case 'getUserStats':
        return await getUserStats(data, wxContext)
      default:
        return { code: 400, message: '未知操作' }
    }
  } catch (error) {
    console.error('user-service 错误:', error)
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
    message: 'user-service 运行正常',
    data: {
      timestamp: new Date().toISOString(),
      openid: wxContext.OPENID,
      appid: wxContext.APPID
    }
  }
}

// 用户登录/注册 - 修复版，不再覆盖用户已修改的信息
async function handleLogin(data, wxContext) {
  const { userInfo } = data
  
  if (!userInfo) {
    return { code: 400, message: '缺少用户信息' }
  }
  
  try {
    // 检查用户是否已存在
    const queryResult = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    let userData = null
    let isNewUser = false
    
    if (queryResult.data.length === 0) {
      // 新用户注册
      isNewUser = true
      
      // 为新用户创建默认标签
      const defaultTags = [
        { id: 1, name: '日麻初心玩家' }
      ]
      
      // 为新用户创建默认游戏/装备
      const defaultGames = [
        { id: Date.now(), name: 'root', type: 'mahjong' }
      ]
      
      const newUser = {
        openid: wxContext.OPENID,
        ...userInfo,
        tags: defaultTags,
        games: defaultGames,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      }
      
      const addResult = await db.collection('users').add({
        data: newUser
      })
      
      userData = { ...newUser, _id: addResult._id }
      
    } else {
      // 已存在用户 - 重要修复：不再覆盖用户已修改的信息
      const existingUser = queryResult.data[0]
      const userId = existingUser._id
      
      // 只更新最后登录时间，不覆盖用户已修改的昵称和头像
      await db.collection('users').doc(userId).update({
        data: {
          lastLoginAt: new Date()
        }
      })
      
      // 使用数据库中的用户信息，而不是微信返回的信息
      userData = { ...existingUser, _id: userId }
      
      console.log('✅ 使用数据库中的用户信息，不覆盖微信返回的信息')
      console.log('数据库中的昵称:', userData.nickname)
      console.log('数据库中的头像:', userData.avatar)
      console.log('微信返回的昵称:', userInfo.nickname)
      console.log('微信返回的头像:', userInfo.avatarUrl)
    }
    
    // 获取用户统计信息
    const stats = await getUserStats({ userId: userData._id }, wxContext)
    
    return {
      code: 0,
      message: isNewUser ? '注册成功' : '登录成功',
      data: {
        userInfo: {
          id: userData._id,
          nickname: userData.nickname,
          avatar: userData.avatar,
          tags: userData.tags || [],
          games: userData.games || []
        },
        token: wxContext.OPENID,
        stats: stats.data
      }
    }
    
  } catch (error) {
    console.error('登录处理错误:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 获取用户信息
async function getUserInfo(data, wxContext) {
  const { userId } = data
  
  if (!userId) {
    return { code: 400, message: '缺少用户ID' }
  }
  
  try {
    const userRes = await db.collection('users').doc(userId).get()
    
    if (!userRes.data) {
      return { code: 404, message: '用户不存在' }
    }
    
    const userData = userRes.data
    
    return {
      code: 0,
      data: {
        id: userData._id,
        nickname: userData.nickname,
        avatar: userData.avatar,
        tags: userData.tags || [],
        games: userData.games || []
      }
    }
  } catch (error) {
    console.error('获取用户信息错误:', error)
    throw error
  }
}

// 更新用户信息 - 修复版
async function updateUserInfo(data, wxContext) {
  const { userId, updates } = data
  
  if (!updates) {
    return { code: 400, message: '缺少更新数据' }
  }
  
  try {
    console.log('更新用户信息参数:', { userId, updates, openid: wxContext.OPENID })
    
    // 通过 openid 查找用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    console.log('查询到的用户:', userRes.data)
    
    if (userRes.data.length === 0) {
      return { code: 404, message: '用户不存在' }
    }
    
    const userDoc = userRes.data[0]
    const userDocId = userDoc._id
    
    // 将 ObjectId 转为字符串比较
    if (userId && userDocId.toString() !== userId) {
      console.warn('用户ID不匹配:', { 
        dbId: userDocId.toString(), 
        passedId: userId 
      })
      return { code: 403, message: '无权操作其他用户' }
    }
    
    // 过滤不允许更新的字段
    const allowedUpdates = ['nickname', 'gender', 'province', 'city', 'country']
    const filteredUpdates = {}
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key]
      }
    })
    
    if (Object.keys(filteredUpdates).length === 0) {
      return { code: 400, message: '没有有效的更新字段' }
    }
    
    // 执行更新
    await db.collection('users').doc(userDocId).update({
      data: {
        ...filteredUpdates,
        updatedAt: new Date()
      }
    })
    
    console.log('✅ 用户信息更新成功:', filteredUpdates)
    
    return {
      code: 0,
      message: '更新成功',
      data: filteredUpdates
    }
  } catch (error) {
    console.error('更新用户信息错误:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 更新用户标签
async function updateUserTags(data, wxContext) {
  const { userId, tags } = data
  
  if (!userId || !tags || !Array.isArray(tags)) {
    return { code: 400, message: '缺少必要参数或参数格式错误' }
  }
  
  try {
    console.log('更新用户标签参数:', { userId, tags, openid: wxContext.OPENID })
    
    // 通过 openid 查找用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userRes.data.length === 0) {
      return { code: 404, message: '用户不存在' }
    }
    
    const userDoc = userRes.data[0]
    const userDocId = userDoc._id
    
    // 验证用户权限
    if (userDocId.toString() !== userId) {
      return { code: 403, message: '无权操作' }
    }
    
    // 执行更新
    await db.collection('users').doc(userDocId).update({
      data: {
        tags: tags,
        updatedAt: new Date()
      }
    })
    
    console.log('✅ 用户标签更新成功:', tags)
    
    return {
      code: 0,
      message: '标签更新成功',
      data: { tags }
    }
  } catch (error) {
    console.error('更新用户标签错误:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 更新用户游戏/设备
async function updateUserGames(data, wxContext) {
  const { userId, games } = data
  
  if (!userId || !games || !Array.isArray(games)) {
    return { code: 400, message: '缺少必要参数或参数格式错误' }
  }
  
  try {
    console.log('更新用户游戏参数:', { userId, games, openid: wxContext.OPENID })
    
    // 通过 openid 查找用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userRes.data.length === 0) {
      return { code: 404, message: '用户不存在' }
    }
    
    const userDoc = userRes.data[0]
    const userDocId = userDoc._id
    
    // 验证用户权限
    if (userDocId.toString() !== userId) {
      return { code: 403, message: '无权操作' }
    }
    
    // 执行更新
    await db.collection('users').doc(userDocId).update({
      data: {
        games: games,
        updatedAt: new Date()
      }
    })
    
    console.log('✅ 用户游戏更新成功:', games)
    
    return {
      code: 0,
      message: '游戏/设备更新成功',
      data: { games }
    }
  } catch (error) {
    console.error('更新用户游戏错误:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 更新用户头像
async function updateUserAvatar(data, wxContext) {
  const { userId, avatarUrl } = data
  
  if (!avatarUrl) {
    return { code: 400, message: '缺少头像URL' }
  }
  
  try {
    console.log('更新用户头像参数:', { userId, avatarUrl, openid: wxContext.OPENID })
    
    // 通过 openid 查找用户
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get()
    
    if (userRes.data.length === 0) {
      return { code: 404, message: '用户不存在' }
    }
    
    const userDoc = userRes.data[0]
    const userDocId = userDoc._id
    
    // 将 ObjectId 转为字符串比较
    if (userId && userDocId.toString() !== userId) {
      console.warn('用户ID不匹配:', { 
        dbId: userDocId.toString(), 
        passedId: userId 
      })
      return { code: 403, message: '无权操作其他用户' }
    }
    
    // 验证头像URL格式
    if (!avatarUrl.startsWith('cloud://') && !avatarUrl.startsWith('http')) {
      return { code: 400, message: '头像URL格式不正确' }
    }
    
    // 执行更新
    await db.collection('users').doc(userDocId).update({
      data: {
        avatar: avatarUrl,
        updatedAt: new Date()
      }
    })
    
    console.log('✅ 用户头像更新成功:', avatarUrl)
    
    return {
      code: 0,
      message: '头像更新成功',
      data: { avatar: avatarUrl }
    }
  } catch (error) {
    console.error('更新用户头像错误:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 获取用户统计
async function getUserStats(data, wxContext) {
  const { userId } = data
  
  if (!userId) {
    return { code: 400, message: '缺少用户ID' }
  }
  
  try {
    const db = cloud.database()
    const _ = db.command
    
    // 1. 获取用户创建的、进行中的组局数量
    const createdGamesRes = await db.collection('games')
      .where({ 
        creatorId: userId,
        status: 'pending'  // 只统计进行中的
      })
      .count()
    
    // 2. 获取用户参与的、进行中的组局数量（排除自己创建的）
    const joinedGamesRes = await db.collection('games')
      .where({
        'participants.id': userId,
        status: 'pending',  // 只统计进行中的
        creatorId: _.neq(userId)  // 排除自己创建的
      })
      .count()
    
    // 3. 获取用户已完成的组局数量（包括创建和参与）
    const completedGamesRes = await db.collection('games')
      .where({
        'participants.id': userId,
        status: 'completed'
      })
      .count()
    
    return {
      code: 0,
      data: {
        createdGames: createdGamesRes.total || 0,
        joinedGames: joinedGamesRes.total || 0,
        completedGames: completedGamesRes.total || 0
      }
    }
  } catch (error) {
    console.error('获取用户统计错误:', error)
    // 返回默认统计
    return {
      code: 0,
      data: {
        createdGames: 0,
        joinedGames: 0,
        completedGames: 0
      }
    }
  }
}