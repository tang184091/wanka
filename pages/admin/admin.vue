<template>
  <view class="admin-page">
    <scroll-view class="seat-scroll" scroll-y>
      <view class="layout-card">
        <view class="layout-header">
          <text class="layout-title">管理员座位管理</text>
          <view class="refresh-btn" :class="{ disabled: refreshing }" @tap="refreshData">{{ refreshing ? '刷新中...' : '刷新' }}</view>
        </view>
        <view class="tip">点击座位可修改状态（空闲中 / 预约中 / 使用中）</view>

        <view v-if="!isAdmin" class="empty-box">
          <text class="empty-text">仅管理员可访问</text>
        </view>

        <view v-else>
          <view class="floor-card">
            <view class="floor-tag">一楼</view>
            <view class="first-floor-grid">
              <view class="seat-item floor1-arcade-room" :class="getSeatStatusClass(arcadeRoom.status)" @tap="onAdminSeatTap(arcadeRoom)">
                <text class="seat-name">{{ arcadeRoom.name }}</text>
                <text class="seat-status">{{ getSeatStatusText(arcadeRoom.status) }}</text>
              </view>
              <view class="corridor-box floor1-shop">卡店</view>

              <view class="seat-item floor1-arcade-1" :class="getSeatStatusClass(interArcade1.status)" @tap="onAdminSeatTap(interArcade1)">
                <text class="seat-name">{{ interArcade1.name }}</text>
                <text class="seat-status">{{ getSeatStatusText(interArcade1.status) }}</text>
              </view>
              <view class="seat-item floor1-arcade-2" :class="getSeatStatusClass(interArcade2.status)" @tap="onAdminSeatTap(interArcade2)">
                <text class="seat-name">{{ interArcade2.name }}</text>
                <text class="seat-status">{{ getSeatStatusText(interArcade2.status) }}</text>
              </view>
              <view class="seat-item floor1-inter-desk" :class="getSeatStatusClass(interDesk.status)" @tap="onAdminSeatTap(interDesk)">
                <text class="seat-name">{{ interDesk.name }}</text>
                <text class="seat-status">{{ getSeatStatusText(interDesk.status) }}</text>
              </view>

              <view class="corridor-box floor1-corridor">走廊</view>

              <view class="seat-item floor1-desk6" :class="getSeatStatusClass(hallDeskRows[2][1].status)" @tap="onAdminSeatTap(hallDeskRows[2][1])">
                <text class="seat-name">{{ hallDeskRows[2][1].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(hallDeskRows[2][1].status) }}</text>
              </view>
              <view class="seat-item floor1-desk5" :class="getSeatStatusClass(hallDeskRows[2][0].status)" @tap="onAdminSeatTap(hallDeskRows[2][0])">
                <text class="seat-name">{{ hallDeskRows[2][0].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(hallDeskRows[2][0].status) }}</text>
              </view>

              <view class="seat-item floor1-arcade-hall" :class="getSeatStatusClass(arcadeHall.status)" @tap="onAdminSeatTap(arcadeHall)">
                <text class="seat-name">{{ arcadeHall.name }}</text>
                <text class="seat-status">{{ getSeatStatusText(arcadeHall.status) }}</text>
              </view>
              <view class="seat-item floor1-desk1" :class="getSeatStatusClass(hallDeskRows[0][0].status)" @tap="onAdminSeatTap(hallDeskRows[0][0])">
                <text class="seat-name">{{ hallDeskRows[0][0].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(hallDeskRows[0][0].status) }}</text>
              </view>
              <view class="seat-item floor1-desk2" :class="getSeatStatusClass(hallDeskRows[0][1].status)" @tap="onAdminSeatTap(hallDeskRows[0][1])">
                <text class="seat-name">{{ hallDeskRows[0][1].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(hallDeskRows[0][1].status) }}</text>
              </view>
              <view class="seat-item floor1-desk3" :class="getSeatStatusClass(hallDeskRows[1][0].status)" @tap="onAdminSeatTap(hallDeskRows[1][0])">
                <text class="seat-name">{{ hallDeskRows[1][0].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(hallDeskRows[1][0].status) }}</text>
              </view>
              <view class="seat-item floor1-desk4" :class="getSeatStatusClass(hallDeskRows[1][1].status)" @tap="onAdminSeatTap(hallDeskRows[1][1])">
                <text class="seat-name">{{ hallDeskRows[1][1].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(hallDeskRows[1][1].status) }}</text>
              </view>
            </view>
          </view>

          <view class="floor-card">
            <view class="floor-tag">二楼</view>
            <view class="second-floor-grid">
              <view class="seat-item floor2-top-left" :class="getSeatStatusClass(floor2Bottom[1].status)" @tap="onAdminSeatTap(floor2Bottom[1])">
                <text class="seat-name">{{ floor2Bottom[1].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(floor2Bottom[1].status) }}</text>
              </view>
              <view class="seat-item floor2-top-right" :class="getSeatStatusClass(floor2Bottom[0].status)" @tap="onAdminSeatTap(floor2Bottom[0])">
                <text class="seat-name">{{ floor2Bottom[0].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(floor2Bottom[0].status) }}</text>
              </view>

              <view class="corridor-box floor2-corridor">走廊</view>

              <view class="seat-item floor2-r1" :class="getSeatStatusClass(floor2Left[3].status)" @tap="onAdminSeatTap(floor2Left[3])">
                <text class="seat-name">{{ floor2Left[3].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(floor2Left[3].status) }}</text>
              </view>
              <view class="seat-item floor2-r2" :class="getSeatStatusClass(floor2Left[2].status)" @tap="onAdminSeatTap(floor2Left[2])">
                <text class="seat-name">{{ floor2Left[2].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(floor2Left[2].status) }}</text>
              </view>
              <view class="seat-item floor2-r3" :class="getSeatStatusClass(floor2Left[1].status)" @tap="onAdminSeatTap(floor2Left[1])">
                <text class="seat-name">{{ floor2Left[1].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(floor2Left[1].status) }}</text>
              </view>
              <view class="seat-item floor2-r4" :class="getSeatStatusClass(floor2Left[0].status)" @tap="onAdminSeatTap(floor2Left[0])">
                <text class="seat-name">{{ floor2Left[0].name }}</text>
                <text class="seat-status">{{ getSeatStatusText(floor2Left[0].status) }}</text>
              </view>
            </view>
          </view>

          <view class="save-btn" :class="{ disabled: saving }" @tap="saveOverrides">{{ saving ? '保存中...' : '保存所有修改' }}</view>


          <view class="manage-card">
            <view class="manage-title">役满图片管理</view>
            <view class="manage-row">
              <view class="manage-info">
                <text class="manage-line">进入专页管理役满照片与信息</text>
              </view>
              <view class="delete-btn" style="background:#f59e0b" @tap="goYakumanManage">进入</view>
            </view>
          </view>
          <view class="manage-card">
            <view class="manage-title">管理玩家上传战绩</view>
            <view v-if="!adminRecords.length" class="manage-empty">暂无可管理战绩</view>
            <view v-for="item in adminRecords" :key="item._id" class="manage-row">
              <view class="manage-info">
                <text class="manage-line">{{ formatTime(item.createdAt) }} · {{ (item.players || []).map(p => p.nickname || p.userId || '未知').join(' / ') }}</text>
              </view>
              <view class="delete-btn" @tap="deleteRecord(item)">删除</view>
            </view>
          </view>

          <view class="manage-card">
            <view class="manage-title">管理用户创建组局</view>
            <view v-if="!adminGames.length" class="manage-empty">暂无可管理组局</view>
            <view v-for="item in adminGames" :key="item.id" class="manage-row">
              <view class="manage-info">
                <text class="manage-line">{{ item.title || '未命名组局' }}（{{ item.location || '-' }}）</text>
                <text class="manage-sub">{{ gameStatusText(item.status) }} · {{ formatTime(item.createdAt) }}</text>
              </view>
              <view class="delete-btn" @tap="deleteGame(item)">删除</view>
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

