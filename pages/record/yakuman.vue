<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="header-card">
        <view>
          <view class="title">役满榜</view>
          <view class="sub">每行展示两张役满照片</view>
        </view>
        <view class="upload-btn" @tap="openUpload">役满上传</view>
      </view>

      <view v-if="!list.length" class="empty">暂无役满记录</view>

      <view class="grid">
        <view class="item" v-for="item in list" :key="item._id">
          <image class="photo" :src="item.imageUrl" mode="aspectFill" @tap="preview(item.imageUrl)" />
          <view class="info">
            <text class="line">玩家：{{ item.playerNickname }}</text>
            <text class="line">番种：{{ item.yakumanType }}</text>
            <text class="line">达成：{{ formatTime(item.achievedAt) }}</text>
          </view>
          <view v-if="isAdmin" class="ops">
            <view class="op edit" @tap.stop="goEdit(item)">编辑</view>
            <view class="op del" @tap.stop="removeItem(item)">删除</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const list = ref([])
const isAdmin = ref(false)

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const toSafeValue = (value) => String(value || '').trim()

const resolveImageUrls = async (records = []) => {
  const normalized = records.map((item) => ({
    ...item,
    imageFileId: toSafeValue(item.imageFileId),
    imageUrl: toSafeValue(item.imageUrl || item.imageFileId)
  }))

  const cloudIds = normalized
    .map((item) => toSafeValue(item.imageUrl || item.imageFileId))
    .filter((id) => id.startsWith('cloud://'))

  if (!cloudIds.length) return normalized

  const uniqueIds = [...new Set(cloudIds)]
  const idToTempUrl = {}

  for (let i = 0; i < uniqueIds.length; i += 50) {
    const chunk = uniqueIds.slice(i, i + 50)
    const tempRes = await wx.cloud.getTempFileURL({ fileList: chunk })
    const fileList = tempRes?.fileList || []
    fileList.forEach((item) => {
      if (item?.fileID && item?.tempFileURL) {
        idToTempUrl[item.fileID] = item.tempFileURL
      }
    })
  }

  return normalized.map((item) => ({
    ...item,
    imageUrl: idToTempUrl[toSafeValue(item.imageUrl || item.imageFileId)] || toSafeValue(item.imageUrl || item.imageFileId)
  }))
}

const loadData = async () => {
  const me = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!me?.result?.data?.isAdmin

  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: { action: 'getYakumanList', data: {} }
  })

  if (res.result?.code === 0) {
    const records = res.result.data.list || []
    list.value = await resolveImageUrls(records)
  } else {
    uni.showToast({ title: res.result?.message || '加载失败', icon: 'none' })
  }
}

const goEdit = (item) => {
  const id = item?.id || item?._id
  if (!id) return
  uni.navigateTo({ url: `/pages/admin/yakuman-edit?recordId=${id}` })
}

const removeItem = (item) => {
  const id = item?.id || item?._id
  if (!id) return
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确认继续？',
    success: async (res) => {
      if (!res.confirm) return
      const r = await wx.cloud.callFunction({
        name: 'game-service',
        data: { action: 'adminDeleteYakumanRecord', data: { recordId: id } }
      })
      if (r?.result?.code === 0) {
        uni.showToast({ title: '已删除', icon: 'success' })
        await loadData()
      } else {
        uni.showToast({ title: r?.result?.message || '删除失败', icon: 'none' })
      }
    }
  })
}

const openUpload = () => {
  uni.navigateTo({ url: '/pages/record/yakuman-upload' })
}

const preview = (src) => {
  if (!src) return
  uni.previewImage({ urls: [src], current: src })
}

onShow(loadData)
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.header-card { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 20rpx; display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 30rpx; font-weight: 700; }
.sub { margin-top: 6rpx; font-size: 22rpx; color: #6b7280; }
.upload-btn { height: 60rpx; padding: 0 20rpx; border-radius: 30rpx; background: #f59e0b; color: #fff; display: flex; align-items: center; font-size: 24rpx; }
.grid { margin: 20rpx; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; }
.item { background: #fff; border-radius: 12rpx; overflow: hidden; }
.photo { width: 100%; height: 220rpx; background: #e5e7eb; }
.info { padding: 12rpx; display: flex; flex-direction: column; gap: 4rpx; }
.line { font-size: 22rpx; color: #374151; }
.ops { padding: 0 12rpx 12rpx; display: flex; gap: 10rpx; }
.op { flex: 1; height: 48rpx; border-radius: 8rpx; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22rpx; }
.op.edit { background: #2563eb; }
.op.del { background: #ef4444; }
.empty { margin: 20rpx; color: #9ca3af; }
</style>
