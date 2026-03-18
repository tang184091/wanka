<template>
  <view class="user-container">
    <!-- 用户信息卡片 -->
    <view class="user-card card" v-if="userInfo">
      <view class="user-header">
        <view class="avatar-section">
          <image :src="userInfo.avatar" class="user-avatar" @tap="chooseAvatar" />
          <view class="avatar-edit" @tap="chooseAvatar">更换</view>
        </view>
        <view class="user-base-info">
          <view class="nickname-section">
            <text class="nickname">{{ userInfo.nickname }}</text>
            <view class="edit-icon" @tap="editNickname">编辑</view>
          </view>
          <text class="user-id">ID: {{ userInfo.id }}</text>
        </view>
      </view>

      <!-- 我的标签 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">我的标签</text>
          <view class="edit-icon" @tap="editTags">管理</view>
        </view>
        <view class="tags-container">
          <view v-if="userInfo.tags && userInfo.tags.length === 0" class="no-tags">
            <text>暂无标签，点击管理添加</text>
          </view>
          <view v-else class="tags-list">
            <view 
              v-for="tag in userInfo.tags" 
              :key="tag.id"
              class="tag-item"
            >
              {{ tag.name }}
            </view>
          </view>
        </view>
      </view>

      <!-- 我的游戏/装备 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">我的游戏/设备</text>
          <view class="edit-icon" @tap="editGames">管理</view>
        </view>
        <view class="games-container">
          <view v-if="userInfo.games && userInfo.games.length === 0" class="no-games">
            <text>暂无游戏/装备，点击管理添加</text>
          </view>
          <view v-else class="games-list">
            <view 
              v-for="game in userInfo.games" 
              :key="game.id"
              class="game-item"
            >
              <view class="game-type-tag" :class="getGameTypeClass(game.type)">
                {{ getGameTypeText(game.type) }}
              </view>
              <text class="game-name">{{ game.name }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 游戏数据统计 -->
      <view class="stats-section" v-if="userStats">
        <view class="stat-item">
          <text class="stat-value">{{ userStats.createdGames || 0 }}</text>
          <text class="stat-label">发起的局</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ userStats.joinedGames || 0 }}</text>
          <text class="stat-label">加入的局</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ userStats.completedGames || 0 }}</text>
          <text class="stat-label">完成的局</text>
        </view>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <view class="menu-item" @tap="goToMyGames('created')">
        <view class="menu-left">
          <image src="/static/icons/created.png" class="menu-icon" />
          <text class="menu-text">我发起的</text>
        </view>
        <view class="menu-right">
          <text class="menu-count" v-if="userStats">{{ userStats.createdGames || 0 }}</text>
          <image src="/static/icons/arrow-right.png" class="arrow-icon" />
        </view>
      </view>

      <view class="menu-item" @tap="goToMyGames('joined')">
        <view class="menu-left">
          <image src="/static/icons/joined.png" class="menu-icon" />
          <text class="menu-text">我参与的</text>
        </view>
        <view class="menu-right">
          <text class="menu-count" v-if="userStats">{{ userStats.joinedGames || 0 }}</text>
          <image src="/static/icons/arrow-right.png" class="arrow-icon" />
        </view>
      </view>

      <view class="menu-item" @tap="goToMyGames('history')">
        <view class="menu-left">
          <image src="/static/icons/history.png" class="menu-icon" />
          <text class="menu-text">历史记录</text>
        </view>
        <image src="/static/icons/arrow-right.png" class="arrow-icon" />
      </view>

      <view class="menu-divider"></view>


      <view class="menu-item" v-if="userInfo && userInfo.isAdmin" @tap="goToAdmin">
        <view class="menu-left">
          <image src="/static/icons/settings.png" class="menu-icon" />
          <text class="menu-text">管理员功能</text>
        </view>
        <image src="/static/icons/arrow-right.png" class="arrow-icon" />
      </view>

      <view class="menu-item" @tap="goToSettings">
        <view class="menu-left">
          <image src="/static/icons/settings.png" class="menu-icon" />
          <text class="menu-text">设置</text>
        </view>
        <image src="/static/icons/arrow-right.png" class="arrow-icon" />
      </view>

      <view class="menu-item" @tap="goToAbout">
        <view class="menu-left">
          <image src="/static/icons/about.png" class="menu-icon" />
          <text class="menu-text">关于我们</text>
        </view>
        <image src="/static/icons/arrow-right.png" class="arrow-icon" />
      </view>
    </view>

    <!-- 登录按钮（未登录时显示） -->
    <view class="login-btn-container" v-if="!userInfo">
      <view class="login-btn" @tap="handleLogin">
        <image src="/static/icons/wechat.png" class="wechat-icon" />
        <text class="login-text">微信一键登录</text>
      </view>
      <text class="login-tip">登录后可以创建和加入组局</text>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-container" v-else>
      <view class="logout-btn" @tap="handleLogout">
        退出登录
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import UserService from '@/utils/user.js'
import { userActions } from '@/utils/store.js'

