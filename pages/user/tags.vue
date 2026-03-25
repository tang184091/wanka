<template>
  <view class="tags-container">
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <text class="nav-text-btn">返回</text>
      </view>
      <view class="nav-title">标签管理</view>
      <view class="nav-right" @tap="saveTags">
        <text class="save-text">保存</text>
      </view>
    </view>

    <scroll-view class="tags-scroll" scroll-y>
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
            <view v-if="isTagSelected(tag.id)" class="tag-check">✓</view>
          </view>
        </view>
      </view>

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
            <view class="tag-remove" @tap="removeCustomTag(index)">×</view>
          </view>
          <view class="add-tag-btn" @tap="addCustomTag">+ 添加自定义标签</view>
        </view>
      </view>

      <view class="save-tips">
        <text>最多可选8个标签，自定义标签最多3个</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import UserService from '@/utils/user.js'

const systemTags = ref([
  { id: 1, name: '玩咖萌新' },
  { id: 2, name: '功利玩家' },
  { id: 4, name: '狙击七段' },
  { id: 5, name: '周末有空' },
  { id: 6, name: '工作日晚' },
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

const selectedTagIds = ref([])
const customTags = ref([])

const isTagSelected = (tagId) => selectedTagIds.value.includes(tagId)

const toggleTag = (tagId) => {
  const index = selectedTagIds.value.indexOf(tagId)
  if (index > -1) {
    selectedTagIds.value.splice(index, 1)
    return
  }
  if (selectedTagIds.value.length >= 8) {
    uni.showToast({ title: '最多选择8个标签', icon: 'none' })
    return
  }
  selectedTagIds.value.push(tagId)
}

const addCustomTag = () => {
  if (customTags.value.length >= 3) {
    uni.showToast({ title: '最多添加3个自定义标签', icon: 'none' })
    return
  }
  customTags.value.push('')
}

const removeCustomTag = (index) => {
  customTags.value.splice(index, 1)
}

const saveTags = async () => {
  const selectedSystemTags = systemTags.value.filter((tag) => selectedTagIds.value.includes(tag.id))
  const selectedCustomTags = customTags.value
    .filter((name) => String(name || '').trim())
    .map((name, index) => ({
      id: 10000 + index,
      name: String(name).trim()
    }))
  const allTagsToSave = [...selectedSystemTags, ...selectedCustomTags]

  if (allTagsToSave.length > 8) {
    uni.showToast({ title: '最多选择8个标签', icon: 'none' })
    return
  }

  uni.showLoading({ title: '保存中...', mask: true })
  try {
    await UserService.updateUserTags(allTagsToSave)
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 600)
  } catch (error) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const goBack = () => uni.navigateBack()

onMounted(() => {
  const userInfo = UserService.getCurrentUser()
  const tags = userInfo?.tags || []
  const systemTagIds = []
  const customList = []
  tags.forEach((tag) => {
    if (systemTags.value.some((item) => item.id === Number(tag.id))) {
      systemTagIds.push(Number(tag.id))
    } else if (tag?.name) {
      customList.push(String(tag.name))
    }
  })
  selectedTagIds.value = systemTagIds
  customTags.value = customList.slice(0, 3)
})
</script>

<style scoped>
.tags-container { width: 100vw; min-height: 100vh; background-color: #f8f8f8; display: flex; flex-direction: column; }
.nav-bar { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 30rpx; background-color: white; border-bottom: 1rpx solid #f0f0f0; position: sticky; top: 0; z-index: 10; }
.nav-left,.nav-right { width: 80rpx; }
.nav-right { text-align: right; }
.nav-text-btn { font-size: 28rpx; color: #374151; line-height: 1; }
.nav-title { font-size: 36rpx; font-weight: bold; color: #333; flex: 1; text-align: center; }
.save-text { font-size: 32rpx; color: #07c160; font-weight: 500; }
.tags-scroll { flex: 1; padding: 20rpx 30rpx; box-sizing: border-box; }
.section { margin-bottom: 40rpx; background-color: white; border-radius: 16rpx; padding: 30rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.05); }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid #f0f0f0; }
.tags-list { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16rpx; }
.tag-item { position: relative; background-color: #f0f0f0; color: #666; height: 72rpx; border-radius: 12rpx; font-size: 24rpx; border: 2rpx solid transparent; display: flex; align-items: center; justify-content: center; padding: 0 12rpx; box-sizing: border-box; }
.tag-item.selected { background-color: #e6f7ff; color: #1890ff; border-color: #1890ff; }
.tag-text { font-size: 24rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; }
.tag-check { position: absolute; right: 6rpx; top: 6rpx; width: 24rpx; height: 24rpx; background-color: #1890ff; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16rpx; font-weight: bold; }
.custom-tags { display: flex; flex-direction: column; gap: 20rpx; }
.custom-tag-item { display: flex; align-items: center; gap: 20rpx; }
.custom-tag-input { flex: 1; height: 80rpx; padding: 0 20rpx; background-color: #f8f8f8; border-radius: 8rpx; font-size: 28rpx; color: #333; border: 2rpx solid #e0e0e0; box-sizing: border-box; }
.placeholder { color: #999; font-size: 28rpx; }
.tag-remove { width: 60rpx; height: 60rpx; background-color: #ff4d4f; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40rpx; }
.add-tag-btn { padding: 20rpx; background-color: #f8f8f8; color: #07c160; border-radius: 8rpx; font-size: 28rpx; text-align: center; border: 2rpx dashed #07c160; margin-top: 10rpx; }
.save-tips { padding: 20rpx; background-color: #fff7e6; color: #fa8c16; border-radius: 8rpx; font-size: 24rpx; text-align: center; margin-top: 20rpx; border: 1rpx solid #ffd591; }
</style>
