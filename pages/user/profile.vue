<template>
  <view class="profile-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 用户信息 -->
    <scroll-view v-else class="profile-scroll" scroll-y>
      <!-- 用户头像和昵称 -->
      <view class="user-header card">
        <view class="avatar-section">
          <image :src="userInfo.avatar || constants.DEFAULT_AVATAR" class="user-avatar" mode="aspectFill" />
          <view class="user-basic">
            <text class="user-nickname">{{ userInfo.nickname || '未知用户' }}</text>
            <view v-if="userInfo.gender" class="user-gender">
              <image 
                :src="userInfo.gender === 1 ? '/static/icons/male.png' : '/static/icons/female.png'" 
                class="gender-icon" 
              />
            </view>
          </view>
        </view>
        
        <!-- 用户标签 -->
        <view v-if="userInfo.tags && userInfo.tags.length > 0" class="user-tags">
          <view 
            v-for="(tag, index) in userInfo.tags" 
            :key="index"
            class="user-tag"
          >
            {{ tag }}
          </view>
        </view>
      </view>

      <!-- 统计信息 -->
      <view class="stats-section card">
        <view class="section-title">统计数据</view>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-value">{{ stats.createdCount || 0 }}</text>
            <text class="stat-label">创建组局</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ stats.joinedCount || 0 }}</text>
            <text class="stat-label">参与组局</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ stats.completedCount || 0 }}</text>
            <text class="stat-label">完成组局</text>
          </view>
        </view>
      </view>

      <!-- 创建的组局 -->
      <view v-if="createdGames.length > 0" class="games-section card">
        <view class="section-title">创建的组局</view>
        <view class="games-list">
          <view 
            v-for="game in createdGames" 
            :key="game.id"
            class="game-item"
            @tap="goToGameDetail(game.id)"
          >
            <view class="game-header">
              <view :class="['type-tag', getTypeClass(game.type)]">
                {{ getTypeText(game.type) }}
              </view>
              <view :class="['status-tag', getStatusClass(game.status)]">
                {{ getStatusText(game.status) }}
              </view>
            </view>
            <view class="game-title">{{ game.title || '未命名' }}</view>
            <view class="game-time">{{ formatDateTime(game.time) }}</view>
            <view class="game-info">
              <view class="info-item">
                <image src="/static/icons/location.png" class="info-icon" />
                <text class="info-text">{{ game.location || '未设置地点' }}</text>
              </view>
              <view class="info-item">
                <image src="/static/icons/people.png" class="info-icon" />
                <text class="info-text">{{ game.currentPlayers || 0 }}/{{ game.maxPlayers }}人</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 参与的组局 -->
      <view v-if="joinedGames.length > 0" class="games-section card">
        <view class="section-title">参与的组局</view>
        <view class="games-list">
          <view 
            v-for="game in joinedGames" 
            :key="game.id"
            class="game-item"
            @tap="goToGameDetail(game.id)"
          >
            <view class="game-header">
              <view :class="['type-tag', getTypeClass(game.type)]">
                {{ getTypeText(game.type) }}
              </view>
              <view class="creator-info">
                <image :src="game.creatorInfo?.avatar || constants.DEFAULT_AVATAR" class="creator-avatar" />
                <text class="creator-name">{{ game.creatorInfo?.nickname || '未知用户' }}</text>
              </view>
            </view>
            <view class="game-title">{{ game.title || '未命名' }}</view>
            <view class="game-time">{{ formatDateTime(game.time) }}</view>
            <view class="game-info">
              <view class="info-item">
                <image src="/static/icons/location.png" class="info-icon" />
                <text class="info-text">{{ game.location || '未设置地点' }}</text>
              </view>
              <view class="info-item">
                <image src="/static/icons/people.png" class="info-icon" />
                <text class="info-text">{{ game.currentPlayers || 0 }}/{{ game.maxPlayers }}人</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-area"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import constants from '@/utils/constants.js'
import { gameActions } from '@/utils/store.js'

// 响应式数据
const loading = ref(true)
const userId = ref('')
const userInfo = ref({})
const stats = ref({})
const createdGames = ref([])
const joinedGames = ref([])

// 页面加载
onLoad(async (options) => {
  if (options.userId) {
    userId.value = options.userId
    await loadUserProfile()
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

// 加载用户资料
const loadUserProfile = async () => {
  loading.value = true
  try {
    // 这里应该调用获取用户信息的云函数
    // 暂时模拟数据
    await loadUserInfo()
    await loadUserGames()
    await loadUserStats()
  } catch (error) {
    console.error('加载用户资料失败:', error)
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  // 这里应该调用云函数获取用户信息
  // 暂时返回模拟数据
  userInfo.value = {
    nickname: '测试用户',
    avatar: constants.DEFAULT_AVATAR,
    gender: 1,
    tags: ['麻将爱好者', '桌游高手']
  }
}

// 加载用户游戏
const loadUserGames = async () => {
  try {
    // 获取创建的组局
    const createdResult = await gameActions.getCreatedGames()
    if (createdResult && createdResult.code === 0) {
      createdGames.value = createdResult.data || []
    }
    
    // 获取参与的组局
    const joinedResult = await gameActions.getJoinedGames()
    if (joinedResult && joinedResult.code === 0) {
      joinedGames.value = joinedResult.data || []
    }
  } catch (error) {
    console.error('加载用户游戏失败:', error)
  }
}

// 加载用户统计
const loadUserStats = async () => {
  // 这里应该调用云函数获取用户统计
  // 暂时返回模拟数据
  stats.value = {
    createdCount: createdGames.value.length,
    joinedCount: joinedGames.value.length,
    completedCount: Math.floor(createdGames.value.length + joinedGames.value.length / 2)
  }
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
    'mahjong': '立直麻将',
    'boardgame': '桌游',
    'videogame': '电玩'
  }
  return textMap[type] || '立直麻将'
}

// 获取状态样式
const getStatusClass = (status) => {
  const classMap = {
    'pending': 'status-pending',
    'full': 'status-full',
    'ongoing': 'status-ongoing',
    'cancelled': 'status-cancelled',
    'finished': 'status-finished'
  }
  return classMap[status] || 'status-pending'
}

// 获取状态文字
const getStatusText = (status) => {
  const textMap = {
    'pending': '招募中',
    'full': '已满员',
    'ongoing': '进行中',
    'cancelled': '已取消',
    'finished': '已结束'
  }
  return textMap[status] || '招募中'
}

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return ''
  
  const date = new Date(datetime)
  const now = new Date()
  const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '明天'
  } else if (diffDays === 2) {
    return '后天'
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

// 跳转到游戏详情
const goToGameDetail = (gameId) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${gameId}`
  })
}
</script>

<style scoped>
/* 样式代码省略，根据实际需要编写 */
</style>