<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">词条审核与编辑</view>
        <view class="sub">标签项已隐藏，可在本页编辑并保存</view>
      </view>

      <view v-if="!isAdmin" class="empty">仅管理员可访问</view>
      <view v-else-if="!editingId" class="empty">词条不存在或参数无效</view>
      <view v-else class="card">
        <input class="input" v-model="form.title" placeholder="词条标题" />
        <input class="input" v-model="form.summary" placeholder="词条摘要（可选）" />
        <textarea class="textarea" v-model="form.content" placeholder="词条正文（最多1000字）" maxlength="1000" />
        <view class="count">{{ form.content.length }}/1000</view>
        <input class="input" v-model="form.creatorNickname" placeholder="创建者昵称" />
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
            <image :src="displayImages[index] || localFallbackImage" class="img" mode="aspectFill" />
            <view class="img-del" @tap="removeImage(index)">删除</view>
          </view>
        </view>

        <view class="actions">
          <view class="btn primary" @tap="submit">保存</view>
          <view class="btn ghost" @tap="goBack">返回</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const localFallbackImage = '/static/empty.png'
const isAdmin = ref(false)
const editingId = ref('')
const statusOptions = ['待审核', '已发布', '已驳回']
const statusValueMap = ['pending', 'published', 'rejected']
const statusIndex = ref(0)
const preservedTags = ref([])
const displayImages = ref([])
const form = ref({
  title: '',
  summary: '',
  content: '',
  images: [],
  creatorId: '',
  creatorNickname: '',
  status: 'pending'
})

const isCloudFileId = (value) => typeof value === 'string' && value.startsWith('cloud://')
const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//.test(value)

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

const refreshDisplayImages = async () => {
  const images = form.value.images || []
  if (!images.length) {
    displayImages.value = []
    return
  }

  const cloudIds = images.filter((img) => isCloudFileId(img))
  const tempMap = {}
  if (cloudIds.length) {
    try {
      const res = await wx.cloud.getTempFileURL({ fileList: cloudIds })
      ;(res?.fileList || []).forEach((item) => {
        if (item?.status === 0 && item?.fileID && item?.tempFileURL) {
          tempMap[item.fileID] = item.tempFileURL
        }
      })
    } catch (error) {
      console.warn('refreshDisplayImages getTempFileURL failed:', error)
    }
  }

  displayImages.value = images.map((img) => {
    if (isHttpUrl(img) || String(img || '').startsWith('/')) return img
    if (isCloudFileId(img)) return tempMap[img] || localFallbackImage
    return localFallbackImage
  })
}

const onStatusChange = (e) => {
  const idx = Number(e.detail.value || 0)
  statusIndex.value = idx
  form.value.status = statusValueMap[idx] || 'pending'
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
        await refreshDisplayImages()
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

const removeImage = async (index) => {
  form.value.images.splice(index, 1)
  await refreshDisplayImages()
}

const loadDetail = async (entryId) => {
  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: { action: 'getWikiDetail', data: { entryId } }
  })
  if (res?.result?.code !== 0) {
    uni.showToast({ title: res?.result?.message || '加载失败', icon: 'none' })
    return
  }
  const doc = res.result.data || {}
  editingId.value = doc.id || entryId
  form.value.title = doc.title || ''
  form.value.summary = doc.summary || ''
  form.value.content = doc.content || ''
  form.value.images = [...(doc.images || [])]
  form.value.creatorId = doc.creatorId || ''
  form.value.creatorNickname = doc.creatorNickname || ''
  form.value.status = doc.status || 'pending'
  statusIndex.value = Math.max(0, statusValueMap.indexOf(form.value.status))
  preservedTags.value = Array.isArray(doc.tags) ? doc.tags : []
  await refreshDisplayImages()
}

const submit = async () => {
  if (!editingId.value) return
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  if (!form.value.content.trim()) {
    uni.showToast({ title: '请填写正文', icon: 'none' })
    return
  }

  const payload = {
    entryId: editingId.value,
    title: form.value.title,
    summary: form.value.summary,
    content: form.value.content,
    images: form.value.images,
    tags: preservedTags.value,
    status: form.value.status,
    creatorId: form.value.creatorId,
    creatorNickname: form.value.creatorNickname
  }

  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: { action: 'adminUpdateWiki', data: payload }
  })
  if (res?.result?.code === 0) {
    uni.showToast({ title: '已保存', icon: 'success' })
  } else {
    uni.showToast({ title: res?.result?.message || '保存失败', icon: 'none' })
  }
}

const goBack = () => {
  uni.navigateBack()
}

onLoad(async (query) => {
  await checkAdmin()
  if (!isAdmin.value) return
  const entryId = String(query?.entryId || '').trim()
  if (!entryId) {
    uni.showToast({ title: '缺少词条ID', icon: 'none' })
    return
  }
  await loadDetail(entryId)
})
</script>

<style scoped>
.page { min-height: 100vh; background:#f5f6f8; }
.scroll { height: 100vh; }
.card { margin:20rpx; background:#fff; border-radius:14rpx; padding:16rpx; }
.title { font-size:30rpx; font-weight:700; }
.sub { margin-top:6rpx; color:#6b7280; font-size:22rpx; }
.empty { color:#9ca3af; font-size:24rpx; margin:20rpx; }
.input,.textarea,.picker { margin-top:10rpx; width:100%; background:#f8fafc; border-radius:10rpx; padding:12rpx; box-sizing:border-box; font-size:24rpx; }
.textarea { min-height:180rpx; }
.count { margin-top:6rpx; text-align:right; font-size:20rpx; color:#9ca3af; }
.form-row { margin-top:8rpx; }
.label { color:#374151; font-size:24rpx; }
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
</style>
