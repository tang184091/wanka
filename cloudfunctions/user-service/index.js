// 用户服务云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const success = (data = null, message = 'ok') => ({ code: 0, message, data })
const fail = (code, message, data = null) => ({ code, message, data })

exports.main = async (event) => {
  const { action, data } = event || {}
  const wxContext = cloud.getWXContext()

  console.log('user-service 调用:', { action, openid: wxContext.OPENID })

  try {
    switch (action) {
      case 'test':
        return success({
          timestamp: new Date().toISOString(),
          openid: wxContext.OPENID,
          appid: wxContext.APPID
        }, 'user-service 运行正常')
      case 'login':
        return await handleLogin(data, wxContext)
      case 'getUserInfo':
        return await getUserInfo(data)
      case 'updateUserInfo':
        return await updateUserInfo(data, wxContext)
      case 'updateUserTags':
        return await updateUserTags(data, wxContext)
      case 'updateUserGames':
        return await updateUserGames(data, wxContext)
      case 'updateUserAvatar':
        return await updateUserAvatar(data, wxContext)
      case 'getUserStats':
<<<<<<< ours
        return await getUserStats(data, wxContext)
      case 'searchUsers':
        return await searchUsers(data, wxContext)
      case 'getMe':
        return await getMe(data, wxContext)
=======
        return await getUserStats(data)
      case 'searchUsers':
        return await searchUsers(data)
      case 'getMe':
        return await getMe(wxContext)
>>>>>>> theirs
      default:
        return fail(400, '未知操作')
    }
  } catch (error) {
    console.error('user-service 未捕获错误:', error)
    return fail(500, `服务器内部错误: ${error.message}`)
  }
}

async function getCurrentUser(wxContext) {
  const res = await db.collection('users').where({ openid: wxContext.OPENID }).limit(1).get()
  return (res.data || [])[0] || null
}

function toUserDto(user) {
  return {
    id: user._id,
    nickname: user.nickname || '',
    avatar: user.avatar || '',
    tags: user.tags || [],
    games: user.games || [],
    isAdmin: !!user.isAdmin
  }
}

<<<<<<< ours
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
        { id: 1, name: '立直麻将初心玩家' }
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
          games: userData.games || [],
          isAdmin: !!userData.isAdmin
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
=======
function sanitizeUserUpdates(updates = {}) {
  const allowed = ['nickname', 'gender', 'province', 'city', 'country']
  const next = {}
  allowed.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(updates, key)) next[key] = updates[key]
  })
  return next
>>>>>>> theirs
}

function ensureOwner(currentUser, targetUserId) {
  if (!currentUser) return fail(404, '用户不存在')
  if (targetUserId && String(currentUser._id) !== String(targetUserId)) {
    return fail(403, '无权操作其他用户')
  }
  return null
}

async function handleLogin(data, wxContext) {
  const payload = data || {}
  const { userInfo } = payload
  if (!userInfo) return fail(400, '缺少用户信息')

  const now = new Date()
  const queryResult = await db.collection('users').where({ openid: wxContext.OPENID }).limit(1).get()

  let userData
  let isNewUser = false

  if (!(queryResult.data || []).length) {
    isNewUser = true
    const defaultTags = [{ id: 1, name: '立直麻将初心玩家' }]
    const defaultGames = [{ id: Date.now(), name: 'root', type: 'mahjong' }]

    const newUser = {
      openid: wxContext.OPENID,
      nickname: userInfo.nickname || '微信用户',
      avatar: userInfo.avatarUrl || userInfo.avatar || '',
      gender: userInfo.gender || 0,
      province: userInfo.province || '',
      city: userInfo.city || '',
      country: userInfo.country || '',
      tags: defaultTags,
      games: defaultGames,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    }

    const addResult = await db.collection('users').add({ data: newUser })
    userData = { ...newUser, _id: addResult._id }
  } else {
    userData = queryResult.data[0]
    await db.collection('users').doc(userData._id).update({
      data: {
<<<<<<< ours
        id: userData._id,
        nickname: userData.nickname,
        avatar: userData.avatar,
        tags: userData.tags || [],
        games: userData.games || [],
        isAdmin: !!userData.isAdmin
=======
        lastLoginAt: now
>>>>>>> theirs
      }
    })
  }

  const statsRes = await getUserStats({ userId: userData._id })

  return success({
    userInfo: toUserDto(userData),
    token: wxContext.OPENID,
    stats: statsRes.data || { createdGames: 0, joinedGames: 0, completedGames: 0 }
  }, isNewUser ? '注册成功' : '登录成功')
}

async function getUserInfo(data) {
  const payload = data || {}
  const { userId } = payload
  if (!userId) return fail(400, '缺少用户ID')

  const userRes = await db.collection('users').doc(userId).get()
  if (!userRes.data) return fail(404, '用户不存在')

  return success(toUserDto(userRes.data), '获取成功')
}

async function updateUserInfo(data, wxContext) {
  const payload = data || {}
  const { userId, updates } = payload
  if (!updates || typeof updates !== 'object') return fail(400, '缺少更新数据')

  const currentUser = await getCurrentUser(wxContext)
  const ownerError = ensureOwner(currentUser, userId)
  if (ownerError) return ownerError

  const filteredUpdates = sanitizeUserUpdates(updates)
  if (!Object.keys(filteredUpdates).length) return fail(400, '没有有效的更新字段')

  await db.collection('users').doc(currentUser._id).update({
    data: {
      ...filteredUpdates,
      updatedAt: new Date()
    }
  })

  return success(filteredUpdates, '更新成功')
}

