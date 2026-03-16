// cleanup-service/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 主函数
exports.main = async (event, context) => {
  const { action } = event
  
  try {
    switch (action) {
      case 'cleanupExpiredGames':
        return await cleanupExpiredGames(event.data)
      case 'getCleanupStats':
        return await getCleanupStats()
      default:
        return { code: 400, message: '未知操作' }
    }
  } catch (error) {
    console.error('清理服务错误:', error)
    return { code: 500, message: '服务器内部错误', error: error.message }
  }
}

// 清理过期对局
async function cleanupExpiredGames(data) {
  const { 
    days = 30,  // 默认清理30天前的
    dryRun = false  // 测试模式，不实际删除
  } = data || {}
  
  const now = new Date()
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  
  console.log(`开始清理${days}天前(${cutoffDate.toISOString()})的过期对局，测试模式: ${dryRun}`)
  
  // 1. 查询已取消的对局
  const cancelledRes = await db.collection('games')
    .where({
      status: 'cancelled',
      updatedAt: _.lt(cutoffDate)
    })
    .get()
  
  // 2. 查询已完成的对局（可选）
  const completedRes = await db.collection('games')
    .where({
      status: 'completed',
      updatedAt: _.lt(cutoffDate)
    })
    .get()
  
  const gamesToDelete = [...cancelledRes.data, ...completedRes.data]
  
  console.log(`找到${gamesToDelete.length}条过期对局（取消:${cancelledRes.data.length}, 完成:${completedRes.data.length})`)
  
  if (gamesToDelete.length === 0) {
    return { 
      code: 0, 
      message: '没有需要清理的过期对局',
      stats: { total: 0, cancelled: 0, completed: 0 }
    }
  }
  
  if (dryRun) {
    return { 
      code: 0, 
      message: `测试模式：找到${gamesToDelete.length}条过期对局，不会实际删除`,
      data: gamesToDelete,
      stats: { 
        total: gamesToDelete.length, 
        cancelled: cancelledRes.data.length, 
        completed: completedRes.data.length 
      }
    }
  }
  
  // 实际删除
  const deletePromises = gamesToDelete.map(game => 
    db.collection('games').doc(game._id).remove()
  )
  
  await Promise.all(deletePromises)
  
  // 清理相关记录
  for (const game of gamesToDelete) {
    await db.collection('participations')
      .where({ gameId: game._id })
      .remove()
      .catch(err => console.log('清理参与记录失败:', err))
    
    await db.collection('activities')
      .where({ gameId: game._id })
      .remove()
      .catch(err => console.log('清理活动记录失败:', err))
  }
  
  console.log(`成功清理${gamesToDelete.length}条过期对局`)
  
  return { 
    code: 0, 
    message: `成功清理${gamesToDelete.length}条过期对局`,
    stats: { 
      total: gamesToDelete.length, 
      cancelled: cancelledRes.data.length, 
      completed: completedRes.data.length 
    }
  }
}

// 获取清理统计
async function getCleanupStats() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const [sevenDayRes, thirtyDayRes, allRes] = await Promise.all([
    // 7天前已取消的对局
    db.collection('games')
      .where({
        status: 'cancelled',
        updatedAt: _.lt(sevenDaysAgo)
      })
      .count(),
    
    // 30天前已取消的对局
    db.collection('games')
      .where({
        status: 'cancelled',
        updatedAt: _.lt(thirtyDaysAgo)
      })
      .count(),
    
    // 所有已取消的对局
    db.collection('games')
      .where({ status: 'cancelled' })
      .count()
  ])
  
  return {
    code: 0,
    data: {
      cancelled7Days: sevenDayRes.total,
      cancelled30Days: thirtyDayRes.total,
      cancelledAll: allRes.total,
      cleanupThreshold: 7  // 默认清理阈值（天）
    }
  }
}