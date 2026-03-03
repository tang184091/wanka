// utils/user.js
// 用户管理工具类 - 已集成云开发，已修复退出登录循环问题

import { userActions } from './store'

// 存储键名常量
const STORAGE_KEYS = {
  USER_INFO: 'user_info',
  USER_TOKEN: 'user_token',
  USER_STATS: 'user_stats',
  LOGIN_TIME: 'login_time',
  CLOUD_ENV: 'cloud_env',
  APP_CONFIG: 'app_config'
}

// 用户服务类
class UserService {
  // 检查是否已登录
  static isLoggedIn() {
    const userInfo = uni.getStorageSync(STORAGE_KEYS.USER_INFO)
    const token = uni.getStorageSync(STORAGE_KEYS.USER_TOKEN)
    return !!(userInfo && token)
  }

  // 获取当前用户信息
  static getCurrentUser() {
    return uni.getStorageSync(STORAGE_KEYS.USER_INFO) || null
  }

  // 获取当前用户统计
  static getUserStats() {
    return uni.getStorageSync(STORAGE_KEYS.USER_STATS) || null
  }

  // 获取用户token
  static getToken() {
    return uni.getStorageSync(STORAGE_KEYS.USER_TOKEN) || ''
  }

  // 获取云开发环境
  static getCloudEnv() {
    return uni.getStorageSync(STORAGE_KEYS.CLOUD_ENV) || 'cloud1-6glnv3cs9b44417a'
  }

  // 检查云开发是否可用
  static isCloudAvailable() {
    return !!(wx && wx.cloud)
  }

  // 微信登录 - 只获取登录code
  static async wechatLogin() {
    return new Promise((resolve, reject) => {
      console.log('开始获取微信登录code...')
      
      uni.login({
        provider: 'weixin',
        success: async (loginRes) => {
          if (loginRes.code) {
            console.log('✅ 获取微信code成功')
            resolve({ code: loginRes.code })
          } else {
            console.error('获取微信code失败')
            reject(new Error('获取微信登录code失败'))
          }
        },
        fail: (err) => {
          console.error('uni.login失败:', err)
          reject(new Error('微信登录失败: ' + err.errMsg))
        }
      })
    })
  }

  // 云开发登录
  static async cloudLogin(code, userInfo) {
    try {
      console.log('调用云函数 user-service 登录')
      
      // 调用云函数
      const result = await wx.cloud.callFunction({
        name: 'user-service',
        data: {
          action: 'login',
          data: {
            userInfo: userInfo
          }
        }
      })

      console.log('云函数调用结果:', result)

      if (result.result && result.result.code === 0) {
        return {
          success: true,
          userInfo: result.result.data.userInfo,
          token: result.result.data.token,
          stats: result.result.data.stats
        }
      } else {
        const errorMsg = result.result?.message || '云函数登录失败'
        console.error('云函数返回错误:', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('云函数调用失败:', error)
      throw error
    }
  }

  // 保存用户数据
  static saveUserData(userInfo, token, stats = null) {
    const now = new Date().getTime()
    
    console.log('保存用户数据:', { userInfo, token, stats })
    
    // 保存用户信息
    uni.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo)
    
    // 保存token
    uni.setStorageSync(STORAGE_KEYS.USER_TOKEN, token)
    
    // 保存登录时间
    uni.setStorageSync(STORAGE_KEYS.LOGIN_TIME, now)
    
    // 保存用户统计
    if (stats) {
      uni.setStorageSync(STORAGE_KEYS.USER_STATS, stats)
    }
    
    // 更新全局状态
    if (userActions && userActions.updateUserInfo) {
      userActions.updateUserInfo(userInfo)
      if (stats) {
        userActions.updateUserStats(stats)
      }
    }
    
    // 触发登录成功事件
    uni.$emit('user:login', { userInfo, token, stats })
    
    return true
  }

  // 退出登录 - 已修复，不再调用 userActions.logout() 避免循环
  static logout() {
    console.log('开始执行 UserService.logout() - 只处理数据清理')
    
    // 清除本地存储
    const storageKeys = [
      STORAGE_KEYS.USER_INFO,
      STORAGE_KEYS.USER_TOKEN, 
      STORAGE_KEYS.USER_STATS,
      STORAGE_KEYS.LOGIN_TIME
    ]
    
    storageKeys.forEach(key => {
      console.log(`清除存储: ${key}`)
      uni.removeStorageSync(key)
    })
    
    console.log('✅ 本地存储已清除')
    
    // 重要修复：这里不再调用 userActions.logout()，避免无限循环
    // 状态更新由页面组件调用 userActions.logout() 完成
    // 我们只负责触发事件通知
    
    // 触发退出登录事件
    console.log('触发 user:logout 事件，通知所有监听组件')
    uni.$emit('user:logout')
    
    console.log('✅ UserService.logout() 执行完成')
    return true
  }

  // 更新用户信息
  static async updateUserInfo(updates) {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }
    
    try {
      // 调用云函数更新用户信息
      const result = await wx.cloud.callFunction({
        name: 'user-service',
        data: {
          action: 'updateUserInfo',
          data: {
            userId: currentUser.id,
            updates: updates
          }
        }
      })

      console.log('更新用户信息结果:', result)

      if (result.result && result.result.code === 0) {
        const updatedUser = { ...currentUser, ...updates }
        
        // 保存到本地存储
        uni.setStorageSync(STORAGE_KEYS.USER_INFO, updatedUser)
        
        // 更新全局状态
        if (userActions && userActions.updateUserInfo) {
          userActions.updateUserInfo(updates)
        }
        
        // 触发更新事件
        uni.$emit('user:updated', updatedUser)
        
        return updatedUser
      } else {
        throw new Error(result.result?.message || '更新用户信息失败')
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    }
  }

  // 更新用户标签
  static async updateUserTags(tags) {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'user-service',
        data: {
          action: 'updateUserTags',
          data: {
            userId: currentUser.id,
            tags: tags
          }
        }
      })

