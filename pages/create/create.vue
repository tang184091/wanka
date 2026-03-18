<template>
  <view class="create-container">
    <scroll-view class="form-scroll" scroll-y>
      <!-- 活动类型选择 -->
      <view class="form-section">
        <view class="section-title">活动类型</view>
        <view class="type-options">
          <view 
            v-for="type in gameTypes" 
            :key="type.id"
            class="type-option"
            :class="{ active: formData.type === type.id }"
            @tap="selectType(type.id)"
          >
            <view class="type-icon">
              <image :src="type.icon" class="type-icon-img" />
            </view>
            <text class="type-name">{{ type.name }}</text>
          </view>
        </view>
      </view>

      <!-- 基本信息 -->
      <view class="form-section">
        <view class="section-title">基本信息</view>
        
        <!-- 活动标题 -->
        <view class="form-item">
          <view class="form-label">活动标题 *</view>
          <input 
            v-model="formData.title"
            class="form-input"
            placeholder="请输入活动标题，如：周五晚公式战"
            placeholder-class="placeholder"
            maxlength="20"
          />
          <view class="form-tips">{{ formData.title.length }}/20</view>
        </view>

        <!-- 具体游戏/项目 -->
        <view class="form-item">
          <view class="form-label">具体项目 *</view>
          <input 
            v-model="formData.project"
            class="form-input"
            :placeholder="getProjectPlaceholder()"
            placeholder-class="placeholder"
            maxlength="30"
          />
          <view class="form-tips">{{ formData.project.length }}/30</view>
        </view>

        <!-- 活动时间 -->
        <view class="form-item">
          <view class="form-label">活动时间 *</view>
          <view class="picker-wrapper">
            <picker 
              mode="date" 
              :value="dateValue" 
              :start="currentDate" 
              :end="endDate" 
              @change="bindDateChange"
              class="picker-item"
            >
              <view class="picker-input">
                <text class="time-text">{{ dateDisplay || '选择日期' }}</text>
                <image src="/static/icons/arrow-right.png" class="arrow-right" />
              </view>
            </picker>
            <picker 
              mode="time" 
              :value="timeValue" 
              start="00:00" 
              end="23:59" 
              @change="bindTimeChange"
              class="picker-item"
            >
              <view class="picker-input">
                <text class="time-text">{{ timeDisplay || '选择时间' }}</text>
                <image src="/static/icons/arrow-right.png" class="arrow-right" />
              </view>
            </picker>
          </view>
          <view v-if="timeError" class="error-text">
            请选择未来的时间
          </view>
        </view>

        <!-- 活动地点 -->
        <view class="form-item">
          <view class="form-label">活动地点 *</view>
          <picker
            mode="selector"
            :range="locationOptions"
            range-key="name"
            :value="locationPickerValue"
            @change="bindLocationChange"
            class="picker-item"
          >
            <view class="picker-input">
              <text class="time-text" :class="{ 'placeholder-text': !selectedLocationName }">
                {{ selectedLocationName || '请选择活动地点' }}
              </text>
              <image src="/static/icons/arrow-right.png" class="arrow-right" />
            </view>
          </picker>
          <view class="location-hint">地点由门店统一维护</view>
        </view>

        <!-- 人数设置 -->
        <view class="form-item">
          <view class="form-label">人数设置 *</view>
          <view class="number-picker">
            <view class="number-control">
              <view 
                class="number-btn minus"
                :class="{ disabled: formData.maxPlayers <= minPlayers }"
                @tap="decreaseNumber"
              >
                -
              </view>
              <view class="number-display">
                <text class="number-value">{{ formData.maxPlayers }}</text>
                <text class="number-unit">人</text>
              </view>
              <view 
                class="number-btn plus"
                :class="{ disabled: formData.maxPlayers >= maxPlayers }"
                @tap="increaseNumber"
              >
                +
              </view>
            </view>
            <view class="number-tips">
              当前选择：{{ getPlayerRangeText() }}
            </view>
          </view>
        </view>

        <!-- 活动描述 -->
        <view class="form-item">
          <view class="form-label">补充说明（可选）</view>
          <textarea 
            v-model="formData.description"
            class="form-textarea"
            placeholder="可补充活动规则、注意事项等"
            placeholder-class="placeholder"
            maxlength="200"
          />
          <view class="form-tips">{{ formData.description.length }}/200</view>
        </view>
      </view>

      <!-- 创建按钮 -->
      <view class="create-btn-container">
        <view 
          class="create-btn"
          :class="{ disabled: !canSubmit }"
          @tap="handleSubmit"
        >
          创建组局
        </view>
        <view class="create-tips">
          创建后会自动生成组局详情页，可分享到微信群
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-area"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { gameActions } from '@/utils/store.js'
import UserService from '@/utils/user.js'
import constants from '@/utils/constants.js'

