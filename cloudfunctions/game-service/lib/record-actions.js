const { db, _, success, fail, getCurrentUser, getUserMapByIds } = require('./shared')

async function fillPlayerNicknames(players = []) {
  const isValidDocId = (id) => /^[a-fA-F0-9]{24}$/.test(String(id || ''))
  const userIds = [...new Set(players.map((item) => item.userId).filter(isValidDocId))]
  const userMap = await getUserMapByIds(userIds)

  return players.map((player) => ({
    ...player,
    nickname: player.nickname || (userMap[player.userId] && userMap[player.userId].nickname) || player.userId || '未知玩家'
  }))
}

async function getMahjongRecords() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const res = await db.collection('mahjong_records')
    .where({ createdAt: _.gte(sevenDaysAgo) })
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get()

  const list = []
  for (const record of res.data || []) {
    list.push({
      ...record,
      players: await fillPlayerNicknames(record.players || [])
    })
  }

  return success({ list }, '获取成功')
}

async function getMahjongRecordDetail(data) {
  const { recordId } = data || {}
  if (!recordId) return fail(400, '缺少战绩ID')

  const res = await db.collection('mahjong_records').doc(recordId).get()
  if (!res.data) return fail(404, '战绩不存在')

  return success({
    ...res.data,
    players: await fillPlayerNicknames(res.data.players || [])
  }, '获取成功')
}

async function createMahjongRecord(data, wxContext) {
  const players = (data && data.players) || []
  if (!Array.isArray(players) || players.length !== 4) return fail(400, '必须提交4位玩家数据')

  const scores = players.map((item) => Number(item.score || 0))
  const totalScore = scores.reduce((sum, n) => sum + n, 0)
  if (![100000, 1000].includes(totalScore)) return fail(400, '分数总和必须为100000或1000')

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '请先登录')

  const gameId = `mj-${Date.now()}`
  const addRes = await db.collection('mahjong_records').add({
    data: {
      gameId,
      players: players.map((p, idx) => ({
        seat: idx + 1,
        userId: p.userId,
        nickname: p.nickname || '',
        score: Number(p.score || 0)
      })),
      creatorId: currentUser._id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  return success({ id: addRes._id, gameId }, '创建成功')
}

module.exports = {
  fillPlayerNicknames,
  getMahjongRecords,
  getMahjongRecordDetail,
  createMahjongRecord
}
