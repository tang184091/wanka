<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">桌游先后手及计分工具</view>
        <view class="sub">随机顺位、防误触计分、支持历史对局读取</view>
      </view>

      <view v-if="step === 'entry'" class="card">
        <view class="btn big primary" @tap="startNewMatch">建立新的对局</view>
        <view class="btn big secondary" @tap="openHistory">读取对局</view>
      </view>

      <view v-if="step === 'colors'" class="card">
        <view class="section-title">选择玩家颜色</view>
        <view class="subtle">说明：勾选颜色数量 = 玩家数量（1-8人）</view>

        <view class="color-grid">
          <view
            v-for="color in colorOptions"
            :key="color.key"
            class="color-cell"
            :class="{ checked: selectedColors.includes(color.key) }"
            @tap="toggleColor(color.key)"
          >
            <view class="color-fill" :style="{ backgroundColor: color.hex, borderColor: colorBorder(color.hex) }" />
            <view class="pick-area">
              <text v-if="selectedColors.includes(color.key)" class="picked-text">已选取</text>
            </view>
          </view>
        </view>

        <view class="subtle mt">已选择 {{ selectedColors.length }} 种颜色</view>

        <view class="btn-row row-end">
          <view class="btn action same-size" @tap="backToEntry">返回</view>
          <view class="btn action same-size" :class="{ disabled: selectedColors.length < 1 }" @tap="randomizeAndCreate">随机开局顺位</view>
        </view>
      </view>

      <view v-if="step === 'history'" class="card">
        <view class="section-title">历史对局</view>
        <view v-if="!matches.length" class="empty">暂无历史对局</view>

        <view v-for="m in matches" :key="m.id" class="history-item">
          <view class="history-head">
            <text class="history-title">{{ m.playerCount }}人局 · {{ formatTime(m.createdAt) }}</text>
            <text class="history-time">更新 {{ formatTime(m.updatedAt) }}</text>
          </view>
          <view class="history-summary">
            <text v-for="p in m.players" :key="`${m.id}-${p.seat}`" class="summary-line">{{ p.score }}</text>
          </view>
          <view class="btn-row grid-two">
            <view class="btn action" @tap="loadMatch(m.id)">读取</view>
            <view class="btn danger" @tap="removeMatch(m.id)">删除</view>
          </view>
        </view>

        <view class="btn-row grid-two">
          <view class="btn action" @tap="backToEntry">返回</view>
          <view class="btn danger" :class="{ disabled: !matches.length }" @tap="clearAllMatches">清空历史</view>
        </view>
      </view>

      <view v-if="step === 'play' && activeMatch" class="card">
        <view class="top-actions">
          <view class="tool-btn undo" @tap="undoLastAction">撤销计分操作</view>
          <view class="tool-btn round" @tap="markRoundEnd">回合结束</view>
        </view>

        <view class="play-head">
          <view class="section-title">当前对局（{{ activeMatch.playerCount }}人）</view>
        </view>
        <view class="subtle">顺位：{{ orderText }}</view>

        <view v-for="p in activeMatch.players" :key="`player-${p.seat}`" class="player-card">
          <view class="score-block" :style="{ backgroundColor: p.colorHex, color: textColor(p.colorHex), borderColor: colorBorder(p.colorHex) }">
            <text class="score">{{ p.score }}</text>
          </view>

          <view class="score-btns">
            <view
              v-for="delta in deltas"
              :key="`plus-${p.seat}-${delta}`"
              class="score-btn"
              :style="scoreBtnStyle(p.colorHex)"
              @tap="changeScore(p.seat, delta)"
            >
              +{{ delta }}
            </view>
            <view
              v-for="delta in deltas"
              :key="`minus-${p.seat}-${delta}`"
              class="score-btn"
              :style="scoreBtnStyle(p.colorHex)"
              @tap="changeScore(p.seat, -delta)"
            >
              -{{ delta }}
            </view>
          </view>
        </view>

        <view class="history-log">
          <view class="log-head">
            <text class="log-title">计分历史</text>
          </view>
          <scroll-view scroll-y :show-scrollbar="true" class="history-scroll">
            <view v-if="!activeMatch.logs.length" class="empty-log">暂无记录</view>
            <view v-for="(log, idx) in activeMatch.logs" :key="`global-${idx}`" class="log-line">
              <view class="log-main">
                <template v-if="log.type === 'score'">
                  <text class="log-player" :style="logPlayerStyle(log)">{{ log.colorLabel || '玩家' }}</text>
                  <text class="log-delta" :class="Number(log.delta || 0) >= 0 ? 'delta-plus' : 'delta-minus'">{{ formatDelta(log.delta) }}</text>
                </template>
                <template v-else>
                  <text class="log-event">回合结束</text>
                </template>
              </view>
              <text class="log-time">{{ formatClock(log.ts) }}</text>
            </view>
          </scroll-view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const STORAGE_KEY = 'boardgame_turnscore_matches_v1'
