<template>
  <view class="tags-container">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <image src="/static/icons/back.png" class="back-icon" />
      </view>
      <view class="nav-title">标签管理</view>
      <view class="nav-right" @tap="saveTags">
        <text class="save-text">保存</text>
      </view>
    </view>

    <!-- 标签列表 -->
    <scroll-view class="tags-scroll" scroll-y>
      <!-- 系统推荐标签 -->
      <view class="section">
        <view class="section-title">系统推荐标签</view>
        <view class="tags-list">
          <view 
            v-for="tag in systemTags" 
            :key="tag.id"
            class="tag-item"
            :class="{ selected: isTagSelected(tag.id) }"
            @tap="toggleTag(tag.id)"
          >
            <text class="tag-text">{{ tag.name }}</text>
            <view v-if="isTagSelected(tag.id)" class="tag-check">
              ✓
            </view>
          </view>
        </view>
      </view>

      <!-- 我的标签 -->
      <view class="section">
        <view class="section-title">我的标签</view>
        <view class="tags-list">
          <view 
            v-for="tag in myTags" 
            :key="tag.id"
            class="tag-item"
            :class="{ selected: isTagSelected(tag.id) }"
            @tap="toggleTag(tag.id)"
          >
            <text class="tag-text">{{ tag.name }}</text>
            <view v-if="isTagSelected(tag.id)" class="tag-check">
              ✓
            </view>
          </view>
        </view>
      </view>

      <!-- 自定义标签 -->
      <view class="section">
        <view class="section-title">自定义标签</view>
        <view class="custom-tags">
          <view 
            v-for="(tag, index) in customTags" 
            :key="index"
            class="custom-tag-item"
          >
            <input
              v-model="customTags[index]"
              class="custom-tag-input"
              placeholder="输入标签"
              placeholder-class="placeholder"
              maxlength="6"
            />
            <view class="tag-remove" @tap="removeCustomTag(index)">
              ×
            </view>
          </view>
          <view class="add-tag-btn" @tap="addCustomTag">
            + 添加自定义标签
          </view>
        </view>
      </view>

      <!-- 保存提示 -->
      <view class="save-tips">
        <text>标签最多选择8个，自定义标签最多添加3个</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import UserService from '@/utils/user.js'

// 系统推荐标签
const systemTags = ref([
  { id: 1, name: '立直麻将素人' },
  { id: 2, name: '你同我认真打' },
  { id: 3, name: '乱冲下次不和你玩了' },
  { id: 4, name: '狙击七段' },
  { id: 5, name: '周末有空' },
  { id: 6, name: '工作日晚上' },
  { id: 7, name: '阿瓦隆' },
  { id: 8, name: '美式桌游玩家' },
  { id: 9, name: '德策桌游玩家' },
  { id: 10, name: '毛线桌游玩家' },
  { id: 11, name: '血染钟楼' },
  { id: 12, name: 'Switch玩家' },
  { id: 13, name: 'PS5玩家' },
  { id: 14, name: '轻策玩家' },
  { id: 15, name: '中策玩家' },
  { id: 16, name: '重策玩家' }
])

// 用户已选择的标签
const selectedTagIds = ref([])
// 自定义标签
const customTags = ref([])

// 计算属性
const myTags = computed(() => {
  const userInfo = UserService.getCurrentUser()
  return userInfo?.tags || []
})

// 检查标签是否被选择
const isTagSelected = (tagId) => {
  return selectedTagIds.value.includes(tagId)
}

// 切换标签选择
const toggleTag = (tagId) => {
  const index = selectedTagIds.value.indexOf(tagId)
  if (index > -1) {
    // 已选择，取消选择
    selectedTagIds.value.splice(index, 1)
  } else {
    // 未选择，检查是否超过限制
    if (selectedTagIds.value.length >= 8) {
      uni.showToast({
        title: '最多选择8个标签',
        icon: 'none'
      })
      return
    }
    selectedTagIds.value.push(tagId)
  }
}

// 添加自定义标签
const addCustomTag = () => {
  if (customTags.value.length >= 3) {
    uni.showToast({
      title: '最多添加3个自定义标签',
      icon: 'none'
    })
    return
  }
  customTags.value.push('')
}

// 移除自定义标签
const removeCustomTag = (index) => {
  customTags.value.splice(index, 1)
}

