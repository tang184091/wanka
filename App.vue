<!-- App.vue -->
<script>
import { initStore } from '@/utils/store.js'

export default {
  onLaunch: function(options) {
    console.log('App Launch - 玩咖约局小程序启动')
    console.log('启动参数:', options)
    
    // 检查微信版本是否支持云开发
    if (wx.cloud) {
      console.log('开始初始化云开发...')
      
      // 初始化云开发环境 - 使用开发者工具分配的环境
      wx.cloud.init({
        // 使用微信开发者工具分配的云环境ID
        env: 'cloud1-6glnv3cs9b44417a',
        // 是否在将用户访问记录到用户管理中，在控制台中可见
        traceUser: true
      })
      
      console.log('云开发初始化成功')
      console.log('环境ID: cloud1-6glnv3cs9b44417a')
      console.log('小程序ID: wx6639309919ac9170')
      
      // 测试云开发连接
      this.testCloudConnection()
    } else {
      console.error('当前微信版本不支持云开发，请升级微信版本')
      uni.showModal({
        title: '提示',
        content: '当前微信版本过低，无法使用全部功能，请升级到最新微信版本',
        showCancel: false
      })
    }
    
    // 初始化全局状态管理
    console.log('开始初始化全局状态...')
    initStore()
    console.log('全局状态初始化完成')
    
    // 检查登录状态
    this.checkLoginStatus()
    
    // 获取系统信息
    this.getSystemInfo()
    
    // 检查更新
    this.checkUpdate()
  },
  
  onShow: function(options) {
    console.log('App Show - 小程序显示')
    console.log('显示参数:', options)
    
    // 检查场景值，用于统计和分析
    if (options && options.scene) {
      console.log('场景值:', options.scene)
      // 移除不存在的 recordScene 方法调用
      // 可以在这里添加场景值记录逻辑
    }
    
    // 检查是否有分享卡片进入
    if (options && options.query) {
      console.log('分享卡片参数:', options.query)
      // 移除不存在的 handleShareCardEntry 方法调用
      // 可以在这里添加分享卡片处理逻辑
    }
  },
  
  onHide: function() {
    console.log('App Hide - 小程序隐藏')
    
    // 保存当前状态到本地存储
    this.saveAppState()
  },
  
  onError: function(error) {
    console.error('App Error - 小程序发生错误:', error)
    
    // 错误处理 - 移除不存在的 reportError 方法调用
    // 可以在这里添加错误上报逻辑
    
    // 显示友好错误提示
    uni.showToast({
      title: '程序发生错误，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },
  
  onPageNotFound: function(res) {
    console.warn('App PageNotFound - 页面不存在:', res)
    
    // 重定向到首页
    uni.redirectTo({
      url: '/pages/index/index'
    })
  },
  
  methods: {
    // 测试云开发连接
    async testCloudConnection() {
      try {
        console.log('开始测试云开发连接...')
        
        // 测试云开发API
        const result = await wx.cloud.callFunction({
          name: 'user-service',
          data: {
            action: 'test'
          }
        })
        
        console.log('云开发连接测试成功:', result)
        
        return true
      } catch (error) {
        console.warn('云开发连接测试失败，可能是云函数未部署或环境问题:', error)
        
        // 显示友好提示
        uni.showModal({
          title: '云服务连接失败',
          content: '云服务连接失败，部分功能可能无法使用。可能是云函数未部署或网络问题。',
          showCancel: false
        })
        
        return false
      }
    },
    
    // 检查登录状态
    checkLoginStatus() {
      try {
        const userInfo = uni.getStorageSync('user_info')
        const userToken = uni.getStorageSync('user_token')
        
        if (userInfo && userToken) {
          console.log('检测到已登录用户:', userInfo.nickname)
          
          // 验证token是否过期
          const loginTime = uni.getStorageSync('login_time')
          const now = Date.now()
          const loginDuration = now - loginTime
          const sevenDays = 7 * 24 * 60 * 60 * 1000
          
          if (loginDuration > sevenDays) {
            console.log('登录已过期，清除登录状态')
            this.clearLoginData()
          } else {
            console.log('登录状态有效，剩余时间:', Math.round((sevenDays - loginDuration) / (24 * 60 * 60 * 1000)), '天')
          }
        } else {
          console.log('未检测到登录状态')
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
      }
    },
    
    // 清除登录数据
    clearLoginData() {
      const keys = ['user_info', 'user_token', 'user_stats', 'login_time']
      keys.forEach(key => {
        uni.removeStorageSync(key)
      })
      console.log('已清除所有登录数据')
    },
    
    // 获取系统信息
    getSystemInfo() {
      try {
        const systemInfo = uni.getSystemInfoSync()
        console.log('系统信息:', {
          platform: systemInfo.platform,
          system: systemInfo.system,
          version: systemInfo.version,
          SDKVersion: systemInfo.SDKVersion,
          brand: systemInfo.brand,
          model: systemInfo.model,
          screenWidth: systemInfo.screenWidth,
          screenHeight: systemInfo.screenHeight,
          windowWidth: systemInfo.windowWidth,
          windowHeight: systemInfo.windowHeight,
          pixelRatio: systemInfo.pixelRatio,
          language: systemInfo.language
        })
        
        // 保存到全局状态
        uni.setStorageSync('system_info', systemInfo)
        
        // 根据平台设置样式变量
        this.setPlatformStyle(systemInfo)
        
      } catch (error) {
        console.error('获取系统信息失败:', error)
      }
    },
    
    // 根据平台设置样式
    setPlatformStyle(systemInfo) {
      // 在小程序中无法直接设置CSS变量，这里记录系统信息
      // 可以在页面中使用uni.getSystemInfoSync()获取
      console.log('平台信息:', {
        isIOS: systemInfo.platform === 'ios',
        statusBarHeight: systemInfo.statusBarHeight,
        safeArea: systemInfo.safeArea
      })
      
      // 保存到全局变量，供页面使用
      uni.setStorageSync('platform_info', {
        isIOS: systemInfo.platform === 'ios',
        statusBarHeight: systemInfo.statusBarHeight,
        safeAreaTop: systemInfo.safeArea?.top || 0,
        safeAreaBottom: systemInfo.safeArea ? (systemInfo.screenHeight - systemInfo.safeArea.bottom) : 0
      })
    },
    
    // 检查更新
    checkUpdate() {
      // 开发环境不检查更新
      if (process.env.NODE_ENV === 'development') {
        console.log('开发环境，跳过更新检查')
        return
      }
      
      const updateManager = uni.getUpdateManager()
      
      updateManager.onCheckForUpdate(function(res) {
        // 请求完新版本信息的回调
        console.log('检查更新结果:', res.hasUpdate ? '有新版本' : '已是最新版本')
      })
      
      updateManager.onUpdateReady(function() {
        uni.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success(res) {
            if (res.confirm) {
              // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
              updateManager.applyUpdate()
            }
          }
        })
      })
      
      updateManager.onUpdateFailed(function() {
        // 新版本下载失败
        console.warn('新版本下载失败')
      })
    },
    
    // 保存应用状态
    saveAppState() {
      try {
        const state = {
          lastHideTime: new Date().getTime()
        }
        uni.setStorageSync('app_state', state)
        console.log('应用状态已保存')
      } catch (error) {
        console.error('保存应用状态失败:', error)
      }
    }
  }
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
}

/* 卡片样式 */
.card {
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 按钮样式 */
.primary-btn {
  background-color: #07c160;
  color: #fff;
  border-radius: 8rpx;
  font-size: 32rpx;
  font-weight: 500;
  text-align: center;
  padding: 20rpx 40rpx;
}

.primary-btn:active {
  background-color: #06ad56;
}

.secondary-btn {
  background-color: #f0f0f0;
  color: #666;
  border-radius: 8rpx;
  font-size: 32rpx;
  font-weight: 500;
  text-align: center;
  padding: 20rpx 40rpx;
}

.secondary-btn:active {
  background-color: #e0e0e0;
}

/* 表单样式 */
.form-input {
  background-color: #f8f8f8;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
}

.form-input:focus {
  border-color: #07c160;
  background-color: #fff;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
  font-weight: 500;
}

/* 标签样式 */
.tag {
  display: inline-block;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.tag-mahjong {
  background-color: #e6f7ff;
  color: #1890ff;
}

.tag-boardgame {
  background-color: #f6ffed;
  color: #52c41a;
}

.tag-videogame {
  background-color: #fff7e6;
  color: #fa8c16;
}

.tag-status {
  background-color: #e6f7ff;
  color: #1890ff;
}

.tag-status-full {
  background-color: #ff4d4f;
  color: #fff;
}

/* 加载动画 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f0f0f0;
  border-top-color: #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  text-align: center;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 40rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 20rpx;
}

/* 安全区域适配 */
.safe-area {
  padding-bottom: env(safe-area-inset-bottom);
  padding-bottom: constant(safe-area-inset-bottom);
}
</style>