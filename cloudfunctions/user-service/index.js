// 用户服务云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const success = (data = null, message = 'ok') => ({ code: 0, message, data })
const fail = (code, message, data = null) => ({ code, message, data })

async function checkTextSecurity(content, title = '内容') {
  const text = String(content || '').trim()
  if (!text) return { ok: true }

  try {
    const checker = cloud?.openapi?.security?.msgSecCheck
    if (typeof checker !== 'function') {
      console.warn('msgSecCheck unavailable, skip security check')
      return { ok: true, skipped: true }
    }

    const res = await checker({
      content: text,
      version: 2,
      scene: 2
    })
    const errCode = Number(res?.errCode || 0)
    if (errCode === 0) return { ok: true }
    if (errCode !== 87014) {
      console.warn('msgSecCheck unavailable by errCode, skip security check:', errCode, res?.errMsg || '')
      return { ok: true, skipped: true }
    }
    return {
      ok: false,
      code: 422,
      message: `${title}包含敏感或违规内容，请修改后重试`
    }
  } catch (error) {
    const errCode = Number(error?.errCode || error?.errno || -1)
    const errText = String(error?.errMsg || error?.message || '')

    if (errCode === 87014 || errText.includes('risky')) {
      return {
        ok: false,
        code: 422,
        message: `${title}包含敏感或违规内容，请修改后重试`
      }
    }

    if (
      errText.includes('openapi') ||
      errText.includes('access_token') ||
      errText.includes('invalid scope') ||
      errText.includes('not found')
    ) {
      console.warn('msgSecCheck unavailable, skip security check', errText)
      return { ok: true, skipped: true }
    }

    console.warn('msgSecCheck unavailable, skip security check', errCode, errText)
    return { ok: true, skipped: true }
    console.error('msgSecCheck failed:', error)
    return {
      ok: false,
      code: 503,
      message: '内容安全检查失败，请稍后重试'
    }
  }
}

async function checkTextSecurityBatch(items = []) {
  for (const item of items) {
    const result = await checkTextSecurity(item?.text, item?.title || '内容')
    if (!result.ok) return result
  }
  return { ok: true }
}

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
      case 'adminUpdateUserProfile':
        return await adminUpdateUserProfile(data, wxContext)
      case 'adminUpdateUserTags':
        return await adminUpdateUserTags(data, wxContext)
      case 'adminUpdateUserGames':
        return await adminUpdateUserGames(data, wxContext)
      case 'adminSetUserBlacklist':
        return await adminSetUserBlacklist(data, wxContext)
      case 'adminSetUserAdmin':
        return await adminSetUserAdmin(data, wxContext)
      case 'getUserStats':
        return await getUserStats(data)
      case 'searchUsers':
        return await searchUsers(data)
      case 'adminListUsers':
        return await adminListUsers(data, wxContext)
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
    isAdmin: !!user.isAdmin,
    isBlacklisted: !!user.isBlacklisted
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

function isBlacklistedUser(user) {
  if (!user) return false
  return user.isBlacklisted === true || user.isBlacklisted === 'true'
}

