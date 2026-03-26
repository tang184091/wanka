const { db, success, fail, getCurrentUser, checkTextSecurityBatch } = require('./shared')
const { YAKUMAN_TYPES } = require('./record-actions')

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

async function adminGetYakumanRecord(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error
  const { recordId } = data || {}
  if (!recordId) return fail(400, '缺少役满记录ID')

  const res = await db.collection('yakuman_records').doc(recordId).get()
  if (!res?.data) return fail(404, '役满记录不存在')
  return success({ ...res.data, id: res.data._id }, '获取成功')
}

async function adminUpdateYakumanRecord(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error

  const payload = data || {}
  const recordId = String(payload.recordId || '').trim()
  const playerNickname = String(payload.playerNickname || '').trim()
  const yakumanType = String(payload.yakumanType || '').trim()
  const achievedAtText = String(payload.achievedAt || '').trim()
  const imageFileId = String(payload.imageFileId || '').trim()
  const note = String(payload.note || '').trim()

  if (!recordId) return fail(400, '缺少役满记录ID')
  if (!playerNickname) return fail(400, '玩家昵称不能为空')
  if (!yakumanType || !YAKUMAN_TYPES.includes(yakumanType)) return fail(400, '役满类型不合法')

  const achievedAt = new Date(achievedAtText)
  if (Number.isNaN(achievedAt.getTime())) return fail(400, '达成时间格式错误')

  const securityRes = await checkTextSecurityBatch([
    { title: '玩家昵称', text: playerNickname },
    { title: '备注', text: note }
  ])
  if (!securityRes.ok) return fail(securityRes.code || 422, securityRes.message || '内容安全检查失败')

  const updateData = {
    playerNickname,
    yakumanType,
    achievedAt,
    note,
    updatedAt: new Date(),
    updaterId: auth.user._id,
    updaterNickname: auth.user.nickname || '管理员'
  }
  if (imageFileId) updateData.imageFileId = imageFileId

  await db.collection('yakuman_records').doc(recordId).update({ data: updateData })
  return success({ id: recordId }, '修改成功')
}

async function adminDeleteHonorRecord(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error
  const { recordId } = data || {}
  if (!recordId) return fail(400, '缺少荣誉记录ID')
  await db.collection('honor_records').doc(recordId).remove()
  return success(null, '删除成功')
}

async function getSeatAnnouncement() {
  try {
    const res = await db.collection('system_tags').where({ key: 'seat_announcement' }).limit(1).get()
    const item = (res.data || [])[0] || {}
    return success({
      content: String(item.value || ''),
      updatedAt: item.updatedAt || null,
      updatedBy: item.updatedBy || '',
      updatedByNickname: item.updatedByNickname || ''
    }, '获取成功')
  } catch (error) {
    return success({
      content: '',
      updatedAt: null,
      updatedBy: '',
      updatedByNickname: ''
    }, '获取成功')
  }
}

async function setSeatAnnouncement(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error

  const content = String(data?.content || '').trim()
  if (content.length > 1000) return fail(400, '公告最多1000字')

  const securityRes = await checkTextSecurityBatch([
    { title: '公告内容', text: content }
  ])
  if (!securityRes.ok) return fail(securityRes.code || 422, securityRes.message || '内容安全检查失败')

  const now = new Date()
  const payload = {
    key: 'seat_announcement',
    value: content,
    updatedAt: now,
    updatedBy: auth.user._id,
    updatedByNickname: auth.user.nickname || '管理员'
  }

  const queryRes = await db.collection('system_tags').where({ key: 'seat_announcement' }).limit(1).get()
  const existed = (queryRes.data || [])[0]

  if (existed?._id) {
    await db.collection('system_tags').doc(existed._id).update({ data: payload })
  } else {
    await db.collection('system_tags').add({
      data: {
        ...payload,
        createdAt: now
      }
    })
  }

  return success({
    content,
    updatedAt: now,
    updatedBy: auth.user._id,
    updatedByNickname: auth.user.nickname || '管理员'
  }, '保存成功')
}

async function getBoardgameToolCovers() {
  try {
    const res = await db.collection('system_tags').where({ key: 'boardgame_tool_covers' }).limit(1).get()
    const item = (res.data || [])[0] || {}
    const value = item.value && typeof item.value === 'object' ? item.value : {}
    return success({ covers: value }, '获取成功')
  } catch (error) {
    return success({ covers: {} }, '获取成功')
  }
}

async function setBoardgameToolCover(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error

  const toolKey = String(data?.toolKey || '').trim()
  const coverFileId = String(data?.coverFileId || '').trim()
  if (!toolKey) return fail(400, '缺少工具标识')
  if (!coverFileId) return fail(400, '缺少封面文件ID')
  if (!coverFileId.startsWith('cloud://')) return fail(400, '封面文件ID格式不正确')

  const now = new Date()
  const queryRes = await db.collection('system_tags').where({ key: 'boardgame_tool_covers' }).limit(1).get()
  const existed = (queryRes.data || [])[0]
  const oldValue = existed?.value && typeof existed.value === 'object' ? existed.value : {}
  const nextValue = {
    ...oldValue,
    [toolKey]: {
      fileId: coverFileId,
      updatedAt: now,
      updatedBy: auth.user._id,
      updatedByNickname: auth.user.nickname || '管理员'
    }
  }

  const payload = {
    key: 'boardgame_tool_covers',
    value: nextValue,
    updatedAt: now,
    updatedBy: auth.user._id,
    updatedByNickname: auth.user.nickname || '管理员'
  }

  if (existed?._id) {
    await db.collection('system_tags').doc(existed._id).update({ data: payload })
  } else {
    await db.collection('system_tags').add({ data: { ...payload, createdAt: now } })
  }

  return success({ toolKey, coverFileId }, '保存成功')
}

module.exports = {
  getAdminManageData,
  adminDeleteMahjongRecord,
  adminDeleteGame,
  adminDeleteYakumanRecord,
  adminGetYakumanRecord,
  adminUpdateYakumanRecord,
  adminDeleteHonorRecord,
  getSeatAnnouncement,
  setSeatAnnouncement,
  getBoardgameToolCovers,
  setBoardgameToolCover
}
