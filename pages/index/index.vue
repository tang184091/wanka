<template>
  <view class="container">
    <!-- 顶部筛选栏 -->
    <view class="filter-bar">
      <view class="type-row top">
        <view
          class="type-tab quarter-btn"
          :class="{ active: activeTab === 'all' }"
          @tap="switchTab('all')"
        >
          全部
        </view>
        <view
          v-for="tab in firstRowTabs"
          :key="tab.id"
          class="type-tab quarter-btn"
          :class="{ active: activeTab === tab.id }"
          @tap="switchTab(tab.id)"
        >
          {{ tab.name }}
        </view>
      </view>

      <view class="type-row bottom">
        <view
          v-for="tab in secondRowTabs"
          :key="tab.id"
          class="type-tab quarter-btn"
          :class="{ active: activeTab === tab.id }"
          @tap="switchTab(tab.id)"
        >
          {{ tab.name }}
        </view>
        <view class="type-tab create-btn quarter-btn" @tap="goToCreate">
          <text>+ 创建</text>
        </view>
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
            <view :class="['game-status-tag', getGameStatusClass(game.status)]">
              {{ getGameStatusText(game.status) }}
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
            <image :src="icons.time" class="info-icon" />
            <text class="info-text">{{ formatTime(game.time) }}</text>
          </view>
          <view class="info-item">
            <image :src="icons.location" class="info-icon" />
            <text class="info-text">{{ game.location }}</text>
          </view>
          <view class="info-item">
            <image :src="icons.people" class="info-icon" />
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
        <view class="action-btn" v-if="game.status === 'pending' && !game.isFull && !game.isJoined">
          <view class="join-btn" @tap.stop="joinGame(game.id || game._id)">
            立即加入
          </view>
        </view>
        <view v-if="game.status === 'pending' && game.isJoined" class="action-btn">
          <view class="joined-btn">
            已加入
          </view>
        </view>
        <view v-if="game.status === 'pending' && game.isFull && !game.isJoined" class="action-btn">
          <view class="full-btn">
            已满员
          </view>
        </view>
        <view v-if="game.status === 'ongoing' && canCompleteGame(game)" class="action-btn">
          <view class="complete-btn" @tap.stop="markCompleted(game)">
            标记已完成
          </view>
        </view>
        <view v-if="isAdminUser()" class="action-btn">
          <view class="admin-delete-btn" @tap.stop="adminDeleteGame(game)">
            删除组局
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
import * as icons from '@/utils/icons.js'
import { resolveCloudFileUrls } from '@/utils/cloud-image.js'

// 响应式数据
const tabs = ref([
  { id: 'mahjong', name: '立直麻将' },
  { id: 'boardgame', name: '桌游' },
  { id: 'videogame', name: '电玩' },
  { id: 'cardgame', name: '打牌' },
  { id: 'competition', name: '比赛' },
  { id: 'ongoing', name: '进行中' }
])

const activeTab = ref('all')
const gameList = ref([])
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = ref(10)
const firstRowTabs = ref(tabs.value.slice(0, 3))
const secondRowTabs = ref(tabs.value.slice(3, 6))

const normalizeGamesAvatarUrls = async (games = []) => {
  if (!Array.isArray(games) || !games.length) return games
  const avatarList = []
  games.forEach((game) => {
    const players = Array.isArray(game?.players) ? game.players : []
    players.forEach((player) => {
      avatarList.push(player?.avatar || '')
    })
  })

  const resolved = await resolveCloudFileUrls(avatarList)
  let offset = 0
  games.forEach((game) => {
    const players = Array.isArray(game?.players) ? game.players : []
    players.forEach((player) => {
      const nextAvatar = resolved[offset]
      if (nextAvatar) {
        player.avatar = nextAvatar
      }
      offset += 1
    })
  })
  return games
}

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
    'videogame': 'tag-videogame',
    'cardgame': 'tag-cardgame',
    'competition': 'tag-competition'
  }
  return classMap[type] || 'tag-mahjong'
}

// 获取类型文字
const getTypeText = (type) => {
  const textMap = {
    'mahjong': '立直麻将',
    'boardgame': '桌游',
    'videogame': '电玩',
    'cardgame': '打牌',
    'competition': '比赛'
  }
  return textMap[type] || '立直麻将'
}

const getCurrentUser = () => UserService.getCurrentUser() || null

const canCompleteGame = (game) => {
  if (!game || game.status !== 'ongoing') return false
  const user = getCurrentUser()
  if (!user) return false
  const userId = String(user.id || user._id || '')
  if (!userId) return false
  if (user.isAdmin) return true
  if (String(game.creatorId || '') === userId) return true
  return !!game.isJoined
}

const isAdminUser = () => {
  const user = getCurrentUser()
  return !!user?.isAdmin
}

const getGameStatusText = (status) => {
  const textMap = {
    pending: '预约中',
    ongoing: '进行中',
    completed: '已完成'
  }
  return textMap[status] || '预约中'
}

