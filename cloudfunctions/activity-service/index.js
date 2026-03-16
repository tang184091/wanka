// 活动记录服务云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  
  console.log('activity-service 调用:', { action, data, openid: wxContext.OPENID })
  
  try {
    switch (action) {
      case 'test':
        return handleTest(wxContext)
      case 'getGameActivities':
        return await getGameActivities(data, wxContext)
      case 'addGameActivity':
        return await addGameActivity(data, wxContext)
      case 'getUserActivities':
        return await getUserActivities(data, wxContext)
      case 'getUnreadMessages':
        return await getUnreadMessages(data, wxContext)
      case 'markMessageRead':
        return await markMessageRead(data, wxContext)
      case 'markAllMessagesRead':
        return await markAllMessagesRead(data, wxContext)
      default:
        return { code: 400, message: '未知操作' }
    }
  } catch (error) {
    console.error('activity-service 错误:', error)
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
    message: 'activity-service 运行正常',
    data: {
      timestamp: new Date().toISOString(),
      openid: wxContext.OPENID,
      appid: wxContext.APPID
    }
  }
}

// 获取组局活动记录
async function getGameActivities(data, wxContext) {
  const { gameId } = data
  
  if (!gameId) {
    return { code: 400, message: '缺少组局ID' }
  }
  
  try {
    const activitiesRes = await db.collection('activities')
      .where({ gameId: gameId })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()
    
    return {
      code: 0,
      data: activitiesRes.data
    }
  } catch (error) {
    console.error('获取组局活动记录错误:', error)
    throw error
  }
}

// 添加组局活动记录
async function addGameActivity(data, wxContext) {
  const { gameId, activityData } = data
  
  if (!gameId || !activityData) {
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
    const userName = userRes.data[0].nickname
    
    // 添加活动记录
    const addRes = await db.collection('activities').add({
      data: {
        gameId: gameId,
        userId: userId,
        userName: userName,
        ...activityData,
        createdAt: new Date()
      }
    })
    
    return {
      code: 0,
      message: '活动记录添加成功',
      data: {
        id: addRes._id
      }
    }
  } catch (error) {
    console.error('添加组局活动记录错误:', error)
    throw error
  }
}

// 获取用户活动记录
async function getUserActivities(data, wxContext) {
  const { userId, limit = 20 } = data
  
  if (!userId) {
    return { code: 400, message: '缺少用户ID' }
  }
  
  try {
    // 获取用户参与的组局
    const participationsRes = await db.collection('participations')
      .where({ userId: userId })
      .get()
    
    const gameIds = participationsRes.data.map(p => p.gameId)
    
    if (gameIds.length === 0) {
      return { code: 0, data: [] }
    }
    
    // 获取相关组局的活动记录
    const activitiesRes = await db.collection('activities')
      .where({ gameId: db.command.in(gameIds) })
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()
    
    return {
      code: 0,
      data: activitiesRes.data
    }
  } catch (error) {
    console.error('获取用户活动记录错误:', error)
    throw error
  }
}

// 获取未读消息
async function getUnreadMessages(data, wxContext) {
  const { userId } = data
  
  if (!userId) {
    return { code: 400, message: '缺少用户ID' }
  }
  
  try {
    // 模拟返回未读消息数量
    // 实际应该根据业务逻辑查询数据库
    return {
      code: 0,
      data: {
        count: 0, // 默认0条未读
        messages: []
      }
    }
  } catch (error) {
    console.error('获取未读消息错误:', error)
    throw error
  }
}

// 标记消息已读
async function markMessageRead(data, wxContext) {
  const { userId, messageId } = data
  
  if (!userId || !messageId) {
    return { code: 400, message: '缺少必要参数' }
  }
  
  try {
    // 模拟标记消息已读
    return {
      code: 0,
      message: '消息已标记为已读'
    }
  } catch (error) {
    console.error('标记消息已读错误:', error)
    throw error
  }
}

// 标记所有消息已读
async function markAllMessagesRead(data, wxContext) {
  const { userId } = data
  
  if (!userId) {
    return { code: 400, message: '缺少用户ID' }
  }
  
  try {
    // 模拟标记所有消息已读
    return {
      code: 0,
      message: '所有消息已标记为已读'
    }
  } catch (error) {
    console.error('标记所有消息已读错误:', error)
    throw error
  }
}