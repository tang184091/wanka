<template>
  <view class="admin-page">
    <view v-if="!isAdmin" class="forbidden">仅管理员可访问</view>
    <scroll-view v-else scroll-y class="admin-scroll">
      <view class="card">
        <view class="title">座位状态管理</view>
        <view class="tip">每个房间/座位都可单独设置为空闲中、预约中、使用中。</view>

        <view class="seat-grid">
          <view v-for="seat in seats" :key="seat" class="seat-cell">
            <text class="seat-name">{{ seat }}</text>
            <picker :range="statusOptions" :value="statusIndex(overrides[seat])" @change="(e) => changeStatus(seat, e)">
              <view class="picker">{{ statusText(overrides[seat] || 'available') }}</view>
            </picker>
          </view>
        </view>

        <view class="btn" @tap="save">保存</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import constants from '@/utils/constants'

const isAdmin = ref(false)
const overrides = ref({})
const seats = constants.GAME_LOCATIONS.map(item => item.name)
const statusOptions = ['空闲中', '预约中', '使用中']
const statusValues = ['available', 'reserved', 'occupied']

const statusIndex = (value) => {
  const i = statusValues.indexOf(value || 'available')
  return i >= 0 ? i : 0
}
const statusText = (value) => statusOptions[statusIndex(value)]

const checkAdmin = async () => {
  const res = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  if (res.result?.code === 0) {
    isAdmin.value = !!res.result.data.isAdmin
  }
}

const load = async () => {
  const res = await wx.cloud.callFunction({ name: 'game-service', data: { action: 'getSeatStatusOverrides', data: {} } })
  if (res.result?.code === 0) {
    overrides.value = res.result.data.overrides || {}
  }
}

const changeStatus = (seat, e) => {
  const index = Number(e.detail.value)
  overrides.value = { ...overrides.value, [seat]: statusValues[index] }
}

const save = async () => {
  const res = await wx.cloud.callFunction({ name: 'game-service', data: { action: 'setSeatStatusOverrides', data: { overrides: overrides.value } } })
  if (res.result?.code === 0) {
    uni.showToast({ title: '保存成功', icon: 'success' })
  } else {
    uni.showToast({ title: res.result?.message || '保存失败', icon: 'none' })
  }
}

onShow(async () => {
  await checkAdmin()
  if (isAdmin.value) await load()
})
</script>

<style scoped>
.admin-page { min-height: 100vh; background:#f5f6f8; }
.admin-scroll { height: 100vh; }
.card { margin: 20rpx; background:#fff; border-radius:16rpx; padding:20rpx; }
.title { font-size:30rpx; font-weight:700; }
.tip { margin-top:8rpx; color:#6b7280; font-size:22rpx; }
.seat-grid { margin-top: 16rpx; display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12rpx; }
.seat-cell { background:#f8fafc; border:1rpx solid #e5e7eb; border-radius:10rpx; padding:12rpx; }
.seat-name { display:block; font-size:24rpx; color:#111827; margin-bottom:8rpx; }
.picker { text-align:center; background:#f3f4f6; padding:10rpx 14rpx; border-radius: 10rpx; font-size:22rpx; }
.btn { margin-top:20rpx; background:#07c160; color:#fff; height:72rpx; border-radius:12rpx; display:flex; align-items:center; justify-content:center; }
.forbidden { padding: 30rpx; color: #ef4444; }
</style>
