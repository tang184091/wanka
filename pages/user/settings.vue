<template>
  <view class="settings-container">
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <text class="nav-text-btn">返回</text>
      </view>
      <view class="nav-title">设置</view>
      <view class="nav-right"></view>
    </view>

    <scroll-view class="settings-scroll" scroll-y>
      <view class="section">
        <view class="section-title">通知设置</view>
        <view class="menu-list">
          <view class="menu-item">
            <view class="menu-left">
              <text class="menu-text">组局提醒</text>
            </view>
            <switch
              :checked="notificationSettings.gameReminder"
              @change="onGameReminderChange"
              color="#07c160"
            />
          </view>

          <view class="menu-item">
            <view class="menu-left">
              <text class="menu-text">消息通知</text>
            </view>
            <switch
              :checked="notificationSettings.message"
              @change="onMessageChange"
              color="#07c160"
            />
          </view>

          <view class="menu-item">
            <view class="menu-left">
              <text class="menu-text">振动提醒</text>
            </view>
            <switch
              :checked="notificationSettings.vibration"
              @change="onVibrationChange"
              color="#07c160"
            />
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-title">通用设置</view>
        <view class="menu-list">
          <view class="menu-item" @tap="clearCache">
            <view class="menu-left">
              <text class="menu-text">清理缓存</text>
            </view>
            <view class="menu-right">
              <text class="menu-sub">{{ cacheSizeText }}</text>
              <text class="menu-arrow">›</text>
            </view>
          </view>

          <view class="menu-item" @tap="checkForUpdate">
            <view class="menu-left">
              <text class="menu-text">检查更新</text>
            </view>
            <text class="menu-arrow">›</text>
          </view>

          <view class="menu-item" @tap="about">
            <view class="menu-left">
              <text class="menu-text">关于我们</text>
            </view>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="logout-section">
        <view class="logout-btn" @tap="handleLogout">
          退出登录
        </view>
      </view>

      <view class="safe-area"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userActions } from '@/utils/store.js'

const notificationSettings = ref({
  gameReminder: true,
  message: true,
  vibration: false
})
const cacheSizeText = ref('0KB')

const goBack = () => {
  uni.navigateBack()
}

const onGameReminderChange = (e) => {
  notificationSettings.value.gameReminder = e.detail.value
  saveNotificationSettings()
}

const onMessageChange = (e) => {
  notificationSettings.value.message = e.detail.value
  saveNotificationSettings()
}

const onVibrationChange = (e) => {
  notificationSettings.value.vibration = e.detail.value
  saveNotificationSettings()
}

const saveNotificationSettings = () => {
  uni.setStorageSync('notification_settings', notificationSettings.value)
  uni.showToast({
    title: '设置已保存',
    icon: 'success'
  })
}

const about = () => {
  uni.showModal({
    title: '关于玩咖约局',
    content: '版本：v1.0.0\n\n一个专注于日麻、桌游、电玩组局的小程序\n\n联系我们：support@wankayueju.com',
    showCancel: false
  })
}

const updateCacheSize = () => {
  try {
    const info = uni.getStorageInfoSync()
    const kb = Math.round((info.currentSize || 0) * 100) / 100
    cacheSizeText.value = `${kb}KB`
  } catch (error) {
    cacheSizeText.value = '--'
  }
}

const clearCache = () => {
  uni.showModal({
    title: '确认清理',
    content: '将清理本地缓存（包含设置与本地临时数据），是否继续？',
    success: (res) => {
      if (!res.confirm) return
      try {
        uni.clearStorageSync()
        notificationSettings.value = {
          gameReminder: true,
          message: true,
          vibration: false
        }
        saveNotificationSettings()
        updateCacheSize()
        uni.showToast({ title: '缓存已清理', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: '清理失败', icon: 'none' })
      }
    }
  })
}

const checkForUpdate = () => {
  // #ifdef MP-WEIXIN
  const updateManager = wx.getUpdateManager()
  updateManager.onCheckForUpdate((res) => {
    if (!res.hasUpdate) {
      uni.showToast({ title: '已是最新版本', icon: 'none' })
    }
  })
  updateManager.onUpdateReady(() => {
    uni.showModal({
      title: '更新提示',
      content: '新版本已准备好，是否立即重启更新？',
      success: (res) => {
        if (res.confirm) updateManager.applyUpdate()
      }
    })
  })
  updateManager.onUpdateFailed(() => {
    uni.showToast({ title: '新版本下载失败', icon: 'none' })
  })
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({ title: '当前平台不支持自动更新', icon: 'none' })
  // #endif
}

const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userActions.logout()
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        })

        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      }
    }
  })
}

const loadNotificationSettings = () => {
  const saved = uni.getStorageSync('notification_settings')
  if (saved) {
    notificationSettings.value = saved
  }
}

onMounted(() => {
  loadNotificationSettings()
  updateCacheSize()
})
</script>

<style scoped>
.settings-container {
  height: 100vh;
  width: 100%;
  box-sizing: border-box;
  background-color: #f8f8f8;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: white;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
  box-sizing: border-box;
}

.nav-left,
.nav-right {
  width: 80rpx;
}

.nav-right {
  display: flex;
  justify-content: flex-end;
}

.nav-text-btn {
  font-size: 28rpx;
  color: #374151;
  line-height: 1;
}

.nav-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  text-align: center;
}

.settings-scroll {
  height: calc(100vh - 120rpx);
  width: 100%;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
}

.section {
  margin-bottom: 40rpx;
  background-color: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #666;
  padding: 20rpx 30rpx;
  background-color: #f8f8f8;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  background-color: white;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.menu-right {
  display: flex;
  align-items: center;
}

.menu-text {
  font-size: 32rpx;
  color: #333;
}

.menu-sub {
  font-size: 24rpx;
  color: #9ca3af;
  margin-right: 12rpx;
}

.menu-arrow {
  font-size: 28rpx;
  color: #9ca3af;
  line-height: 1;
}

switch {
  transform: scale(0.8);
  transform-origin: right center;
}

.logout-section {
  margin-top: 40rpx;
}

.logout-btn {
  width: 100%;
  background-color: #ff4d4f;
  color: white;
  text-align: center;
  padding: 25rpx 0;
  border-radius: 10rpx;
  font-size: 32rpx;
  font-weight: 500;
}

.safe-area {
  height: env(safe-area-inset-bottom);
  min-height: 20rpx;
  padding-bottom: 100rpx;
}
</style>
