<template>
  <view class="container">
    <!-- 顶部筛选栏 -->
    <view class="filter-bar">
      <scroll-view class="type-tabs" scroll-x>
        <view 
          v-for="tab in tabs" 
          :key="tab.id"
          class="type-tab"
          :class="{ active: activeTab === tab.id }"
          @tap="switchTab(tab.id)"
        >
          {{ tab.name }}
        </view>
      </scroll-view>
      
      <view class="create-btn" @tap="goToCreate">
        <text>+ 创建</text>
      </view>
    </view>

    <!-- 组局列表 -->
    <scroll-view 
      class="game-list" 
      scroll-y 
      refresher-enabled 
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <!-- 刷新提示 -->
      <view v-if="refreshing" class="refresh-tip">
        <text>刷新中...</text>
      </view>

      <!-- 空状态 -->
      <view v-if="gameList.length === 0 && !loading" class="empty-state">
        <image src="/static/empty.png" class="empty-image" />
        <text class="empty-text">暂无组局，快来创建一个吧！</text>
        <view class="empty-btn" @tap="goToCreate">
          创建第一个组局
        </view>
      </view>

      <!-- 组局卡片 -->
      <view 
        v-for="game in gameList" 
        :key="game.id || game._id"
        class="game-card card"
        @tap="goToDetail(game.id || game._id)"
      >
        <!-- 顶部类型和状态 -->
        <view class="card-header">
          <view class="game-type">
            <view :class="['type-tag', getTypeClass(game.type)]">
              {{ getTypeText(game.type) }}
            </view>
          </view>
          <view :class="['status-tag', game.isFull ? 'tag-status-full' : 'tag-status']">
            {{ game.isFull ? '已满员' : `缺${game.maxPlayers - game.currentPlayers}人` }}
          </view>
        </view>

        <!-- 游戏标题和具体项目 -->
        <view class="game-title">
          <text class="title-text">{{ game.title }}</text>
        </view>
        <view class="game-project">
          <text class="project-text">{{ game.project }}</text>
        </view>

        <!-- 活动信息 -->
        <view class="game-info">
          <view class="info-item">
            <image src="/static/icons/time.png" class="info-icon" />
            <text class="info-text">{{ formatTime(game.time) }}</text>
          </view>
          <view class="info-item">
            <image src="/static/icons/location.png" class="info-icon" />
            <text class="info-text">{{ game.location }}</text>
          </view>
          <view class="info-item">
            <image src="/static/icons/people.png" class="info-icon" />
            <text class="info-text">{{ game.currentPlayers }}/{{ game.maxPlayers }}人</text>
          </view>
        </view>

        <!-- 玩家头像 -->
        <view class="player-avatars" v-if="game.players && game.players.length > 0">
          <view 
            v-for="(player, index) in game.players.slice(0, 5)" 
            :key="index"
            class="avatar-item"
          >
            <image :src="player.avatar" class="avatar" />
          </view>
          <view v-if="game.players.length > 5" class="more-players">
            +{{ game.players.length - 5 }}
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-btn" v-if="!game.isFull && !game.isJoined">
          <view class="join-btn" @tap.stop="joinGame(game.id || game._id)">
            立即加入
          </view>
        </view>
        <view v-if="game.isJoined" class="action-btn">
          <view class="joined-btn">
            已加入
          </view>
        </view>
        <view v-if="game.isFull && !game.isJoined" class="action-btn">
          <view class="full-btn">
            已满员
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loading" class="loading-tip">
        <text>加载中...</text>
      </view>
      <view v-if="hasMore && !loading" class="load-more" @tap="onLoadMore">
        <text>点击加载更多</text>
      </view>
      <view v-if="!hasMore && gameList.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { gameActions } from '@/utils/store.js'
import UserService from '@/utils/user.js'

// 响应式数据
const tabs = ref([
  { id: 'all', name: '全部' },
  { id: 'mahjong', name: '日麻' },
  { id: 'boardgame', name: '桌游' },
  { id: 'videogame', name: '电玩' }
])