      if (result.result && result.result.code === 0) {
        const updatedUser = { ...currentUser, tags: tags }
        uni.setStorageSync(STORAGE_KEYS.USER_INFO, updatedUser)
        
        if (userActions && userActions.updateUserInfo) {
          userActions.updateUserInfo({ tags: tags })
        }
        
        uni.$emit('user:updated', updatedUser)
        
        return updatedUser
      } else {
        throw new Error(result.result?.message || '更新用户标签失败')
      }
    } catch (error) {
      console.error('更新用户标签失败:', error)
      throw error
    }
  }

  // 更新用户标签
  static async updateUserTags(tags) {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }
  
    try {
      const result = await wx.cloud.callFunction({
        name: 'user-service',
        data: {
          action: 'updateUserTags',
          data: {
            userId: currentUser.id,
            tags: tags
          }
        }
      })
  
      if (result.result && result.result.code === 0) {
        const updatedUser = { ...currentUser, tags: tags }
        uni.setStorageSync(STORAGE_KEYS.USER_INFO, updatedUser)
  
        if (userActions && userActions.updateUserInfo) {
          userActions.updateUserInfo({ tags: tags })
        }
  
        uni.$emit('user:updated', updatedUser)
  
        return updatedUser
      } else {
        throw new Error(result.result?.message || '更新用户标签失败')
      }
    } catch (error) {
      console.error('更新用户标签失败:', error)
      throw error
    }
  }
  
  // 更新用户游戏/装备
  static async updateUserGames(games) {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }
  
    try {
      const result = await wx.cloud.callFunction({
        name: 'user-service',
        data: {
          action: 'updateUserGames',
          data: {
            userId: currentUser.id,
            games: games
          }
        }
      })
  
      if (result.result && result.result.code === 0) {
        const updatedUser = { ...currentUser, games: games }
        uni.setStorageSync(STORAGE_KEYS.USER_INFO, updatedUser)
  
        if (userActions && userActions.updateUserInfo) {
          userActions.updateUserInfo({ games: games })
        }
  
        uni.$emit('user:updated', updatedUser)
  
        return updatedUser
      } else {
        throw new Error(result.result?.message || '更新用户游戏失败')
      }
    } catch (error) {
      console.error('更新用户游戏失败:', error)
      throw error
    }
  }

  // 更新用户头像
  static async updateUserAvatar(avatarUrl) {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'user-service',
        data: {
          action: 'updateUserAvatar',
          data: {
            userId: currentUser.id,
            avatarUrl: avatarUrl
          }
        }
      })

      if (result.result && result.result.code === 0) {
        const updatedUser = { ...currentUser, avatar: avatarUrl }
        uni.setStorageSync(STORAGE_KEYS.USER_INFO, updatedUser)
        
        if (userActions && userActions.updateUserInfo) {
          userActions.updateUserInfo({ avatar: avatarUrl })
        }
        
        uni.$emit('user:updated', updatedUser)
        
        return updatedUser
      } else {
        throw new Error(result.result?.message || '更新用户头像失败')
      }
    } catch (error) {
      console.error('更新用户头像失败:', error)
      throw error
    }
  }

  // 获取用户统计
  static async fetchUserStats() {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'user-service',
        data: {
          action: 'getUserStats',
          data: {
            userId: currentUser.id
          }
        }
      })

      if (result.result && result.result.code === 0) {
        const stats = result.result.data
        uni.setStorageSync(STORAGE_KEYS.USER_STATS, stats)
        
        if (userActions && userActions.updateUserStats) {
          userActions.updateUserStats(stats)
        }
        
        return stats
      } else {
        throw new Error(result.result?.message || '获取用户统计失败')
      }
    } catch (error) {
      console.error('获取用户统计失败:', error)
      throw error
    }
  }

  // 检查token是否过期
  static isTokenExpired() {
    const loginTime = uni.getStorageSync(STORAGE_KEYS.LOGIN_TIME)
    if (!loginTime) return true
    
    const now = new Date().getTime()
    const sevenDays = 7 * 24 * 60 * 60 * 1000 // 7天过期
    
    return (now - loginTime) > sevenDays
  }

  // 上传图片到云存储
  static async uploadImage(filePath) {
    if (!this.isCloudAvailable()) {
      throw new Error('云开发不可用')
    }
    
    try {
      // 生成文件名
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substr(2, 6)
      const cloudPath = `images/${timestamp}_${randomStr}.jpg`
      
      console.log('开始上传图片到云存储:', cloudPath)
      
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      })
      
      console.log('图片上传成功:', uploadResult.fileID)
      return uploadResult.fileID
    } catch (error) {
      console.error('图片上传失败:', error)
      throw error
    }
  }

  // 清理所有本地数据（调试用）
  static clearAllData() {
    console.log('清理所有本地数据')
    
    const keys = [
      STORAGE_KEYS.USER_INFO,
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USER_STATS,
      STORAGE_KEYS.LOGIN_TIME,
      STORAGE_KEYS.CLOUD_ENV,
      STORAGE_KEYS.APP_CONFIG
    ]
    
    keys.forEach(key => {
      uni.removeStorageSync(key)
    })
    
    return true
  }
}

// 导出单例
export default UserService