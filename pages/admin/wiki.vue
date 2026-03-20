<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">百科管理</view>
        <view class="sub">管理员可审核发布、编辑词条并可修改创建者信息</view>
      </view>

      <view v-if="!isAdmin" class="empty">仅管理员可访问</view>
      <view v-else>
        <view class="card">
          <input class="input" v-model="form.title" placeholder="词条标题" />
          <input class="input" v-model="form.summary" placeholder="词条摘要（可选）" />
          <textarea class="textarea" v-model="form.content" placeholder="词条正文（最多1000字）" maxlength="1000" />
          <view class="count">{{ form.content.length }}/1000</view>
          <input class="input" v-model="tagsText" placeholder="标签（可选，多个标签用逗号分隔）" />
          <input class="input" v-model="form.creatorNickname" placeholder="创建者昵称（管理员可修改）" />
          <input class="input" v-model="form.creatorId" placeholder="创建者ID（可选）" />

          <view class="form-row">
            <text class="label">发布状态</text>
            <picker mode="selector" :range="statusOptions" :value="statusIndex" @change="onStatusChange">
              <view class="picker">{{ statusOptions[statusIndex] }}</view>
            </picker>
          </view>

          <view class="img-head">
            <text class="label">词条图片（最多9张）</text>
            <view class="img-btn" @tap="chooseImages">选择图片</view>
          </view>
          <view class="img-list" v-if="form.images.length">
            <view class="img-item" v-for="(img, index) in form.images" :key="img + index">
              <image :src="img" class="img" mode="aspectFill" />
              <view class="img-del" @tap="removeImage(index)">删除</view>
            </view>
          </view>

          <view class="actions">
            <view class="btn primary" @tap="submit">{{ editingId ? '保存修改' : '新增词条' }}</view>
            <view v-if="editingId" class="btn ghost" @tap="resetForm">取消编辑</view>
          </view>
        </view>

        <view class="card">
          <view class="title-sm">词条列表</view>
          <view class="filter-row">
            <picker mode="selector" :range="statusFilterOptions" :value="statusFilterIndex" @change="onFilterChange">
              <view class="picker">{{ statusFilterOptions[statusFilterIndex] }}</view>
            </picker>
            <view class="refresh-btn" @tap="loadList">刷新</view>
          </view>
          <view v-if="!list.length" class="empty">暂无词条</view>
          <view v-for="item in list" :key="item.id" class="row">
            <view class="info">
              <view class="line">
                <text class="status" :class="statusClass(item.status)">{{ statusText(item.status) }}</text>
                <text class="title-line">{{ item.title }}</text>
              </view>
              <text class="sub-line">{{ item.summary || '无摘要' }}</text>
              <text class="meta">创建者：{{ item.creatorNickname || '未命名用户' }}</text>
            </view>
            <view class="ops">
              <view class="op edit" @tap="editItem(item)">编辑</view>
              <view class="op del" @tap="removeItem(item)">删除</view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const isAdmin = ref(false)
const list = ref([])
const editingId = ref('')
const tagsText = ref('')
const statusOptions = ['待审核', '已发布', '已驳回']
const statusValueMap = ['pending', 'published', 'rejected']
const statusIndex = ref(0)
const statusFilterOptions = ['全部', '待审核', '已发布', '已驳回']
const statusFilterValueMap = ['', 'pending', 'published', 'rejected']
const statusFilterIndex = ref(0)
const form = ref({
  title: '',
  summary: '',
  content: '',
  images: [],
  creatorId: '',
  creatorNickname: '',
  status: 'pending'
})

const statusText = (value) => {
  if (value === 'published') return '已发布'
  if (value === 'rejected') return '已驳回'
  return '待审核'
}

const statusClass = (value) => {
  if (value === 'published') return 'status-published'
  if (value === 'rejected') return 'status-rejected'
  return 'status-pending'
}