const getGameStatusClass = (status) => {
  const classMap = {
    pending: 'status-pending',
    ongoing: 'status-ongoing',
    completed: 'status-completed'
  }
  return classMap[status] || 'status-pending'
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
    
    if (activeTab.value === 'ongoing') {
      params.status = 'ongoing'
    } else if (activeTab.value !== 'all') {
      params.type = activeTab.value
    }
    
    console.log('调用参数:', params)
    
    // 通过 store.js 调用云函数
    const games = await gameActions.getGameList(params)
    console.log('获取到的组局列表:', games)
    
    if (games && Array.isArray(games)) {
      const displayGames = await normalizeGamesAvatarUrls(games)
      // 检查当前用户是否已加入每个组局
      const currentUser = UserService.getCurrentUser()
      if (currentUser) {
        const userId = currentUser.id
        displayGames.forEach(game => {
          // 注意：云函数返回的数据中 isJoined 字段已由后端计算
          // 这里做双重保险
          if (game.participants && Array.isArray(game.participants)) {
            game.isJoined = game.participants.includes(userId)
          }
        })
      }
      
      // 分页加载
      if (currentPage.value === 1) {
        gameList.value = displayGames
      } else {
        gameList.value = [...gameList.value, ...displayGames]
      }
      
      hasMore.value = displayGames.length >= pageSize.value
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
const markCompleted = async (game) => {
  const gameId = game.id || game._id
  if (!gameId) return
  if (!canCompleteGame(game)) {
    uni.showToast({ title: '无权限操作', icon: 'none' })
    return
  }
  uni.showModal({
    title: '确认完成',
    content: '将该进行中组局标记为已完成？',
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '提交中...', mask: true })
      try {
        const result = await wx.cloud.callFunction({
          name: 'game-service',
          data: { action: 'completeGame', data: { gameId } }
        })
        if (result?.result?.code === 0) {
          uni.showToast({ title: '已标记完成', icon: 'success' })
          currentPage.value = 1
          gameList.value = []
          hasMore.value = true
          await loadGameList()
        } else {
          throw new Error(result?.result?.message || '操作失败')
        }
      } catch (error) {
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const adminDeleteGame = async (game) => {
  const gameId = game?.id || game?._id
  if (!gameId) return
  if (!isAdminUser()) {
    uni.showToast({ title: '仅管理员可操作', icon: 'none' })
    return
  }
  uni.showModal({
    title: '确认删除组局',
    content: '删除后不可恢复，确认继续？',
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '删除中...', mask: true })
      try {
        const result = await wx.cloud.callFunction({
          name: 'game-service',
          data: { action: 'adminDeleteGame', data: { gameId } }
        })
        if (result?.result?.code === 0) {
          uni.showToast({ title: '已删除', icon: 'success' })
          currentPage.value = 1
          gameList.value = []
          hasMore.value = true
          await loadGameList()
        } else {
          throw new Error(result?.result?.message || '删除失败')
        }
      } catch (error) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}
</script>

<style scoped>
.container {
  padding: 0;
}

/* 筛选栏样式 */
.filter-bar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 20rpx 30rpx;
  background-color: white;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
  gap: 10rpx;
}

/* const markCompleted = async (game) => {
  const gameId = game.id || game._id
  if (!gameId) return
  if (!canCompleteGame(game)) {
    uni.showToast({ title: '无权限操作', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认完成',
    content: '将该进行中组局标记为已完成？',
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '提交中...', mask: true })
      try {
        const result = await wx.cloud.callFunction({
          name: 'game-service',
          data: { action: 'completeGame', data: { gameId } }
        })
        if (result?.result?.code === 0) {
          uni.showToast({ title: '已标记完成', icon: 'success' })
          currentPage.value = 1
          gameList.value = []
          hasMore.value = true
          await loadGameList()
        } else {
          throw new Error(result?.result?.message || '操作失败')
        }
      } catch (error) {
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
} */

.type-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.type-row.top {
  justify-content: space-between;
}

.type-row.bottom {
  justify-content: flex-start;
}

.type-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16rpx;
  height: 60rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  color: #666;
  background-color: #f5f5f5;
  white-space: nowrap;
  box-sizing: border-box;
}

.quarter-btn {
  width: calc((100% - 48rpx) / 4);
  flex-shrink: 0;
}

.type-tab.active {
  background-color: #07c160;
  color: white;
}

.create-btn {
  background-color: #07c160;
  color: white;
  border-color: transparent;
}

.create-btn:active {
  background-color: #06ad56;
}

/* 组局列表样式 */
.game-list {
  height: calc(100vh - 230rpx);
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
  gap: 10rpx;
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

.tag-cardgame {
  background-color: #ecfeff;
  color: #0891b2;
}

.tag-competition {
  background-color: #f3e8ff;
  color: #7c3aed;
}

.status-tag {
  padding: 6rpx 20rpx;
  border-radius: 4rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.game-status-tag {
  padding: 6rpx 16rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.status-pending {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.status-ongoing {
  background-color: #ffedd5;
  color: #c2410c;
}

.status-completed {
  background-color: #e5e7eb;
  color: #4b5563;
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

.complete-btn {
  padding: 15rpx 32rpx;
  background-color: #fb923c;
  color: #fff;
  border-radius: 30rpx;
  font-size: 28rpx;
}
.admin-delete-btn {
  margin-top: 16rpx;
  padding: 15rpx 40rpx;
  background-color: #ef4444;
  color: #fff;
  border-radius: 30rpx;
  font-size: 28rpx;
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
