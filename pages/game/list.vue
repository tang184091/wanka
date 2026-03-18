<template>
  <view class="game-list-container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <image src="/static/icons/back.png" class="back-icon" />
      </view>
      <view class="nav-title">我的组局</view>
      <view class="nav-right" @tap="refreshPage">
        <image src="/static/icons/refresh.png" class="refresh-icon" />
      </view>
    </view>

    <!-- 筛选标签 -->
    <view class="filter-tabs">
      <scroll-view class="tabs-scroll" scroll-x>
        <view 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-item"
          :class="{ active: activeTab === tab.id }"
          @tap="switchTab(tab.id)"
        >
          <text class="tab-text">{{ tab.name }}</text>
          <text v-if="tab.count" class="tab-count">({{ tab.count }})</text>
        </view>
      </scroll-view>
    </view>

    <!-- 组局列表 -->
    <scroll-view 
      class="game-scroll" 
      scroll-y 
      refresher-enabled 
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <!-- 空状态 -->
      <view v-if="!loading && filteredGames.length === 0" class="empty-state">
        <image :src="getEmptyImage()" class="empty-image" />
        <text class="empty-text">{{ getEmptyText() }}</text>
        <view v-if="activeTab === 'all' || activeTab === 'created'" class="empty-btn" @tap="goToCreate">
          创建第一个组局
        </view>
        <view v-if="activeTab === 'joined'" class="empty-btn" @tap="goToHome">
          去组局大厅看看
        </view>
      </view>

      <!-- 组局列表 -->
      <view v-else class="games-container">
        <!-- 按日期分组 -->
        <template v-for="group in groupedGames" :key="group.date">
          <view class="date-group">
            <view class="date-title">
              <text class="date-text">{{ group.date }}</text>
            </view>
            <view class="games-list">
              <view 
                v-for="game in group.games" 
                :key="game.id || game._id"
                class="game-item card"
                @tap="goToDetail(game.id || game._id)"
              >
                <!-- 顶部信息 -->
                <view class="game-header">
                  <view class="game-type-info">
                    <view :class="['type-tag', getTypeClass(game.type)]">
                      {{ getTypeText(game.type) }}
                    </view>
                    <view v-if="game.isCreator || (game.creatorId === userId)" class="creator-tag">
                      我发起
                    </view>
                  </view>
                  <view :class="['status-tag', getStatusClass(game.status || 'pending')]">
                    {{ getStatusText(game.status || 'pending') }}
                  </view>
                </view>

                <!-- 游戏信息 -->
                <view class="game-main">
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
                      <text class="info-text">{{ formatGameTime(game.time) }}</text>
                    </view>
                    <view v-if="game.location" class="info-item">
                      <image src="/static/icons/location.png" class="info-icon" />
                      <text class="info-text">{{ game.location }}</text>
                    </view>
                  </view>
                </view>

                <!-- 底部信息 -->
                <view class="game-footer">
                  <view class="players-info">
                    <view class="avatars">
                      <view 
                        v-for="(player, index) in (game.players || []).slice(0, 4)" 
                        :key="player.id || index"
                        class="avatar-wrapper"
                        :style="{ 'z-index': 10 - index }"
                      >
                        <image :src="player.avatar || '/static/avatar/default.png'" class="player-avatar" />
                      </view>
                      <view v-if="game.currentPlayers > 4" class="more-players">
                        +{{ game.currentPlayers - 4 }}
                      </view>
                    </view>
                    <text class="players-count">{{ game.currentPlayers || 1 }}/{{ game.maxPlayers || 4 }}人</text>
                  </view>
                  
                  <view class="game-actions">
                    <view v-if="(game.status === 'pending' || !game.status) && (game.isCreator || game.creatorId === userId)" class="action-btn manage-btn" @tap.stop="manageGame(game)">
                      管理
                    </view>
                    <view v-if="(game.status === 'pending' || !game.status) && game.isJoined && !game.isCreator && game.creatorId !== userId" class="action-btn quit-btn" @tap.stop="quitGame(game)">
                      退出
                    </view>
                    <view v-if="(game.status === 'pending' || !game.status) && !game.isJoined && !game.isFull && game.creatorId !== userId" class="action-btn join-btn" @tap.stop="joinGame(game)">
                      加入
                    </view>
                    <view v-if="game.status === 'completed'" class="action-btn review-btn" @tap.stop="reviewGame(game)">
                      回顾
                    </view>
                    <view v-if="game.status === 'cancelled'" class="action-btn cancelled-btn">
                      已取消
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- 加载更多 -->
        <view v-if="loading" class="loading-tip">
          <view class="loading-spinner"></view>
          <text>加载中...</text>
        </view>
        <view v-if="hasMore && !loading" class="load-more" @tap="onLoadMore">
          <text>点击加载更多</text>
        </view>
        <view v-if="!hasMore && filteredGames.length > 0" class="no-more">
          <text>没有更多了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import UserService from '@/utils/user.js'

