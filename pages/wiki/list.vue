<template>
  <view class="page">
    <scroll-view scroll-y class="scroll" @scrolltolower="loadMore">
      <view class="search-card">
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索词条标题或摘要"
          @confirm="onSearch"
        />
        <view class="search-btn" @tap="onSearch">搜索</view>
        <view class="submit-btn" @tap="goSubmit">投稿词条</view>
      </view>

      <view v-if="filteredList.length === 0" class="empty">暂无词条</view>
      <view
        v-for="item in filteredList"
        :key="item.id"
        class="entry-card"
        @tap="openDetail(item.id)"
      >
        <view class="entry-main">
          <view class="title">{{ item.title }}</view>
          <view class="summary">{{ item.summary || '暂无摘要' }}</view>
          <view class="meta">
            <text v-if="item.tags && item.tags.length" class="tag">{{ item.tags.slice(0, 2).join(' / ') }}</text>
          </view>
        </view>
      </view>

      <view v-if="loading" class="loading">加载中...</view>
      <view v-else-if="!hasMore && list.length > 0" class="loading">没有更多了</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const list = ref([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const keyword = ref('')

const filteredList = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return list.value
  return list.value.filter((item) => {
    const title = String(item.title || '').toLowerCase()
    const summary = String(item.summary || '').toLowerCase()
    return title.includes(key) || summary.includes(key)
  })
})

const fetchList = async (reset = false) => {
  if (loading.value) return
  if (!hasMore.value && !reset) return
  loading.value = true
  try {
    const nextPage = reset ? 1 : page.value
    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: { action: 'getWikiList', data: { page: nextPage, pageSize: 20 } }
    })
    if (res?.result?.code === 0) {
      const incoming = res.result.data.list || []
      list.value = reset ? incoming : [...list.value, ...incoming]
      hasMore.value = !!res.result.data.hasMore
      page.value = nextPage + 1
    } else {
      uni.showToast({ title: res?.result?.message || '加载失败', icon: 'none' })
    }
  } catch (error) {
    console.error('load wiki list failed', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const onSearch = () => {}
const loadMore = () => {
  fetchList(false)
}
const openDetail = (id) => {
  if (!id) return
  uni.navigateTo({ url: `/pages/wiki/detail?id=${id}` })
}

const goSubmit = () => {
  uni.navigateTo({ url: '/pages/wiki/submit' })
}

onShow(() => {
  page.value = 1
  hasMore.value = true
  fetchList(true)
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.search-card { margin: 20rpx; background: #fff; border-radius: 14rpx; padding: 16rpx; display: flex; gap: 12rpx; }
.search-input { flex: 1; height: 68rpx; border-radius: 10rpx; background: #f8fafc; padding: 0 16rpx; font-size: 24rpx; }
.search-btn { width: 110rpx; height: 68rpx; border-radius: 10rpx; background: #07c160; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24rpx; flex-shrink: 0; }
.submit-btn { min-width: 150rpx; height: 68rpx; border-radius: 10rpx; background: #0ea5e9; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24rpx; padding: 0 16rpx; flex-shrink: 0; }
.entry-card { margin: 0 20rpx 16rpx; background: #fff; border-radius: 14rpx; overflow: hidden; border: 1rpx solid #edf2f7; }
.entry-main { padding: 16rpx; }
.title { font-size: 30rpx; color: #111827; font-weight: 700; }
.summary { margin-top: 8rpx; font-size: 24rpx; color: #6b7280; line-height: 1.6; }
.meta { margin-top: 10rpx; display: flex; justify-content: flex-end; align-items: center; gap: 12rpx; }
.tag { font-size: 22rpx; color: #2563eb; }
.loading { padding: 24rpx; text-align: center; font-size: 24rpx; color: #9ca3af; }
.empty { margin: 40rpx 20rpx; background: #fff; border-radius: 14rpx; padding: 40rpx; text-align: center; color: #9ca3af; font-size: 24rpx; }
</style>