// 保存标签 - 修复版
const saveTags = async () => {
  console.log('开始保存标签')
  
  // 1. 根据选中的ID，找到对应的系统标签对象
  const selectedSystemTags = systemTags.value.filter(tag => 
    selectedTagIds.value.includes(tag.id)
  )
  
  // 2. 将自定义标签名称转换为标签对象（为每个自定义标签生成一个唯一ID）
  const selectedCustomTags = customTags.value
    .filter(name => name.trim() !== '') // 过滤空的自定义标签
    .map((name, index) => ({
      id: 10000 + index, // 给自定义标签一个唯一的ID（例如从10000开始）
      name: name.trim()
    }))
  
  // 3. 合并系统标签和自定义标签
  const allTagsToSave = [...selectedSystemTags, ...selectedCustomTags]
  
  console.log('要保存的标签:', allTagsToSave)
  
  if (allTagsToSave.length > 8) {
    uni.showToast({
      title: '最多选择8个标签',
      icon: 'none'
    })
    return
  }
  
  // 4. 显示保存中
  uni.showLoading({
    title: '保存中...',
    mask: true
  })
  
  try {
    console.log('调用 UserService.updateUserTags')
    
    // 5. 调用云函数更新标签
    await UserService.updateUserTags(allTagsToSave)
    
    console.log('✅ 标签保存成功')
    
    uni.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 1500
    })
    
    // 6. 延迟返回
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    
  } catch (error) {
    console.error('保存标签失败:', error)
    uni.showToast({
      title: '保存失败: ' + (error.message || '请重试'),
      icon: 'none',
      duration: 3000
    })
  } finally {
    // 7. 确保 hideLoading 被调用
    uni.hideLoading()
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 页面加载
onMounted(() => {
  // 获取当前用户的标签
  const userInfo = UserService.getCurrentUser()
  if (userInfo?.tags) {
    // 分离系统标签和自定义标签
    const systemTagIds = []
    const customTagsList = []
    
    userInfo.tags.forEach(tag => {
      if (systemTags.value.some(t => t.id === tag.id)) {
        systemTagIds.push(tag.id)
      } else {
        customTagsList.push(tag.name)
      }
    })
    
    selectedTagIds.value = systemTagIds
    customTags.value = customTagsList
  }
})
</script>

<style scoped>
/* 修复整体向右偏移问题 */
.tags-container {
  width: 100vw; /* 明确使用视口宽度 */
  min-height: 100vh;
  background-color: #f8f8f8;
  margin: 0;
  padding: 0;
  overflow-x: hidden; /* 防止水平滚动 */
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background-color: white;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%; /* 确保宽度占满 */
  box-sizing: border-box; /* 内边距计算在宽度内 */
  flex-shrink: 0; /* 不压缩 */
}

.nav-left {
  width: 80rpx;
  flex-shrink: 0;
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
  min-width: 0; /* 允许文本截断 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-right {
  width: 80rpx;
  text-align: right;
  flex-shrink: 0;
}

.save-text {
  font-size: 32rpx;
  color: #07c160;
  font-weight: 500;
}

/* 滚动区域 */
.tags-scroll {
  flex: 1;
  padding: 20rpx 30rpx;
  width: 100%; /* 明确宽度 */
  box-sizing: border-box; /* 内边距计算在宽度内 */
  display: flex;
  flex-direction: column;
}

/* 分区样式 */
.section {
  margin-bottom: 40rpx;
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  width: 100%; /* 防止宽度超出父容器 */
  box-sizing: border-box; /* 内边距计算在宽度内 */
  flex-shrink: 0; /* 不压缩 */
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  width: 100%;
  box-sizing: border-box;
}

/* 标签列表 */
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  width: 100%;
  box-sizing: border-box;
}

.tag-item {
  position: relative;
  background-color: #f0f0f0;
  color: #666;
  padding: 15rpx 30rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  transition: all 0.3s;
  border: 2rpx solid transparent;
  flex-shrink: 0; /* 不压缩 */
  box-sizing: border-box;
}

.tag-item.selected {
  background-color: #e6f7ff;
  color: #1890ff;
  border-color: #1890ff;
  padding-right: 50rpx;
}

.tag-text {
  font-size: 28rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200rpx;
  display: block;
}

.tag-check {
  position: absolute;
  right: 15rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 30rpx;
  height: 30rpx;
  background-color: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: bold;
  flex-shrink: 0;
}

/* 自定义标签 */
.custom-tags {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  width: 100%;
  box-sizing: border-box;
}

.custom-tag-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  width: 100%;
  box-sizing: border-box;
}

.custom-tag-input {
  flex: 1;
  min-width: 0; /* 允许压缩 */
  height: 80rpx;
  padding: 0 20rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  border: 2rpx solid #e0e0e0;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-tag-input:focus {
  border-color: #07c160;
  background-color: white;
  min-width: 300rpx; /* 聚焦时确保最小宽度 */
}

.placeholder {
  color: #999;
  font-size: 28rpx;
}

.tag-remove {
  width: 60rpx;
  height: 60rpx;
  background-color: #ff4d4f;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: bold;
  flex-shrink: 0;
}

.tag-remove:active {
  background-color: #ff7875;
}

.add-tag-btn {
  padding: 20rpx;
  background-color: #f8f8f8;
  color: #07c160;
  border-radius: 8rpx;
  font-size: 28rpx;
  text-align: center;
  border: 2rpx dashed #07c160;
  margin-top: 10rpx;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.add-tag-btn:active {
  background-color: #f0f0f0;
}

/* 保存提示 */
.save-tips {
  padding: 20rpx;
  background-color: #fff7e6;
  color: #fa8c16;
  border-radius: 8rpx;
  font-size: 24rpx;
  text-align: center;
  margin-top: 20rpx;
  border: 1rpx solid #ffd591;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}
</style>