function ensureNotBlacklisted(currentUser, actionText = '执行该操作') {
  if (!currentUser) return fail(404, '用户不存在')
  if (isBlacklistedUser(currentUser)) {
    return fail(403, `您已被管理员加入黑名单，暂时无法${actionText}`)
  }
  return null
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

    const newUser = {
      openid,
      nickname: userInfo.nickname || '微信用户',
      avatar: userInfo.avatarUrl || userInfo.avatar || '',
      gender: userInfo.gender || 0,
      province: userInfo.province || '',
      city: userInfo.city || '',
      country: userInfo.country || '',
      tags: [],
      games: [],
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

    const updates = { lastLoginAt: now }
    if (userData.forceLogoutFlag) {
      updates.forceLogoutFlag = false
      updates.forceLogoutUntil = null
    }
    if (Object.keys(updates).length > 1) {
      updates.updatedAt = now
    }

    await db.collection('users').doc(userData._id).update({ data: updates })
    userData = { ...userData, ...updates }
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
  const blacklistError = ensureNotBlacklisted(currentUser, '修改个人标签')
  if (blacklistError) return blacklistError

  const filteredUpdates = sanitizeUserUpdates(updates)
  const infoSecurityRes = await checkTextSecurityBatch([
    { title: '昵称', text: filteredUpdates.nickname },
    { title: '省份', text: filteredUpdates.province },
    { title: '城市', text: filteredUpdates.city },
    { title: '国家', text: filteredUpdates.country }
  ])
  if (!infoSecurityRes.ok) return fail(infoSecurityRes.code || 422, infoSecurityRes.message || '内容包含敏感信息')
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
  const blacklistError = ensureNotBlacklisted(currentUser, '修改个人信息')
  if (blacklistError) return blacklistError

  const tagSecurityRes = await checkTextSecurityBatch(
    tags.map((item) => ({ title: '标签', text: item && item.name }))
  )
  if (!tagSecurityRes.ok) return fail(tagSecurityRes.code || 422, tagSecurityRes.message || '内容包含敏感信息')

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
  const blacklistGamesError = ensureNotBlacklisted(currentUser, '修改游戏设备信息')
  if (blacklistGamesError) return blacklistGamesError

  const gameSecurityRes = await checkTextSecurityBatch(
    games.map((item) => ({ title: '游戏/设备名称', text: item && item.name }))
  )
  if (!gameSecurityRes.ok) return fail(gameSecurityRes.code || 422, gameSecurityRes.message || '内容包含敏感信息')

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
  const blacklistAvatarError = ensureNotBlacklisted(currentUser, '修改头像')
  if (blacklistAvatarError) return blacklistAvatarError

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

async function adminUpdateUserProfile(data, wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '璇峰厛鐧诲綍')
  if (!isAdminUser(currentUser)) return fail(403, '浠呯鐞嗗憳鍙搷浣?')

  const targetUserId = String(data?.userId || '').trim()
  if (!targetUserId) return fail(400, '缂哄皯鐢ㄦ埛ID')

  const nickname = data?.nickname
  const avatarUrl = data?.avatarUrl
  const avatarSize = Number(data?.avatarSize || 0)
  const updates = {}

  if (typeof nickname !== 'undefined') {
    const text = String(nickname || '').trim()
    if (!text) return fail(400, '鏄电О涓嶈兘涓虹┖')
    updates.nickname = text.slice(0, 32)
  }

  const adminProfileSecurityRes = await checkTextSecurityBatch([
    { title: '昵称', text: updates.nickname }
  ])
  if (!adminProfileSecurityRes.ok) {
    return fail(adminProfileSecurityRes.code || 422, adminProfileSecurityRes.message || '内容包含敏感信息')
  }

  if (typeof avatarUrl !== 'undefined') {
    const url = String(avatarUrl || '').trim()
    if (!url) return fail(400, '澶村儚URL涓嶈兘涓虹┖')
    if (!url.startsWith('cloud://') && !url.startsWith('http')) {
      return fail(400, '澶村儚URL鏍煎紡涓嶆纭?')
    }
    if (avatarSize > 2 * 1024 * 1024) {
      return fail(400, '澶村儚澶у皬涓嶈兘瓒呰繃2MB')
    }
    updates.avatar = url
  }

  if (!Object.keys(updates).length) return fail(400, '娌℃湁鍙洿鏂扮殑鍐呭')

  updates.updatedAt = new Date()
  updates.adminUpdatedBy = currentUser._id

  await db.collection('users').doc(targetUserId).update({ data: updates })
  const userRes = await db.collection('users').doc(targetUserId).get()
  if (!userRes.data) return fail(404, '鐢ㄦ埛涓嶅瓨鍦?')

  return success(toUserDto(userRes.data), '鏇存柊鎴愬姛')
}

async function adminUpdateUserTags(data, wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '请先登录')
  if (!isAdminUser(currentUser)) return fail(403, '仅管理员可操作')

  const targetUserId = String(data?.userId || '').trim()
  if (!targetUserId) return fail(400, '缺少用户ID')

  const tags = Array.isArray(data?.tags) ? data.tags : null
  if (!tags) return fail(400, '标签格式错误')
  if (tags.length > 20) return fail(400, '标签数量不能超过20个')

  const normalizedTags = []
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i] || {}
    const name = String(tag.name || '').trim().slice(0, 12)
    if (!name) continue
    normalizedTags.push({
      id: tag.id || (10000 + i),
      name
    })
  }

  const adminTagSecurityRes = await checkTextSecurityBatch(
    normalizedTags.map((item) => ({ title: '标签', text: item && item.name }))
  )
  if (!adminTagSecurityRes.ok) {
    return fail(adminTagSecurityRes.code || 422, adminTagSecurityRes.message || '内容包含敏感信息')
  }

  await db.collection('users').doc(targetUserId).update({
    data: {
      tags: normalizedTags,
      updatedAt: new Date(),
      adminUpdatedBy: currentUser._id
    }
  })

  const userRes = await db.collection('users').doc(targetUserId).get()
  if (!userRes.data) return fail(404, '用户不存在')
  return success(toUserDto(userRes.data), '标签更新成功')
}

