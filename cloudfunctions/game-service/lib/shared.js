const cloud = require('wx-server-sdk')

const db = cloud.database()
const _ = db.command
const DEFAULT_AVATAR = 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png'

const success = (data = null, message = 'ok') => ({ code: 0, message, data })
const fail = (code, message, data = null) => ({ code, message, data })

async function checkTextSecurity(content, options = {}) {
  const text = String(content || '').trim()
  if (!text) return { ok: true }

  const scene = Number(options.scene || 2)
  const title = String(options.title || '内容')

  try {
    const checker = cloud?.openapi?.security?.msgSecCheck
    if (typeof checker !== 'function') {
      console.warn('msgSecCheck unavailable, skip security check')
      return { ok: true, skipped: true }
    }

    const res = await checker({
      content: text,
      version: 2,
      scene
    })

    const errCode = Number(res?.errCode || 0)
    if (errCode === 0) return { ok: true }

    return {
      ok: false,
      code: 422,
      message: `${title}包含敏感或违规内容，请修改后重试`,
      detail: res
    }
  } catch (error) {
    const errCode = Number(error?.errCode || error?.errno || -1)
    const errText = String(error?.errMsg || error?.message || '').toLowerCase()

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
      errText.includes('not found') ||
      errText.includes('token') ||
      errText.includes('api unauthorized') ||
      errText.includes('request:fail')
    ) {
      console.warn('msgSecCheck unavailable, skip security check', errText)
      return { ok: true, skipped: true }
    }

    // 非明确违规类错误降级放行，避免影响业务闭环
    console.warn('msgSecCheck unexpected error, skip security check', error)
    return { ok: true, skipped: true }
  }
}

async function checkTextSecurityBatch(items = [], options = {}) {
  for (const item of items) {
    const text = String(item?.text || '').trim()
    if (!text) continue
    const result = await checkTextSecurity(text, {
      scene: options.scene || item?.scene || 2,
      title: item?.title || options.title || '内容'
    })
    if (!result.ok) return result
  }
  return { ok: true }
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

function isBlacklistedUser(user) {
  if (!user) return false
  return user.isBlacklisted === true || user.isBlacklisted === 'true'
}

function ensureUserAvailable(user, actionText = '执行该操作') {
  if (!user) return fail(401, '请先登录')
  if (isBlacklistedUser(user)) {
    return fail(403, `您已被管理员加入黑名单，暂时无法${actionText}`)
  }
  return null
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

module.exports = {
  db,
  _,
  DEFAULT_AVATAR,
  success,
  fail,
  getCurrentUser,
  normalizeUserBrief,
  isBlacklistedUser,
  ensureUserAvailable,
  getUserMapByIds,
  normalizeParticipants,
  enrichGame,
  addActivity,
  checkTextSecurity,
  checkTextSecurityBatch
}
