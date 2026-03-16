// utils/store.js
// 全局状态管理 - 统一修复版
// 已修复：1.统一云函数调用格式 2.修复userId未定义 3.增强错误处理 4.统一状态更新

import { reactive, readonly } from 'vue'
import UserService from './user.js'

// 全局状态
const state = reactive({
  // 用户相关
  user: {
    isLoggedIn: false,
    info: null,
    stats: null,
    token: null
  },
  
  // 应用相关
  app: {
    theme: 'light',
    language: 'zh-CN',
    isLoading: false
  },
  
  // 组局相关
  games: {
    list: [],
    currentPage: 1,
    hasMore: true
  },
  
  // 消息相关
  messages: {
    unreadCount: 0,
    list: []
  }
})

// 获取状态
export const getState = () => readonly(state)

// 用户相关actions
export const userActions = {
  // 登录
  async login(userInfo) {
    state.app.isLoading = true
    
    try {
      const loginResult = await UserService.wechatLogin()
      
      if (loginResult.code) {
        const cloudResult = await UserService.cloudLogin(loginResult.code, userInfo)
        
        if (cloudResult.success) {
          state.user.isLoggedIn = true
          state.user.info = cloudResult.userInfo
          state.user.token = cloudResult.token
          state.user.stats = cloudResult.stats
          
          // 保存到本地存储
          const savedState = uni.getStorageSync('global_state') || {}
          uni.setStorageSync('global_state', JSON.stringify({
            ...savedState,
            user: state.user
          }))
          
          return { success: true, data: cloudResult }
        } else {
          return { success: false, error: cloudResult.error }
        }
      } else {
        return { success: false, error: '获取登录凭证失败' }
      }
    } catch (error) {
      console.error('登录失败:', error)
      uni.showToast({
        title: '登录失败，请重试',
        icon: 'none',
        duration: 2000
      })
      return { success: false, error: error.message }
    } finally {
      state.app.isLoading = false
    }
  },
  
  // 退出登录
  logout() {
    console.log('store.js: 开始执行 userActions.logout()')
    state.user.isLoggedIn = false
    state.user.info = null
    state.user.stats = null
    state.user.token = null
    
    // 清除用户相关的本地存储
    const savedState = uni.getStorageSync('global_state') || {}
    delete savedState.user
    uni.setStorageSync('global_state', JSON.stringify(savedState))
    
    // 清除组局列表
    state.games.list = []
    state.games.currentPage = 1
    state.games.hasMore = true
    
    // 清除消息
    state.messages.unreadCount = 0
    state.messages.list = []
    
    console.log('✅ store.js: userActions.logout() 执行完成')
  },
  
  // 更新用户信息
  updateUserInfo(updates) {
    if (state.user.info) {
      state.user.info = { ...state.user.info, ...updates }
      // 同步更新到本地存储
      const savedState = uni.getStorageSync('global_state') || {}
      if (savedState.user) {
        savedState.user.info = { ...savedState.user.info, ...updates }
        uni.setStorageSync('global_state', JSON.stringify(savedState))
      }
    }
  },
  
  // 更新用户统计
  updateUserStats(stats) {
    state.user.stats = { ...state.user.stats, ...stats }
  },
  
  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = UserService.isLoggedIn()
    
    if (isLoggedIn) {
      state.user.isLoggedIn = true
      state.user.info = UserService.getCurrentUser()
      state.user.stats = UserService.getUserStats()
      state.user.token = UserService.getToken()
    } else {
      state.user.isLoggedIn = false
      state.user.info = null
      state.user.stats = null
      state.user.token = null
    }
    
    return isLoggedIn
  },
  
  // 获取用户统计
  async fetchUserStats() {
    try {
      const stats = await UserService.fetchUserStats()
      if (stats) {
        state.user.stats = stats
      }
      return stats
    } catch (error) {
      console.error('获取用户统计失败:', error)
      return null
    }
  }
}

