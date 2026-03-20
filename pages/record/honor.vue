<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="header">
        <view>
          <view class="title">荣誉榜</view>
          <view class="sub">比赛冠军 / 段位荣誉，按最新时间排序</view>
        </view>
      </view>

      <view v-if="!list.length" class="empty">暂无荣誉记录</view>

      <view class="card" v-for="item in list" :key="item._id || item.id">
        <view class="card-head">
          <text class="badge" :class="[getTypeClass(item.type), getRarityClass(item.rarity)]">
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

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const getTypeClass = (type) => {
  return type === 'rank' ? 'badge-rank' : 'badge-match'
}

const getRarityClass = (rarity) => {
  if (rarity === 'legend' || rarity === 'gold') return 'badge-legend'
  if (rarity === 'epic' || rarity === 'purple') return 'badge-epic'
  if (rarity === 'rare' || rarity === 'blue' || rarity === 'silver') return 'badge-rare'
  return 'badge-common'
}

const loadData = async () => {
  const listRes = await wx.cloud.callFunction({ name: 'game-service', data: { action: 'getHonorList', data: {} } })

  if (listRes.result?.code === 0) {
    list.value = (listRes.result.data.list || []).map((item) => ({
      ...item,
      rarity: ['legend', 'epic', 'rare', 'common', 'gold', 'purple', 'blue', 'silver'].includes(item.rarity) ? item.rarity : 'epic'
    }))
  }
}

onShow(loadData)
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.header { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 20rpx; display:flex; justify-content:space-between; align-items:center; }
.title { font-size: 30rpx; font-weight: 700; color: #111827; }
.sub { margin-top: 6rpx; font-size: 22rpx; color: #6b7280; }
.empty { margin: 20rpx; color: #9ca3af; }
.card { margin: 0 20rpx 16rpx; background:#fff; border-radius: 14rpx; padding: 16rpx; }
.card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8rpx; }
.badge { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 999rpx; }
.badge-match { color:#fff; }
.badge-rank { color:#fff; }
.badge-legend { background: linear-gradient(135deg,#f59e0b,#fcd34d); color:#7c2d12; }
.badge-epic { background: linear-gradient(135deg,#7c3aed,#8b5cf6); color:#fff; }
.badge-rare { background: linear-gradient(135deg,#2563eb,#38bdf8); color:#fff; }
.badge-common { background:#fff; color:#111827; border:1rpx solid #111827; }
.time { font-size: 22rpx; color:#6b7280; }
.line { margin-top: 6rpx; color:#111827; font-size: 24rpx; }
.note { margin-top: 10rpx; background:#f8fafc; border-radius: 10rpx; padding: 10rpx; color:#374151; font-size: 22rpx; }
</style>