const activeTab = ref('all')
const gameList = ref([])
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = ref(10)

// 切换标签
const switchTab = (tabId) => {
  activeTab.value = tabId
  currentPage.value = 1
  gameList.value = []
  hasMore.value = true
  loadGameList()
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

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  
  const now = new Date()
  const target = new Date(time)
  const diff = target - now
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return `今天 ${target.getHours().toString().padStart(2, '0')}:${target.getMinutes().toString().padStart(2, '0')}`
  } else if (diffDays === 1) {
    return `明天 ${target.getHours().toString().padStart(2, '0')}:${target.getMinutes().toString().padStart(2, '0')}`
  } else if (diffDays < 7) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${days[target.getDay()]} ${target.getHours().toString().padStart(2, '0')}:${target.getMinutes().toString().padStart(2, '0')}`
  } else {
    return `${target.getMonth() + 1}月${target.getDate()}日 ${target.getHours().toString().padStart(2, '0')}:${target.getMinutes().toString().padStart(2, '0')}`
  }
}

// 加载组局列表
const loadGameList = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    console.log('开始加载组局列表...')
    
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (activeTab.value !== 'all') {
      params.type = activeTab.value
    }
    
    console.log('调用参数:', params)
    
    // 通过 store.js 调用云函数
    const games = await gameActions.getGameList(params)
    console.log('获取到的组局列表:', games)
    
    if (games && Array.isArray(games)) {
      // 检查当前用户是否已加入每个组局
      const currentUser = UserService.getCurrentUser()
      if (currentUser) {
        const userId = currentUser.id
        games.forEach(game => {
          // 注意：云函数返回的数据中 isJoined 字段已由后端计算
          // 这里做双重保险
          if (game.participants && Array.isArray(game.participants)) {
            game.isJoined = game.participants.includes(userId)
          }
        })
      }
      
      // 分页加载
      if (currentPage.value === 1) {
        gameList.value = games
      } else {
        gameList.value = [...gameList.value, ...games]
      }
      
      hasMore.value = games.length >= pageSize.value
    } else {
      console.warn('返回数据格式异常:', games)
      gameList.value = []
      hasMore.value = false
    }
    
  } catch (error) {
    console.error('加载组局列表失败，完整错误:', error)
    
    // 清空列表
    if (currentPage.value === 1) {
      gameList.value = []
    }
    
    uni.showToast({
      title: '加载失败: ' + (error.message || '请检查网络'),
      icon: 'none',
      duration: 3000
    })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true
  currentPage.value = 1
  gameList.value = []
  hasMore.value = true
  loadGameList()
}

// 加载更多
const onLoadMore = () => {
  if (!hasMore.value || loading.value) return
  currentPage.value++
  loadGameList()
}

// 跳转到创建页面
const goToCreate = () => {
  const currentUser = UserService.getCurrentUser()
  if (!currentUser) {
    uni.showModal({
      title: '需要登录',
      content: '请先登录后再创建组局',
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
  
  uni.navigateTo({
    url: '/pages/create/create'
  })
}

// 跳转到详情页面
const goToDetail = (gameId) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${gameId}`
  })
}