const isAdmin = ref(false)
const refreshing = ref(false)
const saving = ref(false)
const statusValues = ['available', 'reserved', 'occupied']
const adminRecords = ref([])
const adminGames = ref([])

const floor2Left = ref([
  { id: 'f2-bg-1', name: '桌游房1', status: 'available' },
  { id: 'f2-mj-1', name: '立直麻将房1', status: 'available' },
  { id: 'f2-mj-2', name: '立直麻将房2', status: 'available' },
  { id: 'f2-mj-3', name: '立直麻将房3', status: 'available' }
])
const floor2Bottom = ref([
  { id: 'f2-bg-2', name: '桌游房2', status: 'available' },
  { id: 'f2-mj-4', name: '立直麻将房4', status: 'available' }
])
const hallDeskRows = ref([
  [
    { id: 'f1-desk-1', name: '大厅桌游1', status: 'available' },
    { id: 'f1-desk-2', name: '大厅桌游2', status: 'available' }
  ],
  [
    { id: 'f1-desk-3', name: '大厅桌游3', status: 'available' },
    { id: 'f1-desk-4', name: '大厅桌游4', status: 'available' }
  ],
  [
    { id: 'f1-desk-5', name: '大厅桌游5', status: 'available' },
    { id: 'f1-desk-6', name: '大厅桌游6', status: 'available' }
  ]
])

