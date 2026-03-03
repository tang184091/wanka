<template>
  <view class="settings-container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <image src="/static/icons/back.png" class="back-icon" />
      </view>
      <view class="nav-title">设置</view>
    </view>

    <!-- 设置列表 -->
    <scroll-view class="settings-scroll" scroll-y>
      <!-- 账号设置 -->
      <view class="section">
        <view class="section-title">账号设置</view>
        <view class="menu-list">
          <view class="menu-item" @tap="goToAccountInfo">
            <view class="menu-left">
              <image src="/static/icons/account.png" class="menu-icon" />
              <text class="menu-text">账号信息</text>
            </view>
            <image src="/static/icons/arrow-right.png" class="arrow-icon" />
          </view>
          
          <view class="menu-item" @tap="changePassword">
            <view class="menu-left">
              <image src="/static/icons/password.png" class="menu-icon" />
              <text class="menu-text">修改密码</text>
            </view>
            <image src="/static/icons/arrow-right.png" class="arrow-icon" />
          </view>
        </view>
      </view>

      <!-- 通知设置 -->
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

      <!-- 隐私设置 -->
      <view class="section">
        <view class="section-title">隐私设置</view>
        <view class="menu-list">
          <view class="menu-item">
            <view class="menu-left">
              <image src="/static/icons/privacy.png" class="menu-icon" />
              <text class="menu-text">隐私保护</text>
            </view>
            <image src="/static/icons/arrow-right.png" class="arrow-icon" />
          </view>
          
          <view class="menu-item" @tap="blockedUsers">
            <view class="menu-left">
              <image src="/static/icons/block.png" class="menu-icon" />
              <text class="menu-text">屏蔽用户</text>
            </view>
            <image src="/static/icons/arrow-right.png" class="arrow-icon" />
          </view>
        </view>
      </view>

      <!-- 通用设置 -->
      <view class="section">
        <view class="section-title">通用设置</view>
        <view class="menu-list">
          <view class="menu-item" @tap="clearCache">
            <view class="menu-left">
              <image src="/static/icons/clear.png" class="menu-icon" />
              <text class="menu-text">清理缓存</text>
            </view>
            <view class="menu-right">
              <text class="cache-size">{{ cacheSize }}</text>
              <image src="/static/icons/arrow-right.png" class="arrow-icon" />
            </view>
          </view>
          
          <view class="menu-item" @tap="checkUpdate">
            <view class="menu-left">
              <image src="/static/icons/update.png" class="menu-icon" />
              <text class="menu-text">检查更新</text>
            </view>
            <view class="menu-right">
              <text class="version-text">v1.0.0</text>
              <image src="/static/icons/arrow-right.png" class="arrow-icon" />
            </view>
          </view>
          
          <view class="menu-item" @tap="feedback">
            <view class="menu-left">
              <image src="/static/icons/feedback.png" class="menu-icon" />
              <text class="menu-text">意见反馈</text>
            </view>
            <image src="/static/icons/arrow-right.png" class="arrow-icon" />
          </view>
          
          <view class="menu-item" @tap="about">
            <view class="menu-left">
              <image src="/static/icons/about.png" class="menu-icon" />
              <text class="menu-text">关于我们</text>
            </view>
            <image src="/static/icons/arrow-right.png" class="arrow-icon" />
          </view>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-section">
        <view class="logout-btn" @tap="handleLogout">
          退出登录
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-area"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userActions } from '@/utils/store.js'

// 通知设置
const notificationSettings = ref({
  gameReminder: true,
  message: true,
  vibration: false
})

// 缓存大小
const cacheSize = ref('0KB')

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 跳转到账号信息
const goToAccountInfo = () => {
  uni.showModal({
    title: '账号信息',
    content: '功能开发中，敬请期待',
    showCancel: false
  })
}

// 修改密码
const changePassword = () => {
  uni.showModal({
    title: '修改密码',
    content: '功能开发中，敬请期待',
    showCancel: false
  })
}

// 组局提醒开关变化
const onGameReminderChange = (e) => {
  notificationSettings.value.gameReminder = e.detail.value
  saveNotificationSettings()
}

// 消息通知开关变化
const onMessageChange = (e) => {
  notificationSettings.value.message = e.detail.value
  saveNotificationSettings()
}

