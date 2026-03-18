<template>
  <view class="detail-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else-if="error" class="error-container">
      <image src="/static/error.png" class="error-image" />
      <text class="error-text">{{ error }}</text>
      <view class="error-actions">
        <view class="retry-btn" @tap="loadGameDetail">重试</view>
        <view class="back-btn" @tap="handleBack">返回</view>
      </view>
    </view>

    <!-- 详情内容 -->
    <scroll-view v-else class="detail-scroll" scroll-y 
      refresher-enabled 
      :refresher-triggered="refreshing" 
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <!-- 顶部信息卡片 -->
      <view class="info-card card">
        <!-- 类型和状态 -->
        <view class="detail-header">
          <view class="detail-type">
            <view :class="['type-tag', getTypeClass(gameDetail.type)]">
              {{ getTypeText(gameDetail.type) }}
            </view>
          </view>
          <view :class="['status-tag', gameDetail.status !== 'pending' ? 'tag-status-cancelled' : (gameDetail.isFull ? 'tag-status-full' : 'tag-status')]">
            {{ getStatusText(gameDetail) }}
          </view>
        </view>

        <!-- 活动标题 -->
        <view class="detail-title">
          <text class="title-text">{{ gameDetail.title || '未命名活动' }}</text>
        </view>

        <!-- 具体项目 -->
        <view v-if="gameDetail.project" class="detail-project">
          <text class="project-text">{{ gameDetail.project }}</text>
        </view>

        <!-- 活动信息 -->
        <view class="detail-info">
          <view class="info-item">
            <view class="info-icon">
              <image src="/static/icons/time.png" class="info-icon-img" />
            </view>
            <view class="info-content">
              <text class="info-label">活动时间</text>
              <text class="info-value">{{ formatDateTime(gameDetail.time) }}</text>
            </view>
          </view>

          <view class="info-item">
            <view class="info-icon">
              <image src="/static/icons/location.png" class="info-icon-img" />
            </view>
            <view class="info-content">
              <text class="info-label">活动地点</text>
              <text class="info-value">{{ gameDetail.location || '未设置地点' }}</text>
            </view>
          </view>

          <view class="info-item">
            <view class="info-icon">
              <image src="/static/icons/people.png" class="info-icon-img" />
            </view>
            <view class="info-content">
              <text class="info-label">参与人数</text>
              <text class="info-value">
                {{ gameDetail.currentPlayers || 1 }}/{{ gameDetail.maxPlayers || 4 }}人
                <text v-if="!gameDetail.isFull" class="remaining-text">(缺{{ (gameDetail.maxPlayers || 4) - (gameDetail.currentPlayers || 1) }}人)</text>
              </text>
            </view>
          </view>

          <view v-if="gameDetail.description" class="info-item">
            <view class="info-icon">
              <image src="/static/icons/description.png" class="info-icon-img" />
            </view>
            <view class="info-content">
              <text class="info-label">补充说明</text>
              <text class="info-value description-text">{{ gameDetail.description }}</text>
            </view>
          </view>
        </view>

        <!-- 创建时间 -->
        <view class="create-time">
          创建于 {{ formatCreateTime(gameDetail.createdAt) }}
        </view>
      </view>

      <!-- 创建者信息 -->
      <view v-if="gameDetail.creatorInfo" class="creator-card card">
        <view class="section-title">创建者</view>
        <view class="creator-info">
          <image 
            :src="gameDetail.creatorInfo.avatar || '/static/images/default-avatar.png'" 
            class="creator-avatar" 
            @error="handleAvatarError"
          />
          <view class="creator-detail">
            <view class="creator-name-row">
              <text class="creator-name">{{ gameDetail.creatorInfo.nickname || '未知用户' }}</text>
              <view v-if="gameDetail.creatorInfo.gender" class="gender-badge">
                <image 
                  :src="gameDetail.creatorInfo.gender === 1 ? '/static/icons/male.png' : '/static/icons/female.png'" 
                  class="gender-icon" 
                />
              </view>
            </view>
            <!-- 修改点1：模板中调用 getTagDisplay 函数 -->
            <view v-if="gameDetail.creatorInfo.tags && gameDetail.creatorInfo.tags.length > 0" class="creator-tags">
              <view v-for="(tag, index) in gameDetail.creatorInfo.tags.slice(0, 3)" :key="index" class="creator-tag">
                {{ getTagDisplay(tag) }}
              </view>
              <view v-if="gameDetail.creatorInfo.tags.length > 3" class="creator-tag more">
                +{{ gameDetail.creatorInfo.tags.length - 3 }}
              </view>
            </view>
          </view>
        </view>
        
        <view v-if="gameDetail.creatorInfo.intro" class="creator-intro">
          <text class="intro-text">{{ gameDetail.creatorInfo.intro }}</text>
        </view>
        
        <view v-if="gameDetail.creatorContact" class="creator-contact">
          <image src="/static/icons/contact.png" class="contact-icon" />
          <text class="contact-text">{{ gameDetail.creatorContact }}</text>
        </view>
      </view>

      <!-- 参与者列表 -->
      <view class="players-card card">
        <view class="section-title">已加入玩家 ({{ (gameDetail.participants || []).length + 1 }})</view>
        
        <!-- 玩家列表 -->
        <view class="players-list">
          <!-- 创建者 -->
          <view class="player-item creator">
            <view class="player-avatar-container">
              <image 
                :src="gameDetail.creatorInfo?.avatar || '/static/images/default-avatar.png'" 
                class="player-avatar" 
                @error="handleAvatarError"
              />
              <view class="creator-badge">创建者</view>
            </view>
            <view class="player-info">
              <text class="player-name">{{ gameDetail.creatorInfo?.nickname || '未知用户' }}</text>
              <view class="player-status">
                <image src="/static/icons/creator.png" class="status-icon" />
                <text class="status-text">已加入</text>
              </view>
            </view>
          </view>
          
          <!-- 其他参与者 -->
          <view 
            v-for="(player, index) in gameDetail.participants" 
            :key="index"
            class="player-item"
          >
            <image 
              :src="player.avatar || '/static/images/default-avatar.png'" 
              class="player-avatar" 
              @error="handleAvatarError"
            />
            <view class="player-info">
              <text class="player-name">{{ player.nickname || '玩家' + (index + 1) }}</text>
              <view class="player-status">
                <image src="/static/icons/join.png" class="status-icon" />
                <text class="status-text">已加入</text>
              </view>
            </view>
            <view v-if="player.joinTime" class="player-time">
              {{ formatRelativeTime(player.joinTime) }}
            </view>
          </view>
          
          <!-- 空位提示 -->
          <view v-if="!gameDetail.isFull" class="empty-slots">
            <view 
              v-for="n in (gameDetail.maxPlayers || 4) - (gameDetail.currentPlayers || 1)" 
              :key="n"
              class="empty-slot"
            >
              <view class="empty-avatar">?</view>
              <text class="empty-text">等待加入</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 活动动态 -->
      <view v-if="gameDetail.activities && gameDetail.activities.length > 0" class="activity-card card">
        <view class="section-title">活动动态</view>
        <view class="activity-list">
          <view 
            v-for="(activity, index) in gameDetail.activities" 
            :key="index"
            class="activity-item"
          >
            <view class="activity-icon">
              <image :src="getActivityIcon(activity.type)" class="activity-icon-img" />
            </view>
            <view class="activity-content">
              <text class="activity-text">{{ activity.text || '未知操作' }}</text>
              <text class="activity-time">{{ formatRelativeTime(activity.createdAt) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 安全区域 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="!loading && !error && gameDetail.status === 'pending'" class="action-bar">
      <view class="action-buttons">
        <!-- 分享按钮 -->
        <view class="share-btn" @tap="handleShare">
          <image src="/static/icons/share-green.png" class="share-icon" />
          <text class="share-text">分享</text>
        </view>

        <!-- 动态按钮 -->
        <template v-if="!gameDetail.isJoined">
          <view 
            v-if="!gameDetail.isFull"
            class="join-btn"
            @tap="handleJoin"
          >
            <image src="/static/icons/join-white.png" class="btn-icon" />
            <text class="btn-text">立即加入</text>
          </view>
          
          <view 
            v-else
            class="full-btn disabled"
          >
            <image src="/static/icons/full.png" class="btn-icon" />
            <text class="btn-text">已满员</text>
          </view>
        </template>
        
        <template v-else-if="!gameDetail.isCreator">
          <view 
            class="quit-btn"
            @tap="handleQuit"
          >
            <image src="/static/icons/quit-white.png" class="btn-icon" />
            <text class="btn-text">退出组局</text>
          </view>
        </template>
        
        <template v-else>
          <view class="creator-actions">
            <view class="edit-btn" @tap="handleEdit">
              <image src="/static/icons/edit.png" class="btn-icon" />
              <text class="btn-text">编辑</text>
            </view>
            <view class="cancel-btn" @tap="handleCancel">
              <image src="/static/icons/cancel-red.png" class="btn-icon" />
              <text class="btn-text">取消</text>
            </view>
          </view>
        </template>
      </view>
    </view>

    <!-- 已取消提示 -->
    <view v-if="!loading && !error && gameDetail.status === 'cancelled'" class="cancelled-banner">
      <image src="/static/icons/cancelled.png" class="cancelled-icon" />
      <text class="cancelled-text">此组局已取消</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'

// 响应式数据
const gameDetail = ref({
  creatorInfo: {},
  participants: [],
  activities: [],
  type: 'mahjong',
  status: 'pending',
  isFull: false,
  isJoined: false,
  isCreator: false
})
const loading = ref(true)
const refreshing = ref(false)
const error = ref('')
const gameId = ref('')
const currentUser = ref(null)

onLoad(async (options) => {
  if (options.id) {
    gameId.value = options.id
    console.log('开始加载组局详情，ID:', gameId.value)
    
    // 获取当前用户
    await getCurrentUser()
    
    // 从服务器获取游戏详情
    await loadGameDetail()
  } else {
    console.error('未传递游戏ID')
    error.value = '参数错误：缺少游戏ID'
    loading.value = false
  }
})

// 获取当前用户
const getCurrentUser = async () => {
  try {
    const userInfo = uni.getStorageSync('userInfo')
    if (userInfo) {
      currentUser.value = userInfo
    } else {
      // 如果本地没有用户信息，尝试从云端获取
      const res = await wx.cloud.callFunction({
        name: 'user-service',
        data: { action: 'getCurrentUser' }
      })
      
      if (res.result && res.result.code === 0) {
        currentUser.value = res.result.data
        uni.setStorageSync('userInfo', res.result.data)
      }
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
  }
}

// 加载游戏详情
const loadGameDetail = async () => {
  loading.value = true
  error.value = ''
  
  try {
    console.log('调用game-service获取详情，参数:', { gameId: gameId.value })
    
    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: {
        action: 'getGameDetail',
        data: { gameId: gameId.value }
      }
    })
    
    console.log('获取组局详情结果:', res)
    
    if (res.result && res.result.code === 0) {
      const game = res.result.data
      
      // 计算是否已加入
      let isJoined = false
      if (currentUser.value) {
        isJoined = game.participants?.some(p => p.id === currentUser.value.id) || false
      }
      
      // 计算是否是创建者
      const isCreator = currentUser.value && (game.creatorId === currentUser.value.id)
      
      // 计算是否已满员
      const currentPlayers = (game.participants || []).length + 1
      const isFull = currentPlayers >= (game.maxPlayers || 4)
      
      gameDetail.value = {
        ...game,
        id: game._id || game.id,
        creatorInfo: game.creatorInfo || { 
          nickname: '未知用户', 
          avatar: '/static/images/default-avatar.png',
          tags: []
        },
        participants: game.participants || [],
        activities: game.activities || [],
        currentPlayers: currentPlayers,
        isFull: isFull,
        isJoined: isJoined,
        isCreator: isCreator
      }
      
      console.log('处理后的游戏数据:', gameDetail.value)
    } else {
      throw new Error(res.result?.message || '获取游戏详情失败')
    }
  } catch (err) {
    console.error('加载组局详情失败:', err)
    error.value = err.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  if (!refreshing.value) {
    refreshing.value = true
    loadGameDetail()
  }
}

// 加载更多（预留）
const onLoadMore = () => {
  // 可以用于加载更多活动记录
}

// 返回
const handleBack = () => {
  uni.navigateBack()
}

// 获取类型样式
const getTypeClass = (type) => {
  const classMap = {
    'mahjong': 'tag-mahjong',
    'boardgame': 'tag-boardgame',
    'videogame': 'tag-videogame',
    'competition': 'tag-competition',
    'sports': 'tag-sports',
    'other': 'tag-other'
  }
  return classMap[type] || 'tag-mahjong'
}

// 获取类型文字
const getTypeText = (type) => {
  const textMap = {
    'mahjong': '立直麻将',
    'boardgame': '桌游',
    'videogame': '电玩',
    'competition': '比赛',
    'sports': '运动',
    'other': '其他'
  }
  return textMap[type] || '立直麻将'
}

// 获取状态文字
const getStatusText = (game) => {
  if (game.status === 'cancelled') {
    return '已取消'
  } else if (game.isFull) {
    return '已满员'
  } else {
    return `缺${(game.maxPlayers || 4) - (game.currentPlayers || 1)}人`
  }
}

// 获取活动图标
const getActivityIcon = (type) => {
  const iconMap = {
    'create': '/static/icons/create.png',
    'join': '/static/icons/join.png',
    'quit': '/static/icons/quit.png',
    'cancel': '/static/icons/cancel.png',
    'update': '/static/icons/update.png'
  }
  return iconMap[type] || '/static/icons/default-activity.png'
}

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return '未设置'
  
  try {
    const date = new Date(datetime)
    if (isNaN(date.getTime())) return '时间格式错误'
    
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
  } catch (e) {
    console.error('格式化时间错误:', e)
    return '时间格式错误'
  }
}

// 格式化创建时间
const formatCreateTime = (datetime) => {
  if (!datetime) return ''
  
  try {
    const date = new Date(datetime)
    if (isNaN(date.getTime())) return ''
    
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  } catch (e) {
    console.error('格式化创建时间错误:', e)
    return ''
  }
}

// 格式化相对时间
const formatRelativeTime = (datetime) => {
  if (!datetime) return ''
  
  try {
    const date = new Date(datetime)
    if (isNaN(date.getTime())) return ''
    
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
  } catch (e) {
    console.error('格式化相对时间错误:', e)
    return ''
  }
}

// 处理头像加载失败
const handleAvatarError = (e) => {
  console.log('头像加载失败:', e)
  e.detail.target.src = '/static/images/default-avatar.png'
}

// 加入组局
const handleJoin = async () => {
  if (!currentUser.value) {
    uni.showModal({
      title: '需要登录',
      content: '请先登录后再加入组局',
      confirmText: '去登录',
      cancelText: '取消',
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
  
  // 检查组局状态
  if (gameDetail.value.status !== 'pending') {
    uni.showToast({
      title: '此组局已不可加入',
      icon: 'none'
    })
    return
  }
  
  if (gameDetail.value.isFull) {
    uni.showToast({
      title: '组局已满员',
      icon: 'none'
    })
    return
  }
  
  uni.showModal({
    title: '确认加入',
    content: '确定要加入这个组局吗？',
    confirmText: '确定',
    cancelText: '取消',
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
              data: {
                gameId: gameId.value,
                userId: currentUser.value.id
              }
            }
          })
          
          console.log('加入组局结果:', result)
          
          if (result.result && result.result.code === 0) {
            // 重新加载详情
            await loadGameDetail()
            
            uni.showToast({
              title: '加入成功',
              icon: 'success',
              duration: 2000
            })
          } else {
            throw new Error(result.result?.message || '加入失败')
          }
          
        } catch (err) {
          console.error('加入组局失败:', err)
          uni.showToast({
            title: err.message || '加入失败',
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

// 退出组局
const handleQuit = async () => {
  if (!currentUser.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }
  
  uni.showModal({
    title: '确认退出',
    content: '确定要退出这个组局吗？',
    confirmText: '确定',
    cancelText: '取消',
    confirmColor: '#ff4d4f',
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
              data: {
                gameId: gameId.value,
                userId: currentUser.value.id
              }
            }
          })
          
          console.log('退出组局结果:', result)
          
          if (result.result && result.result.code === 0) {
            // 重新加载详情
            await loadGameDetail()
            
            uni.showToast({
              title: '已退出',
              icon: 'success',
              duration: 2000
            })
          } else {
            throw new Error(result.result?.message || '退出失败')
          }
          
        } catch (err) {
          console.error('退出组局失败:', err)
          uni.showToast({
            title: err.message || '退出失败',
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

// 分享
const handleShare = () => {
  uni.showActionSheet({
    itemList: ['分享给好友', '分享到朋友圈'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 小程序分享会自动触发onShareAppMessage
        uni.showShareMenu({
          withShareTicket: true
        })
      } else if (res.tapIndex === 1) {
        // 分享到朋友圈
        uni.showModal({
          title: '提示',
          content: '请点击右上角菜单，选择"分享到朋友圈"',
          showCancel: false
        })
      }
    }
  })
}

// 编辑
const handleEdit = () => {
  if (!currentUser.value || !gameDetail.value.isCreator) {
    uni.showToast({
      title: '只有创建者可以编辑',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: `/pages/create/create?edit=1&id=${gameId.value}`
  })
}

// 取消组局
const handleCancel = () => {
  if (!currentUser.value || !gameDetail.value.isCreator) {
    uni.showToast({
      title: '只有创建者可以取消',
      icon: 'none'
    })
    return
  }
  
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个组局吗？此操作不可撤销，已加入的用户会收到通知。',
    confirmText: '确定取消',
    cancelText: '再想想',
    confirmColor: '#ff4d4f',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({
          title: '取消中...',
          mask: true
        })
        
        try {
          const result = await wx.cloud.callFunction({
            name: 'game-service',
            data: {
              action: 'deleteGame',
              data: { gameId: gameId.value }
            }
          })
          
          console.log('取消组局结果:', result)
          
          if (result.result && result.result.code === 0) {
            // 重新加载详情
            await loadGameDetail()
            
            uni.showToast({
              title: '组局已取消',
              icon: 'success',
              duration: 2000
            })
            
            // 延时返回列表页
            setTimeout(() => {
              uni.navigateBack()
            }, 2000)
          } else {
            throw new Error(result.result?.message || '取消失败')
          }
          
        } catch (err) {
          console.error('取消组局失败:', err)
          uni.showToast({
            title: err.message || '取消失败',
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

// 修改点2：添加标签显示处理函数
// 处理标签显示
const getTagDisplay = (tag) => {
  if (!tag) return ''
  
  // 如果标签是字符串，直接返回
  if (typeof tag === 'string') {
    return tag
  }
  
  // 如果标签是对象，尝试获取 name 属性
  if (tag && typeof tag === 'object') {
    // 检查是否有 name 属性
    if (tag.name) {
      return tag.name
    }
    // 检查是否有其他可能的显示属性
    if (tag.text) {
      return tag.text
    }
    if (tag.label) {
      return tag.label
    }
  }
  
  // 如果以上都不是，转换为字符串显示
  return String(tag)
}

// 分享配置
onShareAppMessage(() => {
  return {
    title: `${gameDetail.value.title} - 玩咖约局`,
    path: `/pages/detail/detail?id=${gameId.value}`,
    imageUrl: gameDetail.value.creatorInfo?.avatar || '/static/images/share-default.jpg'
  }
})

// 分享到朋友圈
onShareTimeline(() => {
  return {
    title: `玩咖约局：${gameDetail.value.title}`,
    query: `id=${gameId.value}`,
    imageUrl: gameDetail.value.creatorInfo?.avatar || '/static/images/share-default.jpg'
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
  background-color: #f8f8f8;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid rgba(7, 193, 96, 0.1);
  border-top-color: #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 30rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f8f8f8;
  padding: 0 60rpx;
}

.error-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 40rpx;
  opacity: 0.6;
}

.error-text {
  font-size: 30rpx;
  color: #666;
  text-align: center;
  margin-bottom: 60rpx;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 30rpx;
  width: 100%;
  max-width: 400rpx;
}

.retry-btn,
.back-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: 500;
  transition: all 0.3s;
}

.retry-btn {
  background-color: #07c160;
  color: white;
}

.retry-btn:active {
  background-color: #06ad56;
  transform: translateY(2rpx);
}

.back-btn {
  background-color: #f0f0f0;
  color: #666;
}

.back-btn:active {
  background-color: #e0e0e0;
  transform: translateY(2rpx);
}

/* 详情滚动区域 */
.detail-scroll {
  height: calc(100vh - 120rpx);
  padding-bottom: 120rpx;
}

/* 通用卡片样式 */
.card {
  background-color: white;
  border-radius: 20rpx;
  margin: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

/* 信息卡片样式 */
.info-card {
  margin: 20rpx 20rpx 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25rpx;
}

.detail-type {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.type-tag {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: white;
}

.tag-mahjong { background-color: #ff6b6b; }
.tag-boardgame { background-color: #4dabf7; }
.tag-videogame { background-color: #69db7c; }
.tag-competition { background-color: #8b5cf6; }
.tag-sports { background-color: #ff922b; }
.tag-other { background-color: #adb5bd; }

.status-tag {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: white;
}

.tag-status { background-color: #ff922b; }
.tag-status-full { background-color: #868e96; }
.tag-status-cancelled { background-color: #fa5252; }

.detail-title {
  margin-bottom: 15rpx;
}

.title-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  display: block;
}

.detail-project {
  margin-bottom: 30rpx;
}

.project-text {
  font-size: 32rpx;
  color: #666;
  line-height: 1.5;
  display: block;
}

/* 详情信息样式 */
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 25rpx;
  margin-bottom: 30rpx;
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
  opacity: 0.7;
}

.info-icon-img {
  width: 100%;
  height: 100%;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
  font-weight: 400;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  display: block;
}

.remaining-text {
  color: #ff922b;
  font-size: 24rpx;
  margin-left: 10rpx;
}

.description-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.create-time {
  font-size: 24rpx;
  color: #999;
  text-align: right;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

/* 分区标题 */
.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 25rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

/* 创建者信息 */
.creator-card {
  margin: 20rpx 20rpx 0;
}

.creator-info {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.creator-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 25rpx;
  border: 3rpx solid #07c160;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.creator-detail {
  flex: 1;
}

.creator-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.creator-name {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin-right: 15rpx;
  line-height: 1.4;
}

.gender-badge {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e6f7ff;
}

.gender-icon {
  width: 20rpx;
  height: 20rpx;
}

.creator-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.creator-tag {
  background-color: #f0f8ff;
  color: #1890ff;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.creator-tag.more {
  background-color: #f8f9fa;
  color: #868e96;
}

.creator-intro {
  background-color: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.intro-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  display: block;
}

.creator-contact {
  display: flex;
  align-items: center;
  background-color: #fff7e6;
  border-radius: 12rpx;
  padding: 20rpx;
  border-left: 4rpx solid #ff922b;
}

.contact-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 15rpx;
  opacity: 0.8;
}

.contact-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  flex: 1;
}

/* 玩家列表 */
.players-card {
  margin: 20rpx 20rpx 0;
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
  background-color: #f8f9fa;
  border-radius: 12rpx;
  transition: all 0.3s;
}

.player-item.creator {
  background-color: #e6f7ff;
  border: 2rpx solid #91d5ff;
}

.player-avatar-container {
  position: relative;
  margin-right: 20rpx;
}

.player-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #e0e0e0;
  border: 2rpx solid white;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.player-item.creator .player-avatar {
  border-color: #91d5ff;
}

.creator-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background-color: #ff6b6b;
  color: white;
  padding: 4rpx 10rpx;
  border-radius: 10rpx;
  font-size: 20rpx;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.player-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.player-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 6rpx;
  line-height: 1.4;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.status-icon {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.7;
}

.status-text {
  font-size: 24rpx;
  color: #666;
}

.player-time {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

/* 空位提示 */
.empty-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150rpx, 1fr));
  gap: 20rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 2rpx dashed #f0f0f0;
}

.empty-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  border: 2rpx dashed #dee2e6;
}

.empty-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #e9ecef;
  color: #adb5bd;
  font-size: 30rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
}

.empty-text {
  font-size: 24rpx;
  color: #868e96;
  text-align: center;
}

/* 操作记录 */
.activity-card {
  margin: 20rpx 20rpx 0;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.activity-item {
  display: flex;
  align-items: flex-start;
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
  opacity: 0.7;
}

.activity-icon-img {
  width: 100%;
  height: 100%;
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.activity-text {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
  line-height: 1.4;
  display: block;
}

.activity-time {
  font-size: 24rpx;
  color: #999;
  font-weight: 400;
}

/* 已取消横幅 */
.cancelled-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #ff6b6b;
  color: white;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15rpx;
  z-index: 999;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.cancelled-icon {
  width: 36rpx;
  height: 36rpx;
}

.cancelled-text {
  font-size: 28rpx;
  font-weight: 500;
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
  z-index: 1000;
  box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.1);
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
  padding: 15rpx 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  flex-shrink: 0;
  transition: all 0.3s;
}

.share-btn:active {
  background-color: #e9ecef;
  transform: translateY(2rpx);
}

.share-icon {
  width: 40rpx;
  height: 40rpx;
  margin-bottom: 8rpx;
}

.share-text {
  font-size: 24rpx;
  color: #07c160;
  font-weight: 500;
}

/* 主要操作按钮 */
.join-btn,
.quit-btn,
.edit-btn,
.cancel-btn,
.full-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: 500;
  transition: all 0.3s;
  gap: 10rpx;
}

.btn-icon {
  width: 36rpx;
  height: 36rpx;
}

.btn-text {
  font-weight: 500;
}

.join-btn {
  background: linear-gradient(135deg, #07c160, #06ad56);
  color: white;
  box-shadow: 0 4rpx 20rpx rgba(7, 193, 96, 0.3);
}

.join-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 10rpx rgba(7, 193, 96, 0.3);
}

.quit-btn {
  background: linear-gradient(135deg, #ff6b6b, #fa5252);
  color: white;
  box-shadow: 0 4rpx 20rpx rgba(255, 107, 107, 0.3);
}

.quit-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 10rpx rgba(255, 107, 107, 0.3);
}

/* 创建者操作 */
.creator-actions {
  display: flex;
  gap: 20rpx;
  flex: 1;
}

.edit-btn {
  flex: 1;
  background: linear-gradient(135deg, #4dabf7, #339af0);
  color: white;
  box-shadow: 0 4rpx 20rpx rgba(77, 171, 247, 0.3);
}

.edit-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 10rpx rgba(77, 171, 247, 0.3);
}

.cancel-btn {
  flex: 1;
  background: linear-gradient(135deg, #ff922b, #fd7e14);
  color: white;
  box-shadow: 0 4rpx 20rpx rgba(255, 146, 43, 0.3);
}

.cancel-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 10rpx rgba(255, 146, 43, 0.3);
}

/* 禁用状态 */
.full-btn.disabled,
.joined-btn.disabled {
  background-color: #e9ecef;
  color: #adb5bd;
  box-shadow: none;
}

.full-btn.disabled .btn-icon {
  opacity: 0.6;
}

/* 安全区域 */
.safe-area-bottom {
  height: calc(env(safe-area-inset-bottom) + 120rpx);
  min-height: 120rpx;
}
</style>