// 应用相关actions
export const appActions = {
  // 设置主题
  setTheme(theme) {
    state.app.theme = theme
    // 持久化到本地存储
    const savedState = uni.getStorageSync('global_state') || {}
    uni.setStorageSync('global_state', JSON.stringify({
      ...savedState,
      app: { ...state.app, theme }
    }))
  },
  
  // 设置语言
  setLanguage(lang) {
    state.app.language = lang
    // 持久化到本地存储
    const savedState = uni.getStorageSync('global_state') || {}
    uni.setStorageSync('global_state', JSON.stringify({
      ...savedState,
      app: { ...state.app, language: lang }
    }))
  },
  
  // 显示加载
  showLoading() {
    state.app.isLoading = true
  },
  
  // 隐藏加载
  hideLoading() {
    state.app.isLoading = false
  }
}

// 统一的云函数调用器
const callGameService = async (action, data = {}, options = {}) => {
  const { showLoading = true, loadingText = '处理中...' } = options
  
  if (showLoading) {
    uni.showLoading({ title: loadingText, mask: true })
  }
  
  try {
    console.log(`[game-service] 调用 ${action}:`, data)
    const startTime = Date.now()
    
    const result = await wx.cloud.callFunction({
      name: 'game-service',
      data: {
        action,
        data
      }
    })
    
    const costTime = Date.now() - startTime
    console.log(`[game-service] ${action} 成功，耗时${costTime}ms:`, result.result)
    
    if (result.result) {
      if (result.result.code === 0) {
        return { 
          success: true, 
          data: result.result.data,
          message: result.result.message,
          code: result.result.code
        }
      } else {
        return { 
          success: false, 
          error: result.result.message,
          code: result.result.code,
          data: result.result.data
        }
      }
    } else {
      return { 
        success: false, 
        error: '云函数返回格式错误',
        code: 500
      }
    }
  } catch (error) {
    console.error(`[game-service] ${action} 失败:`, error)
    return { 
      success: false, 
      error: error.message || '网络请求失败',
      code: 500
    }
  } finally {
    if (showLoading) {
      uni.hideLoading()
    }
  }
}