// 响应式数据
const tabs = ref([
  { id: 'all', name: '全部' },
  { id: 'created', name: '我发起的' },
  { id: 'joined', name: '我参与的' },
  { id: 'pending', name: '进行中' },
  { id: 'completed', name: '已完成' }
])

const activeTab = ref('all')
const games = ref([])
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = ref(10)
const userId = ref('')

// 页面参数
const pageParams = ref({})

// 计算属性
const filteredGames = computed(() => {
  let filtered = [...games.value]
  
  // 首先确保游戏数据有 isCreator 和 isJoined 属性
  filtered = filtered.map(game => {
    const enhancedGame = { ...game }
    
    // 判断是否是创建者
    enhancedGame.isCreator = game.creatorId === userId.value
    
    // 判断是否已加入
    if (game.participants && Array.isArray(game.participants)) {
      // 如果participants是对象数组
      if (game.participants.length > 0 && typeof game.participants[0] === 'object') {
        enhancedGame.isJoined = game.participants.some(p => p.id === userId.value)
      } else {
        // 如果participants是字符串数组
        enhancedGame.isJoined = game.participants.includes(userId.value)
      }
    } else {
      enhancedGame.isJoined = false
    }
    
    // 判断是否已满员
    enhancedGame.isFull = (game.currentPlayers || 1) >= (game.maxPlayers || 4)
    
    return enhancedGame
  })
  
  switch (activeTab.value) {
    case 'created':
      filtered = filtered.filter(game => game.isCreator)
      break
    case 'joined':
      filtered = filtered.filter(game => game.isJoined)
      break
    case 'pending':
      filtered = filtered.filter(game => game.status === 'pending' || !game.status)
      break
    case 'completed':
      filtered = filtered.filter(game => game.status === 'completed')
      break
  }
  
  return filtered.sort((a, b) => new Date(b.time) - new Date(a.time))
})

