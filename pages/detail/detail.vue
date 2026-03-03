<template>
  <view class="detail-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 详情内容 -->
    <scroll-view v-else class="detail-scroll" scroll-y refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <!-- 顶部信息卡片 -->
      <view class="info-card card">
        <!-- 类型和状态 -->
        <view class="detail-header">
          <view class="detail-type">
            <view :class="['type-tag', getTypeClass(gameDetail.type)]">
              {{ getTypeText(gameDetail.type) }}
            </view>
          </view>
          <view :class="['status-tag', gameDetail.isFull ? 'tag-status-full' : 'tag-status']">
            {{ gameDetail.isFull ? '已满员' : `缺${gameDetail.maxPlayers - gameDetail.currentPlayers}人` }}
          </view>
        </view>

        <!-- 活动标题 -->
        <view class="detail-title">
          <text class="title-text">{{ gameDetail.title }}</text>
        </view>

        <!-- 具体项目 -->
        <view class="detail-project">
          <text class="project-text">{{ gameDetail.project }}</text>
        </view>

        <!-- 活动信息 -->
        <view class="detail-info">
          <view class="info-item">
            <view class="info-icon">
              <image src="/static/icons/time.png" />
            </view>
            <view class="info-content">
              <text class="info-label">活动时间</text>
              <text class="info-value">{{ formatDateTime(gameDetail.time) }}</text>
            </view>
          </view>

          <view class="info-item">
            <view class="info-icon">
              <image src="/static/icons/location.png" />
            </view>
            <view class="info-content">
              <text class="info-label">活动地点</text>
              <text class="info-value">{{ gameDetail.location }}</text>
            </view>
          </view>

          <view class="info-item">
            <view class="info-icon">
              <image src="/static/icons/people.png" />
            </view>
            <view class="info-content">
              <text class="info-label">参与人数</text>
              <text class="info-value">{{ gameDetail.currentPlayers }}/{{ gameDetail.maxPlayers }}人</text>
            </view>
          </view>

          <view v-if="gameDetail.description" class="info-item">
            <view class="info-icon">
              <image src="/static/icons/description.png" />
            </view>
            <view class="info-content">
              <text class="info-label">补充说明</text>
              <text class="info-value description-text">{{ gameDetail.description }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 创建者信息 -->
      <view v-if="gameDetail.creatorInfo" class="creator-card card">
        <view class="section-title">创建者</view>
        <view class="creator-info">
          <image :src="gameDetail.creatorInfo.avatar || '/static/avatar-default.png'" class="creator-avatar" />
          <view class="creator-detail">
            <text class="creator-name">{{ gameDetail.creatorInfo.nickname || '未知用户' }}</text>
            <view v-if="gameDetail.creatorTags && gameDetail.creatorTags.length > 0" class="creator-tags">
              <view v-for="tag in gameDetail.creatorTags" :key="tag" class="creator-tag">
                {{ tag }}
              </view>
            </view>
          </view>
        </view>
        <view v-if="gameDetail.creatorContact" class="creator-contact">
          <text class="contact-text">{{ gameDetail.creatorContact }}</text>
        </view>
      </view>

      <!-- 参与者列表 -->
      <view class="players-card card">
        <view class="section-title">已加入玩家 ({{ gameDetail.currentPlayers }})</view>
        
        <!-- 空状态 -->
        <view v-if="gameDetail.players && gameDetail.players.length === 0" class="empty-players">
          <image src="/static/empty-players.png" class="empty-players-img" />
          <text class="empty-players-text">暂无玩家加入，快来成为第一个吧！</text>
        </view>

        <!-- 玩家列表 -->
        <view v-else-if="gameDetail.players && gameDetail.players.length > 0" class="players-list">
          <view 
            v-for="(player, index) in gameDetail.players" 
            :key="index"
            class="player-item"
          >
            <image :src="player.avatar || '/static/avatar-default.png'" class="player-avatar" />
            <view class="player-info">
              <text class="player-name">{{ player.nickname || '玩家' + (index + 1) }}</text>
              <view v-if="player.isCreator" class="player-role">
                创建者
              </view>
            </view>
            <view v-if="player.joinTime" class="player-time">
              加入于 {{ formatRelativeTime(player.joinTime) }}
            </view>
          </view>
        </view>
      </view>

      <!-- 操作记录 -->
      <view v-if="gameDetail.activities && gameDetail.activities.length > 0" class="activity-card card">
        <view class="section-title">操作记录</view>
        <view class="activity-list">
          <view 
            v-for="(activity, index) in gameDetail.activities" 
            :key="index"
            class="activity-item"
          >
            <view class="activity-icon">
              <image :src="getActivityIcon(activity.type)" />
            </view>
            <view class="activity-content">
              <text class="activity-text">{{ activity.text || '未知操作' }}</text>
              <text class="activity-time">{{ formatRelativeTime(activity.createdAt) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="safe-area"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="!loading" class="action-bar">
      <view class="action-buttons">
        <!-- 分享按钮 -->
        <view class="share-btn" @tap="handleShare">
          <image src="/static/icons/share.png" class="share-icon" />
          <text class="share-text">分享</text>
        </view>

        <!-- 加入/退出按钮 -->
        <view 
          v-if="!gameDetail.isJoined && !gameDetail.isFull"
          class="join-btn"
          @tap="handleJoin"
        >
          立即加入
        </view>

        <view 
          v-if="gameDetail.isJoined && !gameDetail.isCreator"
          class="quit-btn"
          @tap="handleQuit"
        >
          退出组局
        </view>

        <!-- 创建者操作 -->
        <view 
          v-if="gameDetail.isCreator"
          class="creator-actions"
        >
          <view class="edit-btn" @tap="handleEdit">
            编辑
          </view>
          <view class="cancel-btn" @tap="handleCancel">
            取消组局
          </view>
        </view>

        <!-- 已满员提示 -->
        <view 
          v-if="gameDetail.isFull && !gameDetail.isJoined"
          class="full-btn disabled"
        >
          已满员
        </view>

        <!-- 已加入提示 -->
        <view 
          v-if="gameDetail.isJoined && !gameDetail.isCreator"
          class="joined-btn disabled"
        >
          已加入
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { gameActions } from '@/utils/store.js'
import UserService from '@/utils/user.js'

// 响应式数据
const gameDetail = ref({
  creatorInfo: {},
  players: [],
  activities: []
})
const loading = ref(true)
const refreshing = ref(false)
const gameId = ref('')
const userId = ref('')

onLoad(async (options) => {
  if (options.id) {
    gameId.value = options.id
    console.log('开始加载组局详情，ID:', gameId.value)
    
    // 获取当前用户ID
    const currentUser = UserService.getCurrentUser()
    if (currentUser && currentUser.id) {
      userId.value = currentUser.id
    }
    
    // 从服务器获取游戏详情
    await loadGameDetail()
  } else {
    console.error('未传递游戏ID')
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

// loadGameDetail函数
const loadGameDetail = async () => {
  loading.value = true
  
  try {
    console.log('调用gameActions.getGameDetail，参数:', { gameId: gameId.value })
    const result = await gameActions.getGameDetail(gameId.value)
    console.log('获取组局详情结果:', result)
    
    if (result && result.code === 0) {
      const gameData = result.data || result
      console.log('游戏数据:', gameData)
      
      if (gameData) {
        // 确保有必要的字段
        const currentUser = UserService.getCurrentUser()
        const currentUserId = currentUser ? currentUser.id : ''
        
        // 计算是否已加入
        let isJoined = false
        if (gameData.participants && Array.isArray(gameData.participants)) {
          isJoined = gameData.participants.includes(currentUserId)
        } else if (gameData.players && Array.isArray(gameData.players)) {
          isJoined = gameData.players.some(player => player.id === currentUserId || player._id === currentUserId)
        }
        
        // 计算是否已满员
        const isFull = (gameData.currentPlayers || 1) >= (gameData.maxPlayers || 4)
        
        // 计算是否是创建者
        const isCreator = gameData.creatorId === currentUserId
        
        // 处理玩家数据
        let players = []
        if (gameData.players && Array.isArray(gameData.players)) {
          players = gameData.players
        } else if (gameData.participants && Array.isArray(gameData.participants)) {
          // 如果只有参与者ID数组，需要转换为玩家对象
          players = gameData.participants.map((participantId, index) => ({
            id: participantId,
            nickname: `玩家${index + 1}`,
            avatar: '/static/avatar-default.png',
            isCreator: participantId === gameData.creatorId
          }))
        }
        
        // 确保创建者信息存在
        const creatorInfo = gameData.creatorInfo || { 
          nickname: '未知用户', 
          avatar: '/static/avatar-default.png' 
        }
        
        gameDetail.value = {
          ...gameData,
          id: gameData._id || gameData.id,
          creatorInfo: creatorInfo,
          players: players,
          activities: gameData.activities || [],
          currentPlayers: gameData.currentPlayers || 1,
          maxPlayers: gameData.maxPlayers || 4,
          status: gameData.status || 'pending',
          isFull: isFull,
          isJoined: isJoined,
          isCreator: isCreator
        }
        console.log('设置游戏数据:', gameDetail.value)
      } else {
        throw new Error('游戏数据为空')
      }
    } else {
      throw new Error(result?.message || '获取游戏详情失败')
    }
  } catch (error) {
    console.error('加载组局详情失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  loadGameDetail()
}

// 获取类型样式
const getTypeClass = (type) => {
  const classMap = {
    'mahjong': 'tag-mahjong',
    'boardgame': 'tag-boardgame',
    'videogame': 'tag-videogame'
  }
  return classMap[type] || 'tag-mahjong'
}

// 获取类型文字
const getTypeText = (type) => {
  const textMap = {
    'mahjong': '日麻',
    'boardgame': '桌游',
    'videogame': '电玩'
  }
  return textMap[type] || '日麻'
}

// 获取活动图标
const getActivityIcon = (type) => {
  const iconMap = {
    'create': '/static/icons/create.png',
    'join': '/static/icons/join.png',
    'quit': '/static/icons/quit.png',
    'cancel': '/static/icons/cancel.png'
  }
  return iconMap[type] || '/static/icons/default.png'
}

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return ''
  
  const date = new Date(datetime)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24))
  
  let dateStr = ''
  if (diffDays === 0) {
    dateStr = '今天'
  } else if (diffDays === 1) {
    dateStr = '明天'
  } else if (diffDays === 2) {
    dateStr = '后天'
  } else {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
  }
  
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${dateStr} ${hours}:${minutes}`
}

// 格式化相对时间
const formatRelativeTime = (datetime) => {
  if (!datetime) return ''
  
  const date = new Date(datetime)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) {
    return '刚刚'
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

// 加入组局
const handleJoin = async () => {
  const currentUser = UserService.getCurrentUser()
  if (!currentUser) {
    uni.showModal({
      title: '需要登录',
      content: '请先登录后再加入组局',
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
  
  uni.showModal({
    title: '确认加入',
    content: '确定要加入这个组局吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({
          title: '加入中...',
          mask: true
        })
        
        try {
          // 调用云函数加入组局
          const result = await wx.cloud.callFunction({
            name: 'game-service',
            data: {
              action: 'joinGame',
              data: {
                gameId: gameId.value,
                userId: currentUser.id
              }
            }
          })
          
          console.log('加入组局结果:', result)
          
          if (result.result && result.result.code === 0) {
            // 重新加载详情
            await loadGameDetail()
            
            uni.showToast({
              title: '加入成功',
              icon: 'success'
            })
          } else {
            uni.showToast({
              title: result.result?.message || '加入失败',
              icon: 'none'
            })
          }
          
        } catch (error) {
          console.error('加入组局失败:', error)
          uni.showToast({
            title: error.message || '加入失败',
            icon: 'none'
          })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 退出组局
const handleQuit = async () => {
  const currentUser = UserService.getCurrentUser()
  if (!currentUser) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }
  
  uni.showModal({
    title: '确认退出',
    content: '确定要退出这个组局吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({
          title: '退出中...',
          mask: true
        })
        
        try {
          // 调用云函数退出组局
          const result = await wx.cloud.callFunction({
            name: 'game-service',
            data: {
              action: 'quitGame',
              data: {
                gameId: gameId.value,
                userId: currentUser.id
              }
            }
          })
          
          console.log('退出组局结果:', result)
          
          if (result.result && result.result.code === 0) {
            // 重新加载详情
            await loadGameDetail()
            
            uni.showToast({
              title: '已退出',
              icon: 'success'
            })
          } else {
            uni.showToast({
              title: result.result?.message || '退出失败',
              icon: 'none'
            })
          }
          
        } catch (error) {
          console.error('退出组局失败:', error)
          uni.showToast({
            title: error.message || '退出失败',
            icon: 'none'
          })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 分享
const handleShare = () => {
  uni.showActionSheet({
    itemList: ['分享给好友', '生成分享图'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 小程序分享会自动触发onShareAppMessage
        uni.showShareMenu({
          withShareTicket: true
        })
      } else {
        uni.showModal({
          title: '功能开发中',
          content: '生成分享图功能开发中，敬请期待',
          showCancel: false
        })
      }
    }
  })
}

// 编辑
const handleEdit = () => {
  // 跳转到编辑页面
  uni.navigateTo({
    url: `/pages/create/create?edit=1&id=${gameId.value}`
  })
}

// 取消组局
const handleCancel = () => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个组局吗？此操作不可撤销。',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({
          title: '取消中...',
          mask: true
        })
        
        try {
          // 调用云函数取消组局
          const result = await wx.cloud.callFunction({
            name: 'game-service',
            data: {
                action: 'deleteGame',
                data: { gameId: gameId.value }
              }
            })
            
            console.log('取消组局结果:', result)
            
            if (result.result && result.result.code === 0) {
              uni.showToast({
                title: '组局已取消',
                icon: 'success'
              })
              
              setTimeout(() => {
                uni.navigateBack()
              }, 1500)
            } else {
              throw new Error(result.result?.message || '取消失败')
            }
            
          } catch (error) {
            console.error('取消失败:', error)
            uni.showToast({
              title: error.message || '取消失败',
              icon: 'none'
            })
          } finally {
            uni.hideLoading()
          }
        }
      }
    })
  }

  // 分享配置
  onShareAppMessage(() => {
    return {
      title: `玩咖约局：${gameDetail.value.title}`,
      path: `/pages/detail/detail?id=${gameId.value}`,
      imageUrl: gameDetail.value.creatorInfo?.avatar || '/static/share-default.jpg'
    }
  })

  // 分享到朋友圈
  onShareTimeline(() => {
    return {
      title: `玩咖约局：${gameDetail.value.title}`,
      query: `id=${gameId.value}`
    }
  })
</script>

<style scoped>
.detail-container {
  height: 100vh;
  background-color: #f8f8f8;
  position: relative;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
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

/* 详情滚动区域 */
.detail-scroll {
  height: calc(100vh - 120rpx);
  padding-bottom: 120rpx;
}

/* 信息卡片样式 */
.info-card {
  margin: 20rpx;
  padding: 30rpx;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.detail-title {
  margin-bottom: 10rpx;
}

.title-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
}

.detail-project {
  margin-bottom: 30rpx;
}

.project-text {
  font-size: 32rpx;
  color: #666;
  line-height: 1.4;
}

/* 详情信息样式 */
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 25rpx;
}

.info-item {
  display: flex;
  align-items: flex-start;
}

.info-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon image {
  width: 100%;
  height: 100%;
  opacity: 0.7;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 5rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
}

.description-text {
  white-space: pre-wrap;
  word-break: break-word;
}

/* 分区卡片样式 */
.creator-card,
.players-card,
.activity-card {
  margin: 0 20rpx 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 25rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

/* 创建者信息 */
.creator-info {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.creator-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  border: 2rpx solid #07c160;
}

.creator-detail {
  flex: 1;
}

.creator-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}

.creator-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.creator-tag {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.creator-contact {
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  border-left: 4rpx solid #07c160;
}

.contact-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

/* 玩家列表 */
.empty-players {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
}

.empty-players-img {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-players-text {
  font-size: 28rpx;
  color: #999;
  text-align: center;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.player-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
}

.player-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  border: 2rpx solid #e0e0e0;
}

.player-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.player-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 5rpx;
}

.player-role {
  background-color: #07c160;
  color: white;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  font-size: 20rpx;
  align-self: flex-start;
}

.player-time {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

/* 操作记录 */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 15rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon image {
  width: 100%;
  height: 100%;
  opacity: 0.7;
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.activity-text {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 5rpx;
  line-height: 1.4;
}

.activity-time {
  font-size: 24rpx;
  color: #999;
}

/* 底部操作栏 */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
  z-index: 100;
  box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.05);
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

/* 分享按钮 */
.share-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.share-btn:active {
  background-color: #f0f0f0;
}

.share-icon {
  width: 40rpx;
  height: 40rpx;
  margin-bottom: 5rpx;
}

.share-text {
  font-size: 24rpx;
  color: #666;
}

/* 主要操作按钮 */
.join-btn,
.quit-btn,
.edit-btn,
.cancel-btn,
.full-btn,
.joined-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: 500;
  transition: all 0.3s;
}

.join-btn {
  background-color: #07c160;
  color: white;
}

.join-btn:active {
  background-color: #06ad56;
  transform: translateY(2rpx);
}

.quit-btn {
  background-color: #ff4d4f;
  color: white;
}

.quit-btn:active {
  background-color: #ff7875;
  transform: translateY(2rpx);
}

/* 创建者操作 */
.creator-actions {
  display: flex;
  gap: 20rpx;
  flex: 1;
}

.edit-btn {
  background-color: #1890ff;
  color: white;
}

.edit-btn:active {
  background-color: #096dd9;
  transform: translateY(2rpx);
}

.cancel-btn {
  background-color: #ff4d4f;
  color: white;
}

.cancel-btn:active {
  background-color: #ff7875;
  transform: translateY(2rpx);
}

/* 禁用状态 */
.full-btn.disabled,
.joined-btn.disabled {
  background-color: #cccccc;
  color: white;
}

/* 安全区域 */
.safe-area {
  height: env(safe-area-inset-bottom);
  min-height: 20rpx;
  padding-bottom: 120rpx;
}
</style>