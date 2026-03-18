// 用户服务云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const success = (data = null, message = 'ok') => ({ code: 0, message, data })
const fail = (code, message, data = null) => ({ code, message, data })

const RISK_WINDOW_MS = 60 * 1000
const FAST_RETRY_MS = 5000
const MAX_RISK_COUNT = 6
const CAPTCHA_FAIL_LIMIT = 3
const CAPTCHA_LOCK_MS = 30 * 60 * 1000

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

function ensureOwner(currentUser, targetUserId) {
  if (!currentUser) return fail(404, '用户不存在')
  if (targetUserId && String(currentUser._id) !== String(targetUserId)) {
    return fail(403, '无权操作其他用户')
  }
  return null
}

function randomCaptchaCode() {
  const pool = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 4; i++) {
    out += pool[Math.floor(Math.random() * pool.length)]
  }
  return out
}

function buildCaptchaChallenge(old) {
  const code = randomCaptchaCode()
  return {
    captchaId: `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    captchaCode: code,
    captchaHint: `请输入验证码：${code}`,
    failedCaptchaCount: old?.failedCaptchaCount || 0,
    captchaRequired: true,
    updatedAt: new Date()
  }
}

async function getRiskDoc(openid) {
  const res = await db.collection('login_security').where({ openid }).limit(1).get()
  return (res.data || [])[0] || null
}

async function saveRiskDoc(openid, data, docId = '') {
  if (docId) {
    await db.collection('login_security').doc(docId).update({ data })
    return docId
  }
  const addRes = await db.collection('login_security').add({ data: { openid, ...data } })
  return addRes._id
}

function parseRecentAttempts(lastAttempts = [], nowMs) {
  return (lastAttempts || []).filter((ts) => Number(ts) > nowMs - RISK_WINDOW_MS)
}

async function markRiskAttempt(openid, riskDoc) {
  const nowMs = Date.now()
  const recentAttempts = parseRecentAttempts(riskDoc?.recentAttempts || [], nowMs)
  recentAttempts.push(nowMs)

  const payload = {
    recentAttempts,
    lastAttemptAt: new Date(nowMs),
    updatedAt: new Date(nowMs)
  }

  if (riskDoc?._id) {
    await saveRiskDoc(openid, payload, riskDoc._id)
    return { ...riskDoc, ...payload }
  }

  const id = await saveRiskDoc(openid, payload)
  return { _id: id, openid, ...payload }
}

function needCaptchaByFrequency(riskDoc, nowMs) {
  const recentAttempts = parseRecentAttempts(riskDoc?.recentAttempts || [], nowMs)
  const lastTs = recentAttempts.length ? recentAttempts[recentAttempts.length - 1] : 0
  const tooFast = lastTs && (nowMs - lastTs) < FAST_RETRY_MS
  const tooMany = recentAttempts.length >= MAX_RISK_COUNT
  return tooFast || tooMany
}

async function requireCaptcha(openid, riskDoc, reason = '操作过于频繁，请完成验证码后重新登录') {
  const next = buildCaptchaChallenge(riskDoc)
  const data = {
    ...next,
    forceLogoutAt: new Date(),
    reason
  }

  if (riskDoc?._id) {
    await saveRiskDoc(openid, data, riskDoc._id)
  } else {
    await saveRiskDoc(openid, data)
  }

  return fail(429, reason, {
    needCaptcha: true,
    captchaId: next.captchaId,
    captchaHint: next.captchaHint,
    forceLogout: true
  })
}

async function validateCaptchaIfNeeded(openid, payload, riskDoc) {
  const nowMs = Date.now()
  const lockUntil = riskDoc?.lockUntil ? new Date(riskDoc.lockUntil).getTime() : 0
  if (lockUntil && lockUntil > nowMs) {
    return fail(429, '验证码输入错误次数过多，请稍后再试', {
      needCaptcha: true,
      captchaId: riskDoc.captchaId,
      captchaHint: riskDoc.captchaHint,
      forceLogout: true
    })
  }

  if (!riskDoc?.captchaRequired) return null

  const inputId = String(payload.captchaId || '')
  const inputAnswer = String(payload.captchaAnswer || '').trim().toUpperCase()
  const expectedId = String(riskDoc.captchaId || '')
  const expectedCode = String(riskDoc.captchaCode || '').trim().toUpperCase()

  if (!inputId || !inputAnswer || inputId !== expectedId || inputAnswer !== expectedCode) {
    const failCount = Number(riskDoc.failedCaptchaCount || 0) + 1
    const patch = {
      failedCaptchaCount: failCount,
      updatedAt: new Date()
    }

    if (failCount >= CAPTCHA_FAIL_LIMIT) {
      patch.lockUntil = new Date(Date.now() + CAPTCHA_LOCK_MS)
    }

    await saveRiskDoc(openid, patch, riskDoc._id)

    return fail(429, '验证码错误，请重试', {
      needCaptcha: true,
      captchaId: riskDoc.captchaId,
      captchaHint: riskDoc.captchaHint,
      forceLogout: true
    })
  }

  await saveRiskDoc(openid, {
    captchaRequired: false,
    captchaId: '',
    captchaCode: '',
    captchaHint: '',
    failedCaptchaCount: 0,
    lockUntil: null,
    updatedAt: new Date()
  }, riskDoc._id)

  return null
}

async function handleLogin(data, wxContext) {
  const payload = data || {}
  const { userInfo } = payload
  if (!userInfo) return fail(400, '缺少用户信息')

  const openid = wxContext.OPENID
  const now = new Date()

  let riskDoc = await getRiskDoc(openid)
  const nowMs = Date.now()

  const captchaErr = await validateCaptchaIfNeeded(openid, payload, riskDoc)
  if (captchaErr) return captchaErr

  riskDoc = await markRiskAttempt(openid, riskDoc)

  if (needCaptchaByFrequency(riskDoc, nowMs)) {
    return requireCaptcha(openid, riskDoc)
  }

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

    if (userData.forceLogoutFlag) {
      await db.collection('users').doc(userData._id).update({
        data: {
          forceLogoutFlag: false,
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

  if (riskDoc?._id) {
    await saveRiskDoc(openid, {
      captchaRequired: false,
      captchaId: '',
      captchaCode: '',
      captchaHint: '',
      failedCaptchaCount: 0,
      lockUntil: null,
      forceLogoutAt: null,
      reason: '',
      updatedAt: now
    }, riskDoc._id)
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

  await db.collection('users').doc(currentUser._id).update({
    data: {
      avatar: avatarUrl,
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

  await db.collection('users').doc(user._id).update({
    data: {
      forceLogoutFlag: true,
      updatedAt: new Date()
    }
  })

  return success(null, '已标记强制退出')
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