// 响应式数据
const gameTypes = ref([
  { 
    id: 'mahjong', 
    name: '立直麻将', 
    icon: '/static/icons/mahjong.png',
    minPlayers: constants.GAME_TYPES.mahjong.minPlayers,
    maxPlayers: constants.GAME_TYPES.mahjong.maxPlayers
  },
  { 
    id: 'boardgame', 
    name: '桌游', 
    icon: '/static/icons/boardgame.png',
    minPlayers: constants.GAME_TYPES.boardgame.minPlayers,
    maxPlayers: constants.GAME_TYPES.boardgame.maxPlayers
  },
  { 
    id: 'videogame', 
    name: '电玩', 
    icon: '/static/icons/videogame.png',
    minPlayers: constants.GAME_TYPES.videogame.minPlayers,
    maxPlayers: constants.GAME_TYPES.videogame.maxPlayers
  },
  {
    id: 'competition',
    name: '比赛',
    icon: '/static/icons/activity-create.png',
    minPlayers: constants.GAME_TYPES.competition.minPlayers,
    maxPlayers: constants.GAME_TYPES.competition.maxPlayers
  }
])

// 表单数据
const formData = ref({
  type: 'mahjong', // 默认日麻
  title: '',
  project: '',
  time: '',
  location: '',
  maxPlayers: 4, // 默认人数
  description: ''
})

// 编辑模式相关
const isEditMode = ref(false)
const gameId = ref('')
const originalData = ref({})

// 修复：拆分为独立的日期和时间值，用于原生 picker
const dateValue = ref('')
const timeValue = ref('')
const dateDisplay = ref('')
const timeDisplay = ref('')
const timeError = ref(false)

// 可选地点
const locationOptions = ref(constants.GAME_LOCATIONS || [])

// 当前时间和结束日期
const currentDate = ref('')
const endDate = ref('')

// 计算属性
const minPlayers = computed(() => {
  const type = gameTypes.value.find(t => t.id === formData.value.type)
  return type?.minPlayers || 2
})

const maxPlayers = computed(() => {
  const type = gameTypes.value.find(t => t.id === formData.value.type)
  return type?.maxPlayers || 4
})

const canSubmit = computed(() => {
  return formData.value.title && 
         formData.value.project && 
         formData.value.time && 
         formData.value.location &&
         formData.value.maxPlayers >= minPlayers.value &&
         formData.value.maxPlayers <= maxPlayers.value &&
         !timeError.value
})

const selectedLocationName = computed(() => formData.value.location || '')

const locationPickerValue = computed(() => {
  const index = locationOptions.value.findIndex(item => item.name === formData.value.location)
  return index >= 0 ? index : 0
})

// 应用快捷创建预填参数
const applyPrefill = (options = {}) => {
  if (options.type) {
    const allowedType = gameTypes.value.find(t => t.id === options.type)
    if (allowedType) {
      formData.value.type = allowedType.id
      formData.value.maxPlayers = allowedType.minPlayers
    }
  }

  if (options.project) {
    formData.value.project = decodeURIComponent(options.project)
  }

  if (options.location) {
    formData.value.location = decodeURIComponent(options.location)
  }
}

// 页面加载
onLoad((options) => {
  console.log('页面参数:', options)
  
  // 检查是否编辑模式
  if (options.edit && options.id) {
    isEditMode.value = true
    gameId.value = options.id
    loadGameDetail(options.id)
  } else {
    // 创建模式：初始化默认值
    initDates()
    applyPrefill(options)
  }
})

// 加载对局详情
const loadGameDetail = async (id) => {
  try {
    uni.showLoading({
      title: '加载中...',
      mask: true
    })
    
    const result = await wx.cloud.callFunction({
      name: 'game-service',
      data: {
        action: 'getGameDetail',
        data: { gameId: id }
      }
    })
    
    console.log('加载对局详情结果:', result)
    
    if (result.result && result.result.code === 0 && result.result.data) {
      const game = result.result.data
      
      // 保存原始数据
      originalData.value = { ...game }
      
      // 填充表单数据
      formData.value = {
        type: game.type || 'mahjong',
        title: game.title || '',
        project: game.project || '',
        time: game.time || '',
        location: game.location || '',
        maxPlayers: game.maxPlayers || 4,
        description: game.description || ''
      }
      
      // 设置日期时间选择器
      if (game.time) {
        const date = new Date(game.time)
        dateValue.value = date.toISOString().split('T')[0]
        timeValue.value = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        updateTimeDisplay(date)
      }
      
      // 设置页面标题
      uni.setNavigationBarTitle({
        title: '编辑组局'
      })
    } else {
      throw new Error('加载对局详情失败')
    }
  } catch (error) {
    console.error('加载对局详情失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none',
      duration: 2000
    })
    
    // 回退到创建模式
    isEditMode.value = false
    initDates()
  } finally {
    uni.hideLoading()
  }
}