async function adminUpdateUserGames(data, wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '请先登录')
  if (!isAdminUser(currentUser)) return fail(403, '仅管理员可操作')

  const targetUserId = String(data?.userId || '').trim()
  if (!targetUserId) return fail(400, '缺少用户ID')

  const games = Array.isArray(data?.games) ? data.games : null
  if (!games) return fail(400, '设备格式错误')
  if (games.length > 20) return fail(400, '设备数量不能超过20个')

  const normalizedGames = []
  for (let i = 0; i < games.length; i++) {
    const game = games[i] || {}
    const name = String(game.name || '').trim().slice(0, 24)
    if (!name) continue
    const type = String(game.type || '').trim() || 'other'
    normalizedGames.push({
      id: game.id || String(Date.now() + i),
      type,
      name
    })
  }

  const adminGameSecurityRes = await checkTextSecurityBatch(
    normalizedGames.map((item) => ({ title: '游戏/设备名称', text: item && item.name }))
  )
  if (!adminGameSecurityRes.ok) {
    return fail(adminGameSecurityRes.code || 422, adminGameSecurityRes.message || '内容包含敏感信息')
  }

  await db.collection('users').doc(targetUserId).update({
    data: {
      games: normalizedGames,
      updatedAt: new Date(),
      adminUpdatedBy: currentUser._id
    }
  })

  const userRes = await db.collection('users').doc(targetUserId).get()
  if (!userRes.data) return fail(404, '用户不存在')
  return success(toUserDto(userRes.data), '设备更新成功')
}

async function adminSetUserBlacklist(data, wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '请先登录')
  if (!isAdminUser(currentUser)) return fail(403, '仅管理员可操作')

  const targetUserId = String(data?.userId || '').trim()
  const isBlacklisted = !!data?.isBlacklisted
  if (!targetUserId) return fail(400, '缺少用户ID')
  if (String(targetUserId) === String(currentUser._id) && isBlacklisted) {
    return fail(400, '不能将自己加入黑名单')
  }

  const updateData = {
    isBlacklisted,
    updatedAt: new Date(),
    adminUpdatedBy: currentUser._id
  }

  if (isBlacklisted) {
    updateData.blacklistedAt = new Date()
    updateData.blacklistedBy = currentUser._id
  } else {
    updateData.blacklistedAt = null
    updateData.blacklistedBy = null
  }

  await db.collection('users').doc(targetUserId).update({ data: updateData })
  const userRes = await db.collection('users').doc(targetUserId).get()
  if (!userRes.data) return fail(404, '用户不存在')
  return success(toUserDto(userRes.data), isBlacklisted ? '已加入黑名单' : '已移出黑名单')
}

async function adminSetUserAdmin(data, wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '请先登录')
  if (!isAdminUser(currentUser)) return fail(403, '仅管理员可操作')

  const targetUserId = String(data?.userId || '').trim()
  const isAdmin = !!data?.isAdmin
  if (!targetUserId) return fail(400, '缺少用户ID')
  if (String(targetUserId) === String(currentUser._id) && !isAdmin) {
    return fail(400, '不能取消自己的管理员身份')
  }

  await db.collection('users').doc(targetUserId).update({
    data: {
      isAdmin,
      updatedAt: new Date(),
      adminUpdatedBy: currentUser._id
    }
  })
  const userRes = await db.collection('users').doc(targetUserId).get()
  if (!userRes.data) return fail(404, '用户不存在')
  return success(toUserDto(userRes.data), isAdmin ? '已加冕管理员' : '已取消管理员')
}

async function getMe(wxContext) {
  const user = await getCurrentUser(wxContext)
  if (!user) return fail(404, '用户不存在')

  return success({
    id: user._id,
    nickname: user.nickname || '',
    avatar: user.avatar || '',
    isAdmin: !!user.isAdmin,
    isBlacklisted: !!user.isBlacklisted
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
    .limit(10)
    .get()

  const list = (byNick.data || []).map((u) => ({
    id: u._id,
    nickname: u.nickname || '未命名用户',
    avatar: u.avatar || '',
    isAdmin: !!u.isAdmin,
    isBlacklisted: !!u.isBlacklisted
  }))

  return success({ list }, '获取成功')
}

async function adminListUsers(data, wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '请先登录')
  if (!isAdminUser(currentUser)) return fail(403, '仅管理员可操作')

  const page = Math.max(1, Number(data?.page || 1))
  const pageSize = Math.min(10, Math.max(1, Number(data?.pageSize || 10)))
  const skip = (page - 1) * pageSize

  let res
  try {
    res = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
  } catch (error) {
    console.warn('adminListUsers fallback to _id desc:', error && (error.errMsg || error.message || error))
    res = await db.collection('users')
      .orderBy('_id', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
  }

  const list = (res.data || []).map((u) => ({
    id: u._id,
    nickname: u.nickname || '未命名用户',
    createdAt: u.createdAt || null,
    isAdmin: !!u.isAdmin,
    isBlacklisted: !!u.isBlacklisted
  }))

  return success({
    list,
    page,
    pageSize,
    hasMore: list.length >= pageSize
  }, '获取成功')
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
