const { db, success, fail, getCurrentUser } = require('./shared')

function isAdminUser(user) {
  if (!user) return false
  return user.isAdmin === true || user.isAdmin === 'true' || user.role === 'admin'
}

async function ensureAdmin(wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return { error: fail(401, '请先登录') }
  if (!isAdminUser(currentUser)) return { error: fail(403, '仅管理员可操作') }
  return { user: currentUser }
}

async function getAdminManageData(wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error

  const [recordsRes, gamesRes, yakumanRes, honorRes] = await Promise.all([
    db.collection('mahjong_records').orderBy('createdAt', 'desc').limit(200).get(),
    db.collection('games').orderBy('createdAt', 'desc').limit(200).get(),
    db.collection('yakuman_records').orderBy('createdAt', 'desc').limit(200).get().catch(() => ({ data: [] })),
    db.collection('honor_records').orderBy('achievedAt', 'desc').limit(200).get().catch(() => ({ data: [] }))
  ])

  const records = recordsRes.data || []
  const games = (gamesRes.data || []).map((g) => ({ ...g, id: g._id }))
  const yakumanRecords = (yakumanRes.data || []).map((item) => ({ ...item, id: item._id }))
  const honorRecords = (honorRes.data || []).map((item) => ({ ...item, id: item._id }))

  return success({ records, games, yakumanRecords, honorRecords }, '获取成功')
}

async function adminDeleteMahjongRecord(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error
  const { recordId } = data || {}
  if (!recordId) return fail(400, '缺少战绩ID')
  await db.collection('mahjong_records').doc(recordId).remove()
  return success(null, '删除成功')
}

async function adminDeleteGame(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error
  const { gameId } = data || {}
  if (!gameId) return fail(400, '缺少组局ID')
  await db.collection('games').doc(gameId).remove()
  await db.collection('participations').where({ gameId }).remove().catch(() => {})
  await db.collection('activities').where({ gameId }).remove().catch(() => {})
  return success(null, '删除成功')
}

async function adminDeleteYakumanRecord(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error
  const { recordId } = data || {}
  if (!recordId) return fail(400, '缺少役满记录ID')
  await db.collection('yakuman_records').doc(recordId).remove()
  return success(null, '删除成功')
}

async function adminDeleteHonorRecord(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error
  const { recordId } = data || {}
  if (!recordId) return fail(400, '缺少荣誉记录ID')
  await db.collection('honor_records').doc(recordId).remove()
  return success(null, '删除成功')
}

module.exports = {
  getAdminManageData,
  adminDeleteMahjongRecord,
  adminDeleteGame,
  adminDeleteYakumanRecord,
  adminDeleteHonorRecord
}