// 初始化日期
const initDates = () => {
  const now = new Date()
  const max = new Date()
  max.setMonth(now.getMonth() + 3) // 最多可预约3个月内
  
  // 格式化为 YYYY-MM-DD
  currentDate.value = now.toISOString().split('T')[0]
  endDate.value = max.toISOString().split('T')[0]
  
  // 设置默认时间为明天下午7点
  const defaultTime = new Date()
  defaultTime.setDate(defaultTime.getDate() + 1) // 明天
  defaultTime.setHours(19, 0, 0, 0) // 晚上7点
  
  // 更新独立的日期和时间值
  dateValue.value = defaultTime.toISOString().split('T')[0]
  timeValue.value = '19:00'
  
  // 更新显示值
  updateTimeDisplay(defaultTime)
  
  // 更新表单数据
  formData.value.time = defaultTime.toISOString()
}

// 更新时间显示
const updateTimeDisplay = (date) => {
  if (!date) return
  
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  dateDisplay.value = `${year}-${month}-${day}`
  timeDisplay.value = `${hours}:${minutes}`
}

// 选择活动类型
const selectType = (type) => {
  formData.value.type = type
  
  // 根据类型设置默认人数
  const typeConfig = gameTypes.value.find(t => t.id === type)
  if (typeConfig) {
    formData.value.maxPlayers = typeConfig.minPlayers
  }
  
  // 清空具体项目，让placeholder更新
  if (!formData.value.project) {
    formData.value.project = ''
  }
}