// 用户信息
const userInfo = ref(null)
const userStats = ref(null)

// 新增：加载用户统计数据
const loadUserStats = async () => {
  if (!userInfo.value) {
    console.log('用户未登录，跳过加载统计')
    return
  }
  
  try {
    console.log('开始加载用户统计...')
    
    // 调用 UserService 获取最新统计
    const stats = await UserService.fetchUserStats()
    
    if (stats) {
      userStats.value = stats
      console.log('用户统计加载成功:', stats)
    } else {
      console.log('用户统计为空，使用默认值')
      userStats.value = { 
        createdGames: 0, 
        joinedGames: 0, 
        completedGames: 0 
      }
    }
  } catch (error) {
    console.error('加载用户统计失败:', error)
    // 如果加载失败，也设置默认值
    userStats.value = { 
      createdGames: 0, 
      joinedGames: 0, 
      completedGames: 0 
    }
  }
}

// 游戏类型样式
const getGameTypeClass = (type) => {
  const classMap = {
    'mahjong': 'game-tag-mahjong',
    'boardgame': 'game-tag-boardgame',
    'videogame': 'game-tag-videogame'
  }
  return classMap[type] || 'game-tag-mahjong'
}

// 游戏类型文字
const getGameTypeText = (type) => {
  const textMap = {
    'mahjong': '立直麻将',
    'boardgame': '桌游',
    'videogame': '电玩'
  }
  return textMap[type] || '立直麻将'
}

// 微信登录 - 修复后的正确流程
const handleLogin = () => {
  console.log('开始微信登录流程')
  
  // 1. 获取用户信息（必须第一步，且由用户点击直接触发）
  uni.getUserProfile({
    desc: '用于完善会员资料',
    success: async (userRes) => {
      console.log('✅ 获取用户信息成功:', userRes.userInfo.nickName)
      
      const userInfoData = {
        nickname: userRes.userInfo.nickName,
        avatar: userRes.userInfo.avatarUrl,
        gender: userRes.userInfo.gender,
        province: userRes.userInfo.province,
        city: userRes.userInfo.city,
        country: userRes.userInfo.country
      }
      
      // 显示加载中
      uni.showLoading({ title: '登录中...', mask: true })
      
      // 2. 获取微信code
      const loginRes = await new Promise((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: resolve,
          fail: reject
        })
      })
      
      if (!loginRes.code) {
        uni.hideLoading()
        uni.showToast({ title: '获取登录凭证失败', icon: 'none' })
        return
      }
      
      console.log('✅ 获取微信code成功')
      
      try {
        // 3. 调用云函数登录
        const loginResult = await UserService.cloudLoginWithCaptcha(loginRes.code, userInfoData)
        
        if (loginResult.success) {
          console.log('✅ 云函数登录成功')
          
          // 保存用户数据
          UserService.saveUserData(
            loginResult.userInfo,
            loginResult.token,
            loginResult.stats
          )
          
          // 更新本地状态
          userInfo.value = loginResult.userInfo
          userStats.value = loginResult.stats || { 
            createdGames: 0, 
            joinedGames: 0, 
            completedGames: 0 
          }
          
          uni.showToast({ title: '登录成功', icon: 'success' })
          
        } else {
          throw new Error(loginResult.error || '登录失败')
        }
      } catch (error) {
        console.error('登录失败:', error)
        uni.showToast({ 
          title: '登录失败: ' + error.message, 
          icon: 'none',
          duration: 3000 
        })
      } finally {
        uni.hideLoading()
      }
    },
    fail: (err) => {
      console.error('获取用户信息失败:', err)
      uni.showToast({ 
        title: '获取用户信息失败: ' + err.errMsg, 
        icon: 'none' 
      })
    }
  })
}

