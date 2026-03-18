<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="header">
        <view>
          <view class="title">荣誉榜</view>
          <view class="sub">比赛冠军 / 段位荣誉，按最新时间排序</view>
        </view>
        <view v-if="isAdmin" class="upload-btn" @tap="goAdminHonor">管理</view>
      </view>

      <view v-if="!list.length" class="empty">暂无荣誉记录</view>

      <view class="card" v-for="item in list" :key="item._id">
        <view class="card-head">
          <text class="badge" :class="item.type === 'tournament' ? 'badge-match' : 'badge-rank'">
            {{ item.type === 'tournament' ? '比赛' : '段位' }}
          </text>
          <text class="time">{{ formatTime(item.achievedAt) }}</text>
        </view>

        <view v-if="item.type === 'tournament'" class="line">冠军：{{ item.championNickname || '-' }}</view>
        <view v-if="item.type === 'tournament'" class="line">参赛人数：{{ item.participantCount || '-' }} 人</view>
        <view v-if="item.type === 'tournament'" class="line">比赛名称：{{ item.title || '店内比赛' }}</view>

        <view v-if="item.type === 'rank'" class="line">玩家：{{ item.playerNickname || '-' }}</view>
        <view v-if="item.type === 'rank'" class="line">段位：{{ item.rankName || '-' }}</view>

        <view v-if="item.note" class="note">{{ item.note }}</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const list = ref([])
const isAdmin = ref(false)

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const loadData = async () => {
  const [listRes, meRes] = await Promise.all([
    wx.cloud.callFunction({ name: 'game-service', data: { action: 'getHonorList', data: {} } }),
    wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  ])

  if (listRes.result?.code === 0) list.value = listRes.result.data.list || []
  isAdmin.value = !!meRes?.result?.data?.isAdmin
}

const goAdminHonor = () => {
  uni.navigateTo({ url: '/pages/admin/honor' })
}

onShow(loadData)
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.header { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 20rpx; display:flex; justify-content:space-between; align-items:center; }
.title { font-size: 30rpx; font-weight: 700; color: #111827; }
.sub { margin-top: 6rpx; font-size: 22rpx; color: #6b7280; }
.upload-btn { padding: 0 24rpx; height: 56rpx; background:#f59e0b; color:#fff; border-radius:28rpx; display:flex; align-items:center; }
.empty { margin: 20rpx; color: #9ca3af; }
.card { margin: 0 20rpx 16rpx; background:#fff; border-radius: 14rpx; padding: 16rpx; }
.card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8rpx; }
.badge { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 999rpx; color:#fff; }
.badge-match { background:#7c3aed; }
.badge-rank { background:#2563eb; }
.time { font-size: 22rpx; color:#6b7280; }
.line { margin-top: 6rpx; color:#111827; font-size: 24rpx; }
.note { margin-top: 10rpx; background:#f8fafc; border-radius: 10rpx; padding: 10rpx; color:#374151; font-size: 22rpx; }
</style>
