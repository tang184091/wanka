<template>
  <view class="seat-page">
    <scroll-view class="seat-scroll" scroll-y>
      <view class="layout-card">
        <view class="layout-header">
          <text class="layout-title">座位详情</text>
          <text class="layout-subtitle">点击房间/座位查看状态，空闲可快速创建组局</text>
        </view>

        <view class="legend-row">
          <view v-for="item in seatLegend" :key="item.status" class="legend-item">
            <view class="legend-dot" :class="`dot-${item.status}`"></view>
            <text class="legend-text">{{ item.label }}</text>
          </view>
        </view>

        <!-- 二楼布局 -->
        <view class="floor-card">
          <view class="floor-tag">二楼</view>
          <view class="floor2-layout">
            <view class="left-stack">
              <view v-for="seat in floor2Left" :key="seat.id" class="seat-item" :class="getSeatStatusClass(seat.status)" @tap="onSeatTap(seat)">
                <text class="seat-name">{{ seat.name }}</text>
                <text class="seat-status">{{ getSeatStatusText(seat.status) }}</text>
              </view>
            </view>

            <view class="middle-corridor">走廊</view>
          </view>

          <view class="floor2-bottom-row">
            <view v-for="seat in floor2Bottom" :key="seat.id" class="seat-item" :class="getSeatStatusClass(seat.status)" @tap="onSeatTap(seat)">
              <text class="seat-name">{{ seat.name }}</text>
              <text class="seat-status">{{ getSeatStatusText(seat.status) }}</text>
            </view>
          </view>
        </view>

        <!-- 一楼布局 -->
        <view class="floor-card">
          <view class="floor-tag">一楼</view>

          <view class="first-row">
            <view class="desk-column">
              <view class="desk-row" v-for="row in hallDeskRows" :key="row[0].id">
                <view class="seat-item small" v-for="seat in row" :key="seat.id" :class="getSeatStatusClass(seat.status)" @tap="onSeatTap(seat)">
                  <text class="seat-name">{{ seat.name }}</text>
                  <text class="seat-status">{{ getSeatStatusText(seat.status) }}</text>
                </view>
              </view>
            </view>

            <view class="seat-item hall-arcade" :class="getSeatStatusClass(arcadeHall.status)" @tap="onSeatTap(arcadeHall)">
              <text class="seat-name">{{ arcadeHall.name }}</text>
              <text class="seat-status">{{ getSeatStatusText(arcadeHall.status) }}</text>
            </view>
          </view>

          <view class="second-row">
            <view class="seat-item wide" :class="getSeatStatusClass(interDesk.status)" @tap="onSeatTap(interDesk)">
              <text class="seat-name">{{ interDesk.name }}</text>
              <text class="seat-status">{{ getSeatStatusText(interDesk.status) }}</text>
            </view>
            <view class="seat-item" :class="getSeatStatusClass(interArcade1.status)" @tap="onSeatTap(interArcade1)">
              <text class="seat-name">{{ interArcade1.name }}</text>
              <text class="seat-status">{{ getSeatStatusText(interArcade1.status) }}</text>
            </view>
            <view class="seat-item" :class="getSeatStatusClass(interArcade2.status)" @tap="onSeatTap(interArcade2)">
              <text class="seat-name">{{ interArcade2.name }}</text>
              <text class="seat-status">{{ getSeatStatusText(interArcade2.status) }}</text>
            </view>
          </view>

          <view class="third-row">
            <view class="corridor-box">走廊</view>
            <view class="seat-item arcade-room" :class="getSeatStatusClass(arcadeRoom.status)" @tap="onSeatTap(arcadeRoom)">
              <text class="seat-name">{{ arcadeRoom.name }}</text>
              <text class="seat-status">{{ getSeatStatusText(arcadeRoom.status) }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import UserService from '@/utils/user.js'

const seatLegend = ref([
  { status: 'available', label: '空闲中' },
  { status: 'reserved', label: '预约中' },
  { status: 'occupied', label: '使用中' }
])

const floor2Left = ref([
  { id: 'f2-bg-1', name: '桌游房1', type: 'boardgame', status: 'available', capacity: 8, device: '桌游桌 + 置物架' },
  { id: 'f2-mj-1', name: '日麻房1', type: 'mahjong', status: 'occupied', capacity: 4, device: '自动麻将机' },
  { id: 'f2-mj-2', name: '日麻房2', type: 'mahjong', status: 'available', capacity: 4, device: '自动麻将机' },
  { id: 'f2-mj-3', name: '日麻房3', type: 'mahjong', status: 'reserved', capacity: 4, device: '自动麻将机' }
])

const floor2Bottom = ref([
  { id: 'f2-bg-2', name: '桌游房2', type: 'boardgame', status: 'available', capacity: 8, device: '桌游桌 + 展示柜' },
  { id: 'f2-mj-4', name: '日麻房4', type: 'mahjong', status: 'reserved', capacity: 4, device: '自动麻将机' }
])

const hallDeskRows = ref([
  [
    { id: 'f1-desk-1', name: '大厅桌游1', type: 'boardgame', status: 'available', capacity: 6, device: '桌游桌' },
    { id: 'f1-desk-2', name: '大厅桌游2', type: 'boardgame', status: 'reserved', capacity: 6, device: '桌游桌' }
  ],
  [
    { id: 'f1-desk-3', name: '大厅桌游3', type: 'boardgame', status: 'occupied', capacity: 6, device: '桌游桌' },
    { id: 'f1-desk-4', name: '大厅桌游4', type: 'boardgame', status: 'available', capacity: 6, device: '桌游桌' }
  ],
  [
    { id: 'f1-desk-5', name: '大厅桌游5', type: 'boardgame', status: 'reserved', capacity: 6, device: '桌游桌' },
    { id: 'f1-desk-6', name: '大厅桌游6', type: 'boardgame', status: 'available', capacity: 6, device: '桌游桌' }
  ]
])

const arcadeHall = ref({ id: 'f1-arcade-hall', name: '电玩大厅', type: 'videogame', status: 'occupied', capacity: 8, device: '多台主机 + 大屏显示器' })
const interDesk = ref({ id: 'f1-inter-desk', name: '间层桌游', type: 'boardgame', status: 'available', capacity: 8, device: '桌游桌' })
const interArcade1 = ref({ id: 'f1-inter-arcade-1', name: '间层电玩1', type: 'videogame', status: 'reserved', capacity: 2, device: 'PS5 + 电视' })
const interArcade2 = ref({ id: 'f1-inter-arcade-2', name: '间层电玩2', type: 'videogame', status: 'occupied', capacity: 2, device: 'Switch + 显示器' })
const arcadeRoom = ref({ id: 'f1-arcade-room', name: '电玩房', type: 'videogame', status: 'available', capacity: 4, device: 'PS5 + Xbox + 4K电视' })

const getSeatStatusClass = (status) => {
  const map = {
    available: 'status-available',
    reserved: 'status-reserved',
    occupied: 'status-occupied'
  }
  return map[status] || 'status-available'
}

const getSeatStatusText = (status) => {
  const map = {
    available: '空闲中',
    reserved: '预约中',
    occupied: '使用中'
  }
  return map[status] || '空闲中'
}

const goToCreateWithPreset = (seat) => {
  const currentUser = UserService.getCurrentUser()
  if (!currentUser) {
    uni.showModal({
      title: '需要登录',
      content: '请先登录后再创建组局',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          uni.switchTab({ url: '/pages/user/user' })
        }
      }
    })
    return
  }

  const typeProjectMap = {
    mahjong: '日麻局',
    boardgame: '桌游局',
    videogame: '电玩局'
  }

  uni.navigateTo({
    url: `/pages/create/create?type=${encodeURIComponent(seat.type)}&location=${encodeURIComponent(seat.name)}&project=${encodeURIComponent(typeProjectMap[seat.type] || '娱乐局')}`
  })
}

