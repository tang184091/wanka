const { db, _, success, fail, getCurrentUser, getUserMapByIds } = require('./shared')

const YAKUMAN_TYPES = [
  '国士无双',
  '四暗刻',
  '大三元',
  '字一色',
  '绿一色',
  '清老头',
  '小四喜',
  '大四喜',
  '四杠子',
  '九莲宝灯',
  '天和',
  '地和',
  '累计役满'
]

function isAdminUser(user) {
  if (!user) return false
  return user.isAdmin === true || user.isAdmin === 'true' || user.role === 'admin'
}

function isCollectionNotExistsError(error) {
  const msg = String(error?.message || error?.errMsg || error || '')
  return msg.includes('-502005')
    || msg.includes('collection not exists')
    || msg.includes('Db or Table not exist')
}

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

async function getYakumanList() {
  try {
    const res = await db.collection('yakuman_records')
      .orderBy('achievedAt', 'desc')
      .limit(200)
      .get()

    return success({
      list: res.data || [],
      yakumanTypes: YAKUMAN_TYPES
    }, '获取成功')
  } catch (error) {
    if (isCollectionNotExistsError(error)) {
      return success({
        list: [],
        yakumanTypes: YAKUMAN_TYPES,
        warning: 'yakuman_records 集合不存在'
      }, '获取成功')
    }
    throw error
  }
}

async function createYakumanRecord(data, wxContext) {
  const payload = data || {}
  const {
    achievedAt,
    playerNickname,
    yakumanType,
    imageFileId,
    imageSize = 0,
    note = ''
  } = payload

  if (!achievedAt || !playerNickname || !yakumanType || !imageFileId) {
    return fail(400, '请完整填写役满信息')
  }

  if (!YAKUMAN_TYPES.includes(yakumanType)) {
    return fail(400, '役满类型不合法')
  }

  if (Number(imageSize) > 2 * 1024 * 1024) {
    return fail(400, '役满图片大小不能超过2MB')
  }

  const achievedDate = new Date(achievedAt)
  if (Number.isNaN(achievedDate.getTime())) {
    return fail(400, '达成时间格式不正确')
  }

  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '请先登录')

  try {
    if (!isAdminUser(currentUser)) {
      const now = new Date()
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const todayUploadsRes = await db.collection('yakuman_records').where({
        uploaderId: currentUser._id,
        createdAt: _.gte(dayStart).and(_.lt(dayEnd))
      }).count()

      if ((todayUploadsRes.total || 0) >= 2) {
        return fail(429, '每日最多上传2次役满照片')
      }
    }

    const addRes = await db.collection('yakuman_records').add({
      data: {
        achievedAt: achievedDate,
        playerNickname: String(playerNickname).trim(),
        yakumanType,
        imageFileId,
        imageSize: Number(imageSize) || 0,
        note: String(note || '').trim(),
        uploaderId: currentUser._id,
        uploaderNickname: currentUser.nickname || '未知用户',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return success({ id: addRes._id }, '上传成功')
  } catch (error) {
    if (isCollectionNotExistsError(error)) {
      return fail(500, '缺少 yakuman_records 集合，请先在云开发数据库中创建该集合')
    }
    throw error
  }
}

async function getHonorList() {
  try {
    const res = await db.collection('honor_records')
      .orderBy('achievedAt', 'desc')
      .limit(500)
      .get()

    return success({ list: res.data || [] }, '获取成功')
  } catch (error) {
    if (isCollectionNotExistsError(error)) {
      return success({ list: [] }, '获取成功')
    }
    throw error
  }
}

async function createHonorRecord(data, wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '请先登录')
  if (!isAdminUser(currentUser)) return fail(403, '仅管理员可上传荣誉记录')

  const payload = data || {}
  const type = String(payload.type || '').trim()
  const achievedAt = new Date(payload.achievedAt || Date.now())
  if (!['tournament', 'rank'].includes(type)) return fail(400, '荣誉类型不合法')
  if (Number.isNaN(achievedAt.getTime())) return fail(400, '达成日期格式错误')

  const base = {
    type,
    achievedAt,
    note: String(payload.note || '').trim(),
    uploaderId: currentUser._id,
    uploaderNickname: currentUser.nickname || '未知用户',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  if (type === 'tournament') {
    const championNickname = String(payload.championNickname || '').trim()
    const participantCount = Number(payload.participantCount || 0)
    if (!championNickname || participantCount < 4 || participantCount > 32) {
      return fail(400, '比赛信息不完整，人数需在4-32之间')
    }
    try {
      const addRes = await db.collection('honor_records').add({
        data: {
          ...base,
          title: String(payload.title || '店内比赛').trim(),
          championNickname,
          participantCount
        }
      })
      return success({ id: addRes._id }, '上传成功')
    } catch (error) {
      if (isCollectionNotExistsError(error)) {
        return fail(500, '缺少 honor_records 集合，请先在云开发数据库中创建该集合')
      }
      throw error
    }
  }

  const playerNickname = String(payload.playerNickname || '').trim()
  const rankName = String(payload.rankName || '').trim()
  if (!playerNickname || !rankName) return fail(400, '段位荣誉信息不完整')

  try {
    const addRes = await db.collection('honor_records').add({
      data: {
        ...base,
        playerNickname,
        rankName
      }
    })
    return success({ id: addRes._id }, '上传成功')
  } catch (error) {
    if (isCollectionNotExistsError(error)) {
      return fail(500, '缺少 honor_records 集合，请先在云开发数据库中创建该集合')
    }
    throw error
  }
}

module.exports = {
  fillPlayerNicknames,
  getMahjongRecords,
  getMahjongRecordDetail,
  createMahjongRecord,
  getYakumanList,
  createYakumanRecord,
  getHonorList,
  createHonorRecord,
  YAKUMAN_TYPES
}