const ACTIVE_KEY = 'boardgame_turnscore_active_v1'

const step = ref('entry')
const selectedColors = ref([])
const matches = ref([])
const activeMatchId = ref('')

const deltas = [1, 2, 5, 10]

const colorOptions = [
  { key: 'blue', label: '蓝色', hex: '#2563eb' },
  { key: 'green', label: '绿色', hex: '#16a34a' },
  { key: 'orange', label: '橙色', hex: '#f97316' },
  { key: 'red', label: '红色', hex: '#dc2626' },
  { key: 'black', label: '黑色', hex: '#111827' },
  { key: 'purple', label: '紫色', hex: '#7c3aed' },
  { key: 'white', label: '白色', hex: '#ffffff' },
  { key: 'yellow', label: '黄色', hex: '#eab308' },
  { key: 'pink', label: '粉色', hex: '#ec4899' },
  { key: 'cyan', label: '青色', hex: '#06b6d4' },
  { key: 'brown', label: '棕色', hex: '#92400e' },
  { key: 'gray', label: '灰色', hex: '#6b7280' }
]

const activeMatch = computed(() => matches.value.find((m) => m.id === activeMatchId.value) || null)
const orderText = computed(() => {
  const m = activeMatch.value
  if (!m) return '-'
  return m.players.map((p) => p.colorLabel).join(' → ')
})