const arcadeHall = ref({ id: 'f1-arcade-hall', name: '电玩大厅', status: 'available' })
const interDesk = ref({ id: 'f1-inter-desk', name: '间层桌游', status: 'available' })
const interArcade1 = ref({ id: 'f1-inter-arcade-1', name: '间层电玩1', status: 'available' })
const interArcade2 = ref({ id: 'f1-inter-arcade-2', name: '间层电玩2', status: 'available' })
const arcadeRoom = ref({ id: 'f1-arcade-room', name: '电玩房', status: 'available' })

const getSeatStatusClass = (status) => ({ available: 'status-available', reserved: 'status-reserved', occupied: 'status-occupied' }[status] || 'status-available')
const getSeatStatusText = (status) => ({ available: '空闲中', reserved: '预约中', occupied: '使用中' }[status] || '空闲中')
const gameStatusText = (status) => ({ pending: '招募中', cancelled: '已取消', completed: '已完成', ongoing: '进行中' }[status] || status || '-')

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const setSeatStatusByName = (name, statusMap) => statusMap[name] || 'available'

const checkAdmin = async () => {
  const res = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!(res?.result?.code === 0 && res?.result?.data?.isAdmin)
}

const loadManageData = async () => {
  const res = await wx.cloud.callFunction({ name: 'game-service', data: { action: 'getAdminManageData', data: {} } })
  if (res?.result?.code === 0) {
    adminRecords.value = res.result.data.records || []
    adminGames.value = res.result.data.games || []
  }
}

const refreshData = async () => {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await checkAdmin()
    if (!isAdmin.value) return

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

    await loadManageData()
  } catch (error) {
    console.error('刷新管理员数据失败:', error)
    uni.showToast({ title: '刷新失败', icon: 'none' })
  } finally {
    refreshing.value = false
  }
}

const cycleStatus = (status) => {
  const idx = statusValues.indexOf(status || 'available')
  return statusValues[(idx + 1) % statusValues.length]
}

const onAdminSeatTap = (seat) => {
  seat.status = cycleStatus(seat.status)
}

const collectOverrides = () => {
  const flatSeats = [
    ...floor2Left.value,
    ...floor2Bottom.value,
    ...hallDeskRows.value.flat(),
    arcadeHall.value,
    interDesk.value,
    interArcade1.value,
    interArcade2.value,
    arcadeRoom.value
  ]
  const overrides = {}
  flatSeats.forEach((item) => {
    overrides[item.name] = item.status || 'available'
  })
  return overrides
}

