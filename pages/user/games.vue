<template>
  <view class="games-container">
    <!-- 导航栏 - 移除重复的返回箭头 -->
    <view class="nav-bar">
      <!-- 只保留一个返回箭头 -->
      <view class="nav-left" @tap="goBack">
        <image src="/static/icons/back.png" class="back-icon" />
      </view>
      <view class="nav-title">游戏/设备管理</view>
      <view class="nav-right" @tap="saveGames">
        <text class="save-text">保存</text>
      </view>
    </view>

    <!-- 游戏列表 -->
    <scroll-view class="games-scroll" scroll-y>
      <!-- 我的游戏 -->
      <view class="section">
        <view class="section-title">我的游戏/设备
          <text class="item-count">({{ myGames.length }}/10)</text>
        </view>
        <view v-if="myGames.length === 0" class="empty-games">
          <image src="/static/empty-games-list.png" class="empty-image" />
          <text class="empty-text">暂无游戏/设备，点击下方添加</text>
        </view>
        <view v-else class="games-list">
          <view 
            v-for="(game, index) in myGames" 
            :key="index"
            class="game-item"
          >
            <view class="game-main">
              <view class="game-type-tag" :class="getGameTypeClass(game.type)">
                {{ getGameTypeText(game.type) }}
              </view>
              <input
                v-model="game.name"
                class="game-name-input"
                placeholder="输入游戏/设备名称"
                placeholder-class="placeholder"
                maxlength="20"
              />
            </view>
            <view class="game-actions">
              <picker 
                mode="selector" 
                :range="gameTypes" 
                :range-key="'name'"
                :value="getTypeIndex(game.type)"
                @change="(e) => changeGameType(index, e.detail.value)"
              >
                <view class="type-btn">
                  类型
                </view>
              </picker>
              <view class="remove-btn" @tap="removeGame(index)">
                删除
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 添加游戏 - 增加区域高度，解决输入框压缩 -->
      <view class="section add-game-section">
        <view class="section-title">添加新游戏/设备</view>
        <view class="add-game-form">
          <view class="form-item">
            <view class="form-label">游戏类型</view>
            <picker 
              mode="selector" 
              :range="gameTypes" 
              :range-key="'name'"
              :value="newGame.typeIndex"
              @change="onNewGameTypeChange"
            >
              <view class="form-picker">
                <text>{{ gameTypes[newGame.typeIndex].name }}</text>
                <image src="/static/icons/arrow-right.png" class="arrow-right" />
              </view>
            </picker>
          </view>
          
          <view class="form-item">
            <view class="form-label">游戏/设备名称</view>
            <input
              v-model="newGame.name"
              class="form-input"
              placeholder="例如：Switch游戏机、《马里奥赛车》"
              placeholder-class="placeholder"
              maxlength="20"
              @confirm="addNewGame"
            />
          </view>
          
          <view 
            class="add-btn" 
            :class="{ 'add-btn-disabled': myGames.length >= 10 }"
            @tap="addNewGame"
          >
            {{ myGames.length >= 10 ? '已达上限' : '添加到我的列表' }}
          </view>
        </view>
      </view>

      <!-- 保存提示 -->
      <view class="save-tips">
        <text>建议添加您经常玩或拥有的游戏/设备，方便组局匹配 (最多10个)</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import UserService from '@/utils/user.js'

// 游戏类型选项
const gameTypes = ref([
  { id: 'mahjong', name: '立直麻将' },
  { id: 'boardgame', name: '桌游' },
  { id: 'videogame', name: '电玩' }
])

// 我的游戏列表
const myGames = ref([])

// 新游戏表单
const newGame = ref({
  typeIndex: 0,
  name: ''
})

// 游戏类型样式
const getGameTypeClass = (type) => {
  const classMap = {
    'mahjong': 'game-tag-mahjong',
    'boardgame': 'game-tag-boardgame',
    'videogame': 'game-tag-videogame'
  }
  return classMap[type] || 'game-tag-mahjong'
}

// 游戏类型文字
const getGameTypeText = (type) => {
  const textMap = {
    'mahjong': '立直麻将',
    'boardgame': '桌游',
    'videogame': '电玩'
  }
  return textMap[type] || '立直麻将'
}

