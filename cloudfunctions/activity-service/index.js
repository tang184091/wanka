// 活动记录服务云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const success = (data = null, message = 'ok') => ({ code: 0, message, data })
const fail = (code, message, data = null) => ({ code, message, data })

exports.main = async (event) => {
  const { action, data } = event || {}
  const wxContext = cloud.getWXContext()

  console.log('activity-service 调用:', { action, openid: wxContext.OPENID })

  try {
    switch (action) {
      case 'test':
        return success({
          timestamp: new Date().toISOString(),
          openid: wxContext.OPENID,
          appid: wxContext.APPID
        }, 'activity-service 运行正常')
      case 'getGameActivities':
        return await getGameActivities(data)
      case 'addGameActivity':
        return await addGameActivity(data, wxContext)
      case 'getUserActivities':
        return await getUserActivities(data)
      case 'getUnreadMessages':
        return await getUnreadMessages(data)
      case 'markMessageRead':
        return await markMessageRead(data)
      case 'markAllMessagesRead':
        return await markAllMessagesRead(data)
      default:
        return fail(400, '未知操作')
    }
  } catch (error) {
    console.error('activity-service 未捕获错误:', error)
    return fail(500, `服务器内部错误: ${error.message}`)
  }
}

async function getCurrentUser(wxContext) {
  const res = await db.collection('users').where({ openid: wxContext.OPENID }).limit(1).get()
  return (res.data || [])[0] || null
}

async function getGameActivities(data) {
  const payload = data || {}
  const { gameId } = payload
  if (!gameId) return fail(400, '缺少组局ID')

  const res = await db.collection('activities')
    .where({ gameId })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()

  return success(res.data || [], '获取成功')
}

async function addGameActivity(data, wxContext) {
  const payload = data || {}
  const { gameId, activityData } = payload
  if (!gameId || !activityData || typeof activityData !== 'object') {
    return fail(400, '缺少必要参数')
  }

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '用户不存在')

  const addRes = await db.collection('activities').add({
    data: {
      gameId,
      userId: currentUser._id,
      userName: currentUser.nickname || '未知用户',
      ...activityData,
      createdAt: new Date()
    }
  })

  return success({ id: addRes._id }, '活动记录添加成功')
}

async function getUserActivities(data) {
  const payload = data || {}
  const { userId, limit = 20 } = payload
  if (!userId) return fail(400, '缺少用户ID')

  const participationsRes = await db.collection('participations').where({ userId }).get()
  const gameIds = [...new Set((participationsRes.data || []).map((p) => p.gameId).filter(Boolean))]

  if (!gameIds.length) return success([], '获取成功')

  const activitiesRes = await db.collection('activities')
    .where({ gameId: _.in(gameIds) })
    .orderBy('createdAt', 'desc')
    .limit(Number(limit) > 0 ? Number(limit) : 20)
    .get()

  return success(activitiesRes.data || [], '获取成功')
}

async function getUnreadMessages(data) {
  const payload = data || {}
  if (!payload.userId) return fail(400, '缺少用户ID')

  return success({ count: 0, messages: [] }, '获取成功')
}

async function markMessageRead(data) {
  const payload = data || {}
  if (!payload.userId || !payload.messageId) return fail(400, '缺少必要参数')

  return success(null, '消息已标记为已读')
}

async function markAllMessagesRead(data) {
  const payload = data || {}
  if (!payload.userId) return fail(400, '缺少用户ID')

  return success(null, '所有消息已标记为已读')
}