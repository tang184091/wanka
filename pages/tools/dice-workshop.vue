<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card notice">
        <view class="title">说明</view>
        <view class="note-line">1. 可自定义骰子面数（2-20）。</view>
        <view class="note-line">2. 系统会按面数生成默认骰面，你可以改成数字或文字。</view>
        <view class="note-line">3. 如需0起点，请自行将骰面改为0开始。</view>
        <view class="note-line">4. 每位玩家最多保存6枚不同自定义骰子。</view>
      </view>

      <view class="card">
        <view class="header-row">
          <text class="title">骰子工坊</text>
          <view class="btn blue" @tap="saveDice">保存骰子</view>
        </view>

        <view class="field-wrap">
          <text class="label">骰子面数</text>
          <input class="input" type="number" :value="String(sides)" @input="onSidesInput" />
        </view>

        <view class="name-field">
          <text class="label">骰子名称（可选）</text>
          <input class="input" maxlength="20" placeholder="例如：事件骰 / D6" :value="name" @input="onNameInput" />
        </view>

        <view class="face-grid">
          <view v-for="(face, idx) in faces" :key="`face-${idx}`" class="face-item">
            <text class="face-no">{{ idx + 1 }}</text>
            <input class="face-input" maxlength="12" :value="face" @input="(e) => onFaceInput(idx, e)" />
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const TEMPLATE_KEY = 'boardgame_dice_templates_v1'
const MAX_TEMPLATE = 6

const sides = ref(6)
const faces = ref([])
const name = ref('')

const safeParse = (v) => {
  try { return JSON.parse(v) } catch (e) { return null }
}

const loadTemplates = () => {
  const raw = uni.getStorageSync(TEMPLATE_KEY)
  const parsed = typeof raw === 'string' ? safeParse(raw) : raw
  return Array.isArray(parsed) ? parsed : []
}

const persistTemplates = (list) => {
  uni.setStorageSync(TEMPLATE_KEY, JSON.stringify(list))
}

const rebuildFaces = () => {
  const n = Math.max(2, Math.min(20, Number(sides.value) || 2))
  const old = Array.isArray(faces.value) ? [...faces.value] : []
  const next = []
  for (let i = 0; i < n; i += 1) {
    next.push(old[i] !== undefined ? String(old[i]) : String(i + 1))
  }
  faces.value = next
}

const onSidesInput = (e) => {
  const v = Number(e?.detail?.value || 0)
  sides.value = Math.max(2, Math.min(20, v || 2))
  rebuildFaces()
}

const onNameInput = (e) => {
  name.value = String(e?.detail?.value || '')
}

const onFaceInput = (idx, e) => {
  const v = String(e?.detail?.value || '')
  const arr = [...faces.value]
  arr[idx] = v
  faces.value = arr
}

const saveDice = () => {
  const list = loadTemplates()
  if (list.length >= MAX_TEMPLATE) {
    uni.showToast({ title: '每位玩家最多保存6枚骰子', icon: 'none' })
    return
  }

  const cleanFaces = faces.value.map((v, idx) => {
    const txt = String(v || '').trim()
    if (txt) return txt
    return String(idx + 1)
  })

  const n = Math.max(2, Math.min(20, Number(sides.value) || 2))
  const diceName = String(name.value || '').trim() || `D${n}`

  list.unshift({
    id: `dice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: diceName,
    sides: n,
    faces: cleanFaces.slice(0, n),
    createdAt: new Date().toISOString()
  })

  persistTemplates(list)
  uni.showToast({ title: '保存成功', icon: 'success' })
  setTimeout(() => {
    uni.navigateBack()
  }, 250)
}

onLoad(() => {
  rebuildFaces()
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.card { margin: 20rpx; background: #fff; border-radius: 14rpx; padding: 16rpx; }
.notice { background: #f8fafc; }
.title { font-size: 28rpx; font-weight: 700; color: #111827; }
.note-line { margin-top: 8rpx; font-size: 22rpx; color: #4b5563; }

.header-row { display: flex; align-items: center; justify-content: space-between; }
.btn { min-width: 150rpx; height: 58rpx; border-radius: 8rpx; color: #fff; font-size: 22rpx; display: flex; align-items: center; justify-content: center; }
.btn.blue { background: #2563eb; }

.field-wrap { margin-top: 14rpx; display: flex; flex-direction: column; gap: 8rpx; }
.name-field { margin-top: 14rpx; display: flex; flex-direction: column; gap: 8rpx; }
.label { font-size: 24rpx; color: #374151; }
.input { height: 64rpx; border: 2rpx solid #d1d5db; border-radius: 8rpx; padding: 0 14rpx; font-size: 24rpx; background: #fff; color: #111827; }

.face-grid { margin-top: 16rpx; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10rpx; }
.face-item { display: flex; align-items: center; gap: 8rpx; }
.face-no { width: 30rpx; text-align: center; font-size: 22rpx; color: #374151; }
.face-input { flex: 1; height: 56rpx; border: 2rpx solid #d1d5db; border-radius: 8rpx; padding: 0 10rpx; font-size: 22rpx; background: #fff; color: #111827; }
</style>
