// 用户服务云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const success = (data = null, message = 'ok') => ({ code: 0, message, data })
const fail = (code, message, data = null) => ({ code, message, data })

const CAPTCHA_LOCK_MS = 30 * 60 * 1000

function isCollectionNotExistsError(error) {
  const text = String(error?.message || error?.errMsg || error || '')
  return text.includes('-502005')
    || text.includes('collection not exists')
    || text.includes('Db or Table not exist')
}	

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
        return await getUserStats(data)
      case 'searchUsers':
        return await searchUsers(data)
      case 'getMe':
        return await getMe(wxContext)
      case 'getCurrentUser':
        return await getMe(wxContext)
      case 'forceLogout':
        return await forceLogout(wxContext)
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

function sanitizeUserUpdates(updates = {}) {
  const allowed = ['nickname', 'gender', 'province', 'city', 'country']
  const next = {}
  allowed.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(updates, key)) next[key] = updates[key]
  })
  return next
}

function isAdminUser(user) {
  if (!user) return false
  return user.isAdmin === true || user.isAdmin === 'true' || user.role === 'admin'
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

  const openid = wxContext.OPENID
  const now = new Date()

  const queryResult = await db.collection('users').where({ openid }).limit(1).get()

  let userData
  let isNewUser = false

  if (!(queryResult.data || []).length) {
    isNewUser = true
    const defaultTags = [{ id: 1, name: '立直麻将初心玩家' }]
    const defaultGames = [{ id: Date.now(), name: 'root', type: 'mahjong' }]

    const newUser = {
      openid,
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
      lastLoginAt: now,
      forceLogoutFlag: false
    }

    const addResult = await db.collection('users').add({ data: newUser })
    userData = { ...newUser, _id: addResult._id }
  } else {
    userData = queryResult.data[0]

    const lockUntilTs = userData.forceLogoutUntil ? new Date(userData.forceLogoutUntil).getTime() : 0
    if (lockUntilTs && lockUntilTs > Date.now()) {
      return fail(423, '账号已被强制下线，请30分钟后再登录', {
        forceLogout: true,
        lockUntil: userData.forceLogoutUntil
      })
    }

    if (userData.forceLogoutFlag) {
      await db.collection('users').doc(userData._id).update({
        data: {
          forceLogoutFlag: false,
          forceLogoutUntil: null,
          lastLoginAt: now,
          updatedAt: now
        }
      })
    } else {
      await db.collection('users').doc(userData._id).update({
        data: { lastLoginAt: now }
      })
    }
  }

  const statsRes = await getUserStats({ userId: userData._id })

  return success({
    userInfo: toUserDto(userData),
    token: openid,
    stats: statsRes.data || { createdGames: 0, joinedGames: 0, completedGames: 0 },
    needCaptcha: false
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
  const { userId, avatarUrl, avatarSize = 0 } = payload
  if (!avatarUrl) return fail(400, '缺少头像URL')
  if (Number(avatarSize) > 2 * 1024 * 1024) return fail(400, '头像大小不能超过2MB')
  if (!String(avatarUrl).startsWith('cloud://') && !String(avatarUrl).startsWith('http')) {
    return fail(400, '头像URL格式不正确')
  }

  const currentUser = await getCurrentUser(wxContext)
  const ownerError = ensureOwner(currentUser, userId)
  if (ownerError) return ownerError

  if (!isAdminUser(currentUser)) {
    const lastUpdateTs = currentUser.lastAvatarUpdateAt ? new Date(currentUser.lastAvatarUpdateAt).getTime() : 0
    if (lastUpdateTs) {
      const now = new Date()
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      if (lastUpdateTs >= dayStart) {
        return fail(429, '头像每天仅可更新1次')
      }
    }
  }

  await db.collection('users').doc(currentUser._id).update({
    data: {
      avatar: avatarUrl,
      lastAvatarUpdateAt: new Date(),
      updatedAt: new Date()
    }
  })

  return success({ avatar: avatarUrl }, '头像更新成功')
}

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

async function forceLogout(wxContext) {
  const user = await getCurrentUser(wxContext)
  if (!user) return fail(404, '用户不存在')

  const lockUntil = new Date(Date.now() + CAPTCHA_LOCK_MS)
  await db.collection('users').doc(user._id).update({
    data: {
      forceLogoutFlag: true,
      forceLogoutUntil: lockUntil,
      updatedAt: new Date()
    }
  })

  return success({ lockUntil }, '已标记强制退出并锁定30分钟')
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
