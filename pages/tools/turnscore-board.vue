<template>
  <view class="page">
    <view class="board-card" v-if="match">
      <view class="head">
        <text class="title">总分看板</text>
        <text class="sub">{{ match.playerCount }}人局</text>
      </view>

      <view class="rows">
        <view
          v-for="(p, idx) in match.players"
          :key="`board-${idx}`"
          class="row"
          :style="{ backgroundColor: p.colorHex, color: textColor(p.colorHex), borderColor: borderColor(p.colorHex) }"
        >
          <text class="score">{{ p.score }}</text>
        </view>
      </view>
    </view>

    <view v-else class="empty">未找到对局数据，请返回重试</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'

const STORAGE_KEY = 'boardgame_turnscore_matches_v1'
const ACTIVE_KEY = 'boardgame_turnscore_active_v1'
const matchId = ref('')
const match = ref(null)

const safeParse = (v) => {
  try { return JSON.parse(v) } catch (e) { return null }
}

const loadData = () => {
  const raw = uni.getStorageSync(STORAGE_KEY)
  const parsed = typeof raw === 'string' ? safeParse(raw) : raw
  const list = Array.isArray(parsed) ? parsed : []
  match.value = list.find((m) => m.id === matchId.value) || null
}

const hexToRgb = (hex) => {
  const h = String(hex || '').replace('#', '').trim()
  if (h.length !== 6) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  }
}

const textColor = (hex) => {
  if (String(hex).toLowerCase() === '#ffffff') return '#111827'
  if (String(hex).toLowerCase() === '#111827') return '#ffffff'
  const { r, g, b } = hexToRgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.65 ? '#111827' : '#ffffff'
}

const borderColor = (hex) => {
  const { r, g, b } = hexToRgb(hex)
  if (r + g + b > 600) return '#111827'
  return 'transparent'
}

onLoad((query) => {
  const fromQuery = String(query?.matchId || '').trim()
  const fromStorage = String(uni.getStorageSync(ACTIVE_KEY) || '').trim()
  matchId.value = fromQuery || fromStorage
  loadData()
})

onShow(() => {
  loadData()
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; padding: 20rpx; box-sizing: border-box; }
.board-card { background: #fff; border-radius: 14rpx; padding: 16rpx; }
.head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.title { font-size: 34rpx; font-weight: 700; color: #111827; }
.sub { font-size: 24rpx; color: #6b7280; }

.rows { display: flex; flex-direction: column; gap: 12rpx; }
.row {
  min-height: 120rpx;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}
.score { font-size: 68rpx; font-weight: 800; line-height: 1; }
.empty { color: #9ca3af; font-size: 26rpx; text-align: center; margin-top: 40rpx; }
</style>
