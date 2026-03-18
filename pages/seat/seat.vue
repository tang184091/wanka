<template>
  <view class="seat-page">
    <scroll-view class="seat-scroll" scroll-y>
      <view class="layout-card">
        <view class="layout-header">
          <text class="layout-title">座位详情</text>
          <view class="refresh-btn" :class="{ disabled: refreshing }" @tap="handleRefresh">{{ refreshing ? '刷新中...' : '刷新' }}</view>
        </view>

        <view class="floor-card">
          <view class="floor-tag">一楼</view>
          <view class="first-floor-grid">
            <view class="seat-item floor1-arcade-room" :class="getSeatStatusClass(arcadeRoom.status)" @tap="onSeatTap(arcadeRoom)">
              <text class="seat-name">{{ arcadeRoom.name }}</text>
              <text class="seat-status">{{ getSeatStatusText(arcadeRoom.status) }}</text>
            </view>
            <view class="corridor-box floor1-shop">卡店</view>

            <view class="seat-item floor1-arcade-1" :class="getSeatStatusClass(interArcade1.status)" @tap="onSeatTap(interArcade1)">
              <text class="seat-name">{{ interArcade1.name }}</text>
              <text class="seat-status">{{ getSeatStatusText(interArcade1.status) }}</text>
            </view>
            <view class="seat-item floor1-arcade-2" :class="getSeatStatusClass(interArcade2.status)" @tap="onSeatTap(interArcade2)">
              <text class="seat-name">{{ interArcade2.name }}</text>
              <text class="seat-status">{{ getSeatStatusText(interArcade2.status) }}</text>
            </view>
            <view class="seat-item floor1-inter-desk" :class="getSeatStatusClass(interDesk.status)" @tap="onSeatTap(interDesk)">
              <text class="seat-name">{{ interDesk.name }}</text>
              <text class="seat-status">{{ getSeatStatusText(interDesk.status) }}</text>
            </view>

            <view class="corridor-box floor1-corridor">走廊</view>

            <view class="seat-item floor1-desk6" :class="getSeatStatusClass(hallDeskRows[2][1].status)" @tap="onSeatTap(hallDeskRows[2][1])">
              <text class="seat-name">{{ hallDeskRows[2][1].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(hallDeskRows[2][1].status) }}</text>
            </view>
            <view class="seat-item floor1-desk5" :class="getSeatStatusClass(hallDeskRows[2][0].status)" @tap="onSeatTap(hallDeskRows[2][0])">
              <text class="seat-name">{{ hallDeskRows[2][0].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(hallDeskRows[2][0].status) }}</text>
            </view>

            <view class="seat-item floor1-arcade-hall" :class="getSeatStatusClass(arcadeHall.status)" @tap="onSeatTap(arcadeHall)">
              <text class="seat-name">{{ arcadeHall.name }}</text>
              <text class="seat-status">{{ getSeatStatusText(arcadeHall.status) }}</text>
            </view>
            <view class="seat-item floor1-desk1" :class="getSeatStatusClass(hallDeskRows[0][0].status)" @tap="onSeatTap(hallDeskRows[0][0])">
              <text class="seat-name">{{ hallDeskRows[0][0].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(hallDeskRows[0][0].status) }}</text>
            </view>
            <view class="seat-item floor1-desk2" :class="getSeatStatusClass(hallDeskRows[0][1].status)" @tap="onSeatTap(hallDeskRows[0][1])">
              <text class="seat-name">{{ hallDeskRows[0][1].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(hallDeskRows[0][1].status) }}</text>
            </view>
            <view class="seat-item floor1-desk3" :class="getSeatStatusClass(hallDeskRows[1][0].status)" @tap="onSeatTap(hallDeskRows[1][0])">
              <text class="seat-name">{{ hallDeskRows[1][0].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(hallDeskRows[1][0].status) }}</text>
            </view>
            <view class="seat-item floor1-desk4" :class="getSeatStatusClass(hallDeskRows[1][1].status)" @tap="onSeatTap(hallDeskRows[1][1])">
              <text class="seat-name">{{ hallDeskRows[1][1].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(hallDeskRows[1][1].status) }}</text>
            </view>
          </view>
        </view>

        <view class="floor-card">
          <view class="floor-tag">二楼</view>
          <view class="second-floor-grid">
            <view class="seat-item floor2-top-left" :class="getSeatStatusClass(floor2Bottom[1].status)" @tap="onSeatTap(floor2Bottom[1])">
              <text class="seat-name">{{ floor2Bottom[1].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(floor2Bottom[1].status) }}</text>
            </view>
            <view class="seat-item floor2-top-right" :class="getSeatStatusClass(floor2Bottom[0].status)" @tap="onSeatTap(floor2Bottom[0])">
              <text class="seat-name">{{ floor2Bottom[0].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(floor2Bottom[0].status) }}</text>
            </view>

            <view class="corridor-box floor2-corridor">走廊</view>

            <view class="seat-item floor2-r1" :class="getSeatStatusClass(floor2Left[3].status)" @tap="onSeatTap(floor2Left[3])">
              <text class="seat-name">{{ floor2Left[3].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(floor2Left[3].status) }}</text>
            </view>
            <view class="seat-item floor2-r2" :class="getSeatStatusClass(floor2Left[2].status)" @tap="onSeatTap(floor2Left[2])">
              <text class="seat-name">{{ floor2Left[2].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(floor2Left[2].status) }}</text>
            </view>
            <view class="seat-item floor2-r3" :class="getSeatStatusClass(floor2Left[1].status)" @tap="onSeatTap(floor2Left[1])">
              <text class="seat-name">{{ floor2Left[1].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(floor2Left[1].status) }}</text>
            </view>
            <view class="seat-item floor2-r4" :class="getSeatStatusClass(floor2Left[0].status)" @tap="onSeatTap(floor2Left[0])">
              <text class="seat-name">{{ floor2Left[0].name }}</text>
              <text class="seat-status">{{ getSeatStatusText(floor2Left[0].status) }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import UserService from '@/utils/user.js'

const refreshing = ref(false)

const floor2Left = ref([
  { id: 'f2-bg-1', name: '桌游房1', type: 'boardgame', status: 'available', capacity: 8, device: '桌游桌' },
  { id: 'f2-mj-1', name: '立直麻将房1', type: 'mahjong', status: 'available', capacity: 4, device: '四口机' },
  { id: 'f2-mj-2', name: '立直麻将房2', type: 'mahjong', status: 'available', capacity: 4, device: '四口机+八口机' },
  { id: 'f2-mj-3', name: '立直麻将房3', type: 'mahjong', status: 'available', capacity: 4, device: '八口机' }
])

const floor2Bottom = ref([
  { id: 'f2-bg-2', name: '桌游房2', type: 'boardgame', status: 'available', capacity: 8, device: '桌游桌 + 展示柜' },
  { id: 'f2-mj-4', name: '立直麻将房4', type: 'mahjong', status: 'available', capacity: 4, device: '八口机' }
])

const hallDeskRows = ref([
  [
    { id: 'f1-desk-1', name: '大厅桌游1', type: 'boardgame', status: 'available', capacity: 6, device: '桌游桌' },
    { id: 'f1-desk-2', name: '大厅桌游2', type: 'boardgame', status: 'available', capacity: 6, device: '桌游桌' }
  ],
  [
    { id: 'f1-desk-3', name: '大厅桌游3', type: 'boardgame', status: 'available', capacity: 6, device: '桌游桌' },
    { id: 'f1-desk-4', name: '大厅桌游4', type: 'boardgame', status: 'available', capacity: 6, device: '桌游桌' }
  ],
  [
    { id: 'f1-desk-5', name: '大厅桌游5', type: 'boardgame', status: 'available', capacity: 6, device: '桌游桌' },
    { id: 'f1-desk-6', name: '大厅桌游6', type: 'boardgame', status: 'available', capacity: 6, device: '桌游桌' }
  ]
])

const arcadeHall = ref({ id: 'f1-arcade-hall', name: '电玩大厅', type: 'videogame', status: 'available', capacity: 8, device: '多台主机 + 大屏显示器' })
const interDesk = ref({ id: 'f1-inter-desk', name: '间层桌游', type: 'boardgame', status: 'available', capacity: 8, device: '桌游桌' })
const interArcade1 = ref({ id: 'f1-inter-arcade-1', name: '间层电玩1', type: 'videogame', status: 'available', capacity: 2, device: '主机 + 电视' })
const interArcade2 = ref({ id: 'f1-inter-arcade-2', name: '间层电玩2', type: 'videogame', status: 'available', capacity: 2, device: '主机 + 电视' })
const arcadeRoom = ref({ id: 'f1-arcade-room', name: '电玩房', type: 'videogame', status: 'available', capacity: 4, device: '主机 + 电视' })

const getSeatStatusClass = (status) => ({ available: 'status-available', reserved: 'status-reserved', occupied: 'status-occupied' }[status] || 'status-available')
const getSeatStatusText = (status) => ({ available: '空闲中', reserved: '预约中', occupied: '使用中' }[status] || '空闲中')

const setSeatStatusByName = (name, statusMap) => statusMap[name] || 'available'

const refreshSeatStatus = async () => {
  try {
    const res = await wx.cloud.callFunction({ name: 'game-service', data: { action: 'getSeatStatus', data: {} } })
    const statusMap = res?.result?.data?.statusByLocation || {}

    floor2Left.value = floor2Left.value.map(item => ({ ...item, status: setSeatStatusByName(item.name, statusMap) }))
    floor2Bottom.value = floor2Bottom.value.map(item => ({ ...item, status: setSeatStatusByName(item.name, statusMap) }))
    hallDeskRows.value = hallDeskRows.value.map(row => row.map(item => ({ ...item, status: setSeatStatusByName(item.name, statusMap) })))

    arcadeHall.value = { ...arcadeHall.value, status: setSeatStatusByName(arcadeHall.value.name, statusMap) }
    interDesk.value = { ...interDesk.value, status: setSeatStatusByName(interDesk.value.name, statusMap) }
    interArcade1.value = { ...interArcade1.value, status: setSeatStatusByName(interArcade1.value.name, statusMap) }
    interArcade2.value = { ...interArcade2.value, status: setSeatStatusByName(interArcade2.value.name, statusMap) }
    arcadeRoom.value = { ...arcadeRoom.value, status: setSeatStatusByName(arcadeRoom.value.name, statusMap) }
  } catch (error) {
    console.error('获取座位状态失败:', error)
  }
}

const handleRefresh = async () => {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await refreshSeatStatus()
    uni.showToast({ title: '已刷新', icon: 'success', duration: 1200 })
  } finally {
    refreshing.value = false
  }
}

