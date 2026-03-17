// cleanup-service/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

<<<<<<< ours
// 统一配置
const DEFAULT_CLEANUP_DAYS = 30
const PAGE_SIZE = 100

// 主函数
exports.main = async (event, context) => {
  const { action } = event || {}
=======
const DEFAULT_CLEANUP_DAYS = 30
const PAGE_SIZE = 100

const success = (data = null, message = 'ok') => ({ code: 0, message, data })
const fail = (code, message, data = null) => ({ code, message, data })

exports.main = async (event) => {
  const { action, data } = event || {}
>>>>>>> theirs

  try {
    switch (action) {
      case 'cleanupExpiredGames':
        return await cleanupExpiredGames(data)
      case 'getCleanupStats':
        return await getCleanupStats()
      default:
        return fail(400, '未知操作')
    }
  } catch (error) {
    console.error('cleanup-service 未捕获错误:', error)
    return fail(500, `服务器内部错误: ${error.message}`)
  }
}

async function queryAllGamesByStatusBeforeDate(status, cutoffDate) {
  const totalRes = await db.collection('games')
    .where({ status, updatedAt: _.lt(cutoffDate) })
    .count()

  const total = totalRes.total || 0
  if (!total) return []

  const all = []
  for (let offset = 0; offset < total; offset += PAGE_SIZE) {
    const res = await db.collection('games')
      .where({ status, updatedAt: _.lt(cutoffDate) })
      .skip(offset)
      .limit(PAGE_SIZE)
      .get()

    all.push(...(res.data || []))
  }

  return all
}

<<<<<<< ours
// 分页查询：获取某状态、某日期前的全部对局
async function queryAllGamesByStatusBeforeDate(status, cutoffDate) {
  const totalRes = await db.collection('games')
    .where({
      status,
      updatedAt: _.lt(cutoffDate)
    })
    .count()

  const total = totalRes.total || 0
  if (total === 0) return []

  const all = []
  for (let offset = 0; offset < total; offset += PAGE_SIZE) {
    const pageRes = await db.collection('games')
      .where({
        status,
        updatedAt: _.lt(cutoffDate)
      })
      .skip(offset)
      .limit(PAGE_SIZE)
      .get()

    all.push(...(pageRes.data || []))
  }

  return all
}

// 清理过期对局
async function cleanupExpiredGames(data) {
  const inputDays = Number(data?.days)
  const days = Number.isFinite(inputDays) && inputDays > 0 ? inputDays : DEFAULT_CLEANUP_DAYS
  const dryRun = Boolean(data?.dryRun)

  const now = new Date()
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  console.log(`开始清理${days}天前(${cutoffDate.toISOString()})的过期对局，测试模式: ${dryRun}`)

  // 分页查询，避免单次 get 上限导致漏删
=======
async function cleanupExpiredGames(data) {
  const payload = data || {}
  const inputDays = Number(payload.days)
  const days = Number.isFinite(inputDays) && inputDays > 0 ? inputDays : DEFAULT_CLEANUP_DAYS
  const dryRun = Boolean(payload.dryRun)

  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

>>>>>>> theirs
  const [cancelledGames, completedGames] = await Promise.all([
    queryAllGamesByStatusBeforeDate('cancelled', cutoffDate),
    queryAllGamesByStatusBeforeDate('completed', cutoffDate)
  ])

  const gamesToDelete = [...cancelledGames, ...completedGames]
<<<<<<< ours

  console.log(`找到${gamesToDelete.length}条过期对局（取消:${cancelledGames.length}, 完成:${completedGames.length})`)

  if (gamesToDelete.length === 0) {
    return {
      code: 0,
      message: '没有需要清理的过期对局',
      stats: { total: 0, cancelled: 0, completed: 0, days }
    }
  }

  if (dryRun) {
    return {
      code: 0,
      message: `测试模式：找到${gamesToDelete.length}条过期对局，不会实际删除`,
      data: gamesToDelete,
      stats: {
        total: gamesToDelete.length,
        cancelled: cancelledGames.length,
        completed: completedGames.length,
        days
      }
    }
  }

  // 实际删除 games
  const deletePromises = gamesToDelete.map(game =>
    db.collection('games').doc(game._id).remove()
  )
  await Promise.all(deletePromises)

  // 清理关联集合（失败不影响主流程）
  const gameIds = gamesToDelete.map(g => g._id)
  for (const gameId of gameIds) {
    await db.collection('participations')
      .where({ gameId })
      .remove()
      .catch(err => console.log('清理参与记录失败:', gameId, err))

    await db.collection('activities')
      .where({ gameId })
      .remove()
      .catch(err => console.log('清理活动记录失败:', gameId, err))
  }

  console.log(`成功清理${gamesToDelete.length}条过期对局`)

  return {
    code: 0,
    message: `成功清理${gamesToDelete.length}条过期对局`,
    stats: {
      total: gamesToDelete.length,
      cancelled: cancelledGames.length,
      completed: completedGames.length,
      days
    }
=======
  const stats = {
    total: gamesToDelete.length,
    cancelled: cancelledGames.length,
    completed: completedGames.length,
    days
  }

  if (!gamesToDelete.length) return success({ stats }, '没有需要清理的过期对局')

  if (dryRun) {
    return success({ list: gamesToDelete, stats }, `测试模式：找到${gamesToDelete.length}条过期对局，不会实际删除`)
  }

  await Promise.all(gamesToDelete.map((game) => db.collection('games').doc(game._id).remove()))

  const gameIds = gamesToDelete.map((g) => g._id)
  for (const gameId of gameIds) {
    await db.collection('participations').where({ gameId }).remove().catch((error) => {
      console.error('清理参与记录失败:', gameId, error)
    })
    await db.collection('activities').where({ gameId }).remove().catch((error) => {
      console.error('清理活动记录失败:', gameId, error)
    })
>>>>>>> theirs
  }

  return success({ stats }, `成功清理${gamesToDelete.length}条过期对局`)
}

async function getCleanupStats() {
<<<<<<< ours
  const now = new Date()
  const thresholdDate = new Date(now.getTime() - DEFAULT_CLEANUP_DAYS * 24 * 60 * 60 * 1000)

  const [cancelledThresholdRes, completedThresholdRes, cancelledAllRes, completedAllRes] = await Promise.all([
    db.collection('games')
      .where({
        status: 'cancelled',
        updatedAt: _.lt(thresholdDate)
      })
      .count(),

    db.collection('games')
      .where({
        status: 'completed',
        updatedAt: _.lt(thresholdDate)
      })
      .count(),

    db.collection('games')
      .where({ status: 'cancelled' })
      .count(),

    db.collection('games')
      .where({ status: 'completed' })
      .count()
  ])

  const expiredTotal = (cancelledThresholdRes.total || 0) + (completedThresholdRes.total || 0)
  const allFinishedTotal = (cancelledAllRes.total || 0) + (completedAllRes.total || 0)

  return {
    code: 0,
    data: {
      thresholdDays: DEFAULT_CLEANUP_DAYS,
      expiredCancelled: cancelledThresholdRes.total || 0,
      expiredCompleted: completedThresholdRes.total || 0,
      expiredTotal,
      allCancelled: cancelledAllRes.total || 0,
      allCompleted: completedAllRes.total || 0,
      allFinishedTotal
    }
  }
=======
  const thresholdDate = new Date(Date.now() - DEFAULT_CLEANUP_DAYS * 24 * 60 * 60 * 1000)

  const [cancelledThresholdRes, completedThresholdRes, cancelledAllRes, completedAllRes] = await Promise.all([
    db.collection('games').where({ status: 'cancelled', updatedAt: _.lt(thresholdDate) }).count(),
    db.collection('games').where({ status: 'completed', updatedAt: _.lt(thresholdDate) }).count(),
    db.collection('games').where({ status: 'cancelled' }).count(),
    db.collection('games').where({ status: 'completed' }).count()
  ])

  const expiredCancelled = cancelledThresholdRes.total || 0
  const expiredCompleted = completedThresholdRes.total || 0
  const allCancelled = cancelledAllRes.total || 0
  const allCompleted = completedAllRes.total || 0

  return success({
    thresholdDays: DEFAULT_CLEANUP_DAYS,
    expiredCancelled,
    expiredCompleted,
    expiredTotal: expiredCancelled + expiredCompleted,
    allCancelled,
    allCompleted,
    allFinishedTotal: allCancelled + allCompleted
  }, '获取成功')
>>>>>>> theirs
}