// 获取具体项目placeholder
const getProjectPlaceholder = () => {
  const placeholders = {
    mahjong: '请输入规则，如：三麻，抽血局',
    boardgame: '请输入具体桌游，如：《历史巨轮》',
    videogame: '请输入具体游戏/设备，如：Switch《马里奥赛车》',
    competition: '请输入比赛名称，如：春季店赛'
  }
  return placeholders[formData.value.type] || '请输入具体项目'
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
    dateStr = `${date.getMonth() + 1}月${date.getDate()}日`
  }
  
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${dateStr} ${hours}:${minutes}`
}

// 日期选择变化
const bindDateChange = (e) => {
  dateValue.value = e.detail.value
  updateFormDateTime()
}

// 时间选择变化
const bindTimeChange = (e) => {
  timeValue.value = e.detail.value
  updateFormDateTime()
}

// 更新表单中的完整时间
const updateFormDateTime = () => {
  if (dateValue.value && timeValue.value) {
    const dateStr = dateValue.value
    const timeStr = timeValue.value
    
    // 组合成完整的 ISO 字符串
    const fullDateTime = `${dateStr}T${timeStr}:00`
    formData.value.time = fullDateTime
    
    // 更新显示
    const date = new Date(fullDateTime)
    updateTimeDisplay(date)
    
    // 验证时间是否为未来
    const now = new Date()
    timeError.value = date <= now
    
  } else {
    formData.value.time = ''
  }
}

// 选择地点（从门店维护列表中选择）
const bindLocationChange = (e) => {
  const index = Number(e.detail.value)
  const selected = locationOptions.value[index]
  if (selected && selected.name) {
    formData.value.location = selected.name
  }
}

// 获取人数范围文本
const getPlayerRangeText = () => {
  if (minPlayers.value === maxPlayers.value) {
    return `仅限${minPlayers.value}人`
  } else {
    return `${minPlayers.value}-${maxPlayers.value}人`
  }
}

// 减少人数
const decreaseNumber = () => {
  if (formData.value.maxPlayers > minPlayers.value) {
    formData.value.maxPlayers--
  }
}

// 增加人数
const increaseNumber = () => {
  if (formData.value.maxPlayers < maxPlayers.value) {
    formData.value.maxPlayers++
  }
}

// 提交表单 - 修复版，支持编辑模式
const handleSubmit = async () => {
  if (!canSubmit.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none'
    })
    return
  }
  
  // 验证时间
  if (timeError.value) {
    uni.showToast({
      title: '活动时间不能早于当前时间',
      icon: 'none'
    })
    return
  }
  
  const selectedTime = new Date(formData.value.time)
  const now = new Date()
  if (selectedTime <= now) {
    uni.showToast({
      title: '活动时间必须是未来时间',
      icon: 'none'
    })
    return
  }
  
  // 获取当前用户
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
  
  uni.showLoading({
    title: isEditMode.value ? '更新中...' : '创建中...',
    mask: true
  })
  
  try {
    // 准备数据
    const gameData = {
      type: formData.value.type,
      title: formData.value.title,
      project: formData.value.project,
      time: formData.value.time,
      location: formData.value.location,
      maxPlayers: formData.value.maxPlayers,
      description: formData.value.description || ''
    }
    
    console.log('✅ 准备提交的 gameData:', gameData)
    console.log('📝 当前模式:', isEditMode.value ? '编辑模式' : '创建模式')
    
    if (isEditMode.value) {
      // 编辑模式：调用 updateGame
      console.log('🔄 调用 updateGame，gameId:', gameId.value)
      
      const result = await wx.cloud.callFunction({
        name: 'game-service',
        data: {
          action: 'updateGame',
          data: {
            gameId: gameId.value,
            updates: gameData
          }
        }
      })
      
      console.log('✅ updateGame 返回结果:', result)
      
      if (result.result && result.result.code === 0) {
        uni.hideLoading()
        
        uni.showToast({
          title: '更新成功',
          icon: 'success',
          duration: 2000
        })
        
        // 返回上一页，并通知列表页面刷新
        setTimeout(() => {
          // 获取当前页面栈
          const pages = getCurrentPages()
          if (pages.length > 1) {
            // 获取上一个页面实例
            const prevPage = pages[pages.length - 2]
            
            // 检查是否是 list 页面
            if (prevPage.route === 'pages/list/list' || prevPage.__route__ === 'pages/list/list') {
              // 调用上一页的刷新方法
              if (prevPage.refreshList) {
                prevPage.refreshList()
              }
            }
          }
          
          // 返回列表
          uni.navigateBack({
            success: () => {
              // 也可以通过事件总线通知列表刷新
              uni.$emit('refreshGameList')
            }
          })
        }, 1500)
      } else {
        throw new Error(result.result?.message || '更新失败，返回数据异常')
      }
    } else {
      // 创建模式：调用 createGame
      const userInfo = {
        id: currentUser._id || currentUser.id,
        nickname: currentUser.nickname || '未知用户',
        avatar: currentUser.avatar || constants.DEFAULT_AVATAR,
        tags: currentUser.tags || [],
        gender: currentUser.gender || 0
      }
      
      console.log('✅ 当前用户信息:', userInfo)
      
      const result = await wx.cloud.callFunction({
        name: 'game-service',
        data: {
          action: 'createGame',
          data: {
            gameData: gameData,
            userInfo: userInfo
          }
        }
      })
      
      console.log('✅ createGame 返回结果:', result)
      
      if (result.result && result.result.code === 0) {
        uni.hideLoading()
        
        uni.showToast({
          title: '创建成功',
          icon: 'success',
          duration: 2000
        })
        
        // 延迟跳转
        setTimeout(() => {
          uni.redirectTo({
            url: `/pages/detail/detail?id=${result.result.data.id}&from=create`
          })
        }, 1500)
      } else {
        throw new Error(result.result?.message || '创建失败，返回数据异常')
      }
    }
    
  } catch (error) {
    console.error('❌ 操作失败:', error)
    
    // 更友好的错误提示
    let errorMessage = error.message || (isEditMode.value ? '更新失败，请重试' : '创建失败，请重试')
    if (errorMessage.includes('Cannot destructure')) {
      errorMessage = '参数格式错误，请检查调用方式'
    } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
      errorMessage = '网络连接失败，请检查网络后重试'
    } else if (errorMessage.includes('permission') || errorMessage.includes('权限')) {
      errorMessage = '权限不足，请重新登录后重试'
    } else if (errorMessage.includes('服务器内部错误')) {
      errorMessage = '服务器异常，请稍后重试'
    } else if (errorMessage.includes('缺少必要字段')) {
      errorMessage = errorMessage
    }
    
    uni.showModal({
      title: isEditMode.value ? '更新失败' : '创建失败',
      content: errorMessage,
      showCancel: false
    })
  } finally {
    // 确保 hideLoading 被调用
    uni.hideLoading()
  }
}

// 监听时间变化，实时验证
watch(() => formData.value.time, (newTime) => {
  if (newTime) {
    const selectedTime = new Date(newTime)
    const now = new Date()
    timeError.value = selectedTime <= now
  } else {
    timeError.value = false
  }
})
</script>

<style scoped>
.create-container {
  height: 100vh;
  background-color: #f8f8f8;
}

.form-scroll {
  height: 100%;
}

/* 分区样式 */
.form-section {
  background-color: white;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

/* 类型选择样式 */
.type-options {
  display: flex;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  border-radius: 16rpx;
  width: 25%;
  box-sizing: border-box;
  padding: 14rpx 8rpx;
  transition: all 0.3s;
  border: 2rpx solid transparent;
}

.type-option.active {
  background-color: #e8f5e9;
  border-color: #07c160;
  transform: translateY(-4rpx);
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.2);
}

.type-icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
  overflow: hidden;
}

.type-option.active .type-icon {
  background-color: #07c160;
}

.type-icon-img {
  width: 44rpx;
  height: 44rpx;
}

.type-name {
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
}

.type-option.active .type-name {
  color: #07c160;
  font-weight: bold;
}

/* 表单项目样式 */
.form-item {
  margin-bottom: 40rpx;
  position: relative;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  border: 2rpx solid #e0e0e0;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #07c160;
  background-color: white;
}

.placeholder {
  color: #999;
  font-size: 28rpx;
}

.form-tips {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 24rpx;
  color: #999;
}

.error-text {
  color: #ff4d4f;
  font-size: 24rpx;
  margin-top: 10rpx;
}

/* 修复：时间选择器包装样式 */
.picker-wrapper {
  display: flex;
  gap: 20rpx;
}

.picker-item {
  flex: 1;
}

.picker-input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  border: 2rpx solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.picker-input:active {
  background-color: #f0f0f0;
}

.time-text {
  font-size: 28rpx;
  color: #333;
}

.placeholder-text {
  color: #999;
}

.location-hint {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #999;
}

.arrow-right {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.5;
}

/* 人数选择器样式 */
.number-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.number-control {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.number-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #07c160;
  color: white;
  font-size: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.number-btn:active {
  background-color: #06ad56;
}

.number-btn.disabled {
  background-color: #cccccc;
  color: #999;
}

.number-btn.disabled:active {
  background-color: #cccccc;
}

.number-btn.minus {
  margin-right: 40rpx;
}

.number-btn.plus {
  margin-left: 40rpx;
}

.number-display {
  display: flex;
  align-items: baseline;
}

.number-value {
  font-size: 60rpx;
  font-weight: bold;
  color: #07c160;
  margin-right: 10rpx;
}

.number-unit {
  font-size: 28rpx;
  color: #666;
}

.number-tips {
  font-size: 24rpx;
  color: #999;
  text-align: center;
}

/* 文本域样式 */
.form-textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  border: 2rpx solid #e0e0e0;
  box-sizing: border-box;
  line-height: 1.5;
}

.form-textarea:focus {
  border-color: #07c160;
  background-color: white;
}

/* 预览卡片样式 */
.preview-card {
  margin-top: 20rpx;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.preview-info .info-item {
  display: flex;
  align-items: center;
}

.preview-info .info-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 15rpx;
  opacity: 0.7;
}

.preview-info .info-text {
  font-size: 28rpx;
  color: #666;
  flex: 1;
}

.preview-players {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
}

.player-avatar.empty {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.avatar-text {
  font-size: 40rpx;
  color: #999;
  font-weight: bold;
}

.player-tips {
  font-size: 28rpx;
  color: #999;
}

/* 创建按钮样式 */
.create-btn-container {
  padding: 40rpx 20rpx 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.create-btn {
  width: 100%;
  height: 100rpx;
  background-color: #07c160;
  color: white;
  border-radius: 50rpx;
  font-size: 36rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  transition: all 0.3s;
}

.create-btn:active {
  background-color: #06ad56;
  transform: translateY(2rpx);
}

.create-btn.disabled {
  background-color: #cccccc;
  color: #999;
}

.create-btn.disabled:active {
  background-color: #cccccc;
  transform: none;
}

.create-tips {
  font-size: 24rpx;
  color: #999;
  text-align: center;
}

/* 安全区域 */
.safe-area {
  height: env(safe-area-inset-bottom);
  min-height: 20rpx;
}
</style>
