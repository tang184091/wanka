<template>
  <view class="seat-page">
    <scroll-view class="seat-scroll" scroll-y>
      <view class="layout-card">
        <view class="layout-header">
          <text class="layout-title">作为详情</text>
          <text class="layout-subtitle">店内座位示意图（点击房间可查看状态）</text>
        </view>

        <view class="legend-row">
          <view v-for="item in seatLegend" :key="item.status" class="legend-item">
            <view class="legend-dot" :class="`dot-${item.status}`"></view>
            <text class="legend-text">{{ item.label }}</text>
          </view>
        </view>

        <view class="zone corridor">走廊 / 通道</view>

        <view class="zone top-grid">
          <view
            v-for="room in upperRooms"
            :key="room.id"
            class="room-cell"
            :class="[getSeatTypeClass(room.type), getSeatStatusClass(room.status)]"
            @tap="onSeatTap(room)"
          >
            <text class="room-name">{{ room.name }}</text>
            <text class="room-status">{{ getSeatStatusText(room.status) }}</text>
          </view>
        </view>

        <view class="zone hall-title">大厅区域</view>
        <view class="zone hall-grid">
          <view
            v-for="seat in hallSeats"
            :key="seat.id"
            class="seat-cell"
            :class="[getSeatTypeClass(seat.type), getSeatStatusClass(seat.status)]"
            @tap="onSeatTap(seat)"
          >
            <text class="seat-name">{{ seat.name }}</text>
          </view>
        </view>

        <view class="zone lower-grid">
          <view
            v-for="seat in lowerArea"
            :key="seat.id"
            class="room-cell"
            :class="[getSeatTypeClass(seat.type), getSeatStatusClass(seat.status)]"
            @tap="onSeatTap(seat)"
          >
            <text class="room-name">{{ seat.name }}</text>
            <text class="room-status">{{ getSeatStatusText(seat.status) }}</text>
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
  { status: 'available', label: '空闲' },
  { status: 'occupied', label: '使用中' },
  { status: 'reserved', label: '预约中' }
])

const upperRooms = ref([
  { id: 'bg1', name: '桌游房1', type: 'boardgame', status: 'available', location: '玩咖二楼A房', capacity: 10, device: '桌游桌 + 置物架' },
  { id: 'mj1', name: '日麻房1', type: 'mahjong', status: 'occupied', location: '玩咖二楼B房', capacity: 4, device: '自动麻将机' },
  { id: 'mj2', name: '日麻房2', type: 'mahjong', status: 'available', location: '玩咖二楼C房', capacity: 4, device: '自动麻将机' },
  { id: 'mj3', name: '日麻房3', type: 'mahjong', status: 'reserved', location: '玩咖二楼D房', capacity: 4, device: '自动麻将机' },
  { id: 'mj4', name: '日麻房4', type: 'mahjong', status: 'available', location: '玩咖二楼E房', capacity: 4, device: '自动麻将机' },
  { id: 'bg2', name: '桌游房2', type: 'boardgame', status: 'available', location: '玩咖二楼F房', capacity: 8, device: '桌游桌 + 展示柜' }
])

const hallSeats = ref([
  { id: 'hbg1', name: '大厅桌游1', type: 'boardgame', status: 'available', location: '玩咖一楼大厅', capacity: 6, device: '桌游桌' },
  { id: 'hbg2', name: '大厅桌游2', type: 'boardgame', status: 'available', location: '玩咖一楼大厅', capacity: 6, device: '桌游桌' },
  { id: 'hbg3', name: '大厅桌游3', type: 'boardgame', status: 'occupied', location: '玩咖一楼大厅', capacity: 6, device: '桌游桌' },
  { id: 'hbg4', name: '大厅桌游4', type: 'boardgame', status: 'available', location: '玩咖一楼大厅', capacity: 6, device: '桌游桌' },
  { id: 'hbg5', name: '大厅桌游5', type: 'boardgame', status: 'reserved', location: '玩咖一楼大厅', capacity: 6, device: '桌游桌' },
  { id: 'hbg6', name: '大厅桌游6', type: 'boardgame', status: 'available', location: '玩咖一楼大厅', capacity: 6, device: '桌游桌' },
  { id: 'ivg1', name: '间层电玩1', type: 'videogame', status: 'available', location: '玩咖电玩区', capacity: 2, device: 'PS5 + 电视' },
  { id: 'ivg2', name: '间层电玩2', type: 'videogame', status: 'reserved', location: '玩咖电玩区', capacity: 2, device: 'Switch + 显示器' }
])

