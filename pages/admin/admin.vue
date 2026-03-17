<template>
  <view class="admin-page">
    <view class="admin-card">
      <view class="card-title">座位状态管理</view>
      <view class="card-subtitle">管理员在此维护座位状态，普通「座位详情」页面只保留查看与创建能力。</view>

      <view v-if="!isAdmin" class="empty-box">
        <text class="empty-text">仅管理员可访问此页面</text>
      </view>

      <view v-else>
        <view class="toolbar">
          <view class="toolbar-btn" :class="{ disabled: refreshing }" @tap="refreshData">{{ refreshing ? '刷新中...' : '刷新状态' }}</view>
          <view class="toolbar-btn save" :class="{ disabled: saving }" @tap="saveOverrides">{{ saving ? '保存中...' : '保存修改' }}</view>
        </view>

        <view class="status-list">
          <view v-for="item in seatItems" :key="item.name" class="status-row">
            <view class="row-left">
              <text class="seat-name">{{ item.name }}</text>
              <text class="seat-current" :class="`current-${item.status}`">当前：{{ statusText(item.status) }}</text>
            </view>
            <picker class="row-picker" :range="statusOptions" :value="statusIndex(item.status)" @change="(e) => changeStatus(item.name, e)">
              <view class="picker-box">{{ statusText(item.status) }}</view>
            </picker>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import constants from '@/utils/constants.js'

const isAdmin = ref(false)
const refreshing = ref(false)
const saving = ref(false)
const statusOptions = ['空闲中', '预约中', '使用中']
const statusValues = ['available', 'reserved', 'occupied']

const seatItems = ref(constants.GAME_LOCATIONS.map((item) => ({
  name: item.name,
  status: 'available'
})))

const statusIndex = (value) => {
  const i = statusValues.indexOf(value || 'available')
  return i >= 0 ? i : 0
}

const statusText = (value) => statusOptions[statusIndex(value)]

const checkAdmin = async () => {
  const res = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!(res?.result?.code === 0 && res?.result?.data?.isAdmin)
}

const refreshData = async () => {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await checkAdmin()
    if (!isAdmin.value) return

    const res = await wx.cloud.callFunction({ name: 'game-service', data: { action: 'getSeatStatus', data: {} } })
    const statusMap = res?.result?.data?.statusByLocation || {}

    seatItems.value = constants.GAME_LOCATIONS.map((item) => ({
      name: item.name,
      status: statusMap[item.name] || 'available'
    }))
  } catch (error) {
    console.error('刷新管理员座位状态失败:', error)
    uni.showToast({ title: '刷新失败', icon: 'none' })
  } finally {
    refreshing.value = false
  }
}

const changeStatus = (seatName, e) => {
  const index = Number(e.detail.value)
  seatItems.value = seatItems.value.map((item) => {
    if (item.name !== seatName) return item
    return {
      ...item,
      status: statusValues[index] || 'available'
    }
  })
}

const saveOverrides = async () => {
  if (!isAdmin.value || saving.value) return
  saving.value = true
  try {
    const overrides = {}
    seatItems.value.forEach((item) => {
      overrides[item.name] = item.status || 'available'
    })

    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: { action: 'setSeatStatusOverrides', data: { overrides } }
    })

    if (res?.result?.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' })
      await refreshData()
    } else {
      uni.showToast({ title: res?.result?.message || '保存失败', icon: 'none' })
    }
  } catch (error) {
    console.error('保存管理员座位状态失败:', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onShow(() => {
  refreshData()
})
</script>

<style scoped>
.admin-page { min-height: 100vh; background: #f5f6f8; padding: 20rpx; }
.admin-card { background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 8rpx 20rpx rgba(0,0,0,.06); }
.card-title { font-size: 34rpx; font-weight: 700; color: #111827; }
.card-subtitle { margin-top: 10rpx; color: #6b7280; font-size: 24rpx; line-height: 1.6; }
.empty-box { margin-top: 24rpx; border: 1rpx dashed #d1d5db; border-radius: 12rpx; padding: 28rpx; text-align: center; }
.empty-text { font-size: 24rpx; color: #6b7280; }

.toolbar { margin-top: 22rpx; display: flex; gap: 12rpx; }
.toolbar-btn { flex: 1; height: 68rpx; border-radius: 10rpx; background: #e5e7eb; color: #111827; display: flex; align-items: center; justify-content: center; font-size: 24rpx; }
.toolbar-btn.save { background: #16a34a; color: #fff; }
.toolbar-btn.disabled { opacity: .55; }

.status-list { margin-top: 18rpx; display: flex; flex-direction: column; gap: 12rpx; }
.status-row { background: #f9fafb; border: 1rpx solid #e5e7eb; border-radius: 12rpx; padding: 16rpx; display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.row-left { display: flex; flex-direction: column; gap: 8rpx; }
.seat-name { font-size: 26rpx; color: #111827; font-weight: 600; }
.seat-current { font-size: 22rpx; }
.current-available { color: #16a34a; }
.current-reserved { color: #0284c7; }
.current-occupied { color: #dc2626; }
.row-picker { width: 180rpx; }
.picker-box { text-align: center; background: #fff; border: 1rpx solid #d1d5db; border-radius: 8rpx; padding: 12rpx 8rpx; font-size: 22rpx; color: #111827; }
</style>