const nowIso = () => new Date().toISOString()
const randomId = () => `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const safeParse = (v) => {
  try {
    return JSON.parse(v)
  } catch (e) {
    return null
  }
}

const normalizeMatch = (m) => ({
  ...m,
  players: Array.isArray(m.players)
    ? m.players.map((p) => ({
        ...p,
        score: Number(p.score || 0),
        colorLabel: p.colorLabel || colorOptions.find((c) => c.key === p.colorKey)?.label || '玩家',
        colorHex: p.colorHex || colorOptions.find((c) => c.key === p.colorKey)?.hex || '#2563eb'
      }))
    : [],
  logs: Array.isArray(m.logs) ? m.logs : []
})

const loadMatches = () => {
  const raw = uni.getStorageSync(STORAGE_KEY)
  const parsed = typeof raw === 'string' ? safeParse(raw) : raw
  matches.value = Array.isArray(parsed) ? parsed.map(normalizeMatch) : []
}

const persistMatches = () => {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(matches.value))
}

const startNewMatch = () => {
  selectedColors.value = []
  step.value = 'colors'
}

const openHistory = () => {
  loadMatches()
  step.value = 'history'
}

const backToEntry = () => {
  step.value = 'entry'
}

const toggleColor = (key) => {
  const set = new Set(selectedColors.value)
  if (set.has(key)) {
    set.delete(key)
  } else {
    if (set.size >= 8) {
      uni.showToast({ title: '最多8名玩家', icon: 'none' })
      return
    }
    set.add(key)
  }
  selectedColors.value = [...set]
}

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const randomizeAndCreate = () => {
  const playerCount = selectedColors.value.length
  if (playerCount < 1) {
    uni.showToast({ title: '请至少选择1种颜色', icon: 'none' })
    return
  }

  const colorKeys = shuffle(selectedColors.value)
  const players = colorKeys.map((key, idx) => {
    const color = colorOptions.find((c) => c.key === key)
    return {
      seat: idx + 1,
      colorKey: key,
      colorLabel: color?.label || key,
      colorHex: color?.hex || '#2563eb',
      score: 0
    }
  })

  const match = {
    id: randomId(),
    playerCount,
    players,
    logs: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  }

  loadMatches()
  matches.value.unshift(match)
  activeMatchId.value = match.id
  persistMatches()
  uni.setStorageSync(ACTIVE_KEY, match.id)
  step.value = 'play'
}

const loadMatch = (id) => {
  activeMatchId.value = id
  uni.setStorageSync(ACTIVE_KEY, id)
  step.value = 'play'
}

const removeMatch = (id) => {
  matches.value = matches.value.filter((m) => m.id !== id)
  if (activeMatchId.value === id) {
    activeMatchId.value = ''
    uni.removeStorageSync(ACTIVE_KEY)
  }
  persistMatches()
}

const clearAllMatches = () => {
  if (!matches.value.length) return
  uni.showModal({
    title: '确认清空',
    content: '将删除所有本地历史对局记录，是否继续？',
    success: (res) => {
      if (!res.confirm) return
      matches.value = []
      activeMatchId.value = ''
      persistMatches()
      uni.removeStorageSync(ACTIVE_KEY)
      uni.showToast({ title: '已清空', icon: 'success' })
    }
  })
}

const appendLog = (m, log) => {
  if (!Array.isArray(m.logs)) m.logs = []
  m.logs.unshift(log)
  if (m.logs.length > 300) m.logs = m.logs.slice(0, 300)
}

const changeScore = (seat, delta) => {
  const m = activeMatch.value
  if (!m) return
  const player = m.players.find((p) => p.seat === seat)
  if (!player) return
  player.score += delta
  appendLog(m, {
    type: 'score',
    seat,
    colorKey: player.colorKey,
    colorLabel: player.colorLabel,
    delta,
    ts: nowIso()
  })
  m.updatedAt = nowIso()
  persistMatches()
}

const markRoundEnd = () => {
  const m = activeMatch.value
  if (!m) return
  appendLog(m, { type: 'round_end', ts: nowIso() })
  m.updatedAt = nowIso()
  persistMatches()
  uni.showToast({ title: '已记录回合结束', icon: 'none' })
}

const undoLastAction = () => {
  const m = activeMatch.value
  if (!m || !Array.isArray(m.logs) || !m.logs.length) {
    uni.showToast({ title: '没有可撤销记录', icon: 'none' })
    return
  }
  const last = m.logs.shift()
  if (last?.type === 'score') {
    const player = m.players.find((p) => p.seat === last.seat)
    if (player) player.score -= Number(last.delta || 0)
  }
  m.updatedAt = nowIso()
  persistMatches()
}

const formatDelta = (delta) => {
  const d = Number(delta || 0)
  return `${d >= 0 ? '+' : ''}${d}`
}

const resolveColorKeyFromLog = (log) => {
  const key = String(log?.colorKey || '').toLowerCase()
  if (key) return key
  const label = String(log?.colorLabel || '').toLowerCase()
  if (label.includes('蓝') || label.includes('blue')) return 'blue'
  if (label.includes('绿') || label.includes('green')) return 'green'
  if (label.includes('橙') || label.includes('orange')) return 'orange'
  if (label.includes('红') || label.includes('red')) return 'red'
  if (label.includes('黑') || label.includes('black')) return 'black'
  if (label.includes('紫') || label.includes('purple')) return 'purple'
  if (label.includes('白') || label.includes('white')) return 'white'
  if (label.includes('黄') || label.includes('yellow')) return 'yellow'
  if (label.includes('粉') || label.includes('pink')) return 'pink'
  if (label.includes('青') || label.includes('cyan')) return 'cyan'
  if (label.includes('棕') || label.includes('brown')) return 'brown'
  if (label.includes('灰') || label.includes('gray')) return 'gray'
  return ''
}

const logPlayerStyle = (log) => {
  if (!log || log.type !== 'score') return {}
  const key = resolveColorKeyFromLog(log)
  const color = colorOptions.find((c) => c.key === key)?.hex || '#111827'
  // 白色文字在白底不可读，这里做可读性兜底
  if (key === 'white') return { color: '#111827' }
  return { color }
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

const colorBorder = (hex) => {
  const { r, g, b } = hexToRgb(hex)
  if (r + g + b > 600) return '#111827'
  return 'transparent'
}

const textColor = (hex) => {
  if (String(hex).toLowerCase() === '#ffffff') return '#111827'
  if (String(hex).toLowerCase() === '#111827') return '#ffffff'
  const { r, g, b } = hexToRgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.65 ? '#111827' : '#ffffff'
}

const scoreBtnStyle = (hex) => ({
  backgroundColor: hex,
  color: textColor(hex),
  borderColor: colorBorder(hex)
})

const formatTime = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}-${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatClock = (iso) => {
  if (!iso) return '--:--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--:--'
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onShow(() => {
  loadMatches()
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.card { margin: 20rpx; background: #fff; border-radius: 14rpx; padding: 16rpx; }
.title { font-size: 30rpx; font-weight: 700; color: #111827; }
.sub { margin-top: 6rpx; font-size: 22rpx; color: #6b7280; }
.section-title { font-size: 26rpx; font-weight: 700; color: #111827; margin-bottom: 10rpx; }
.subtle { color: #6b7280; font-size: 22rpx; }
.subtle.mt { margin-top: 10rpx; }

.btn { height: 66rpx; border-radius: 10rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; }
.btn.big { height: 78rpx; margin-top: 10rpx; }
.btn.primary { background: #07c160; color: #fff; }
.btn.secondary { background: #2563eb; color: #fff; margin-top: 12rpx; }
.btn.action { background: #2563eb; color: #fff; }
.btn.danger { background: #ef4444; color: #fff; }
.btn.disabled { opacity: 0.45; }
.btn-row { margin-top: 12rpx; display: flex; gap: 12rpx; }
.same-size { width: 220rpx; }
.row-end { justify-content: space-between; }
.grid-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; }
.grid-two .btn { width: 100%; height: 52rpx; font-size: 22rpx; }

.color-grid { margin-top: 10rpx; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10rpx; }
.color-cell { border: 2rpx solid #d1d5db; border-radius: 10rpx; overflow: hidden; background: #fff; }
.color-fill { height: 64rpx; border-bottom: 2rpx solid transparent; }
.pick-area { height: 30rpx; display: flex; align-items: center; justify-content: center; background: #fff; }
.picked-text { font-size: 20rpx; color: #16a34a; font-weight: 700; }
.color-cell.checked { border-color: #16a34a; box-shadow: 0 0 0 2rpx #bbf7d0; }

.empty { color: #9ca3af; font-size: 24rpx; }
.history-item { margin-top: 10rpx; padding: 12rpx; border-radius: 10rpx; background: #f8fafc; }
.history-head { display: flex; justify-content: space-between; gap: 10rpx; }
.history-title { font-size: 24rpx; color: #111827; font-weight: 700; }
.history-time { font-size: 22rpx; color: #6b7280; }
.history-summary { margin-top: 8rpx; display: flex; flex-wrap: wrap; gap: 8rpx; }
.summary-line { font-size: 22rpx; color: #4b5563; background: #e5e7eb; padding: 4rpx 10rpx; border-radius: 999rpx; }

.top-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12rpx; margin-bottom: 10rpx; }
.tool-btn { height: 62rpx; border-radius: 12rpx; border: 2rpx solid transparent; font-size: 24rpx; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; }
.tool-btn.undo { background: linear-gradient(135deg, #0ea5e9, #2563eb); box-shadow: 0 6rpx 14rpx rgba(37, 99, 235, 0.25); }
.tool-btn.round { background: linear-gradient(135deg, #f59e0b, #f97316); box-shadow: 0 6rpx 14rpx rgba(249, 115, 22, 0.25); }

.play-head { display: flex; align-items: center; justify-content: space-between; gap: 10rpx; }

.player-card { margin-top: 12rpx; }
.score-block { min-height: 96rpx; border-radius: 10rpx; border: 2rpx solid transparent; display: flex; align-items: center; justify-content: center; }
.score { font-size: 64rpx; font-weight: 800; line-height: 1; }
.score-btns { margin-top: 10rpx; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8rpx; }
.score-btn { height: 54rpx; border-radius: 8rpx; border: 1rpx solid transparent; display: flex; align-items: center; justify-content: center; font-size: 22rpx; font-weight: 700; }

.history-log { margin-top: 14rpx; border: 2rpx solid #111827; border-radius: 6rpx; padding: 10rpx; background: #fff; }
.log-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8rpx; }
.log-title { font-size: 24rpx; color: #111827; font-weight: 700; }
.history-scroll { max-height: 320rpx; padding-right: 8rpx; }
.empty-log { margin-top: 8rpx; color: #9ca3af; font-size: 22rpx; }
.log-line { margin-top: 6rpx; display: flex; justify-content: space-between; align-items: center; gap: 12rpx; }
.log-main { display: flex; align-items: center; gap: 10rpx; min-width: 0; flex: 1; }
.log-player, .log-event { font-size: 22rpx; color: #111827; }
.log-delta { font-size: 22rpx; font-weight: 700; }
.delta-plus { color: #16a34a; }
.delta-minus { color: #dc2626; }
.log-time { font-size: 21rpx; color: #6b7280; flex-shrink: 0; }
</style>
