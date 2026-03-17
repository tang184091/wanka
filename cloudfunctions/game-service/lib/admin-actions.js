const { db, success, fail, getCurrentUser } = require('./shared')
const { fillPlayerNicknames } = require('./record-actions')

async function assertAdmin(wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser || !currentUser.isAdmin) {
    return { error: fail(403, '仅管理员可操作') }
  }
  return { currentUser }
}

async function adminDeleteMahjongRecord(data, wxContext) {
  const { error, currentUser } = await assertAdmin(wxContext)
  if (error) return error

  const recordId = data && data.recordId
  if (!recordId) return fail(400, '缺少战绩ID')

  const recordRes = await db.collection('mahjong_records').doc(recordId).get()
  if (!recordRes.data) return fail(404, '战绩不存在')

  await db.collection('mahjong_records').doc(recordId).remove()
  return success({ recordId, deletedBy: currentUser._id }, '删除成功')
}

async function adminDeleteGame(data, wxContext) {
  const { error, currentUser } = await assertAdmin(wxContext)
  if (error) return error

  const gameId = data && data.gameId
  if (!gameId) return fail(400, '缺少组局ID')

  const gameRes = await db.collection('games').doc(gameId).get()
  if (!gameRes.data) return fail(404, '组局不存在')

  await db.collection('games').doc(gameId).remove()
  await db.collection('participations').where({ gameId }).remove().catch(() => {})
  await db.collection('activities').where({ gameId }).remove().catch(() => {})

  return success({ gameId, deletedBy: currentUser._id }, '删除成功')
}

async function getAdminManageData(wxContext) {
  const { error } = await assertAdmin(wxContext)
  if (error) return error

  const [recordsRes, gamesRes] = await Promise.all([
    db.collection('mahjong_records').orderBy('createdAt', 'desc').limit(30).get(),
    db.collection('games').orderBy('createdAt', 'desc').limit(30).get()
  ])

  const records = []
  for (const record of (recordsRes.data || [])) {
    records.push({
      ...record,
      players: await fillPlayerNicknames(record.players || [])
    })
  }

  const games = (gamesRes.data || []).map((game) => ({
    id: game._id,
    title: game.title || '未命名组局',
    location: game.location || '',
    status: game.status || 'pending',
    createdAt: game.createdAt,
    creatorId: game.creatorId || ''
  }))

  return success({ records, games }, '获取成功')
}

module.exports = {
  adminDeleteMahjongRecord,
  adminDeleteGame,
  getAdminManageData
}