const resetForm = () => {
  editingId.value = ''
  tagsText.value = ''
  statusIndex.value = 0
  form.value = {
    title: '',
    summary: '',
    content: '',
    images: [],
    creatorId: '',
    creatorNickname: '',
    status: 'pending'
  }
}

const onStatusChange = (e) => {
  const idx = Number(e.detail.value || 0)
  statusIndex.value = idx
  form.value.status = statusValueMap[idx] || 'pending'
}

const onFilterChange = async (e) => {
  statusFilterIndex.value = Number(e.detail.value || 0)
  await loadList()
}

const parseTags = () => {
  return tagsText.value
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10)
}

const loadList = async () => {
  const statusFilter = statusFilterValueMap[statusFilterIndex.value]
  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: {
      action: 'getWikiList',
      data: {
        page: 1,
        pageSize: 100,
        includeAll: true,
        status: statusFilter
      }
    }
  })
  if (res?.result?.code === 0) {
    list.value = res.result.data.list || []
  } else {
    uni.showToast({ title: res?.result?.message || '加载失败', icon: 'none' })
  }
}

const checkAdmin = async () => {
  const me = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!me?.result?.data?.isAdmin
  if (!isAdmin.value) {
    uni.showToast({ title: '仅管理员可访问', icon: 'none' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/user/user' })
    }, 300)
  }
}

