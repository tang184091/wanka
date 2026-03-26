<template>
  <view class="detail-page">
    <view class="card" v-if="record">
      <view class="title">战绩详情</view>
      <view class="time">{{ formatTime(record.createdAt) }}</view>

      <view class="score-state-row">
        <text :class="['score-state', localScoreRecorded ? 'state-recorded' : 'state-unrecorded']">
          {{ localScoreRecorded ? '已录分' : '未录分' }}
        </text>
      </view>

      <view class="row" v-for="(player, index) in record.players" :key="index">
        <text class="name">{{ player.nickname || player.userId || '未知玩家' }}</text>
        <view class="score-wrap">
          <text class="score">{{ player.score }}</text>
          <text class="uma">{{ getResultLabel(index) }}</text>
        </view>
      </view>

      <view class="export-title">导出文本</view>
      <view class="export-box">{{ exportText }}</view>
      <view class="btn copy-btn" @tap="copyExport">复制</view>
      <view class="btn toggle-btn" @tap="toggleScoreRecorded">切换录分状态</view>
      <view v-if="isAdmin" class="btn delete-btn" @tap="deleteRecord">删除战绩</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onHide, onLoad, onUnload } from '@dcloudio/uni-app'

const record = ref(null)
const recordId = ref('')
const localScoreRecorded = ref(false)
const originalScoreRecorded = ref(false)
const isAdmin = ref(false)
let saving = false

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const exportText = computed(() => {
  if (!record.value) return ''
  const names = record.value.players.map((p) => p.nickname || p.userId || '-').join(' ')
  const scores = record.value.players.map((p) => p.score ?? 0).join(' ')
  return `${names}\n${scores}`
})

const copyExport = () => {
  uni.setClipboardData({ data: exportText.value })
}

const parseScore = (raw) => {
  const n = Number(String(raw ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

const detectScoreRule = (scores) => {
  const maxAbs = Math.max(...scores.map((n) => Math.abs(n)), 0)
  if (maxAbs >= 10000) return { returnPoint: 30000, divisor: 1000 }
  if (maxAbs >= 1000) return { returnPoint: 3000, divisor: 100 }
  if (maxAbs >= 100) return { returnPoint: 300, divisor: 10 }
  return { returnPoint: 30, divisor: 1 }
}

const getUmaList = (scores) => {
  if (!scores.length) return []
  const rankScores = scores.map((score, idx) => ({ idx, score }))
  rankScores.sort((a, b) => b.score - a.score)
  const points = [40, 10, -10, -20]
  const umaByIndex = {}
  rankScores.forEach((item, rank) => {
    umaByIndex[item.idx] = points[rank] || 0
  })
  return scores.map((_, idx) => umaByIndex[idx] || 0)
}

const getResultList = () => {
  if (!record.value?.players?.length) return []
  const scores = record.value.players.map((p) => parseScore(p.score))
  const { returnPoint, divisor } = detectScoreRule(scores)
  const umaList = getUmaList(scores)
  return scores.map((score, idx) => ((score - returnPoint) / divisor) + (umaList[idx] || 0))
}

const getResultLabel = (index) => {
  const result = getResultList()[index] || 0
  return `${result > 0 ? '+' : ''}${result.toFixed(1)}P`
}

const toggleScoreRecorded = () => {
  localScoreRecorded.value = !localScoreRecorded.value
  if (record.value) {
    record.value.scoreRecorded = localScoreRecorded.value
  }
}

const saveScoreRecordedIfDirty = async () => {
  if (!recordId.value) return
  if (saving) return
  if (localScoreRecorded.value === originalScoreRecorded.value) return

  saving = true
  try {
    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: {
        action: 'updateMahjongRecordScoreRecorded',
        data: {
          recordId: recordId.value,
          scoreRecorded: localScoreRecorded.value
        }
      }
    })
    if (res.result?.code === 0) {
      originalScoreRecorded.value = localScoreRecorded.value
      uni.setStorageSync('record_need_refresh', Date.now())
    }
  } catch (error) {
    console.error('保存录分状态失败', error)
  } finally {
    saving = false
  }
}

onLoad(async (options) => {
  try {
    const me = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
    isAdmin.value = !!me?.result?.data?.isAdmin
  } catch (error) {
    isAdmin.value = false
  }

  const id = options?.id
  if (!id) return
  recordId.value = id

  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: { action: 'getMahjongRecordDetail', data: { recordId: id } }
  })

  if (res.result?.code === 0) {
    record.value = res.result.data
    localScoreRecorded.value = res.result.data?.scoreRecorded === true
    originalScoreRecorded.value = localScoreRecorded.value
  } else {
    uni.showToast({ title: res.result?.message || '加载失败', icon: 'none' })
  }
})

onHide(() => {
  saveScoreRecordedIfDirty()
})

onUnload(() => {
  saveScoreRecordedIfDirty()
})

const deleteRecord = () => {
  if (!isAdmin.value) return
  if (!recordId.value) return
  uni.showModal({
    title: '确认删除战绩',
    content: '删除后不可恢复，确认继续？',
    success: async (res) => {
      if (!res.confirm) return
      const result = await wx.cloud.callFunction({
        name: 'game-service',
        data: {
          action: 'adminDeleteMahjongRecord',
          data: { recordId: recordId.value }
        }
      })
      if (result?.result?.code === 0) {
        uni.showToast({ title: '已删除', icon: 'success' })
        uni.setStorageSync('record_need_refresh', Date.now())
        setTimeout(() => {
          uni.navigateBack()
        }, 400)
      } else {
        uni.showToast({ title: result?.result?.message || '删除失败', icon: 'none' })
      }
    }
  })
}
</script>

<style scoped>
.detail-page { min-height: 100vh; background: #f5f6f8; padding: 20rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 20rpx; }
.title { font-size: 30rpx; font-weight: 700; }
.time { color: #6b7280; margin-top: 8rpx; font-size: 22rpx; }
.score-state-row { margin-top: 16rpx; display: flex; align-items: center; justify-content: flex-start; }
.score-state { font-size: 24rpx; }
.state-recorded { color: #16a34a; }
.state-unrecorded { color: #9ca3af; }
.row { display: flex; justify-content: space-between; margin-top: 14rpx; padding: 10rpx 0; border-bottom: 1rpx solid #eef2f7; }
.name { color: #111827; }
.score { color: #0f766e; }
.score-wrap { display: flex; gap: 10rpx; align-items: center; }
.uma { font-size: 22rpx; color: #7c3aed; }
.export-title { margin-top: 18rpx; font-size: 26rpx; font-weight: 600; }
.export-box { margin-top: 10rpx; white-space: pre-line; background: #f8fafc; border-radius: 10rpx; padding: 14rpx; }
.btn { margin-top: 16rpx; height: 72rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; color: #fff; }
.copy-btn { background: #10b981; }
.toggle-btn { background: #2563eb; }
.delete-btn { background: #ef4444; }
</style>