// 加入组局
const joinGame = async (gameId) => {
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
          const result = await gameActions.joinGame(gameId, currentUser.id)
          
          if (result && result.success) {
            // 更新本地列表
            const gameIndex = gameList.value.findIndex(g => (g.id === gameId || g._id === gameId))
            if (gameIndex !== -1) {
              const game = gameList.value[gameIndex]
              game.currentPlayers = result.currentPlayers || game.currentPlayers + 1
              game.isJoined = true
              
              // 检查是否满员
              if (game.currentPlayers >= game.maxPlayers) {
                game.isFull = true
              }
              
              // 触发响应式更新
              gameList.value = [...gameList.value]
            }
            
            uni.showToast({
              title: '加入成功',
              icon: 'success',
              duration: 2000
            })
          } else {
            throw new Error(result?.message || '加入失败')
          }
          
        } catch (error) {
          console.error('加入组局失败:', error)
          uni.showToast({
            title: error.message || '加入失败',
            icon: 'none',
            duration: 3000
          })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 页面加载
onMounted(() => {
  console.log('首页加载，开始获取组局列表')
  loadGameList()
})
</script>

<style scoped>
.container {
  padding: 0;
}

/* 筛选栏样式 */
.filter-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: white;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.type-tabs {
  flex: 1;
  white-space: nowrap;
  height: 80rpx;
}

.type-tab {
  display: inline-block;
  padding: 0 30rpx;
  height: 60rpx;
  line-height: 60rpx;
  border-radius: 30rpx;
  margin-right: 20rpx;
  font-size: 28rpx;
  color: #666;
  background-color: #f5f5f5;
}

.type-tab.active {
  background-color: #07c160;
  color: white;
}

.create-btn {
  width: 120rpx;
  height: 60rpx;
  line-height: 60rpx;
  background-color: #07c160;
  color: white;
  border-radius: 30rpx;
  font-size: 28rpx;
  text-align: center;
  margin-left: 20rpx;
  flex-shrink: 0;
}

.create-btn:active {
  background-color: #06ad56;
}

/* 组局列表样式 */
.game-list {
  height: calc(100vh - 120rpx);
}

.refresh-tip {
  text-align: center;
  padding: 20rpx;
  color: #999;
  font-size: 28rpx;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-image {
  width: 300rpx;
  height: 300rpx;
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.empty-btn {
  padding: 20rpx 40rpx;
  background-color: #07c160;
  color: white;
  border-radius: 10rpx;
  font-size: 30rpx;
}

.empty-btn:active {
  background-color: #06ad56;
}

/* 游戏卡片样式 */
.game-card {
  margin: 20rpx;
  padding: 30rpx;
}

.game-card:active {
  background-color: #f8f8f8;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.game-type {
  display: flex;
  align-items: center;
}

.type-tag {
  padding: 6rpx 20rpx;
  border-radius: 4rpx;
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

.status-tag {
  padding: 6rpx 20rpx;
  border-radius: 4rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.tag-status {
  background-color: #e6f7ff;
  color: #1890ff;
}

.tag-status-full {
  background-color: #ffccc7;
  color: #ff4d4f;
}

.game-title {
  margin-bottom: 10rpx;
}

.title-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.game-project {
  margin-bottom: 20rpx;
}

.project-text {
  font-size: 30rpx;
  color: #666;
}

/* 活动信息样式 */
.game-info {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 15rpx;
  opacity: 0.7;
}

.info-text {
  font-size: 28rpx;
  color: #666;
  flex: 1;
}

/* 玩家头像样式 */
.player-avatars {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar-item {
  margin-right: -15rpx;
}

.avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  border: 2rpx solid white;
}

.more-players {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #999;
}

/* 操作按钮样式 */
.action-btn {
  display: flex;
  justify-content: flex-end;
}

.join-btn {
  padding: 15rpx 40rpx;
  background-color: #07c160;
  color: white;
  border-radius: 30rpx;
  font-size: 28rpx;
}

.join-btn:active {
  background-color: #06ad56;
}

.joined-btn {
  padding: 15rpx 40rpx;
  background-color: #cccccc;
  color: white;
  border-radius: 30rpx;
  font-size: 28rpx;
}

.full-btn {
  padding: 15rpx 40rpx;
  background-color: #ffccc7;
  color: #ff4d4f;
  border-radius: 30rpx;
  font-size: 28rpx;
  border: 1rpx solid #ff4d4f;
}

/* 加载提示样式 */
.loading-tip {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 28rpx;
}

.load-more {
  text-align: center;
  padding: 30rpx;
  color: #07c160;
  font-size: 28rpx;
}

.load-more:active {
  opacity: 0.7;
}

.no-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 28rpx;
}
</style>