// 退出登录 - 修复版，避免循环调用
const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        console.log('用户确认退出登录')
        
        // 显示加载中
        uni.showLoading({ title: '退出中...', mask: true })
        
        try {
          // 1. 先调用 UserService.logout() 清除本地存储和触发事件
          // 最新版本中，UserService.logout() 不再调用 userActions.logout()
          UserService.logout()
          console.log('✅ UserService.logout() 执行完成 - 已清除存储')
          
          // 2. 然后调用 userActions.logout() 更新全局状态
          // 重要：确保 store.js 中的 userActions.logout() 不再调用 UserService.logout()
          if (userActions && userActions.logout) {
            userActions.logout()
            console.log('✅ userActions.logout() 执行完成 - 已更新全局状态')
          } else {
            console.warn('userActions.logout 未找到，全局状态可能未更新')
          }
          
          // 3. 直接清空本地响应式数据
          userInfo.value = null
          userStats.value = null
          console.log('✅ 本地响应式数据已清空')
          
          uni.hideLoading()
          
          uni.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          })
          
          // 4. 可选：短暂延迟后刷新页面
          setTimeout(() => {
            console.log('退出登录完成，页面状态已更新')
          }, 100)
          
        } catch (error) {
          uni.hideLoading()
          console.error('退出登录过程中出错:', error)
          uni.showToast({
            title: '退出登录失败: ' + error.message,
            icon: 'none',
            duration: 2000
          })
        }
      }
    }
  })
}

// 修改：检查登录状态，添加统计加载
const checkLoginStatus = () => {
  console.log('执行登录状态检查')
  
  const isLoggedIn = UserService.isLoggedIn()
  console.log('登录状态检查结果:', isLoggedIn ? '已登录' : '未登录')
  
  if (isLoggedIn) {
    const currentUser = UserService.getCurrentUser()
    const currentStats = UserService.getUserStats()
    
    console.log('获取到的用户信息:', currentUser)
    console.log('获取到的用户统计（本地）:', currentStats)
    
    userInfo.value = currentUser
    
    // 先使用本地缓存的统计
    if (currentStats) {
      userStats.value = currentStats
    } else {
      // 如果没有本地缓存，设置为默认值
      userStats.value = { 
        createdGames: 0, 
        joinedGames: 0, 
        completedGames: 0 
      }
    }
    
    // 立即从服务器获取最新统计
    loadUserStats()
  } else {
    userInfo.value = null
    userStats.value = null
  }
}

// 监听用户登录状态变化
const setupUserListeners = () => {
  console.log('设置全局事件监听器')
  
  // 登录成功事件
  uni.$on('user:login', async (data) => {
    console.log('监听到用户登录事件:', data)
    userInfo.value = data.userInfo
    
    // 先使用登录返回的统计
    if (data.stats) {
      userStats.value = data.stats
    } else {
      userStats.value = { 
        createdGames: 0, 
        joinedGames: 0, 
        completedGames: 0 
      }
    }
    
    // 登录后加载最新统计
    loadUserStats()
  })
  
  // 退出登录事件
  uni.$on('user:logout', () => {
    console.log('监听到用户退出事件')
    // 立即清空本地状态
    userInfo.value = null
    userStats.value = null
  })
  
  // 用户信息更新事件
  uni.$on('user:updated', (updatedUser) => {
    console.log('监听到用户信息更新:', updatedUser)
    userInfo.value = updatedUser
  })
  
  // 新增：对局数据更新事件监听
  uni.$on('game:stats-changed', () => {
    console.log('监听到对局数据变化，刷新统计')
    loadUserStats()
  })
}

// 页面显示时刷新统计数据
onShow(() => {
  console.log('用户中心页面显示，刷新统计')
  loadUserStats()
})

// 页面加载时检查登录状态
onMounted(() => {
  console.log('个人中心页面加载')
  
  // 设置全局事件监听器
  setupUserListeners()
  
  // 初始检查登录状态
  checkLoginStatus()
})