// 振动提醒开关变化
const onVibrationChange = (e) => {
  notificationSettings.value.vibration = e.detail.value
  saveNotificationSettings()
}

// 保存通知设置
const saveNotificationSettings = () => {
  uni.setStorageSync('notification_settings', notificationSettings.value)
  uni.showToast({
    title: '设置已保存',
    icon: 'success'
  })
}

// 屏蔽用户
const blockedUsers = () => {
  uni.showModal({
    title: '屏蔽用户',
    content: '功能开发中，敬请期待',
    showCancel: false
  })
}

// 清理缓存
const clearCache = () => {
  uni.showModal({
    title: '清理缓存',
    content: '确定要清理缓存吗？',
    success: (res) => {
      if (res.confirm) {
        // 显示清理中
        uni.showLoading({
          title: '清理中...',
          mask: true
        })
        
        // 清理缓存
        setTimeout(() => {
          uni.clearStorageSync()
          cacheSize.value = '0KB'
          
          uni.hideLoading()
          uni.showToast({
            title: '清理完成',
            icon: 'success'
          })
        }, 1000)
      }
    }
  })
}

// 检查更新
const checkUpdate = () => {
  const updateManager = uni.getUpdateManager()
  
  updateManager.onCheckForUpdate((res) => {
    if (res.hasUpdate) {
      uni.showModal({
        title: '更新提示',
        content: '发现新版本，是否更新？',
        success: (res) => {
          if (res.confirm) {
            updateManager.onUpdateReady(() => {
              uni.showModal({
                title: '更新提示',
                content: '新版本下载完成，是否重启应用？',
                success: (res) => {
                  if (res.confirm) {
                    updateManager.applyUpdate()
                  }
                }
              })
            })
            
            updateManager.onUpdateFailed(() => {
              uni.showToast({
                title: '更新失败',
                icon: 'none'
              })
            })
          }
        }
      })
    } else {
      uni.showToast({
        title: '已是最新版本',
        icon: 'success'
      })
    }
  })
}

// 意见反馈
const feedback = () => {
  uni.navigateTo({
    url: '/pages/user/feedback'
  })
}

// 关于我们
const about = () => {
  uni.showModal({
    title: '关于玩咖约局',
    content: '版本：v1.0.0\n\n一个专注于日麻、桌游、电玩组局的小程序\n\n联系我们：support@wankayueju.com',
    showCancel: false
  })
}

// 退出登录
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

// 计算缓存大小
const calculateCacheSize = () => {
  let total = 0
  const info = uni.getStorageInfoSync()
  
  info.keys.forEach(key => {
    const data = uni.getStorageSync(key)
    if (data) {
      total += JSON.stringify(data).length
    }
  })
  
  if (total < 1024) {
    cacheSize.value = total + 'B'
  } else if (total < 1024 * 1024) {
    cacheSize.value = (total / 1024).toFixed(2) + 'KB'
  } else {
    cacheSize.value = (total / (1024 * 1024)).toFixed(2) + 'MB'
  }
}

// 加载通知设置
const loadNotificationSettings = () => {
  const saved = uni.getStorageSync('notification_settings')
  if (saved) {
    notificationSettings.value = saved
  }
}

// 页面加载
onMounted(() => {
  calculateCacheSize()
  loadNotificationSettings()
})
</script>

<style scoped>
.settings-container {
  height: 100vh;
  background-color: #f8f8f8;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: white;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
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

/* 滚动区域 */
.settings-scroll {
  height: calc(100vh - 120rpx);
  padding: 20rpx 30rpx;
}

/* 分区样式 */
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

/* 菜单列表 */
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

.menu-item:active {
  background-color: #f8f8f8;
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

.menu-right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.arrow-icon {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.5;
}

.cache-size {
  font-size: 28rpx;
  color: #999;
}

.version-text {
  font-size: 28rpx;
  color: #999;
}

/* 开关样式 */
switch {
  transform: scale(0.8);
  transform-origin: right center;
}

/* 退出登录 */
.logout-section {
  margin-top: 40rpx;
  padding: 0 30rpx;
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

.logout-btn:active {
  background-color: #ff7875;
}

/* 安全区域 */
.safe-area {
  height: env(safe-area-inset-bottom);
  min-height: 20rpx;
  padding-bottom: 100rpx;
}
</style>