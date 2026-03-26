<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">{{ detail.title || '词条详情' }}</view>
        <view class="summary" v-if="detail.summary">{{ detail.summary }}</view>
        <view class="time">创建时间：{{ formatDateTime(detail.createdAt) }}</view>
        <view class="time">创建者：{{ detail.creatorNickname || '未命名用户' }}</view>
      </view>

      <view class="card" v-if="detail.images && detail.images.length">
        <view class="section-title">图片</view>
        <image
          v-for="(url, index) in displayImages"
          :key="index"
          :src="url"
          class="content-image"
          mode="widthFix"
          @tap="preview(index)"
        />
      </view>

      <view class="card">
        <view class="section-title">正文</view>
        <view class="content">{{ detail.content || '暂无内容' }}</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { resolveCloudFileUrls } from '@/utils/cloud-image.js'

const detail = ref({
  id: '',
  title: '',
  summary: '',
  content: '',
  images: [],
  creatorNickname: '',
  createdAt: ''
})
const displayImages = ref([])

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const loadDetail = async (id) => {
  if (!id) return
  try {
    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: { action: 'getWikiDetail', data: { entryId: id } }
    })
    if (res?.result?.code === 0) {
      detail.value = res.result.data || detail.value
      displayImages.value = await resolveCloudFileUrls(detail.value.images || [])
    } else {
      uni.showToast({ title: res?.result?.message || '加载失败', icon: 'none' })
    }
  } catch (error) {
    console.error('load wiki detail failed', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const preview = (index) => {
  const images = displayImages.value || []
  if (!images.length) return
  uni.previewImage({ current: images[index], urls: images })
}

onLoad((query) => {
  loadDetail(query?.id)
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.card { margin: 20rpx; background: #fff; border-radius: 14rpx; padding: 18rpx; }
.title { font-size: 34rpx; font-weight: 700; color: #111827; line-height: 1.4; }
.summary { margin-top: 10rpx; color: #6b7280; font-size: 24rpx; line-height: 1.6; }
.time { margin-top: 12rpx; color: #9ca3af; font-size: 22rpx; }
.section-title { font-size: 28rpx; font-weight: 700; color: #111827; margin-bottom: 12rpx; }
.content-image { width: 100%; border-radius: 10rpx; margin-bottom: 12rpx; background: #f1f5f9; }
.content { font-size: 26rpx; color: #1f2937; line-height: 1.8; white-space: pre-wrap; word-break: break-word; }
</style>