// 组局相关actions - 统一修复
export const gameActions = {
  // 获取组局列表
  async getGameList(params = {}) {
    try {
      const result = await callGameService('getGameList', params, { showLoading: false })
      
      if (result.success && result.data) {
        const games = result.data.list || []
        state.games.list = games
        state.games.hasMore = result.data.hasMore || games.length >= 10
        return games
      } else {
        uni.showToast({
          title: result.error || '获取列表失败',
          icon: 'none',
          duration: 2000
        })
        return []
      }
    } catch (error) {
      console.error('获取组局列表失败:', error)
      uni.showToast({
        title: '获取失败，请刷新重试',
        icon: 'none',
        duration: 2000
      })
      return []
    }
  },
  
  // 获取更多组局
  async getMoreGames(params = {}) {
    if (!state.games.hasMore) {
      uni.showToast({
        title: '没有更多了',
        icon: 'none',
        duration: 1500
      })
      return []
    }
    
    try {
      const page = state.games.currentPage + 1
      const result = await callGameService('getGameList', { ...params, page }, { showLoading: false })
      
      if (result.success && result.data) {
        const games = result.data.list || []
        
        if (games.length > 0) {
          state.games.list = [...state.games.list, ...games]
          state.games.currentPage = page
          state.games.hasMore = result.data.hasMore || games.length >= 10
        } else {
          state.games.hasMore = false
        }
        
        return games
      } else {
        return []
      }
    } catch (error) {
      console.error('获取更多组局失败:', error)
      uni.showToast({
        title: '加载失败，请重试',
        icon: 'none',
        duration: 2000
      })
      return []
    }
  },
  
  // 获取组局详情 - 修复参数格式
  async getGameDetail(gameId) {
    if (!gameId) {
      uni.showToast({ title: '缺少组局ID', icon: 'none' })
      return null
    }
    
    try {
      const result = await callGameService('getGameDetail', { gameId })
      
      if (result.success) {
        return result.data
      } else {
        uni.showToast({
          title: result.error || '获取详情失败',
          icon: 'none',
          duration: 2000
        })
        return null
      }
    } catch (error) {
      console.error('获取组局详情失败:', error)
      uni.showToast({
        title: '获取详情失败',
        icon: 'none',
        duration: 2000
      })
      return null
    }
  },
  
  // 创建组局 - 统一调用方式
  async createGame(gameData) {
    try {
      const result = await callGameService('createGame', { gameData }, { 
        loadingText: '创建中...' 
      })
      
      if (result.success) {
        // 添加到列表开头
        if (result.data) {
          state.games.list.unshift(result.data)
        }
        return { 
          success: true, 
          data: result.data,
          message: '创建成功'
        }
      } else {
        return { 
          success: false, 
          error: result.error || '创建失败',
          message: result.error
        }
      }
    } catch (error) {
      console.error('创建组局失败:', error)
      return { 
        success: false, 
        error: error.message,
        message: error.message
      }
    }
  },
  
  // 加入组局 - 修复userId问题
  async joinGame(gameId) {
    const currentUser = UserService.getCurrentUser()
    if (!currentUser || !currentUser.id) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return { success: false, error: '用户未登录' }
    }
    
    try {
      const result = await callGameService('joinGame', { 
        gameId, 
        userId: currentUser.id 
      }, { 
        loadingText: '加入中...' 
      })
      
      if (result.success) {
        // 更新本地状态
        this.updateGame(gameId, { 
          currentPlayers: result.data?.currentPlayers,
          isJoined: true,
          isFull: result.data?.isFull || false
        })
        
        return { 
          success: true, 
          message: '加入成功',
          data: result.data
        }
      } else {
        return { 
          success: false, 
          error: result.error,
          message: result.error
        }
      }
    } catch (error) {
      console.error('加入组局失败:', error)
      return { 
        success: false, 
        error: error.message,
        message: error.message
      }
    }
  },
  
  // 退出组局 - 修复userId问题
  async quitGame(gameId) {
    const currentUser = UserService.getCurrentUser()
    if (!currentUser || !currentUser.id) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return { success: false, error: '用户未登录' }
    }
    
    try {
      const result = await callGameService('quitGame', { 
        gameId, 
        userId: currentUser.id 
      }, { 
        loadingText: '退出中...' 
      })
      
      if (result.success) {
        // 更新本地状态
        this.updateGame(gameId, { 
          currentPlayers: result.data?.currentPlayers,
          isJoined: false,
          isFull: false
        })
        
        return { 
          success: true, 
          message: '已退出',
          data: result.data
        }
      } else {
        return { 
          success: false, 
          error: result.error,
          message: result.error
        }
      }
    } catch (error) {
      console.error('退出组局失败:', error)
      return { 
        success: false, 
        error: error.message,
        message: error.message
      }
    }
  },
  
  // 更新组局本地状态
  updateGame(gameId, updates) {
    const index = state.games.list.findIndex(g => g._id === gameId || g.id === gameId)
    if (index !== -1) {
      state.games.list[index] = { ...state.games.list[index], ...updates }
    }
  },
  
  // 删除/取消组局
  async deleteGame(gameId) {
    try {
      const result = await callGameService('deleteGame', { gameId })
      
      if (result.success) {
        // 从列表中移除
        state.games.list = state.games.list.filter(g => g._id !== gameId && g.id !== gameId)
        return { 
          success: true, 
          message: '已取消',
          data: result.data
        }
      } else {
        return { 
          success: false, 
          error: result.error,
          message: result.error
        }
      }
    } catch (error) {
      console.error('删除组局失败:', error)
      return { 
        success: false, 
        error: error.message,
        message: error.message
      }
    }
  },
  
  // 获取创建的组局
  async getCreatedGames() {
    const userInfo = UserService.getCurrentUser()
    if (!userInfo || !userInfo.id) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return []
    }
    
    try {
      const result = await callGameService('getCreatedGames', { userId: userInfo.id })
      
      if (result.success) {
        return result.data || []
      } else {
        uni.showToast({
          title: result.error || '获取失败',
          icon: 'none',
          duration: 2000
        })
        return []
      }
    } catch (error) {
      console.error('获取创建的组局失败:', error)
      uni.showToast({
        title: '获取失败，请重试',
        icon: 'none',
        duration: 2000
      })
      return []
    }
  },
  
  // 获取参与的组局
  async getJoinedGames() {
    const userInfo = UserService.getCurrentUser()
    if (!userInfo || !userInfo.id) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return []
    }
    
    try {
      const result = await callGameService('getJoinedGames', { userId: userInfo.id })
      
      if (result.success) {
        return result.data || []
      } else {
        uni.showToast({
          title: result.error || '获取失败',
          icon: 'none',
          duration: 2000
        })
        return []
      }
    } catch (error) {
      console.error('获取参与的组局失败:', error)
      uni.showToast({
        title: '获取失败，请重试',
        icon: 'none',
        duration: 2000
      })
      return []
    }
  },
  
  // 获取我的组局
  async getMyGames(type = 'all') {
    const userInfo = UserService.getCurrentUser()
    if (!userInfo || !userInfo.id) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return []
    }
    
    try {
      const result = await callGameService('getMyGames', { 
        userId: userInfo.id, 
        type: type 
      })
      
      if (result.success) {
        return result.data || []
      } else {
        uni.showToast({
          title: result.error || '获取失败',
          icon: 'none',
          duration: 2000
        })
        return []
      }
    } catch (error) {
      console.error('获取我的组局失败:', error)
      uni.showToast({
        title: '获取失败，请重试',
        icon: 'none',
        duration: 2000
      })
      return []
    }
  },
  
  // 搜索组局
  async searchGames(keyword, filters = {}) {
    try {
      const result = await callGameService('searchGames', { keyword, filters })
      
      if (result.success) {
        return result.data || []
      } else {
        uni.showToast({
          title: result.error || '搜索失败',
          icon: 'none',
          duration: 2000
        })
        return []
      }
    } catch (error) {
      console.error('搜索组局失败:', error)
      uni.showToast({
        title: '搜索失败，请重试',
        icon: 'none',
        duration: 2000
      })
      return []
    }
  }
}

