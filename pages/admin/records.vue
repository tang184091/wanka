<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">战绩管理</view>
        <view class="sub">管理员可删除玩家上传战绩</view>
      </view>
      <view v-if="!isAdmin" class="empty">仅管理员可访问</view>
      <template v-else>
        <view v-if="!list.length" class="empty">暂无可管理战绩</view>
        <view class="card" v-for="item in list" :key="item._id">
          <view class="line">{{ formatTime(item.createdAt) }} · {{ (item.players || []).map(p => p.nickname || p.userId || '未知').join(' / ') }}</view>
          <view class="del" @tap="removeItem(item)">删除</view>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
const isAdmin = ref(false)
const list = ref([])
const formatTime = (t) => new Date(t).toLocaleString()
const redirectNonAdmin = () => {
  uni.showToast({ title: '仅管理员可访问', icon: 'none' })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/user/user' })
  }, 300)
}
const checkAdmin = async () => {
  const me = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!me?.result?.data?.isAdmin
  if (!isAdmin.value) {
    redirectNonAdmin()
  }
  return isAdmin.value
}
const loadData = async () => {
  if (!await checkAdmin()) return
  const res = await wx.cloud.callFunction({ name: 'game-service', data: { action: 'getAdminManageData', data: {} } })
  if (res.result?.code === 0) list.value = res.result.data.records || []
}
const removeItem = (item) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复',
    success: async (r) => {
      if (!r.confirm) return
      const res = await wx.cloud.callFunction({ name: 'game-service', data: { action: 'adminDeleteMahjongRecord', data: { recordId: item._id } } })
      if (res.result?.code === 0) { uni.showToast({ title: '已删除', icon: 'success' }); loadData() }
    }
  })
}
onShow(loadData)
</script>

<style scoped>
.page{min-height:100vh;background:#f5f6f8}.scroll{height:100vh}.card{margin:20rpx;background:#fff;border-radius:12rpx;padding:16rpx}
.title{font-size:30rpx;font-weight:700}.sub{font-size:22rpx;color:#6b7280;margin-top:6rpx}.line{font-size:24rpx;color:#111827}
.del{margin-top:12rpx;height:60rpx;background:#ef4444;color:#fff;border-radius:8rpx;display:flex;align-items:center;justify-content:center}
.empty{margin:20rpx;color:#9ca3af}
</style>
