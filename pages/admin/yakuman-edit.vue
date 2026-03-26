<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">编辑役满记录</view>
        <view class="sub">可修改玩家昵称、番种、达成日期与图片</view>
      </view>

      <view v-if="!isAdmin" class="empty">仅管理员可访问</view>
      <view v-else-if="!form.recordId" class="empty">{{ loading ? '加载中...' : '记录不存在' }}</view>

      <view v-else class="card">
        <view class="form-row">
          <text class="label">达成日期</text>
          <picker mode="date" :value="form.achievedDate" @change="onDateChange">
            <view class="picker-value">{{ form.achievedDate || '请选择日期' }}</view>
          </picker>
        </view>

        <view class="form-row">
          <text class="label">玩家昵称</text>
          <input class="input" v-model="form.playerNickname" maxlength="32" placeholder="请输入玩家昵称" />
        </view>

        <view class="form-row">
          <text class="label">达成番种</text>
          <picker :range="yakumanTypes" :value="yakumanIndex" @change="onYakumanChange">
            <view class="picker-value">{{ yakumanTypes[yakumanIndex] || '请选择番种' }}</view>
          </picker>
        </view>

        <view class="form-row">
          <text class="label">图片（可替换）</text>
          <view class="upload-box" @tap="chooseImage">
            <image v-if="displayImage" :src="displayImage" class="preview" mode="aspectFill" />
            <text v-else class="upload-tip">点击选择图片</text>
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

const isAdmin = ref(false)
const loading = ref(false)
const yakumanTypes = ref([
  '国士无双', '四暗刻', '大三元', '字一色', '绿一色', '清老头',
  '小四喜', '大四喜', '四杠子', '九莲宝灯', '天和', '地和', '累计役满'
])
const yakumanIndex = ref(0)
const displayImage = ref('')
const imageFileId = ref('')
const imageSize = ref(0)

const form = ref({
  recordId: '',
  achievedDate: '',
  playerNickname: ''
})

const isCloudFileId = (value) => typeof value === 'string' && value.startsWith('cloud://')
const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//.test(value)

const formatDate = (value) => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const ensureDisplayImage = async (rawUrl) => {
  const value = String(rawUrl || '').trim()
  if (!value) {
    displayImage.value = ''
    return
  }
  if (isHttpUrl(value) || value.startsWith('/')) {
    displayImage.value = value
    return
  }
  if (!isCloudFileId(value)) {
    displayImage.value = ''
    return
  }
  try {
    const tempRes = await wx.cloud.getTempFileURL({ fileList: [value] })
    const first = (tempRes?.fileList || [])[0]
    displayImage.value = first?.status === 0 ? first.tempFileURL : ''
  } catch (error) {
    console.warn('ensureDisplayImage failed:', error)
    displayImage.value = ''
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

const loadDetail = async (recordId) => {
  loading.value = true
  try {
    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: { action: 'adminGetYakumanRecord', data: { recordId } }
    })
    if (res?.result?.code !== 0) {
      uni.showToast({ title: res?.result?.message || '加载失败', icon: 'none' })
      return
    }
    const doc = res.result.data || {}
    form.value.recordId = doc.id || recordId
    form.value.playerNickname = doc.playerNickname || ''
    form.value.achievedDate = formatDate(doc.achievedAt)
    yakumanIndex.value = Math.max(0, yakumanTypes.value.indexOf(doc.yakumanType))
    imageFileId.value = String(doc.imageFileId || '').trim()
    await ensureDisplayImage(imageFileId.value)
  } finally {
    loading.value = false
  }
}

const onDateChange = (e) => {
  form.value.achievedDate = e.detail.value
}

const onYakumanChange = (e) => {
  yakumanIndex.value = Number(e.detail.value || 0)
}

const uploadSingleImage = async (filePath) => {
  const ext = (filePath.split('.').pop() || 'jpg').toLowerCase()
  const cloudPath = `yakuman/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
  const res = await wx.cloud.uploadFile({ cloudPath, filePath })
  return res.fileID
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const filePath = (res.tempFilePaths || [])[0]
      const file = (res.tempFiles || [])[0] || {}
      if (!filePath) return
      if (Number(file.size || 0) > 2 * 1024 * 1024) {
        uni.showToast({ title: '图片大小不能超过2MB', icon: 'none' })
        return
      }
      uni.showLoading({ title: '上传中...', mask: true })
      try {
        const fileID = await uploadSingleImage(filePath)
        imageFileId.value = fileID
        imageSize.value = Number(file.size || 0)
        await ensureDisplayImage(fileID)
      } catch (error) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const submit = async () => {
  if (!form.value.recordId) return
  if (!form.value.playerNickname.trim()) {
    uni.showToast({ title: '请输入玩家昵称', icon: 'none' })
    return
  }
  if (!form.value.achievedDate) {
    uni.showToast({ title: '请选择达成日期', icon: 'none' })
    return
  }
  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: {
      action: 'adminUpdateYakumanRecord',
      data: {
        recordId: form.value.recordId,
        playerNickname: form.value.playerNickname.trim(),
        yakumanType: yakumanTypes.value[yakumanIndex.value],
        achievedAt: `${form.value.achievedDate}T12:00:00`,
        imageFileId: imageFileId.value,
        imageSize: imageSize.value
      }
    }
  })
  if (res?.result?.code === 0) {
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 500)
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
  const recordId = String(query?.recordId || '').trim()
  if (!recordId) {
    uni.showToast({ title: '缺少记录ID', icon: 'none' })
    return
  }
  await loadDetail(recordId)
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.card { margin: 20rpx; background: #fff; border-radius: 14rpx; padding: 16rpx; }
.title { font-size: 30rpx; font-weight: 700; }
.sub { margin-top: 6rpx; color: #6b7280; font-size: 22rpx; }
.empty { margin: 20rpx; color: #9ca3af; font-size: 24rpx; }
.form-row { margin-bottom: 16rpx; }
.label { display: block; font-size: 24rpx; color: #374151; margin-bottom: 8rpx; }
.input, .picker-value { height: 72rpx; border-radius: 10rpx; background: #f3f4f6; padding: 0 16rpx; display: flex; align-items: center; font-size: 24rpx; }
.upload-box { height: 220rpx; border-radius: 10rpx; background: #f3f4f6; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.preview { width: 100%; height: 100%; }
.upload-tip { color: #6b7280; font-size: 24rpx; }
.actions { margin-top: 14rpx; display: flex; gap: 12rpx; }
.btn { flex: 1; height: 68rpx; border-radius: 10rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; }
.btn.primary { background: #07c160; color: #fff; }
.btn.ghost { background: #eef2ff; color: #4338ca; }
</style>