async function updateUserTags(data, wxContext) {
  const payload = data || {}
  const { userId, tags } = payload
  if (!Array.isArray(tags)) return fail(400, '缺少必要参数或参数格式错误')

  const currentUser = await getCurrentUser(wxContext)
  const ownerError = ensureOwner(currentUser, userId)
  if (ownerError) return ownerError

  await db.collection('users').doc(currentUser._id).update({
    data: {
      tags,
      updatedAt: new Date()
    }
  })

  return success({ tags }, '标签更新成功')
}

async function updateUserGames(data, wxContext) {
  const payload = data || {}
  const { userId, games } = payload
  if (!Array.isArray(games)) return fail(400, '缺少必要参数或参数格式错误')

  const currentUser = await getCurrentUser(wxContext)
  const ownerError = ensureOwner(currentUser, userId)
  if (ownerError) return ownerError

  await db.collection('users').doc(currentUser._id).update({
    data: {
      games,
      updatedAt: new Date()
    }
  })

  return success({ games }, '游戏/设备更新成功')
}

async function updateUserAvatar(data, wxContext) {
  const payload = data || {}
  const { userId, avatarUrl } = payload
  if (!avatarUrl) return fail(400, '缺少头像URL')
  if (!String(avatarUrl).startsWith('cloud://') && !String(avatarUrl).startsWith('http')) {
    return fail(400, '头像URL格式不正确')
  }

  const currentUser = await getCurrentUser(wxContext)
  const ownerError = ensureOwner(currentUser, userId)
  if (ownerError) return ownerError

  await db.collection('users').doc(currentUser._id).update({
    data: {
      avatar: avatarUrl,
      updatedAt: new Date()
    }
  })

  return success({ avatar: avatarUrl }, '头像更新成功')
}

<<<<<<< ours


async function getMe(data, wxContext) {
  try {
    const res = await db.collection('users').where({ openid: wxContext.OPENID }).limit(1).get()
    if (!res.data.length) return { code: 404, message: '用户不存在' }
    const user = res.data[0]
    return {
      code: 0,
      message: '获取成功',
      data: {
        id: user._id,
        nickname: user.nickname || '',
        avatar: user.avatar || '',
        isAdmin: !!user.isAdmin
      }
    }
  } catch (error) {
    return { code: 500, message: '获取用户失败: ' + error.message }
  }
}

async function searchUsers(data, wxContext) {
  try {
    const keyword = (data && data.keyword ? String(data.keyword) : '').trim()
    if (!keyword) return { code: 0, message: 'ok', data: { list: [] } }

    const byNick = await db.collection('users')
      .where({ nickname: db.RegExp({ regexp: keyword, options: 'i' }) })
      .limit(20)
      .get()

    const byId = await db.collection('users')
      .where({ _id: db.RegExp({ regexp: keyword, options: 'i' }) })
      .limit(20)
      .get()

    const map = new Map()
    ;[...(byNick.data || []), ...(byId.data || [])].forEach(u => {
      if (u && u._id) map.set(u._id, { id: u._id, nickname: u.nickname || '未命名用户', avatar: u.avatar || '' })
    })

    return { code: 0, message: '获取成功', data: { list: Array.from(map.values()).slice(0, 20) } }
  } catch (error) {
    return { code: 500, message: '搜索用户失败: ' + error.message, data: { list: [] } }
  }
}

// 获取用户统计
async function getUserStats(data, wxContext) {
  const { userId } = data
  
  if (!userId) {
    return { code: 400, message: '缺少用户ID' }
  }
  
=======
async function getMe(wxContext) {
  const user = await getCurrentUser(wxContext)
  if (!user) return fail(404, '用户不存在')

  return success({
    id: user._id,
    nickname: user.nickname || '',
    avatar: user.avatar || '',
    isAdmin: !!user.isAdmin
  }, '获取成功')
}

async function searchUsers(data) {
  const payload = data || {}
  const keyword = String(payload.keyword || '').trim()
  if (!keyword) return success({ list: [] }, 'ok')

  const byNick = await db.collection('users')
    .where({ nickname: db.RegExp({ regexp: keyword, options: 'i' }) })
    .limit(20)
    .get()

  const list = (byNick.data || []).map((u) => ({
    id: u._id,
    nickname: u.nickname || '未命名用户',
    avatar: u.avatar || ''
  }))

  return success({ list }, '获取成功')
}

async function getUserStats(data) {
  const payload = data || {}
  const { userId } = payload
  if (!userId) return fail(400, '缺少用户ID')

>>>>>>> theirs
  try {
    const [createdGamesRes, joinedGamesRes, completedCreatedRes, completedJoinedRes] = await Promise.all([
      db.collection('games').where({ creatorId: userId, status: 'pending' }).count(),
      db.collection('games').where({ 'participants.id': userId, status: 'pending', creatorId: _.neq(userId) }).count(),
      db.collection('games').where({ creatorId: userId, status: 'completed' }).count(),
      db.collection('games').where({ 'participants.id': userId, status: 'completed', creatorId: _.neq(userId) }).count()
    ])

    return success({
      createdGames: createdGamesRes.total || 0,
      joinedGames: joinedGamesRes.total || 0,
      completedGames: (completedCreatedRes.total || 0) + (completedJoinedRes.total || 0)
    }, '获取成功')
  } catch (error) {
    console.error('获取用户统计失败:', error)
    return success({
      createdGames: 0,
      joinedGames: 0,
      completedGames: 0
    }, '获取成功')
  }
}