// 移除事件监听器
const removeUserListeners = () => {
  console.log('移除全局事件监听器')
  uni.$off('user:login')
  uni.$off('user:logout')
  uni.$off('user:updated')
  uni.$off('game:stats-changed')
}

// 页面卸载时清理
onUnmounted(() => {
  removeUserListeners()
})

// 更换头像 - 修复版，确保头像更新后云端数据同步
const chooseAvatar = () => {
  if (!userInfo.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      
      // 显示上传中
      uni.showLoading({
        title: '上传中...',
        mask: true
      })
      
      try {
        console.log('开始上传头像到云存储...')
        
        // 1. 先上传图片到云存储
        const uploadResult = await UserService.uploadImage(tempFilePath)
        console.log('头像上传成功，云存储文件ID:', uploadResult)
        
        if (!uploadResult) {
          throw new Error('头像上传失败')
        }
        
        // 2. 获取文件的临时URL
        const fileID = uploadResult
        const avatarUrl = fileID
        
        console.log('调用云函数更新用户头像，URL:', avatarUrl)
        
        // 3. 调用云函数更新用户头像
        const updatedUser = await UserService.updateUserAvatar(avatarUrl)
        
        console.log('云函数返回的更新后用户:', updatedUser)
        
        if (!updatedUser || !updatedUser.avatar) {
          throw new Error('头像更新失败，返回数据异常')
        }
        
        // 4. 保存到本地存储
        UserService.saveUserData(
          updatedUser,
          UserService.getToken(),
          userStats.value
        )
        
        // 5. 更新本地状态
        userInfo.value = updatedUser
        
        uni.showToast({
          title: '头像更新成功',
          icon: 'success',
          duration: 1500
        })
        
      } catch (error) {
        console.error('头像更新失败:', error)
        uni.showToast({
          title: '头像更新失败: ' + error.message,
          icon: 'none',
          duration: 3000
        })
      } finally {
        // 确保 hideLoading 被调用
        uni.hideLoading()
      }
    },
    fail: (err) => {
      console.error('选择图片失败:', err)
      uni.showToast({
        title: '选择图片失败',
        icon: 'none',
        duration: 2000
      })
    }
  })
}

// 编辑昵称 - 修复版，确保昵称更新后云端数据同步
const editNickname = () => {
  if (!userInfo.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '修改昵称',
    content: '请输入新的昵称',
    editable: true,
    placeholderText: userInfo.value.nickname,
    success: async (res) => {
      if (res.confirm && res.content) {
        const newNickname = res.content.trim()
        
        if (!newNickname) {
          uni.showToast({
            title: '昵称不能为空',
            icon: 'none'
          })
          return
        }
        
        if (newNickname === userInfo.value.nickname) {
          uni.showToast({
            title: '昵称未变化',
            icon: 'none'
          })
          return
        }
        
        // 显示更新中
        uni.showLoading({
          title: '更新中...',
          mask: true
        })
        
        try {
          console.log('开始更新用户昵称:', newNickname)
          
          // 调用云函数更新用户信息
          const updatedUser = await UserService.updateUserInfo({ 
            nickname: newNickname 
          })
          
          console.log('云函数返回的更新后用户:', updatedUser)
          
          if (!updatedUser || !updatedUser.nickname) {
            throw new Error('昵称更新失败，返回数据异常')
          }
          
          // 保存到本地存储
          UserService.saveUserData(
            updatedUser,
            UserService.getToken(),
            userStats.value
          )
          
          // 更新本地状态
          userInfo.value = updatedUser
          
          uni.showToast({
            title: '昵称更新成功',
            icon: 'success',
            duration: 1500
          })
          
        } catch (error) {
          console.error('昵称更新失败:', error)
          uni.showToast({
            title: '昵称更新失败: ' + error.message,
            icon: 'none',
            duration: 3000
          })
        } finally {
          // 确保 hideLoading 被调用
          uni.hideLoading()
        }
      }
    }
  })
}

