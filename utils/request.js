// utils/request.js
// 纯净的云函数API网关 - 已适配云开发

// 统一的云函数调用方法
const callCloudFunction = async (functionName, action, data = {}) => {
  if (!wx.cloud) {
    console.error('云开发未初始化，无法调用云函数')
    throw new Error('云开发未初始化')
  }

  console.log(`[API] 调用云函数 ${functionName}，action: ${action}`, data)

  try {
    const result = await wx.cloud.callFunction({
      name: functionName,
<<<<<<< ours
<<<<<<< ours
=======
      // 云函数统一约定 event = { action, data }
      // 这里必须把业务参数包在 data 字段里，否则云函数拿不到参数
>>>>>>> theirs
=======
      // 云函数统一约定 event = { action, data }
      // 这里必须把业务参数包在 data 字段里，否则云函数拿不到参数
>>>>>>> theirs
      data: { action, data }
    })

    console.log('[API] 云函数调用结果:', result)

    if (result.result) {
      if (result.result.code === 0) {
        return result.result.data
      } else {
        // 云函数业务逻辑错误
        const errMsg = result.result.message || '云函数调用失败'
        uni.showToast({ 
          title: errMsg, 
          icon: 'none',
          duration: 2000
        })
        throw new Error(errMsg)
      }
    } else {
      throw new Error('云函数返回结果格式错误')
    }
  } catch (error) {
    console.error(`[API] 云函数 ${functionName} 调用失败:`, error)
    
    // 精确判断错误类型
    const isNetworkError = error.errMsg && (
      error.errMsg.includes('request:fail') || 
      error.errMsg.includes('cloud function error') || // 云函数网络或系统错误
      error.errMsg.includes('timed out') ||
      error.errMsg.includes('网络错误') ||
      error.errMsg.includes('网络连接失败')
    )
    
    if (isNetworkError) {
      uni.showToast({ 
        title: '网络请求失败，请检查网络连接', 
        icon: 'none',
        duration: 2000
      })
    }
    // 其他错误（如云函数业务错误、权限错误等）已在前面被抛出，这里不再重复提示
    
    throw error
  }
}

// API 服务对象 - 统一从这里导出
export const api = {
  user: {
    wechatLogin: (code, userInfo) => callCloudFunction('user-service', 'login', { code, userInfo }),
    getUserInfo: (userId) => callCloudFunction('user-service', 'getUserInfo', { userId }),
    updateUserInfo: (userId, updates) => callCloudFunction('user-service', 'updateUserInfo', { userId, updates }),
    updateUserTags: (userId, tags) => callCloudFunction('user-service', 'updateUserTags', { userId, tags }),
    updateUserGames: (userId, games) => callCloudFunction('user-service', 'updateUserGames', { userId, games }),
    updateUserAvatar: (userId, avatarUrl) => callCloudFunction('user-service', 'updateUserAvatar', { userId, avatarUrl }),
    getUserStats: (userId) => callCloudFunction('user-service', 'getUserStats', { userId })
  },
  game: {
    getGameList: (params) => callCloudFunction('game-service', 'getGameList', params),
    getGameDetail: (gameId) => callCloudFunction('game-service', 'getGameDetail', { gameId }),
    createGame: (gameData) => callCloudFunction('game-service', 'createGame', { gameData }),
    updateGame: (gameId, updates) => callCloudFunction('game-service', 'updateGame', { gameId, updates }),
    deleteGame: (gameId) => callCloudFunction('game-service', 'deleteGame', { gameId }),
    joinGame: (gameId, userId) => callCloudFunction('game-service', 'joinGame', { gameId, userId }),
    quitGame: (gameId, userId) => callCloudFunction('game-service', 'quitGame', { gameId, userId }),
    getMyGames: (userId, type) => callCloudFunction('game-service', 'getMyGames', { userId, type }),
    getCreatedGames: (userId) => callCloudFunction('game-service', 'getCreatedGames', { userId }),
    getJoinedGames: (userId) => callCloudFunction('game-service', 'getJoinedGames', { userId }),
    searchGames: (keyword, filters) => callCloudFunction('game-service', 'searchGames', { keyword, ...filters })
  },
  activity: {
    getGameActivities: (gameId) => callCloudFunction('activity-service', 'getGameActivities', { gameId }),
    addGameActivity: (gameId, data) => callCloudFunction('activity-service', 'addGameActivity', { gameId, data }),
    getUserActivities: (userId, limit) => callCloudFunction('activity-service', 'getUserActivities', { userId, limit }),
    getUnreadMessages: (userId) => callCloudFunction('activity-service', 'getUnreadMessages', { userId }),
    markMessageRead: (userId, messageId) => callCloudFunction('activity-service', 'markMessageRead', { userId, messageId }),
    markAllMessagesRead: (userId) => callCloudFunction('activity-service', 'markAllMessagesRead', { userId })
  },
  upload: {
    uploadImage: (filePath, options) => callCloudFunction('upload-service', 'uploadImage', { filePath, ...options }),
    uploadAvatar: (filePath) => callCloudFunction('upload-service', 'uploadAvatar', { filePath }),
    getUploadToken: () => callCloudFunction('upload-service', 'getUploadToken')
  }
}

// 注意：此文件不再导出默认的 request 对象
// 只导出 api 对象，供 store.js 使用