const uploadSingleImage = async (filePath) => {
  const ext = (filePath.split('.').pop() || 'jpg').toLowerCase()
  const cloudPath = `wiki/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const res = await wx.cloud.uploadFile({ cloudPath, filePath })
  return res.fileID
}

const chooseImages = () => {
  const remain = Math.max(0, 9 - form.value.images.length)
  if (!remain) {
    uni.showToast({ title: '最多 9 张图片', icon: 'none' })
    return
  }
  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...', mask: true })
        const files = res.tempFilePaths || []
        for (const path of files) {
          const fileID = await uploadSingleImage(path)
          form.value.images.push(fileID)
        }
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (error) {
        console.error('upload wiki images failed', error)
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const removeImage = (index) => {
  form.value.images.splice(index, 1)
}

const submit = async () => {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  if (!form.value.content.trim()) {
    uni.showToast({ title: '请填写正文', icon: 'none' })
    return
  }

  const payload = {
    title: form.value.title,
    summary: form.value.summary,
    content: form.value.content,
    images: form.value.images,
    tags: parseTags(),
    status: form.value.status,
    creatorId: form.value.creatorId,
    creatorNickname: form.value.creatorNickname
  }
  if (editingId.value) payload.entryId = editingId.value

  const action = editingId.value ? 'adminUpdateWiki' : 'adminCreateWiki'
  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: { action, data: payload }
  })
  if (res?.result?.code === 0) {
    uni.showToast({ title: editingId.value ? '修改成功' : '创建成功', icon: 'success' })
    resetForm()
    await loadList()
  } else {
    uni.showToast({ title: res?.result?.message || '操作失败', icon: 'none' })
  }
}

const editItem = async (item) => {
  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: { action: 'getWikiDetail', data: { entryId: item.id } }
  })
  if (res?.result?.code !== 0) {
    uni.showToast({ title: res?.result?.message || '加载失败', icon: 'none' })
    return
  }
  const doc = res.result.data || {}
  editingId.value = doc.id || item.id
  form.value.title = doc.title || ''
  form.value.summary = doc.summary || ''
  form.value.content = doc.content || ''
  form.value.images = [...(doc.images || [])]
  form.value.creatorId = doc.creatorId || ''
  form.value.creatorNickname = doc.creatorNickname || ''
  form.value.status = doc.status || 'pending'
  statusIndex.value = Math.max(0, statusValueMap.indexOf(form.value.status))
  tagsText.value = (doc.tags || []).join(', ')
}

const removeItem = (item) => {
  uni.showModal({
    title: '确认删除',
    content: `确认删除词条「${item.title || ''}」吗？`,
    success: async (result) => {
      if (!result.confirm) return
      const res = await wx.cloud.callFunction({
        name: 'game-service',
        data: { action: 'adminDeleteWiki', data: { entryId: item.id } }
      })
      if (res?.result?.code === 0) {
        uni.showToast({ title: '已删除', icon: 'success' })
        if (editingId.value === item.id) resetForm()
        await loadList()
      } else {
        uni.showToast({ title: res?.result?.message || '删除失败', icon: 'none' })
      }
    }
  })
}

onShow(async () => {
  await checkAdmin()
  if (!isAdmin.value) return
  await loadList()
})
</script>

<style scoped>
.page { min-height: 100vh; background:#f5f6f8; }
.scroll { height: 100vh; }
.card { margin:20rpx; background:#fff; border-radius:14rpx; padding:16rpx; }
.title { font-size:30rpx; font-weight:700; }
.sub { margin-top:6rpx; color:#6b7280; font-size:22rpx; }
.title-sm { font-size:26rpx; font-weight:700; margin-bottom:8rpx; }
.input,.textarea,.picker { margin-top:10rpx; width:100%; background:#f8fafc; border-radius:10rpx; padding:12rpx; box-sizing:border-box; font-size:24rpx; }
.textarea { min-height:180rpx; }
.count { margin-top:6rpx; text-align:right; font-size:20rpx; color:#9ca3af; }
.form-row { margin-top:8rpx; }
.label { color:#374151; font-size:24rpx; }
.filter-row { display:flex; align-items:center; gap:12rpx; margin-bottom:8rpx; }
.filter-row .picker { flex:1; margin-top:0; }
.refresh-btn { width:120rpx; height:64rpx; border-radius:8rpx; background:#07c160; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22rpx; }
.img-head { margin-top:12rpx; display:flex; justify-content:space-between; align-items:center; }
.img-btn { min-width:120rpx; height:56rpx; border-radius:8rpx; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22rpx; padding:0 10rpx; }
.img-list { margin-top:10rpx; display:flex; flex-wrap:wrap; gap:12rpx; }
.img-item { width:160rpx; }
.img { width:160rpx; height:160rpx; border-radius:10rpx; background:#f1f5f9; }
.img-del { margin-top:6rpx; height:44rpx; border-radius:8rpx; background:#ef4444; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22rpx; }
.actions { margin-top:14rpx; display:flex; gap:12rpx; }
.btn { flex:1; height:68rpx; border-radius:10rpx; display:flex; align-items:center; justify-content:center; font-size:24rpx; }
.btn.primary { background:#07c160; color:#fff; }
.btn.ghost { background:#eef2ff; color:#4338ca; }
.empty { color:#9ca3af; font-size:24rpx; margin-top:12rpx; }
.row { display:flex; justify-content:space-between; align-items:center; gap:12rpx; padding:12rpx 0; border-bottom:1rpx solid #f1f5f9; }
.row:last-child { border-bottom:none; }
.info { flex:1; min-width:0; }
.line { display:flex; align-items:center; gap:8rpx; }
.title-line { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:24rpx; color:#111827; font-weight:600; }
.status { flex-shrink:0; font-size:20rpx; padding:4rpx 10rpx; border-radius:999rpx; }
.status-pending { background:#fff7ed; color:#c2410c; }
.status-published { background:#ecfdf5; color:#047857; }
.status-rejected { background:#fef2f2; color:#b91c1c; }
.sub-line { display:block; margin-top:6rpx; font-size:22rpx; color:#6b7280; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.meta { display:block; margin-top:4rpx; font-size:20rpx; color:#9ca3af; }
.ops { width:184rpx; display:flex; justify-content:flex-end; align-items:center; gap:10rpx; flex-shrink:0; }
.op { width:86rpx; height:52rpx; border-radius:8rpx; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22rpx; text-align:center; }
.edit { background:#2563eb; }
.del { background:#ef4444; }
</style>