// 编辑标签
const editTags = () => {
  if (!userInfo.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  // 跳转到标签管理页面
  uni.navigateTo({
    url: '/pages/user/tags'
  })
}

// 编辑游戏/装备
const editGames = () => {
  if (!userInfo.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  // 跳转到游戏管理页面
  uni.navigateTo({
    url: '/pages/user/games'
  })
}

// 查看我的组局
const goToMyGames = (type) => {
  if (!userInfo.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }

  // 跳转到我的组局页面
  uni.navigateTo({
    url: `/pages/game/list?tab=${type}`
  })
}


// 跳转到管理员页
const goToAdmin = () => {
  if (!userInfo.value || !userInfo.value.isAdmin) {
    uni.showToast({ title: '仅管理员可访问', icon: 'none' })
    return
  }

  uni.navigateTo({
    url: '/pages/admin/admin'
  })
}

// 跳转到设置
const goToSettings = () => {
  uni.navigateTo({
    url: '/pages/user/settings'
  })
}

// 跳转到关于
const goToAbout = () => {
  uni.showModal({
    title: '关于玩咖约局',
    content: '玩咖约局 v1.0.0\n一个专注于立直麻将、桌游、电玩组局的小程序\n祝您玩得开心！',
    showCancel: false
  })
}
</script>

<style scoped>
/* 样式部分保持不变 */
.user-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 100rpx;
}

/* ... 其余样式代码保持不变 ... */
</style>

<style scoped>
.user-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 100rpx;
}

/* 用户卡片样式 */
.user-card {
  margin: 20rpx;
  padding: 40rpx 30rpx;
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
  padding-bottom: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.avatar-section {
  position: relative;
  margin-right: 30rpx;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #07c160;
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #07c160;
  color: white;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.user-base-info {
  flex: 1;
}

.nickname-section {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.nickname {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-right: 20rpx;
}

.edit-icon {
  background-color: #f0f0f0;
  color: #666;
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
}

.user-id {
  font-size: 28rpx;
  color: #999;
}

/* 分区样式 */
.section {
  margin-bottom: 40rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

/* 标签样式 */
.tags-container,
.games-container {
  min-height: 60rpx;
}

.no-tags,
.no-games {
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.tag-item {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
}

/* 游戏/装备样式 */
.games-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.game-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx
}

.game-type-tag {
  width: 80rpx;
  text-align: center;
  padding: 6rpx 12rpx;
  border-radius: 4rpx;
  font-size: 24rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.game-tag-mahjong {
  background-color: #e6f7ff;
  color: #1890ff;
}

.game-tag-boardgame {
  background-color: #f6ffed;
  color: #52c41a;
}

.game-tag-videogame {
  background-color: #fff7e6;
  color: #fa8c16;
}

.game-name {
  font-size: 28rpx;
  color: #333;
  flex: 1;
  word-break: break-all;
}

/* 统计数据样式 */
.stats-section {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 30rpx 0;
  border-top: 1rpx solid #f0f0f0;
  border-bottom: 1rpx solid #f0f0f0;
  margin-top: 20rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #07c160;
  margin-bottom: 10rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.stat-divider {
  width: 1rpx;
  height: 40rpx;
  background-color: #e0e0e0;
}

/* 菜单列表样式 */
.menu-list {
  background-color: white;
  margin: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background-color: white;
}

.menu-item:active {
  background-color: #f8f8f8;
}

.menu-left {
  display: flex;
  align-items: center;
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
}

.menu-count {
  font-size: 28rpx;
  color: #999;
  margin-right: 20rpx;
}

.arrow-icon {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.5;
}

.menu-divider {
  height: 1rpx;
  background-color: #f0f0f0;
  margin: 0 30rpx;
}

/* 登录按钮样式 */
.login-btn-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100rpx;
  padding: 0 60rpx;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background-color: #07c160;
  color: white;
  padding: 25rpx 0;
  border-radius: 10rpx;
  font-size: 32rpx;
  margin-bottom: 20rpx;
}

.login-btn:active {
  background-color: #06ad56;
}

.wechat-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 15rpx;
}

.login-text {
  font-size: 32rpx;
}

.login-tip {
  font-size: 24rpx;
  color: #999;
  text-align: center;
}

/* 退出登录按钮 */
.logout-container {
  padding: 40rpx 30rpx;
}

.logout-btn {
  width: 100%;
  background-color: #ff4d4f;
  color: white;
  text-align: center;
  padding: 25rpx 0;
  border-radius: 10rpx;
  font-size: 32rpx;
}

.logout-btn:active {
  background-color: #ff7875;
}
</style>
