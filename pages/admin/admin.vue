<template>
  <view class="admin-page">
    <scroll-view class="seat-scroll" scroll-y>
      <view class="layout-card">
        <view class="layout-header">
          <text class="layout-title">管理员座位管理</text>
          <view class="header-actions">
            <picker mode="date" :value="selectedDate" @change="onDateChange">
              <view class="date-picker">{{ selectedDateLabel }}</view>
            </picker>
            <view class="refresh-btn" :class="{ disabled: refreshing }" @tap="refreshData">
              {{ refreshing ? '刷新中...' : '刷新' }}
            </view>
          </view>
        </view>

        <view class="tip">点击座位可循环切换状态：空闲中 / 预约中 / 使用中。保存后以管理员修改为准。</view>

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

          <view class="save-btn" :class="{ disabled: saving }" @tap="saveOverrides">
            {{ saving ? '保存中...' : '保存所有修改' }}
          </view>
          <view class="reset-btn" :class="{ disabled: saving }" @tap="resetManualOverrides">
            清空当日手工状态
          </view>

          <view class="manage-card">
            <view class="manage-title">公告管理</view>
            <view class="manage-row">
              <view class="manage-info">
                <text class="manage-line">编制座位详情页面底部公告（最多1000字）</text>
              </view>
              <view class="action-btn" @tap="goAnnouncementManage">进入</view>
            </view>
          </view>

          <view class="manage-card">
            <view class="manage-title">荣誉榜管理</view>
            <view class="manage-row">
              <view class="manage-info">
                <text class="manage-line">进入专页上传/管理荣誉榜</text>
              </view>
              <view class="action-btn" @tap="goHonorManage">进入</view>
            </view>
          </view>

          <view class="manage-card">
            <view class="manage-title">百科词条管理</view>
            <view class="manage-row">
              <view class="manage-info">
                <text class="manage-line">审核/修改/删除百科词条</text>
              </view>
              <view class="action-btn" @tap="goWikiManage">进入</view>
            </view>
          </view>

          <view class="manage-card">
            <view class="manage-title">用户管理</view>
            <view class="manage-row">
              <view class="manage-info">
                <text class="manage-line">管理用户头像、昵称、标签、黑名单与管理员权限</text>
              </view>
              <view class="action-btn" @tap="goUserManage">进入</view>
            </view>
          </view>

          <view class="manage-card">
            <view class="manage-title">管理员功能说明</view>
            <view class="manage-row">
              <view class="manage-info">
                <text class="manage-line">查看管理员各功能使用说明与规则</text>
              </view>
              <view class="action-btn" @tap="goAdminGuide">进入</view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const isAdmin = ref(false)
const refreshing = ref(false)
const saving = ref(false)
const statusValues = ['available', 'reserved', 'occupied']