const onSeatTap = (seat) => {
  const baseInfo = `${seat.name}\n状态：${getSeatStatusText(seat.status)}\n容量：${seat.capacity}人\n设备：${seat.device}`

  if (seat.status !== 'available') {
    uni.showModal({
      title: '座位详情',
      content: baseInfo,
      showCancel: false
    })
    return
  }

  uni.showModal({
    title: '快捷创建组局',
    content: `${baseInfo}\n\n该位置空闲，是否立即创建对应类型组局？`,
    confirmText: '立即创建',
    success: (res) => {
      if (res.confirm) {
        goToCreateWithPreset(seat)
      }
    }
  })
}
</script>

<style scoped>
.seat-page {
  min-height: 100vh;
  background: #f3f4f6;
}

.seat-scroll {
  height: 100vh;
}

.layout-card {
  margin: 20rpx;
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid #e6e7eb;
  padding: 24rpx;
}

.layout-header {
  margin-bottom: 16rpx;
}

.layout-title {
  display: block;
  font-size: 34rpx;
  color: #1f2937;
  font-weight: 700;
}

.layout-subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
}

.legend-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  margin-right: 8rpx;
}

.dot-available { background: #40c057; }
.dot-reserved { background: #4dabf7; }
.dot-occupied { background: #ff6b6b; }

.legend-text {
  font-size: 22rpx;
  color: #374151;
}

.floor-card {
  background: #f8f9fa;
  border: 2rpx solid #e5e7eb;
  border-radius: 14rpx;
  padding: 16rpx;
  margin-bottom: 18rpx;
  position: relative;
}

.floor-tag {
  position: absolute;
  right: 16rpx;
  top: 10rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.floor2-layout {
  display: flex;
  gap: 16rpx;
  margin-top: 30rpx;
}

.left-stack {
  width: 48%;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.middle-corridor {
  width: 40%;
  border-radius: 12rpx;
  border: 2rpx solid #adb5bd;
  background: #dee2e6;
  color: #374151;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30rpx;
  min-height: 380rpx;
}

.floor2-bottom-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  margin-top: 12rpx;
}

.first-row {
  display: flex;
  gap: 14rpx;
  margin-top: 30rpx;
}

.desk-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.desk-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10rpx;
}

.hall-arcade {
  width: 30%;
  min-height: 260rpx;
}

.second-row {
  margin-top: 12rpx;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 10rpx;
}

.third-row {
  margin-top: 12rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10rpx;
}

.corridor-box {
  border-radius: 12rpx;
  border: 2rpx solid #adb5bd;
  background: #dee2e6;
  color: #374151;
  font-size: 30rpx;
  min-height: 150rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arcade-room {
  min-height: 150rpx;
}

.seat-item {
  border: 2rpx solid #d1d5db;
  border-radius: 10rpx;
  padding: 12rpx 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: transform .2s ease;
  min-height: 100rpx;
}

.seat-item.small {
  min-height: 92rpx;
}

.seat-item.wide {
  min-height: 120rpx;
}

.seat-item:active {
  transform: scale(0.98);
}

.seat-name {
  font-size: 24rpx;
  color: #1f2937;
  font-weight: 600;
  text-align: center;
}

.seat-status {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #374151;
}

/* 按状态配色（不再按类型配色） */
.status-available {
  background: rgba(64, 192, 87, 0.2);
  border-color: #40c057;
}

.status-reserved {
  background: rgba(77, 171, 247, 0.2);
  border-color: #4dabf7;
}

.status-occupied {
  background: rgba(255, 107, 107, 0.2);
  border-color: #ff6b6b;
}

@media (prefers-color-scheme: dark) {
  .seat-page { background: #111317; }
  .layout-card { background: #1a1e24; border-color: #2c313a; box-shadow: none; }
  .layout-title, .seat-name { color: #f3f4f6; }
  .layout-subtitle, .legend-text, .seat-status { color: #d1d5db; }
  .floor-card { background: #252a33; border-color: #3b4048; }
  .floor-tag { color: #d1d5db; }
  .middle-corridor, .corridor-box { background: #4b5563; color: #f3f4f6; border-color: #6b7280; }
}
</style>
