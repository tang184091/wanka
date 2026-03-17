<template>
  <view class="page">
    <view class="card">
      <view class="title">役满上传</view>

      <view class="form-row">
        <text class="label">达成时间</text>
        <picker mode="date" :value="form.achievedDate" @change="onDateChange">
          <view class="picker-value">{{ form.achievedDate || '请选择日期' }}</view>
        </picker>
      </view>

      <view class="form-row">
        <text class="label">达成玩家昵称</text>
        <input class="input" v-model="form.playerKeyword" placeholder="输入2字以上可匹配云端昵称" @input="onSearchNickname" />
        <view v-if="searchResults.length" class="search-box">
          <view class="search-item" v-for="u in searchResults" :key="u.id" @tap="pickNickname(u)">{{ u.nickname }}</view>
        </view>
      </view>

      <view class="form-row">
        <text class="label">达成番种</text>
        <picker :range="yakumanTypes" :value="yakumanIndex" @change="onYakumanChange">
          <view class="picker-value">{{ yakumanTypes[yakumanIndex] || '请选择役满' }}</view>
        </picker>
      </view>

      <view class="form-row">
        <text class="label">役满照片（<=2MB）</text>
        <view class="upload-box" @tap="chooseImage">
          <image v-if="previewUrl" :src="previewUrl" class="preview" mode="aspectFill" />
          <text v-else class="upload-tip">点击选择图片</text>
        </view>
      </view>

      <view class="submit-btn" @tap="submit">上传</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const yakumanTypes = ref([
  '国士无双', '四暗刻', '大三元', '字一色', '绿一色', '清老头',
  '小四喜', '大四喜', '四杠子', '九莲宝灯', '天和', '地和', '累计役满'
])

const yakumanIndex = ref(0)
const previewUrl = ref('')
const imageFileId = ref('')
const imageSize = ref(0)
const searchResults = ref([])
let timer = null

const today = (() => {
  const d = new Date()
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})()

const form = ref({
  achievedDate: today,
  playerKeyword: '',
  playerNickname: ''
})

const onDateChange = (e) => {
  form.value.achievedDate = e.detail.value
}

const onYakumanChange = (e) => {
  yakumanIndex.value = Number(e.detail.value || 0)
}

const onSearchNickname = () => {
  const keyword = String(form.value.playerKeyword || '').trim()
  form.value.playerNickname = ''

  clearTimeout(timer)
  timer = setTimeout(async () => {
    if (keyword.length < 2) {
      searchResults.value = []
      return
    }

    const res = await wx.cloud.callFunction({
      name: 'user-service',
      data: { action: 'searchUsers', data: { keyword } }
    })

    if (res.result?.code === 0) {
      searchResults.value = (res.result.data.list || []).slice(0, 5)
    }
  }, 220)
}

const pickNickname = (u) => {
  form.value.playerNickname = u.nickname
  form.value.playerKeyword = u.nickname
  searchResults.value = []
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      const file = (res.tempFiles && res.tempFiles[0]) || {}
      const size = Number(file.size || 0)

      if (size > 2 * 1024 * 1024) {
        uni.showToast({ title: '图片大小不能超过2MB', icon: 'none' })
        return
      }

      uni.showLoading({ title: '上传中...', mask: true })
      try {
        const ext = filePath.split('.').pop() || 'jpg'
        const cloudPath = `yakuman/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
        const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath })
        imageFileId.value = uploadRes.fileID
        previewUrl.value = uploadRes.fileID
        imageSize.value = size
      } catch (error) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const submit = async () => {
  const nickname = String(form.value.playerNickname || form.value.playerKeyword || '').trim()
  if (!form.value.achievedDate || !nickname || !imageFileId.value) {
    uni.showToast({ title: '请完整填写信息', icon: 'none' })
    return
  }

  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: {
      action: 'createYakumanRecord',
      data: {
        achievedAt: `${form.value.achievedDate}T12:00:00`,
        playerNickname: nickname,
        yakumanType: yakumanTypes.value[yakumanIndex.value],
        imageFileId: imageFileId.value,
        imageSize: imageSize.value
      }
    }
  })

  if (res.result?.code === 0) {
    uni.showToast({ title: '上传成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } else {
    uni.showToast({ title: res.result?.message || '上传失败', icon: 'none' })
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; padding: 20rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 20rpx; }
.title { font-size: 30rpx; font-weight: 700; margin-bottom: 14rpx; }
.form-row { margin-bottom: 16rpx; position: relative; }
.label { display: block; font-size: 24rpx; color: #374151; margin-bottom: 8rpx; }
.input,.picker-value { height: 72rpx; border-radius: 10rpx; background: #f3f4f6; padding: 0 16rpx; display: flex; align-items: center; font-size: 24rpx; }
.search-box { position: absolute; left: 0; right: 0; top: 118rpx; background: #fff; border: 1rpx solid #e5e7eb; z-index: 10; border-radius: 10rpx; }
.search-item { height: 64rpx; display: flex; align-items: center; padding: 0 16rpx; border-bottom: 1rpx solid #f1f5f9; }
.search-item:last-child { border-bottom: none; }
.upload-box { height: 220rpx; border-radius: 10rpx; background: #f3f4f6; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.preview { width: 100%; height: 100%; }
.upload-tip { color: #6b7280; font-size: 24rpx; }
.submit-btn { height: 72rpx; border-radius: 10rpx; background: #f59e0b; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26rpx; }
</style>
