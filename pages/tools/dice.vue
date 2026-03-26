<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="header-row">
          <text class="title">骰子库存</text>
          <view class="head-btns">
            <view class="btn mini blue" @tap="goWorkshop">新建骰子</view>
            <view class="btn mini gray" @tap="toggleManage">{{ manageMode ? '完成管理' : '管理骰子' }}</view>
          </view>
        </view>

        <view v-if="!templates.length" class="empty">库存为空，点击右上角“新建骰子”</view>
        <view v-else class="inv-grid">
          <view v-for="item in templates" :key="item.id" class="inv-item">
            <view class="inv-box" @tap="onTapTemplate(item)">
              <text class="inv-name">{{ item.name }}</text>
              <text class="inv-meta">{{ item.sides }}面</text>
            </view>
            <view v-if="manageMode" class="delete-btn" @tap="removeTemplate(item.id)">删除</view>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="header-row">
          <text class="title">骰子区</text>
          <view class="btn mini green" :class="{ disabled: !trayDice.length }" @tap="rollAll">投掷所有骰子</view>
        </view>
        <view class="sub">点击骰子区里的骰子可移除，最多放入15枚</view>

        <view v-if="!trayDice.length" class="empty">暂无骰子，请从库存点击添加</view>
        <view v-else class="tray-grid">
          <view
            v-for="die in trayDice"
            :key="die.id"
            class="tray-item"
            @tap="removeFromTray(die.id)"
          >
            <text class="tray-face">{{ die.currentFace }}</text>
            <text class="tray-name">{{ die.name }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const TEMPLATE_KEY = 'boardgame_dice_templates_v1'
const TRAY_KEY = 'boardgame_dice_tray_v1'
const MAX_TEMPLATE = 6
const MAX_TRAY = 15

const templates = ref([])
const trayDice = ref([])
const manageMode = ref(false)

const safeParse = (v) => {
  try { return JSON.parse(v) } catch (e) { return null }
}

const loadState = () => {
  const tRaw = uni.getStorageSync(TEMPLATE_KEY)
  const tParsed = typeof tRaw === 'string' ? safeParse(tRaw) : tRaw
  templates.value = Array.isArray(tParsed) ? tParsed : []

  const dRaw = uni.getStorageSync(TRAY_KEY)
  const dParsed = typeof dRaw === 'string' ? safeParse(dRaw) : dRaw
  trayDice.value = Array.isArray(dParsed) ? dParsed : []
}

const persistTemplates = () => {
  uni.setStorageSync(TEMPLATE_KEY, JSON.stringify(templates.value))
}

const persistTray = () => {
  uni.setStorageSync(TRAY_KEY, JSON.stringify(trayDice.value))
}

const toggleManage = () => {
  manageMode.value = !manageMode.value
}

const goWorkshop = () => {
  if (templates.value.length >= MAX_TEMPLATE) {
    uni.showToast({ title: '每位玩家最多保存6枚骰子', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/pages/tools/dice-workshop' })
}

const onTapTemplate = (item) => {
  if (manageMode.value) return
  if (trayDice.value.length >= MAX_TRAY) {
    uni.showToast({ title: '骰子区最多15枚', icon: 'none' })
    return
  }
  const face = String((item.faces || [])[0] ?? '-')
  trayDice.value.push({
    id: `tray_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    templateId: item.id,
    name: item.name,
    faces: Array.isArray(item.faces) ? [...item.faces] : [],
    currentFace: face
  })
  persistTray()
}

const removeTemplate = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，是否继续？',
    success: (res) => {
      if (!res.confirm) return
      templates.value = templates.value.filter((t) => t.id !== id)
      trayDice.value = trayDice.value.filter((d) => d.templateId !== id)
      persistTemplates()
      persistTray()
      uni.showToast({ title: '已删除', icon: 'success' })
    }
  })
}

const removeFromTray = (id) => {
  trayDice.value = trayDice.value.filter((d) => d.id !== id)
  persistTray()
}

const rollAll = () => {
  if (!trayDice.value.length) return
  trayDice.value = trayDice.value.map((d) => {
    const faces = Array.isArray(d.faces) ? d.faces : []
    if (!faces.length) return { ...d, currentFace: '-' }
    const idx = Math.floor(Math.random() * faces.length)
    return { ...d, currentFace: String(faces[idx]) }
  })
  persistTray()
}

onShow(() => {
  manageMode.value = false
  loadState()
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.card { margin: 20rpx; background: #fff; border-radius: 14rpx; padding: 16rpx; }
.header-row { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.head-btns { display: flex; gap: 10rpx; }
.title { font-size: 28rpx; font-weight: 700; color: #111827; }
.sub { margin-top: 8rpx; font-size: 22rpx; color: #6b7280; }
.empty { margin-top: 12rpx; color: #9ca3af; font-size: 24rpx; }

.btn { display: flex; align-items: center; justify-content: center; border-radius: 8rpx; color: #fff; }
.btn.mini { min-width: 140rpx; height: 52rpx; font-size: 22rpx; padding: 0 14rpx; }
.btn.blue { background: #2563eb; }
.btn.gray { background: #6b7280; }
.btn.green { background: #16a34a; }
.btn.disabled { opacity: 0.45; }

.inv-grid { margin-top: 12rpx; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12rpx; }
.inv-item { display: flex; flex-direction: column; gap: 8rpx; }
.inv-box { aspect-ratio: 1 / 1; border: 2rpx solid #d1d5db; border-radius: 12rpx; background: linear-gradient(145deg, #f8fafc, #eef2f7); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 8rpx; box-shadow: 0 6rpx 14rpx rgba(148, 163, 184, 0.16); }
.inv-name { font-size: 22rpx; color: #111827; font-weight: 700; text-align: center; }
.inv-meta { margin-top: 4rpx; font-size: 20rpx; color: #6b7280; }
.delete-btn { height: 44rpx; border-radius: 8rpx; background: #ef4444; color: #fff; font-size: 20rpx; display: flex; align-items: center; justify-content: center; }

.tray-grid { margin-top: 12rpx; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12rpx; }
.tray-item { aspect-ratio: 1 / 1; border: 2rpx solid #cbd5e1; border-radius: 12rpx; background: linear-gradient(145deg, #ffffff, #f8fafc); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8rpx; box-shadow: 0 6rpx 14rpx rgba(148, 163, 184, 0.14); }
.tray-face { font-size: 34rpx; line-height: 1.1; color: #111827; font-weight: 800; word-break: break-all; text-align: center; }
.tray-name { margin-top: 8rpx; font-size: 20rpx; color: #6b7280; text-align: center; }
</style>