const saveOverrides = async () => {
  if (!isAdmin.value || saving.value) return
  saving.value = true
  try {
    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: { action: 'setSeatStatusOverrides', data: { overrides: collectOverrides() } }
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

const deleteRecord = (item) => {
  uni.showModal({
    title: '确认删除战绩',
    content: '删除后不可恢复，确认继续？',
    success: async (res) => {
      if (!res.confirm) return
      const r = await wx.cloud.callFunction({
        name: 'game-service',
        data: { action: 'adminDeleteMahjongRecord', data: { recordId: item._id } }
      })
      if (r?.result?.code === 0) {
        uni.showToast({ title: '已删除', icon: 'success' })
        await loadManageData()
      } else {
        uni.showToast({ title: r?.result?.message || '删除失败', icon: 'none' })
      }
    }
  })
}

const deleteGame = (item) => {
  uni.showModal({
    title: '确认删除组局',
    content: '将同时删除相关参与和活动记录，确认继续？',
    success: async (res) => {
      if (!res.confirm) return
      const r = await wx.cloud.callFunction({
        name: 'game-service',
        data: { action: 'adminDeleteGame', data: { gameId: item.id } }
      })
      if (r?.result?.code === 0) {
        uni.showToast({ title: '已删除', icon: 'success' })
        await loadManageData()
      } else {
        uni.showToast({ title: r?.result?.message || '删除失败', icon: 'none' })
      }
    }
  })
}

const goYakumanManage = () => {
  uni.navigateTo({ url: '/pages/admin/yakuman' })
}

onShow(() => {
  refreshData()
})
</script>

<style scoped>
.admin-page { min-height: 100vh; background: #f3f4f6; }
.seat-scroll { height: 100vh; }
.layout-card { margin: 20rpx; background: #f8f9fa; border-radius: 18rpx; border: 1rpx solid #e5e7eb; padding: 16rpx; }
.layout-header { margin-bottom: 10rpx; display: flex; justify-content: space-between; align-items: center; }
.layout-title { font-size: 26rpx; color: #6b7280; font-weight: 700; }
.tip { font-size: 22rpx; color: #6b7280; margin-bottom: 10rpx; }
.refresh-btn { min-width: 110rpx; height: 48rpx; border-radius: 24rpx; background: #07c160; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22rpx; }
.refresh-btn.disabled { background: #9ca3af; }
.empty-box { margin-top: 16rpx; padding: 24rpx; border: 1rpx dashed #d1d5db; border-radius: 12rpx; text-align: center; }
.empty-text { color: #6b7280; font-size: 24rpx; }

.floor-card { background: #eef0f2; border: 1rpx solid #d9dde2; border-radius: 14rpx; padding: 12rpx; margin-bottom: 14rpx; position: relative; }
.floor-tag { position: absolute; right: 14rpx; top: -18rpx; font-size: 24rpx; color: #6b7280; background: #f3f4f6; padding: 0 8rpx; }

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

.save-btn { margin-top: 8rpx; height: 64rpx; border-radius: 10rpx; background: #16a34a; color:#fff; display:flex; align-items:center; justify-content:center; font-size: 24rpx; }
.save-btn.disabled { opacity: .55; }

.manage-card { margin-top: 16rpx; background: #fff; border-radius: 12rpx; padding: 14rpx; border: 1rpx solid #e5e7eb; }
.manage-title { font-size: 24rpx; font-weight: 700; color: #111827; margin-bottom: 10rpx; }
.manage-empty { color: #9ca3af; font-size: 22rpx; }
.manage-row { display: flex; align-items: center; justify-content: space-between; gap: 10rpx; padding: 10rpx 0; border-bottom: 1rpx solid #eef2f7; }
.manage-row:last-child { border-bottom: 0; }
.manage-info { flex: 1; }
.manage-line { display: block; font-size: 22rpx; color: #111827; }
.manage-sub { display: block; margin-top: 4rpx; font-size: 20rpx; color: #6b7280; }
.delete-btn { width: 90rpx; height: 48rpx; border-radius: 8rpx; background: #ef4444; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22rpx; }
</style>
