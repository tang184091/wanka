<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">百科管理</view>
        <view class="sub">词条列表分页显示，每页最多10条，编辑在独立页面完成</view>
      </view>

      <view v-if="!isAdmin" class="empty">仅管理员可访问</view>
      <view v-else>
        <view class="card">
          <view class="row-head">
            <view class="title-sm">词条列表</view>
            <view class="refresh-btn" @tap="refreshList">刷新</view>
          </view>

          <view v-if="list.length === 0" class="empty">{{ loading ? '加载中...' : '暂无词条' }}</view>
          <view v-for="item in list" :key="item.id" class="row">
            <view class="info">
              <view class="line">
                <text class="status" :class="statusClass(item.status)">{{ statusText(item.status) }}</text>
                <text class="title-line">{{ item.title }}</text>
              </view>
              <text class="sub-line">{{ item.summary || '无摘要' }}</text>
              <text class="meta">创建者：{{ item.creatorNickname || '未命名用户' }}</text>
            </view>
            <view class="ops">
              <view class="op edit" @tap="goToEdit(item.id)">编辑</view>
              <view class="op del" @tap="removeItem(item)">删除</view>
            </view>
          </view>

          <view v-if="hasMore" class="more-wrap">
            <view class="more-btn" @tap="loadMore">{{ loading ? '加载中...' : '加载更多' }}</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const isAdmin = ref(false)
const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

const statusText = (value) => {
  if (value === 'published') return '已发布'
  if (value === 'rejected') return '已驳回'
  return '待审核'
}

const statusClass = (value) => {
  if (value === 'published') return 'status-published'
  if (value === 'rejected') return 'status-rejected'
  return 'status-pending'
}

const checkAdmin = async () => {
  const me = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!me?.result?.data?.isAdmin
  if (!isAdmin.value) {
    uni.showToast({ title: '仅管理员可访问', icon: 'none' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/user/user' })
    }, 300)
  }
}

const loadList = async (append = false) => {
  if (loading.value) return
  loading.value = true
  try {
    const nextPage = append ? page.value + 1 : 1
    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: {
        action: 'getWikiList',
        data: {
          page: nextPage,
          pageSize: pageSize.value,
          includeAll: true
        }
      }
    })
    if (res?.result?.code === 0) {
      const rows = res.result?.data?.list || []
      list.value = append ? [...list.value, ...rows] : rows
      page.value = nextPage
      hasMore.value = !!res.result?.data?.hasMore
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

const refreshList = async () => {
  page.value = 1
  hasMore.value = true
  await loadList(false)
}

const loadMore = async () => {
  if (!hasMore.value) return
  await loadList(true)
}

const goToEdit = (entryId) => {
  if (!entryId) return
  uni.navigateTo({ url: `/pages/admin/wiki-edit?entryId=${entryId}` })
}

const removeItem = (item) => {
  uni.showModal({
    title: '确认删除',
    content: `确认删除词条「${item.title || ''}」吗？`,
    success: async (result) => {
      if (!result.confirm) return
      const res = await wx.cloud.callFunction({
        name: 'game-service',
        data: { action: 'adminDeleteWiki', data: { entryId: item.id } }
      })
      if (res?.result?.code === 0) {
        uni.showToast({ title: '已删除', icon: 'success' })
        await refreshList()
      } else {
        uni.showToast({ title: res?.result?.message || '删除失败', icon: 'none' })
      }
    }
  })
}

onShow(async () => {
  await checkAdmin()
  if (!isAdmin.value) return
  await refreshList()
})
</script>

<style scoped>
.page { min-height: 100vh; background:#f5f6f8; }
.scroll { height: 100vh; }
.card { margin:20rpx; background:#fff; border-radius:14rpx; padding:16rpx; }
.title { font-size:30rpx; font-weight:700; }
.sub { margin-top:6rpx; color:#6b7280; font-size:22rpx; }
.title-sm { font-size:26rpx; font-weight:700; margin-bottom:8rpx; }
.row-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8rpx; }
.refresh-btn { width:120rpx; height:64rpx; border-radius:8rpx; background:#07c160; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22rpx; }
.empty { color:#9ca3af; font-size:24rpx; margin-top:12rpx; }
.row { display:flex; justify-content:space-between; align-items:center; gap:12rpx; padding:12rpx 0; border-bottom:1rpx solid #f1f5f9; }
.row:last-child { border-bottom:none; }
.info { flex:1; min-width:0; }
.line { display:flex; align-items:center; gap:8rpx; }
.title-line { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:24rpx; color:#111827; font-weight:600; }
.status { flex-shrink:0; font-size:20rpx; padding:4rpx 10rpx; border-radius:999rpx; }
.status-pending { background:#fff7ed; color:#c2410c; }
.status-published { background:#ecfdf5; color:#047857; }
.status-rejected { background:#fef2f2; color:#b91c1c; }
.sub-line { display:block; margin-top:6rpx; font-size:22rpx; color:#6b7280; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.meta { display:block; margin-top:4rpx; font-size:20rpx; color:#9ca3af; }
.ops { width:100rpx; display:flex; flex-direction:column; align-items:stretch; gap:8rpx; flex-shrink:0; }
.op { height:44rpx; border-radius:8rpx; color:#fff; display:flex; align-items:center; justify-content:center; font-size:20rpx; text-align:center; }
.edit { background:#2563eb; }
.del { background:#ef4444; }
.more-wrap { margin-top:12rpx; display:flex; justify-content:center; }
.more-btn { min-width:180rpx; height:56rpx; padding:0 18rpx; border-radius:8rpx; background:#eff6ff; color:#1d4ed8; font-size:23rpx; display:flex; align-items:center; justify-content:center; }
</style>
