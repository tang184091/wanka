<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">组局管理</view>
        <view class="sub">参考百科列表样式展示，支持分页加载（每页10条）</view>
      </view>

      <view v-if="!isAdmin" class="empty">仅管理员可访问</view>
      <view v-else class="card">
        <view class="row-head">
          <view class="title-sm">组局列表</view>
          <view class="refresh-btn" @tap="reload">刷新</view>
        </view>

        <view v-if="visibleList.length === 0" class="empty">{{ loading ? '加载中...' : '暂无可管理组局' }}</view>

        <view v-for="item in visibleList" :key="item.id" class="row">
          <view class="info">
            <view class="line">
              <text class="status" :class="statusClass(item.status)">{{ statusText(item.status) }}</text>
              <text class="title-line">{{ item.title || '未命名组局' }}</text>
            </view>
            <text class="sub-line">{{ item.location || '未设置地点' }}</text>
            <text class="meta">创建者：{{ item.creatorInfo?.nickname || '未知用户' }}</text>
          </view>
          <view class="ops">
            <view class="op del" @tap="removeItem(item)">删除</view>
          </view>
        </view>

        <view v-if="hasMore" class="more-wrap">
          <view class="more-btn" @tap="loadMore">{{ loadingMore ? '加载中...' : '加载更多' }}</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const isAdmin = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const allList = ref([])
const page = ref(1)
const pageSize = 10

const visibleList = computed(() => allList.value.slice(0, page.value * pageSize))
const hasMore = computed(() => visibleList.value.length < allList.value.length)

const statusText = (value) => {
  if (value === 'ongoing') return '进行中'
  if (value === 'completed') return '已完成'
  if (value === 'cancelled') return '已取消'
  return '预约中'
}

const statusClass = (value) => {
  if (value === 'ongoing') return 'status-ongoing'
  if (value === 'completed') return 'status-completed'
  if (value === 'cancelled') return 'status-cancelled'
  return 'status-pending'
}

const redirectNonAdmin = () => {
  uni.showToast({ title: '仅管理员可访问', icon: 'none' })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/user/user' })
  }, 300)
}

const checkAdmin = async () => {
  const me = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!me?.result?.data?.isAdmin
  if (!isAdmin.value) redirectNonAdmin()
  return isAdmin.value
}

const loadData = async () => {
  if (!(await checkAdmin())) return
  loading.value = true
  try {
    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: { action: 'getAdminManageData', data: {} }
    })
    if (res?.result?.code === 0) {
      allList.value = (res.result?.data?.games || []).sort((a, b) => {
        const at = new Date(b.updatedAt || b.createdAt || 0).getTime()
        const bt = new Date(a.updatedAt || a.createdAt || 0).getTime()
        return at - bt
      })
      page.value = 1
    } else {
      uni.showToast({ title: res?.result?.message || '加载失败', icon: 'none' })
    }
  } finally {
    loading.value = false
  }
}

const reload = async () => {
  await loadData()
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  page.value += 1
  setTimeout(() => {
    loadingMore.value = false
  }, 120)
}

const removeItem = (item) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复',
    success: async (r) => {
      if (!r.confirm) return
      const res = await wx.cloud.callFunction({
        name: 'game-service',
        data: { action: 'adminDeleteGame', data: { gameId: item.id } }
      })
      if (res?.result?.code === 0) {
        uni.showToast({ title: '已删除', icon: 'success' })
        await loadData()
      } else {
        uni.showToast({ title: res?.result?.message || '删除失败', icon: 'none' })
      }
    }
  })
}

onShow(loadData)
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.card { margin: 20rpx; background: #fff; border-radius: 14rpx; padding: 16rpx; }
.title { font-size: 30rpx; font-weight: 700; }
.sub { margin-top: 6rpx; color: #6b7280; font-size: 22rpx; }
.title-sm { font-size: 26rpx; font-weight: 700; }
.row-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8rpx; }
.refresh-btn { width: 110rpx; height: 56rpx; border-radius: 8rpx; background: #07c160; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22rpx; }
.empty { margin-top: 12rpx; color: #9ca3af; font-size: 24rpx; }
.row { display: flex; justify-content: space-between; align-items: center; gap: 12rpx; padding: 12rpx 0; border-bottom: 1rpx solid #f1f5f9; }
.row:last-child { border-bottom: none; }
.info { flex: 1; min-width: 0; }
.line { display: flex; align-items: center; gap: 8rpx; }
.title-line { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 24rpx; color: #111827; font-weight: 600; }
.status { flex-shrink: 0; font-size: 20rpx; padding: 4rpx 10rpx; border-radius: 999rpx; }
.status-pending { background: #fff7ed; color: #c2410c; }
.status-ongoing { background: #fff7ed; color: #ea580c; }
.status-completed { background: #ecfdf5; color: #047857; }
.status-cancelled { background: #fef2f2; color: #b91c1c; }
.sub-line { display: block; margin-top: 6rpx; font-size: 22rpx; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { display: block; margin-top: 4rpx; font-size: 20rpx; color: #9ca3af; }
.ops { width: 92rpx; flex-shrink: 0; }
.op { height: 44rpx; border-radius: 8rpx; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20rpx; }
.op.del { background: #ef4444; }
.more-wrap { margin-top: 12rpx; display: flex; justify-content: center; }
.more-btn { min-width: 180rpx; height: 56rpx; padding: 0 18rpx; border-radius: 8rpx; background: #eff6ff; color: #1d4ed8; font-size: 23rpx; display: flex; align-items: center; justify-content: center; }
</style>