const groupedGames = computed(() => {
  const groups = {}
  
  filteredGames.value.forEach(game => {
    const date = new Date(game.time)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    let dateKey = ''
    if (date.toDateString() === now.toDateString()) {
      dateKey = '今天'
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = '昨天'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateKey = '明天'
    } else if (date > now) {
      dateKey = '未来活动'
    } else {
      dateKey = '历史活动'
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(game)
  })
  
  // 按照日期顺序排序
  const order = ['今天', '明天', '未来活动', '昨天', '历史活动']
  return order
    .filter(key => groups[key])
    .map(key => ({
      date: key,
      games: groups[key]
    }))
})

// 页面生命周期
onLoad((options) => {
  if (options.tab) {
    activeTab.value = options.tab
  }
  pageParams.value = options
  console.log('页面参数:', options)
})

onShow(() => {
  console.log('页面显示，检查是否需要刷新数据')
  // 从缓存中检查是否有需要刷新的标记
  const needRefresh = uni.getStorageSync('needRefreshGameList')
  if (needRefresh) {
    console.log('检测到需要刷新游戏列表，执行刷新')
    // 移除标记
    uni.removeStorageSync('needRefreshGameList')
    // 刷新数据
    onRefresh()
  }
})

onMounted(() => {
  loadUserInfo()
  loadGameList()
  updateTabCounts()
})

// 加载用户信息
const loadUserInfo = () => {
  const currentUser = UserService.getCurrentUser()
  if (currentUser) {
    userId.value = currentUser.id
  }
}

// 加载游戏列表
const loadGameList = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    const currentUser = UserService.getCurrentUser()
    if (!currentUser) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/user/user'
        })
      }, 1500)
      return
    }
    
    userId.value = currentUser.id
    
    // 根据当前标签选择不同的数据获取方式
    let response = null
    
    if (activeTab.value === 'created' || activeTab.value === 'joined') {
      // 获取"我发起的"或"我参与的"组局
      try {
        console.log(`开始获取${activeTab.value === 'created' ? '我创建的' : '我参与的'}组局...`)
        console.log('当前用户ID:', userId.value)
        
        // 使用微信小程序云开发API
        const cloudResult = await wx.cloud.callFunction({
          name: 'game-service',
          data: {
            action: 'getMyGames',
            userId: userId.value,
            type: activeTab.value, // 'created' 或 'joined'
            page: currentPage.value,
            pageSize: pageSize.value
          }
        })
        
        // 调试日志：查看原始返回数据结构
        console.log('【getMyGames】云函数返回原始数据:', cloudResult)
        console.log('【getMyGames】result数据结构:', typeof cloudResult.result, cloudResult.result)
        console.log('【getMyGames】result.code:', cloudResult.result?.code)
        console.log('【getMyGames】result.data:', cloudResult.result?.data)
        console.log('【getMyGames】result.message:', cloudResult.result?.message)
        
        if (cloudResult && cloudResult.errMsg === 'cloud.callFunction:ok') {
          // 修复：先检查code是否为0，然后从result.data获取数据
          if (cloudResult.result && cloudResult.result.code === 0) {
            const gamesData = cloudResult.result.data || []
            console.log(`获取到${activeTab.value === 'created' ? '我创建的' : '我参与的'}组局数据:`, gamesData.length, '条')
            
            // 格式化数据
            const formattedGames = gamesData.map(game => {
              return {
                ...game,
                id: game._id || game.id,
                participants: Array.isArray(game.participants) ? game.participants : [],
                currentPlayers: game.currentPlayers || 1
              }
            })
            
            response = formattedGames
          } else {
            throw new Error(cloudResult.result?.message || '获取数据失败')
          }
        } else {
          throw new Error(cloudResult?.errMsg || '获取数据失败')
        }
      } catch (error) {
        console.error(`获取${activeTab.value}组局失败:`, error)
        throw error
      }
    } else if (activeTab.value === 'all') {
      // 获取所有组局
      try {
        console.log('开始获取所有组局...')
        
        const cloudResult = await wx.cloud.callFunction({
          name: 'game-service',
          data: {
            action: 'getGameList',
            page: currentPage.value,
            pageSize: pageSize.value
          }
        })
        
        // 调试日志：查看原始返回数据结构
        console.log('【getGameList-all】云函数返回原始数据:', cloudResult)
        console.log('【getGameList-all】result数据结构:', typeof cloudResult.result, cloudResult.result)
        console.log('【getGameList-all】result.code:', cloudResult.result?.code)
        console.log('【getGameList-all】result.data:', cloudResult.result?.data)
        console.log('【getGameList-all】result.message:', cloudResult.result?.message)
        
        if (cloudResult && cloudResult.errMsg === 'cloud.callFunction:ok') {
          // 修复：先检查code是否为0，然后从result.data.list获取数据
          if (cloudResult.result && cloudResult.result.code === 0) {
            const gamesData = cloudResult.result.data?.list || []
            console.log('获取到所有组局数据:', gamesData.length, '条')
            
            const formattedGames = gamesData.map(game => {
              return {
                ...game,
                id: game._id || game.id,
                participants: Array.isArray(game.participants) ? game.participants : [],
                currentPlayers: game.currentPlayers || 1
              }
            })
            
            response = formattedGames
          } else {
            throw new Error(cloudResult.result?.message || '获取数据失败')
          }
        } else {
          throw new Error(cloudResult?.errMsg || '获取数据失败')
        }
      } catch (error) {
        console.error('获取所有组局失败:', error)
        throw error
      }
    } else if (activeTab.value === 'pending' || activeTab.value === 'completed') {
      // 获取特定状态的组局
      try {
        console.log(`开始获取${activeTab.value === 'pending' ? '进行中' : '已完成'}的组局...`)
        
        const cloudResult = await wx.cloud.callFunction({
          name: 'game-service',
          data: {
            action: 'getGameList',
            status: activeTab.value,
            page: currentPage.value,
            pageSize: pageSize.value
          }
        })
        
        // 调试日志：查看原始返回数据结构
        console.log(`【getGameList-${activeTab.value}】云函数返回原始数据:`, cloudResult)
        console.log(`【getGameList-${activeTab.value}】result数据结构:`, typeof cloudResult.result, cloudResult.result)
        console.log(`【getGameList-${activeTab.value}】result.code:`, cloudResult.result?.code)
        console.log(`【getGameList-${activeTab.value}】result.data:`, cloudResult.result?.data)
        console.log(`【getGameList-${activeTab.value}】result.message:`, cloudResult.result?.message)
        
        if (cloudResult && cloudResult.errMsg === 'cloud.callFunction:ok') {
          // 修复：先检查code是否为0，然后从result.data.list获取数据
          if (cloudResult.result && cloudResult.result.code === 0) {
            const gamesData = cloudResult.result.data?.list || []
            console.log(`获取到${activeTab.value === 'pending' ? '进行中' : '已完成'}组局数据:`, gamesData.length, '条')
            
            const formattedGames = gamesData.map(game => {
              return {
                ...game,
                id: game._id || game.id,
                participants: Array.isArray(game.participants) ? game.participants : [],
                currentPlayers: game.currentPlayers || 1
              }
            })
            
            response = formattedGames
          } else {
            throw new Error(cloudResult.result?.message || '获取数据失败')
          }
        } else {
          throw new Error(cloudResult?.errMsg || '获取数据失败')
        }
      } catch (error) {
        console.error(`获取${activeTab.value}组局失败:`, error)
        throw error
      }
    }
    
    // 处理返回的数据
    if (response) {
      if (currentPage.value === 1) {
        games.value = response
      } else {
        games.value = [...games.value, ...response]
      }
      
      hasMore.value = response.length >= pageSize.value
      
      console.log('处理后games.value:', games.value.length, '条')
    } else {
      games.value = []
      hasMore.value = false
    }
    
  } catch (error) {
    console.error('加载组局列表失败:', error)
    
    uni.showToast({
      title: '加载失败: ' + (error.message || '请检查网络'),
      icon: 'none',
      duration: 3000
    })
    
    // 清空列表
    games.value = []
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 更新tab数量
const updateTabCounts = () => {
  tabs.value.forEach(tab => {
    let count = 0
    switch (tab.id) {
      case 'created':
        count = filteredGames.value.filter(g => g.creatorId === userId.value).length
        break
      case 'joined':
        count = filteredGames.value.filter(g => {
          if (g.participants && Array.isArray(g.participants)) {
            if (g.participants.length > 0 && typeof g.participants[0] === 'object') {
              return g.participants.some(p => p.id === userId.value)
            } else {
              return g.participants.includes(userId.value)
            }
          }
          return false
        }).length
        break
      case 'pending':
        count = games.value.filter(g => g.status === 'pending' || !g.status).length
        break
      case 'completed':
        count = games.value.filter(g => g.status === 'completed').length
        break
      case 'all':
        count = games.value.length
        break
    }
    tab.count = count
  })
}

// 切换标签
const switchTab = async (tabId) => {
  activeTab.value = tabId
  currentPage.value = 1
  games.value = []
  await loadGameList()
  updateTabCounts()
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  currentPage.value = 1
  games.value = []
  await loadGameList()
  updateTabCounts()
}

// 加载更多
const onLoadMore = async () => {
  if (!hasMore.value || loading.value) return
  currentPage.value++
  await loadGameList()
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 手动刷新页面
const refreshPage = () => {
  uni.showLoading({
    title: '刷新中...',
    mask: true
  })
  
  setTimeout(() => {
    onRefresh()
    uni.hideLoading()
  }, 500)
}

// 获取类型样式
const getTypeClass = (type) => {
  const classMap = {
    'mahjong': 'tag-mahjong',
    'boardgame': 'tag-boardgame',
    'videogame': 'tag-videogame',
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
    'competition': '比赛'
  }
  return textMap[type] || '立直麻将'
}

// 获取状态样式
const getStatusClass = (status) => {
  const classMap = {
    'pending': 'tag-status-pending',
    'completed': 'tag-status-completed',
    'cancelled': 'tag-status-cancelled',
    'full': 'tag-status-full'
  }
  return classMap[status] || 'tag-status-pending'
}

// 获取状态文字
const getStatusText = (status) => {
  const textMap = {
    'pending': '进行中',
    'completed': '已完成',
    'cancelled': '已取消',
    'full': '已满员'
  }
  return textMap[status] || '进行中'
}

// 格式化游戏时间
const formatGameTime = (datetime) => {
  if (!datetime) return ''
  
  const date = new Date(datetime)
  const now = new Date()
  const diff = date - now
  
  if (diff > 0) {
    // 未来时间
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } else {
    // 过去时间
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

// 获取空状态图片
const getEmptyImage = () => {
  const images = {
    'all': '/static/empty-games.png',
    'created': '/static/empty-created.png',
    'joined': '/static/empty-joined.png',
    'pending': '/static/empty-pending.png',
    'completed': '/static/empty-completed.png'
  }
  return images[activeTab.value] || '/static/empty-games.png'
}

// 获取空状态文本
const getEmptyText = () => {
  const texts = {
    'all': '暂无组局记录',
    'created': '您还没有发起过组局',
    'joined': '您还没有加入过组局',
    'pending': '没有进行中的组局',
    'completed': '没有已完成的组局'
  }
  return texts[activeTab.value] || '暂无数据'
}

// 跳转到创建页面
const goToCreate = () => {
  uni.navigateTo({
    url: '/pages/create/create'
  })
}

// 跳转到首页
const goToHome = () => {
  uni.switchTab({
    url: '/pages/index/index'
  })
}

// 跳转到详情页
const goToDetail = (gameId) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${gameId}`
  })
}

// 加入游戏
const joinGame = async (game) => {
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
    content: `确定要加入 "${game.title}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({
          title: '加入中...',
          mask: true
        })
        
        try {
          const result = await wx.cloud.callFunction({
            name: 'game-service',
            data: {
              action: 'joinGame',
              gameId: game.id || game._id,
              userId: userId.value
            }
          })
          
          if (result && result.errMsg === 'cloud.callFunction:ok') {
            // 设置刷新标记
            uni.setStorageSync('needRefreshGameList', true)
            // 重新加载列表
            await loadGameList()
            updateTabCounts()
            
            uni.showToast({
              title: '加入成功',
              icon: 'success'
            })
          } else {
            throw new Error(result?.errMsg || '加入失败')
          }
          
        } catch (error) {
          console.error('加入游戏失败:', error)
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

// 退出游戏
const quitGame = async (game) => {
  const currentUser = UserService.getCurrentUser()
  if (!currentUser) {
    uni.showModal({
      title: '需要登录',
      content: '请先登录后再操作',
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
    title: '确认退出',
    content: `确定要退出 "${game.title}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({
          title: '退出中...',
          mask: true
        })
        
        try {
          const result = await wx.cloud.callFunction({
            name: 'game-service',
            data: {
              action: 'quitGame',
              gameId: game.id || game._id,
              userId: userId.value
            }
          })
          
          if (result && result.errMsg === 'cloud.callFunction:ok') {
            // 设置刷新标记
            uni.setStorageSync('needRefreshGameList', true)
            // 重新加载列表
            await loadGameList()
            updateTabCounts()
            
            uni.showToast({
              title: '已退出',
              icon: 'success'
            })
          } else {
            throw new Error(result?.errMsg || '退出失败')
          }
          
        } catch (error) {
          console.error('退出游戏失败:', error)
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

// 管理游戏（创建者）
const manageGame = (game) => {
  uni.showActionSheet({
    itemList: ['编辑组局', '取消组局', '复制组局'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          editGame(game)
          break
        case 1:
          cancelGame(game)
          break
        case 2:
          copyGame(game)
          break
      }
    }
  })
}

// 编辑组局
const editGame = (game) => {
  // 跳转到编辑页面
  uni.navigateTo({
    url: `/pages/create/create?edit=1&id=${game.id || game._id}`,
    events: {
      // 监听编辑页面的事件
      refreshList: async () => {
        console.log('收到编辑页面刷新事件')
        // 设置刷新标记
        uni.setStorageSync('needRefreshGameList', true)
        // 重新加载列表
        await loadGameList()
        updateTabCounts()
      }
    },
    success: (res) => {
      // 设置页面关闭时的回调
      res.eventChannel.on('onGameUpdated', async (data) => {
        console.log('编辑页面关闭，收到组局更新事件:', data)
        if (data.success) {
          // 设置刷新标记
          uni.setStorageSync('needRefreshGameList', true)
          // 重新加载列表
          await loadGameList()
          updateTabCounts()
          uni.showToast({
            title: '编辑成功',
            icon: 'success',
            duration: 2000
          })
        }
      })
    }
  })
}

// 取消组局
const cancelGame = (game) => {
  const currentUser = UserService.getCurrentUser()
  if (!currentUser) {
    uni.showModal({
      title: '需要登录',
      content: '请先登录后再操作',
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
    title: '确认取消',
    content: `确定要取消 "${game.title}" 吗？此操作不可撤销。`,
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({
          title: '取消中...',
          mask: true
        })
        
        try {
          // 方法1：调用 deleteGame 云函数
          const result = await wx.cloud.callFunction({
            name: 'game-service',
            data: {
              action: 'deleteGame',  // ✅ 使用 deleteGame
              data: {  // ✅ 注意参数要放在 data 对象中
                gameId: game.id || game._id,
                userId: userId.value
              }
            }
          })
          
          if (result && result.errMsg === 'cloud.callFunction:ok' && result.result.code === 0) {
            // 设置刷新标记
            uni.setStorageSync('needRefreshGameList', true)
            // 重新加载列表
            await loadGameList()
            updateTabCounts()
            
            uni.showToast({
              title: '已取消',
              icon: 'success',
              duration: 2000
            })
            
            console.log('组局取消成功，已重新加载列表')
          } else {
            // 调试信息
            console.error('取消失败返回结果:', result)
            throw new Error(result?.result?.message || '取消失败')
          }
          
        } catch (error) {
          console.error('取消组局失败:', error)
          uni.showToast({
            title: error.message || '取消失败',
            icon: 'none',
            duration: 3000
          })
          
          // 显示更详细的错误信息
          if (error.message.includes('权限') || error.message.includes('权限不足')) {
            uni.showModal({
              title: '权限不足',
              content: '您没有权限取消此组局',
              showCancel: false
            })
          }
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

// 复制组局
const copyGame = (game) => {
  const gameCopy = {
    type: game.type,
    title: `${game.title} (副本)`,
    project: game.project,
    location: game.location,
    maxPlayers: game.maxPlayers,
    description: game.description
  }
  
  uni.setStorageSync('game_copy', gameCopy)
  
  uni.showToast({
    title: '已复制，可在创建页面粘贴',
    icon: 'success'
  })
  
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/create/create?copy=1'
    })
  }, 1000)
}

// 回顾游戏
const reviewGame = (game) => {
  uni.showModal({
    title: '回顾组局',
    content: '回顾功能开发中，敬请期待',
    showCancel: false
  })
}
</script>

<style scoped>
.game-list-container {
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
  z-index: 20;
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

.nav-right {
  width: 80rpx;
  display: flex;
  justify-content: flex-end;
}

.refresh-icon {
  width: 40rpx;
  height: 40rpx;
}

/* 筛选标签 */
.filter-tabs {
  background-color: white;
  position: sticky;
  top: 100rpx;
  z-index: 10;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.tabs-scroll {
  white-space: nowrap;
  height: 100rpx;
  padding: 0 20rpx;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  height: 100rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  color: #666;
  position: relative;
  transition: all 0.3s;
}

.tab-item.active {
  color: #07c160;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20rpx;
  right: 20rpx;
  height: 4rpx;
  background-color: #07c160;
  border-radius: 2rpx;
}

.tab-text {
  font-size: 28rpx;
}

.tab-count {
  font-size: 24rpx;
  margin-left: 8rpx;
  opacity: 0.7;
}

/* 组局滚动区域 */
.game-scroll {
  height: calc(100vh - 200rpx);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
  text-align: center;
}

.empty-image {
  width: 300rpx;
  height: 300rpx;
  margin-bottom: 40rpx;
  opacity: 0.5;
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

/* 日期分组 */
.date-group {
  margin: 20rpx 0;
}

.date-title {
  padding: 0 30rpx 20rpx;
}

.date-text {
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
}

/* 游戏列表 */
.games-list {
  padding: 0 20rpx;
}

.game-item {
  margin-bottom: 20rpx;
  padding: 30rpx;
  transition: all 0.3s;
}

.game-item:active {
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
}

/* 游戏头部 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.game-type-info {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.type-tag {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  font-size: 24rpx;
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

.tag-competition {
  background-color: #f3e8ff;
  color: #7c3aed;
}

.creator-tag {
  background-color: #1890ff;
  color: white;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  font-size: 20rpx;
}

/* 状态标签 */
.status-tag {
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  font-size: 20rpx;
}

.tag-status-pending {
  background-color: #e6f7ff;
  color: #1890ff;
}

.tag-status-completed {
  background-color: #f6ffed;
  color: #52c41a;
}

.tag-status-cancelled {
  background-color: #fff7e6;
  color: #fa8c16;
}

.tag-status-full {
  background-color: #ff4d4f;
  color: white;
}

/* 游戏主要内容 */
.game-main {
  margin-bottom: 20rpx;
}

.game-title {
  margin-bottom: 10rpx;
}

.title-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
}

.game-project {
  margin-bottom: 20rpx;
}

.project-text {
  font-size: 30rpx;
  color: #666;
  line-height: 1.4;
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.game-info .info-item {
  display: flex;
  align-items: center;
}

.game-info .info-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 15rpx;
  opacity: 0.7;
}

.game-info .info-text {
  font-size: 28rpx;
  color: #666;
  flex: 1;
}

/* 游戏底部 */
.game-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.players-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatars {
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  margin-right: -15rpx;
}

.avatar-wrapper:first-child {
  margin-left: 0;
}

.player-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  border: 2rpx solid white;
  background-color: #f0f0f0;
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
  border: 2rpx solid white;
  margin-left: -15rpx;
}

.players-count {
  font-size: 28rpx;
  color: #666;
}

/* 游戏操作 */
.game-actions {
  display: flex;
  gap: 10rpx;
}

.action-btn {
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
  transition: all 0.3s;
  white-space: nowrap;
}

.manage-btn {
  background-color: #1890ff;
  color: white;
}

.manage-btn:active {
  background-color: #096dd9;
}

.quit-btn {
  background-color: #ff4d4f;
  color: white;
}

.quit-btn:active {
  background-color: #ff7875;
}

.join-btn {
  background-color: #07c160;
  color: white;
}

.join-btn:active {
  background-color: #06ad56;
}

.review-btn {
  background-color: #f0f0f0;
  color: #666;
}

.review-btn:active {
  background-color: #e0e0e0;
}

.cancelled-btn {
  background-color: #f0f0f0;
  color: #999;
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

/* 加载提示 */
.loading-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
  color: #999;
  font-size: 28rpx;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #f0f0f0;
  border-top-color: #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