// 获取类型索引
const getTypeIndex = (type) => {
  return gameTypes.value.findIndex(t => t.id === type)
}

// 新游戏类型变化
const onNewGameTypeChange = (e) => {
  newGame.value.typeIndex = e.detail.value
}

// 修改游戏类型
const changeGameType = (index, typeIndex) => {
  myGames.value[index].type = gameTypes.value[typeIndex].id
}

// 添加新游戏
const addNewGame = () => {
  // 检查是否达到上限
  if (myGames.value.length >= 10) {
    uni.showToast({
      title: '最多只能添加10个游戏/设备',
      icon: 'none'
    })
    return
  }
  
  if (!newGame.value.name.trim()) {
    uni.showToast({
      title: '请输入游戏/设备名称',
      icon: 'none'
    })
    return
  }

  const selectedType = gameTypes.value[newGame.value.typeIndex]
  
  myGames.value.push({
    id: Date.now() + myGames.value.length,
    type: selectedType.id,
    name: newGame.value.name.trim()
  })

  // 重置表单
  newGame.value.name = ''
  
  uni.showToast({
    title: '添加成功',
    icon: 'success'
  })
}

// 移除游戏
const removeGame = (index) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个游戏/设备吗？',
    success: (res) => {
      if (res.confirm) {
        myGames.value.splice(index, 1)
        uni.showToast({
          title: '已删除',
          icon: 'success'
        })
      }
    }
  })
}

// 保存游戏列表
const saveGames = async () => {
  if (myGames.value.length === 0) {
    uni.showToast({
      title: '请至少添加一个游戏/设备',
      icon: 'none'
    })
    return
  }
  
  if (myGames.value.length > 10) {
    uni.showToast({
      title: '游戏/设备数量不能超过10个',
      icon: 'none'
    })
    return
  }

  // 显示保存中
  uni.showLoading({
    title: '保存中...',
    mask: true
  })

  try {
    // 调用专门的云函数更新用户游戏/设备
    await UserService.updateUserGames(myGames.value)
    
    uni.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 1500
    })
    
    // 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    
  } catch (error) {
    console.error('保存游戏列表失败:', error)
    uni.showToast({
      title: '保存失败: ' + (error.message || '请重试'),
      icon: 'none',
      duration: 3000
    })
  } finally {
    uni.hideLoading()
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 页面加载
onMounted(() => {
  // 获取当前用户的游戏
  const userInfo = UserService.getCurrentUser()
  if (userInfo?.games) {
    myGames.value = [...userInfo.games]
  }
})
</script>

<style scoped>
.games-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
}

/* 导航栏 - 确保只有一个返回箭头 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: white;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
  position: relative;
  z-index: 1000;
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
}

.nav-right {
  width: 80rpx;
  text-align: right;
}

.save-text {
  font-size: 32rpx;
  color: #07c160;
  font-weight: 500;
}

/* 滚动区域 */
.games-scroll {
  flex: 1;
  padding: 20rpx 30rpx 40rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 分区样式 - 统一高度管理 */
.section {
  margin-bottom: 40rpx;
  background-color: white;
  border-radius: 16rpx;
  padding: 40rpx; /* 增加内边距 */
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许自适应 */
  flex-shrink: 0; /* 防止压缩 */
}

/* 特别处理添加游戏区域，增加高度 */
.add-game-section {
  min-height: 400rpx; /* 确保有足够的高度 */
  padding: 50rpx 40rpx; /* 增加内边距 */
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx; /* 增加底部间距 */
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0; /* 标题不压缩 */
}

.item-count {
  font-size: 28rpx;
  color: #666;
  font-weight: normal;
}

/* 空状态 */
.empty-games {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
  flex: 1; /* 占据可用空间 */
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  text-align: center;
}

/* 游戏列表 */
.games-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  flex: 1; /* 占据可用空间 */
  min-height: 0; /* 允许压缩 */
  overflow: visible;
}

/* 游戏项 */
.game-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  border: 1rpx solid #e0e0e0;
  min-height: 100rpx;
  box-sizing: border-box;
  flex-shrink: 0; /* 不压缩 */
}

