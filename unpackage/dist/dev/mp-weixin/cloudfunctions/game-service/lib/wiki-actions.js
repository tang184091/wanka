const { db, _, success, fail, getCurrentUser, checkTextSecurityBatch, ensureUserAvailable } = require('./shared')

const STATUS_PENDING = 'pending'
const STATUS_PUBLISHED = 'published'
const STATUS_REJECTED = 'rejected'
const STATUS_SET = new Set([STATUS_PENDING, STATUS_PUBLISHED, STATUS_REJECTED])

function isAdminUser(user) {
  if (!user) return false
  return user.isAdmin === true || user.isAdmin === 'true' || user.role === 'admin'
}

function normalizeString(value, max = 2000) {
  return String(value || '').trim().slice(0, max)
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return []
  return images
    .map((url) => String(url || '').trim())
    .filter((url) => url.startsWith('cloud://') || url.startsWith('http'))
    .slice(0, 30)
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag) => normalizeString(tag, 20))
    .filter(Boolean)
    .slice(0, 10)
}

function normalizeStatus(value, fallback = STATUS_PENDING) {
  const status = String(value || '').trim().toLowerCase()
  return STATUS_SET.has(status) ? status : fallback
}

function toListItem(item) {
  return {
    id: item._id,
    title: item.title || '',
    summary: item.summary || '',
    tags: item.tags || [],
    status: normalizeStatus(item.status, STATUS_PUBLISHED),
    creatorId: item.creatorId || '',
    creatorNickname: item.creatorNickname || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    publishedAt: item.publishedAt || null
  }
}

async function ensureAdmin(wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return { error: fail(401, '请先登录') }
  if (!isAdminUser(currentUser)) return { error: fail(403, '仅管理员可操作') }
  return { user: currentUser }
}