const lowerArea = ref([
  { id: 'vg-room', name: '电玩房', type: 'videogame', status: 'available', location: '玩咖电玩区', capacity: 4, device: 'PS5 + Xbox + 4K电视' },
  { id: 'inter-bg', name: '间层桌游', type: 'boardgame', status: 'available', location: '玩咖一楼大厅', capacity: 6, device: '桌游桌' }
])

const getSeatTypeClass = (type) => {
  const map = {
    videogame: 'type-videogame',
    boardgame: 'type-boardgame',
    mahjong: 'type-mahjong'
  }
  return map[type] || 'type-boardgame'
}

const getSeatStatusClass = (status) => {
  const map = {
    available: 'status-available',
    occupied: 'status-occupied',
    reserved: 'status-reserved'
  }
  return map[status] || 'status-available'
}

const getSeatStatusText = (status) => {
  const map = {
    available: '空闲',
    occupied: '使用中',
    reserved: '预约中'
  }
  return map[status] || '空闲'
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
          uni.switchTab({
            url: '/pages/user/user'
          })
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

  const query = [
    `type=${encodeURIComponent(seat.type)}`,
    `location=${encodeURIComponent(seat.location)}`,
    `project=${encodeURIComponent(typeProjectMap[seat.type] || '娱乐局')}`
  ]

  uni.navigateTo({
    url: `/pages/create/create?${query.join('&')}`
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
    content: `${baseInfo}\n\n该区域空闲，可快速创建对应类型组局。`,
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
  background: #f5f6f7;
}

.seat-scroll {
  height: 100vh;
}

.layout-card {
  margin: 20rpx;
  background: #ffffff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid #eef1f3;
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
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.legend-row {
  display: flex;
  gap: 20rpx;
  margin-bottom: 18rpx;
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
.dot-occupied { background: #ff6b6b; }
.dot-reserved { background: #f59f00; }

.legend-text {
  font-size: 22rpx;
  color: #4b5563;
}

.zone {
  border-radius: 12rpx;
  border: 2rpx solid #e5e7eb;
  margin-bottom: 12rpx;
}

.corridor {
  text-align: center;
  font-size: 26rpx;
  color: #374151;
  background: #dee2e6;
  padding: 14rpx 0;
}

.top-grid,
.lower-grid {
  display: grid;
  gap: 10rpx;
  padding: 10rpx;
}

.top-grid {
  grid-template-columns: repeat(3, 1fr);
}

.lower-grid {
  grid-template-columns: repeat(2, 1fr);
}

.hall-title {
  text-align: center;
  font-size: 26rpx;
  color: #374151;
  background: #f8f9fa;
  padding: 14rpx 0;
}

.hall-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10rpx;
  padding: 10rpx;
}

.room-cell,
.seat-cell {
  border-radius: 10rpx;
  border: 2rpx solid transparent;
  padding: 12rpx 8rpx;
  box-sizing: border-box;
  transition: transform 0.2s ease;
}

.room-cell:active,
.seat-cell:active {
  transform: scale(0.98);
}

.room-name,
.seat-name {
  display: block;
  text-align: center;
  color: #1f2937;
  font-size: 22rpx;
  font-weight: 600;
}

.room-status {
  display: block;
  text-align: center;
  margin-top: 6rpx;
  color: #4b5563;
  font-size: 20rpx;
}

/* 类型色：按你的要求 */
.type-videogame { background: rgba(255, 107, 107, 0.14); border-color: rgba(255, 107, 107, 0.4); }
.type-boardgame { background: rgba(77, 171, 247, 0.14); border-color: rgba(77, 171, 247, 0.4); }
.type-mahjong { background: rgba(64, 192, 87, 0.14); border-color: rgba(64, 192, 87, 0.4); }

.status-available { box-shadow: inset 0 0 0 2rpx rgba(64, 192, 87, 0.3); }
.status-occupied { box-shadow: inset 0 0 0 2rpx rgba(255, 107, 107, 0.3); }
.status-reserved { box-shadow: inset 0 0 0 2rpx rgba(245, 159, 0, 0.3); }

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .seat-page { background: #101114; }
  .layout-card {
    background: #1a1c20;
    border-color: #2a2d34;
    box-shadow: none;
  }
  .layout-title { color: #f3f4f6; }
  .layout-subtitle,
  .legend-text,
  .room-status { color: #d1d5db; }
  .room-name,
  .seat-name { color: #f3f4f6; }
  .zone { border-color: #2d3139; }
  .hall-title { background: #252932; color: #e5e7eb; }
  .corridor { background: #3b4048; color: #e5e7eb; }
}
</style>