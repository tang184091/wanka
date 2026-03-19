<template>
  <view class="settings-container">
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <image src="/static/icons/back.png" class="back-icon" />
      </view>
      <view class="nav-title">设置</view>
    </view>

    <scroll-view class="settings-scroll" scroll-y>
      <view class="section">
        <view class="section-title">通知设置</view>
        <view class="menu-list">
          <view class="menu-item">
            <view class="menu-left">
              <image src="/static/icons/notification.png" class="menu-icon" />
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
              <image src="/static/icons/message.png" class="menu-icon" />
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
              <image src="/static/icons/vibration.png" class="menu-icon" />
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
          <view class="menu-item" @tap="about">
            <view class="menu-left">
              <image src="/static/icons/about.png" class="menu-icon" />
              <text class="menu-text">关于我们</text>
            </view>
            <image src="/static/icons/arrow-right.png" class="arrow-icon" />
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

.nav-left {
  width: 80rpx;
}

.back-icon {
  width: 40rpx;
  height: 40rpx;
}

.nav-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  text-align: center;
  margin-right: 80rpx;
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

.menu-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
}

.menu-text {
  font-size: 32rpx;
  color: #333;
}

.arrow-icon {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.5;
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