/* 主要部分 */
.game-main {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  margin-right: 20rpx;
}

.game-type-tag {
  width: 100rpx;
  text-align: center;
  padding: 6rpx 12rpx;
  border-radius: 4rpx;
  font-size: 24rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.game-tag-mahjong {
  background-color: #e6f7ff;
  color: #1890ff;
}

.game-tag-boardgame {
  background-color: #f6ffed;
  color: #52c41a;
}

.game-tag-videogame {
  background-color: #fff7e6;
  color: #fa8c16;
}

/* 游戏名称输入框 */
.game-name-input {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: #333;
  background-color: transparent;
  border: none;
  padding: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  height: 100%;
  display: flex;
  align-items: center;
}

.game-name-input:focus {
  background-color: white;
  padding: 10rpx 20rpx;
  border-radius: 6rpx;
  border: 1rpx solid #07c160;
  position: relative;
  z-index: 1;
  min-width: 300rpx;
  white-space: normal;
  overflow: auto;
  text-overflow: clip;
}

.placeholder {
  color: #999;
  font-size: 28rpx;
}

/* 游戏操作按钮 */
.game-actions {
  display: flex;
  gap: 10rpx;
  flex-shrink: 0;
}

.type-btn,
.remove-btn {
  padding: 8rpx 16rpx;
  border-radius: 4rpx;
  font-size: 24rpx;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.type-btn {
  background-color: #1890ff;
  color: white;
}

.type-btn:active {
  background-color: #096dd9;
}

.remove-btn {
  background-color: #ff4d4f;
  color: white;
}

.remove-btn:active {
  background-color: #ff7875;
}

/* 关键修复：添加游戏表单 - 解决高度压缩问题 */
.add-game-form {
  display: flex;
  flex-direction: column;
  gap: 30rpx; /* 增加表单项间距 */
  width: 100%;
  flex: 1; /* 占据可用空间 */
  min-height: 300rpx; /* 确保最小高度 */
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 15rpx; /* 增加标签和输入框间距 */
  width: 100%;
  flex-shrink: 0; /* 防止压缩 */
}

.form-label {
  font-size: 30rpx; /* 稍微增大字体 */
  color: #333;
  font-weight: 500;
  width: 100%;
  flex-shrink: 0;
}

.form-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25rpx; /* 增加内边距 */
  background-color: #f8f8f8;
  border-radius: 8rpx;
  border: 1rpx solid #e0e0e0;
  font-size: 28rpx;
  color: #333;
  width: 100%;
  box-sizing: border-box;
  min-height: 90rpx; /* 确保最小高度 */
  flex-shrink: 0;
}

.form-picker:active {
  background-color: #f0f0f0;
}

.arrow-right {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.5;
}

/* 关键修复：表单输入框 - 解决压缩问题 */
.form-input {
  width: 100%;
  padding: 25rpx; /* 增加内边距 */
  background-color: #f8f8f8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  border: 1rpx solid #e0e0e0;
  box-sizing: border-box;
  min-height: 90rpx; /* 确保最小高度 */
  flex-shrink: 0; /* 防止压缩 */
  display: block;
}

.form-input:focus {
  border-color: #07c160;
  background-color: white;
  min-width: 300rpx;
}

.add-btn {
  padding: 25rpx; /* 增加内边距 */
  background-color: #07c160;
  color: white;
  border-radius: 8rpx;
  font-size: 28rpx;
  text-align: center;
  font-weight: 500;
  margin-top: 20rpx; /* 增加上边距 */
  width: 100%;
  box-sizing: border-box;
  min-height: 90rpx; /* 确保最小高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-btn:active {
  background-color: #06ad56;
}

.add-btn-disabled {
  background-color: #ccc;
  color: #999;
  pointer-events: none;
}

/* 保存提示 */
.save-tips {
  padding: 20rpx;
  background-color: #f6ffed;
  color: #52c41a;
  border-radius: 8rpx;
  font-size: 24rpx;
  text-align: center;
  margin-top: 20rpx;
  border: 1rpx solid #b7eb8f;
  line-height: 1.4;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}
</style>