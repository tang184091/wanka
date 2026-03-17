<template>
  <view class="admin-page">
    <view v-if="!isAdmin" class="forbidden">仅管理员可访问</view>
    <scroll-view v-else scroll-y class="admin-scroll">
      <view class="card">
        <view class="title">座位状态管理</view>
        <view class="tip">可将座位状态设置为空闲中/预约中/使用中，保存后座位详情页将按云端配置显示。</view>
        <view v-for="seat in seats" :key="seat" class="seat-row">
          <text class="seat-name">{{ seat }}</text>
          <picker :range="statusOptions" :value="statusIndex(overrides[seat])" @change="(e) => changeStatus(seat, e)">
            <view class="picker">{{ statusText(overrides[seat] || 'available') }}</view>
          </picker>
        </view>
        <view class="btn" @tap="save">保存配置</view>
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
.seat-row { display:flex; justify-content:space-between; align-items:center; border-bottom:1rpx solid #eef2f7; padding:16rpx 0; }
.seat-name { max-width: 65%; font-size: 26rpx; }
.picker { min-width:170rpx; text-align:center; background:#f3f4f6; padding:10rpx 14rpx; border-radius: 10rpx; }
.btn { margin-top:20rpx; background:#07c160; color:#fff; height:72rpx; border-radius:12rpx; display:flex; align-items:center; justify-content:center; }
.forbidden { padding: 30rpx; color: #ef4444; }
</style>