// 消息相关actions
export const messageActions = {
  // 获取未读消息
  async getUnreadCount() {
    const userInfo = UserService.getCurrentUser()
    if (!userInfo) {
      state.messages.unreadCount = 0
      return 0
    }
    
    try {
      // 文档中未提供此API的具体实现
      // 需要根据实际云函数调整
      state.messages.unreadCount = 0
      return 0
    } catch (error) {
      console.error('获取未读消息失败:', error)
      return 0
    }
  },
  
  // 获取消息列表
  async getMessages(limit = 20) {
    const userInfo = UserService.getCurrentUser()
    if (!userInfo) {
      state.messages.list = []
      return []
    }
    
    try {
      // 文档中未提供此API的具体实现
      // 需要根据实际云函数调整
      state.messages.list = []
      return []
    } catch (error) {
      console.error('获取消息列表失败:', error)
      return []
    }
  }
}

// 初始化存储状态
export const initStore = () => {
  console.log('初始化全局状态')
  
  try {
    // 从本地存储恢复状态
    const savedState = uni.getStorageSync('global_state')
    if (savedState) {
      const parsed = JSON.parse(savedState)
      
      // 恢复用户状态
      if (parsed.user) {
        Object.assign(state.user, parsed.user)
      }
      
      // 恢复应用状态
      if (parsed.app) {
        Object.assign(state.app, parsed.app)
      }
      
      console.log('从本地存储恢复状态:', {
        isLoggedIn: state.user.isLoggedIn,
        hasUserInfo: !!state.user.info,
        theme: state.app.theme,
        language: state.app.language
      })
    }
    
    // 如果本地有登录状态，验证其有效性
    if (state.user.isLoggedIn && state.user.token) {
      const isStillValid = UserService.validateToken(state.user.token)
      if (!isStillValid) {
        console.log('登录状态已失效，重置为未登录状态')
        state.user.isLoggedIn = false
        state.user.info = null
        state.user.stats = null
        state.user.token = null
      }
    } else {
      // 否则检查当前登录状态
      const isLoggedIn = userActions.checkLoginStatus()
      console.log('检查登录状态结果:', isLoggedIn)
    }
    
  } catch (error) {
    console.error('初始化状态失败:', error)
    // 初始化失败时重置状态
    state.user.isLoggedIn = false
    state.user.info = null
    state.user.stats = null
    state.user.token = null
  }
}

// 默认导出
export default {
  getState,
  userActions,
  appActions,
  gameActions,
  messageActions,
  initStore
}