onShow(() => {
  handleRefresh()
})

const goToCreateWithPreset = (seat) => {
  const currentUser = UserService.getCurrentUser()
  if (!currentUser) {
    uni.showModal({
      title: '需要登录',
      content: '请先登录后再创建组局',
      confirmText: '去登录',
      success: (res) => { if (res.confirm) uni.switchTab({ url: '/pages/user/user' }) }
    })
    return
  }

  const typeProjectMap = {
    mahjong: '立直麻将局',
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
    uni.showModal({ title: '座位详情', content: baseInfo, showCancel: false })
    return
  }

  uni.showModal({
    title: '快捷创建组局',
    content: `${baseInfo}\n\n该位置空闲，是否立即创建对应类型组局？`,
    confirmText: '立即创建',
    success: (res) => { if (res.confirm) goToCreateWithPreset(seat) }
  })
}
</script>

<style scoped>
.seat-page { min-height: 100vh; background: #f3f4f6; }
.seat-scroll { height: 100vh; }
.layout-card { margin: 20rpx; background: #f8f9fa; border-radius: 18rpx; border: 1rpx solid #e5e7eb; padding: 16rpx; }
.layout-header { margin-bottom: 18rpx; display: flex; justify-content: space-between; align-items: center; }
.layout-title { font-size: 26rpx; color: #6b7280; font-weight: 700; }
.refresh-btn { min-width: 110rpx; height: 48rpx; border-radius: 24rpx; background: #07c160; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22rpx; }
.refresh-btn.disabled { background: #9ca3af; }

.floor-card { background: #eef0f2; border: 1rpx solid #d9dde2; border-radius: 14rpx; padding: 28rpx 12rpx 12rpx; margin: 12rpx 0 14rpx; position: relative; }
.floor-tag { position: absolute; right: 14rpx; top: 8rpx; font-size: 24rpx; color: #6b7280; background: #f3f4f6; padding: 0 8rpx; border-radius: 8rpx; }

.first-floor-grid { margin-top: 8rpx; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: repeat(5, 88rpx); gap: 8rpx; }
.floor1-arcade-room { grid-column: 1 / span 8; grid-row: 1; }
.floor1-shop { grid-column: 9 / span 4; grid-row: 1; }
.floor1-arcade-1 { grid-column: 1 / span 4; grid-row: 2; }
.floor1-arcade-2 { grid-column: 5 / span 4; grid-row: 2; }
.floor1-inter-desk { grid-column: 9 / span 4; grid-row: 2; }
.floor1-corridor { grid-column: 9 / span 4; grid-row: 3; }
.floor1-desk6 { grid-column: 1 / span 4; grid-row: 3; }
.floor1-desk5 { grid-column: 5 / span 4; grid-row: 3; }
.floor1-arcade-hall { grid-column: 1 / span 4; grid-row: 4 / span 2; }
.floor1-desk1 { grid-column: 5 / span 4; grid-row: 4; }
.floor1-desk2 { grid-column: 9 / span 4; grid-row: 4; }
.floor1-desk3 { grid-column: 5 / span 4; grid-row: 5; }
.floor1-desk4 { grid-column: 9 / span 4; grid-row: 5; }

.second-floor-grid { margin-top: 8rpx; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(5, 88rpx); gap: 8rpx; }
.floor2-top-left { grid-column: 1; grid-row: 1; }
.floor2-top-right { grid-column: 2; grid-row: 1; }
.floor2-corridor { grid-column: 1; grid-row: 2 / span 4; }
.floor2-r1 { grid-column: 2; grid-row: 2; }
.floor2-r2 { grid-column: 2; grid-row: 3; }
.floor2-r3 { grid-column: 2; grid-row: 4; }
.floor2-r4 { grid-column: 2; grid-row: 5; }

.corridor-box { border-radius: 10rpx; border: 2rpx solid #b9c0c8; background: #c7cbd1; color: #111827; font-size: 34rpx; display: flex; align-items: center; justify-content: center; }
.seat-item { border: 2rpx solid #7ddf9f; border-radius: 10rpx; background: #c0dcc7; padding: 6rpx 4rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; }
.seat-name { font-size: 27rpx; color: #1f2937; font-weight: 700; text-align: center; }
.seat-status { margin-top: 4rpx; font-size: 22rpx; color: #374151; }
.status-available { background: #c0dcc7; border-color: #7ddf9f; }
.status-reserved { background: #c4d9ea; border-color: #83bde3; }
.status-occupied { background: #e5c1c1; border-color: #e39b9b; }
</style>