const now = new Date()
const selectedDate = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`)
const selectedDateLabel = computed(() => `日期：${selectedDate.value}`)

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

const getSeatStatusClass = (status) => ({
  available: 'status-available',
  reserved: 'status-reserved',
  occupied: 'status-occupied'
}[status] || 'status-available')

const getSeatStatusText = (status) => ({
  available: '空闲中',
  reserved: '预约中',
  occupied: '使用中'
}[status] || '空闲中')

const normalizeLocationName = (name = '') => String(name).replace(/\s+/g, '').trim()
const setSeatStatusByName = (name, statusMap) => statusMap[normalizeLocationName(name)] || statusMap[name] || 'available'

const redirectNonAdmin = () => {
  uni.showToast({ title: '仅管理员可访问', icon: 'none' })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/user/user' })
  }, 300)
}

const checkAdmin = async () => {
  const res = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!(res?.result?.code === 0 && res?.result?.data?.isAdmin)
  if (!isAdmin.value) redirectNonAdmin()
}

const refreshData = async () => {
  if (refreshing.value) return
  refreshing.value = true
  try {
    await checkAdmin()
    if (!isAdmin.value) return

    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: { action: 'getSeatStatus', data: { date: selectedDate.value } }
    })
    const rawStatusMap = res?.result?.data?.statusByLocation || {}
    const statusMap = {}
    Object.keys(rawStatusMap).forEach((key) => {
      statusMap[normalizeLocationName(key)] = rawStatusMap[key]
    })

    floor2Left.value = floor2Left.value.map(item => ({ ...item, status: setSeatStatusByName(item.name, statusMap) }))
    floor2Bottom.value = floor2Bottom.value.map(item => ({ ...item, status: setSeatStatusByName(item.name, statusMap) }))
    hallDeskRows.value = hallDeskRows.value.map(row => row.map(item => ({ ...item, status: setSeatStatusByName(item.name, statusMap) })))
    arcadeHall.value = { ...arcadeHall.value, status: setSeatStatusByName(arcadeHall.value.name, statusMap) }
    interDesk.value = { ...interDesk.value, status: setSeatStatusByName(interDesk.value.name, statusMap) }
    interArcade1.value = { ...interArcade1.value, status: setSeatStatusByName(interArcade1.value.name, statusMap) }
    interArcade2.value = { ...interArcade2.value, status: setSeatStatusByName(interArcade2.value.name, statusMap) }
    arcadeRoom.value = { ...arcadeRoom.value, status: setSeatStatusByName(arcadeRoom.value.name, statusMap) }
  } catch (error) {
    console.error('刷新管理员座位数据失败:', error)
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
  flatSeats.forEach((seat) => {
    overrides[seat.name] = seat.status || 'available'
  })
  return overrides
}

const saveOverrides = async () => {
  if (!isAdmin.value || saving.value) return
  saving.value = true
  try {
    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: {
        action: 'setSeatStatusOverrides',
        data: { date: selectedDate.value, overrides: collectOverrides() }
      }
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

const resetManualOverrides = () => {
  if (!isAdmin.value || saving.value) return
  uni.showModal({
    title: '确认清空',
    content: `将清空 ${selectedDate.value} 的手工座位状态，仅保留组局自动状态。`,
    success: async (res) => {
      if (!res.confirm) return
      saving.value = true
      try {
        const result = await wx.cloud.callFunction({
          name: 'game-service',
          data: {
            action: 'setSeatStatusOverrides',
            data: { date: selectedDate.value, overrides: {} }
          }
        })
        if (result?.result?.code === 0) {
          uni.showToast({ title: '已清空', icon: 'success' })
          await refreshData()
        } else {
          uni.showToast({ title: result?.result?.message || '清空失败', icon: 'none' })
        }
      } catch (error) {
        console.error('清空手工状态失败:', error)
        uni.showToast({ title: '清空失败', icon: 'none' })
      } finally {
        saving.value = false
      }
    }
  })
}

const onDateChange = async (e) => {
  selectedDate.value = e.detail.value
  await refreshData()
}

const guardAdmin = () => {
  if (!isAdmin.value) {
    redirectNonAdmin()
    return false
  }
  return true
}

const goAnnouncementManage = () => { if (guardAdmin()) uni.navigateTo({ url: '/pages/admin/announcement' }) }
const goHonorManage = () => { if (guardAdmin()) uni.navigateTo({ url: '/pages/admin/honor' }) }
const goWikiManage = () => { if (guardAdmin()) uni.navigateTo({ url: '/pages/admin/wiki' }) }
const goUserManage = () => { if (guardAdmin()) uni.navigateTo({ url: '/pages/admin/user-manage' }) }
const goAdminGuide = () => { if (guardAdmin()) uni.navigateTo({ url: '/pages/admin/guide' }) }


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
.header-actions { display: flex; align-items: center; gap: 12rpx; }
.date-picker { min-width: 210rpx; height: 48rpx; border-radius: 24rpx; background: #fff; border: 1rpx solid #d1d5db; color: #374151; display: flex; align-items: center; justify-content: center; font-size: 22rpx; padding: 0 16rpx; box-sizing: border-box; }
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
.status-occupied { background: #fed7aa; border-color: #fb923c; }

.save-btn { margin-top: 8rpx; height: 64rpx; border-radius: 10rpx; background: #16a34a; color:#fff; display:flex; align-items:center; justify-content:center; font-size: 24rpx; }
.save-btn.disabled { opacity: .55; }
.reset-btn { margin-top: 8rpx; height: 64rpx; border-radius: 10rpx; background: #dc2626; color:#fff; display:flex; align-items:center; justify-content:center; font-size: 24rpx; }
.reset-btn.disabled { opacity: .55; }

.manage-card { margin-top: 16rpx; background: #fff; border-radius: 12rpx; padding: 14rpx; border: 1rpx solid #e5e7eb; }
.manage-title { font-size: 24rpx; font-weight: 700; color: #111827; margin-bottom: 10rpx; }
.manage-row { display: flex; align-items: center; justify-content: space-between; gap: 10rpx; padding: 10rpx 0; }
.manage-info { flex: 1; }
.manage-line { display: block; font-size: 22rpx; color: #111827; }
.action-btn { width: 90rpx; height: 48rpx; border-radius: 8rpx; background: #f59e0b; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22rpx; }
</style>