async function getWikiList(data, wxContext) {
  const page = Math.max(1, Number(data?.page || 1))
  const pageSize = Math.min(10, Math.max(1, Number(data?.pageSize || 10)))
  const skip = (page - 1) * pageSize

  const includeAll = !!data?.includeAll
  const status = normalizeStatus(data?.status, '')
  const currentUser = await getCurrentUser(wxContext).catch(() => null)
  const admin = isAdminUser(currentUser)

  const where = {}
  if (admin && includeAll && status) {
    where.status = status
  }

  const res = await db.collection('wiki_entries')
    .where(where)
    .orderBy('updatedAt', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  let list = (res.data || []).map(toListItem)
  if (!(admin && includeAll)) {
    list = list.filter((item) => item.status === STATUS_PUBLISHED)
  }
  return success({
    list,
    page,
    pageSize,
    hasMore: list.length >= pageSize
  }, '获取成功')
}

async function getWikiDetail(data, wxContext) {
  const entryId = normalizeString(data?.entryId || data?.id, 64)
  if (!entryId) return fail(400, '缺少词条ID')

  const res = await db.collection('wiki_entries').doc(entryId).get()
  const doc = res?.data
  if (!doc) return fail(404, '词条不存在')

  const status = normalizeStatus(doc.status, STATUS_PUBLISHED)
  if (status !== STATUS_PUBLISHED) {
    const currentUser = await getCurrentUser(wxContext).catch(() => null)
    const admin = isAdminUser(currentUser)
    const isOwner = !!(currentUser && String(currentUser._id) === String(doc.creatorId || ''))
    if (!admin && !isOwner) {
      return fail(403, '词条审核中，暂不可查看')
    }
  }

  return success({
    id: doc._id,
    title: doc.title || '',
    summary: doc.summary || '',
    content: doc.content || '',
    images: doc.images || [],
    tags: doc.tags || [],
    status,
    creatorId: doc.creatorId || '',
    creatorNickname: doc.creatorNickname || '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    publishedAt: doc.publishedAt || null,
    reviewerId: doc.reviewerId || '',
    reviewerNickname: doc.reviewerNickname || ''
  }, '获取成功')
}

async function submitWiki(data, wxContext) {
  const currentUser = await getCurrentUser(wxContext)
  if (!currentUser) return fail(401, '请先登录')

  {
    const availableError = ensureUserAvailable(currentUser, '投稿百科')
    if (availableError) return availableError
  }

  const title = normalizeString(data?.title, 80)
  const summary = normalizeString(data?.summary, 200)
  const content = normalizeString(data?.content, 1000)
  const images = normalizeImages(data?.images)
  const tags = normalizeTags(data?.tags)
  if (!title) return fail(400, '标题不能为空')
  if (!content) return fail(400, '正文不能为空')

  const submitSecurityRes = await checkTextSecurityBatch([
    { title: '词条标题', text: title },
    { title: '词条摘要', text: summary },
    { title: '词条正文', text: content },
    { title: '词条标签', text: tags.join(' ') }
  ])
  if (!submitSecurityRes.ok) return fail(submitSecurityRes.code || 422, submitSecurityRes.message || '内容包含敏感信息')

  const now = new Date()
  const addRes = await db.collection('wiki_entries').add({
    data: {
      title,
      summary,
      content,
      images,
      tags,
      status: STATUS_PENDING,
      creatorId: currentUser._id,
      creatorNickname: currentUser.nickname || '未命名用户',
      submitterId: currentUser._id,
      submitterNickname: currentUser.nickname || '未命名用户',
      createdAt: now,
      updatedAt: now,
      publishedAt: null
    }
  })

  return success({ id: addRes._id }, '提交成功，等待管理员审核发布')
}

async function adminCreateWiki(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error

  const title = normalizeString(data?.title, 80)
  const summary = normalizeString(data?.summary, 200)
  const content = normalizeString(data?.content, 1000)
  const images = normalizeImages(data?.images)
  const tags = normalizeTags(data?.tags)
  const status = normalizeStatus(data?.status, STATUS_PUBLISHED)
  if (!title) return fail(400, '标题不能为空')
  if (!content) return fail(400, '正文不能为空')

  const createSecurityRes = await checkTextSecurityBatch([
    { title: '词条标题', text: title },
    { title: '词条摘要', text: summary },
    { title: '词条正文', text: content },
    { title: '词条标签', text: tags.join(' ') },
    { title: '创建者昵称', text: data?.creatorNickname }
  ])
  if (!createSecurityRes.ok) return fail(createSecurityRes.code || 422, createSecurityRes.message || '内容包含敏感信息')

  const now = new Date()
  const creatorId = normalizeString(data?.creatorId, 64) || auth.user._id
  const creatorNickname = normalizeString(data?.creatorNickname, 64) || auth.user.nickname || '管理员'
  const addRes = await db.collection('wiki_entries').add({
    data: {
      title,
      summary,
      content,
      images,
      tags,
      status,
      creatorId,
      creatorNickname,
      submitterId: auth.user._id,
      submitterNickname: auth.user.nickname || '管理员',
      reviewerId: auth.user._id,
      reviewerNickname: auth.user.nickname || '管理员',
      createdAt: now,
      updatedAt: now,
      publishedAt: status === STATUS_PUBLISHED ? now : null
    }
  })

  return success({ id: addRes._id }, '创建成功')
}

async function adminUpdateWiki(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error

  const entryId = normalizeString(data?.entryId || data?.id, 64)
  if (!entryId) return fail(400, '缺少词条ID')

  const title = normalizeString(data?.title, 80)
  const summary = normalizeString(data?.summary, 200)
  const content = normalizeString(data?.content, 1000)
  const images = normalizeImages(data?.images)
  const tags = normalizeTags(data?.tags)
  const status = normalizeStatus(data?.status, STATUS_PENDING)
  if (!title) return fail(400, '标题不能为空')
  if (!content) return fail(400, '正文不能为空')

  const updateSecurityRes = await checkTextSecurityBatch([
    { title: '词条标题', text: title },
    { title: '词条摘要', text: summary },
    { title: '词条正文', text: content },
    { title: '词条标签', text: tags.join(' ') },
    { title: '创建者昵称', text: data?.creatorNickname }
  ])
  if (!updateSecurityRes.ok) return fail(updateSecurityRes.code || 422, updateSecurityRes.message || '内容包含敏感信息')

  const creatorId = normalizeString(data?.creatorId, 64)
  const creatorNickname = normalizeString(data?.creatorNickname, 64)
  const updateData = {
    title,
    summary,
    content,
    images,
    tags,
    status,
    reviewerId: auth.user._id,
    reviewerNickname: auth.user.nickname || '管理员',
    updaterId: auth.user._id,
    updaterNickname: auth.user.nickname || '管理员',
    updatedAt: new Date()
  }
  if (creatorId) updateData.creatorId = creatorId
  if (creatorNickname) updateData.creatorNickname = creatorNickname
  if (status === STATUS_PUBLISHED) {
    updateData.publishedAt = new Date()
  } else {
    updateData.publishedAt = null
  }

  await db.collection('wiki_entries').doc(entryId).update({ data: updateData })
  return success({ id: entryId }, '修改成功')
}

async function adminDeleteWiki(data, wxContext) {
  const auth = await ensureAdmin(wxContext)
  if (auth.error) return auth.error

  const entryId = normalizeString(data?.entryId || data?.id, 64)
  if (!entryId) return fail(400, '缺少词条ID')

  await db.collection('wiki_entries').doc(entryId).remove()
  return success({ id: entryId }, '删除成功')
}

module.exports = {
  getWikiList,
  getWikiDetail,
  submitWiki,
  adminCreateWiki,
  adminUpdateWiki,
  adminDeleteWiki
}
