<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">荣誉榜管理</view>
        <view class="sub">管理员可新增或修改荣誉记录，并设置稀有度样式</view>
      </view>

      <view v-if="!isAdmin" class="empty">仅管理员可访问</view>
      <view v-else>
        <view class="card">
          <view class="form-row">
            <text class="label">荣誉类型</text>
            <picker mode="selector" :range="typeOptions" :value="typeIndex" @change="onTypeChange">
              <view class="picker">{{ typeOptions[typeIndex] }}</view>
            </picker>
          </view>

          <view class="form-row">
            <text class="label">稀有度样式</text>
            <picker mode="selector" :range="rarityLabels" :value="rarityIndex" @change="onRarityChange">
              <view class="picker">{{ rarityLabels[rarityIndex] }}</view>
            </picker>
          </view>

          <template v-if="form.type === 'tournament'">
            <input class="input" v-model="form.title" placeholder="比赛名称（可选）" />
            <input class="input" v-model="form.championNickname" placeholder="冠军昵称" />
            <input class="input" v-model="form.participantCount" type="number" placeholder="参赛人数（4-32）" />
          </template>
          <template v-else>
            <input class="input" v-model="form.playerNickname" placeholder="玩家昵称" />
            <input class="input" v-model="form.rankName" placeholder="段位名称（如：雀圣）" />
          </template>

          <picker mode="date" :value="dateValue" @change="onDateChange">
            <view class="picker">达成日期：{{ dateValue }}</view>
          </picker>
          <textarea class="textarea" v-model="form.note" placeholder="备注（可选）" />

          <view class="actions">
            <view class="btn primary" @tap="submit">{{ editingId ? '保存修改' : '上传荣誉' }}</view>
            <view v-if="editingId" class="btn ghost" @tap="cancelEdit">取消编辑</view>
          </view>
        </view>

        <view class="card">
          <view class="title-sm">已上传荣誉</view>
          <view v-if="!list.length" class="empty">暂无记录</view>
          <view class="row" v-for="item in list" :key="item.id || item._id">
            <view class="info">
              <view class="line">
                <text class="badge" :class="getBadgeClass(item)">{{ item.type === 'tournament' ? '比赛' : '段位' }}</text>
                <text class="time">{{ formatTime(item.achievedAt) }}</text>
              </view>
              <text class="line text">{{ item.type === 'tournament' ? `比赛冠军：${item.championNickname || '-'}` : `段位：${item.playerNickname || '-'} · ${item.rankName || '-'}` }}</text>
            </view>
            <view class="ops">
              <view class="op edit" @tap="editItem(item)">修改</view>
              <view class="op del" @tap="removeItem(item)">删除</view>
            </view>
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
const editingId = ref('')

const typeOptions = ['比赛荣誉', '段位荣誉']
const typeIndex = ref(0)
const rarityOptions = [
  { label: '金色（传说）', value: 'legend' },
  { label: '紫色（史诗）', value: 'epic' },
  { label: '蓝色（稀有）', value: 'rare' },
  { label: '白色黑框（普通）', value: 'common' }
]
const rarityLabels = rarityOptions.map((item) => item.label)
const rarityIndex = ref(1)

const dateValue = ref(new Date().toISOString().slice(0, 10))
const form = ref({
  type: 'tournament',
  rarity: 'epic',
  title: '',
  championNickname: '',
  participantCount: '',
  playerNickname: '',
  rankName: '',
  note: ''
})

const redirectNonAdmin = () => {
  uni.showToast({ title: '仅管理员可访问', icon: 'none' })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/user/user' })
  }, 300)
}

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const getBadgeClass = (item) => {
  const rarity = normalizeRarity(item.rarity)
  return `badge-${rarity}`
}

const normalizeRarity = (rarity) => {
  if (rarity === 'legend' || rarity === 'gold') return 'legend'
  if (rarity === 'epic' || rarity === 'purple') return 'epic'
  if (rarity === 'rare' || rarity === 'blue' || rarity === 'silver') return 'rare'
  if (rarity === 'common' || rarity === 'normal') return 'common'
  return 'epic'
}

const resetForm = () => {
  editingId.value = ''
  typeIndex.value = 0
  rarityIndex.value = 1
  dateValue.value = new Date().toISOString().slice(0, 10)
  form.value = {
    type: 'tournament',
    rarity: 'epic',
    title: '',
    championNickname: '',
    participantCount: '',
    playerNickname: '',
    rankName: '',
    note: ''
  }
}

const loadData = async () => {
  const me = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!me?.result?.data?.isAdmin
  if (!isAdmin.value) return redirectNonAdmin()

  const res = await wx.cloud.callFunction({ name: 'game-service', data: { action: 'getAdminManageData', data: {} } })
  if (res.result?.code === 0) {
    list.value = (res.result.data.honorRecords || []).map((item) => ({
      ...item,
      id: item.id || item._id,
      rarity: normalizeRarity(item.rarity)
    }))
  }
}

const onTypeChange = (e) => {
  typeIndex.value = Number(e.detail.value)
  form.value.type = typeIndex.value === 0 ? 'tournament' : 'rank'
}

const onRarityChange = (e) => {
  rarityIndex.value = Number(e.detail.value)
  form.value.rarity = rarityOptions[rarityIndex.value].value
}

const onDateChange = (e) => {
  dateValue.value = e.detail.value
}

const editItem = (item) => {
  editingId.value = item.id || item._id || ''
  typeIndex.value = item.type === 'rank' ? 1 : 0
  form.value.type = typeIndex.value === 0 ? 'tournament' : 'rank'

  const rarityValue = normalizeRarity(item.rarity)
  rarityIndex.value = Math.max(0, rarityOptions.findIndex((it) => it.value === rarityValue))
  form.value.rarity = rarityOptions[rarityIndex.value].value

  dateValue.value = formatTime(item.achievedAt)
  form.value.title = item.title || ''
  form.value.championNickname = item.championNickname || ''
  form.value.participantCount = item.participantCount ? String(item.participantCount) : ''
  form.value.playerNickname = item.playerNickname || ''
  form.value.rankName = item.rankName || ''
  form.value.note = item.note || ''
}

const cancelEdit = () => {
  resetForm()
}

const submit = async () => {
  const payload = {
    ...form.value,
    achievedAt: dateValue.value,
    rarity: rarityOptions[rarityIndex.value].value
  }
  const action = editingId.value ? 'updateHonorRecord' : 'createHonorRecord'
  if (editingId.value) payload.recordId = editingId.value

  const res = await wx.cloud.callFunction({ name: 'game-service', data: { action, data: payload } })
  if (res.result?.code === 0) {
    uni.showToast({ title: editingId.value ? '修改成功' : '上传成功', icon: 'success' })
    await loadData()
    resetForm()
  } else {
    uni.showToast({ title: res.result?.message || (editingId.value ? '修改失败' : '上传失败'), icon: 'none' })
  }
}

const removeItem = (item) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确定继续？',
    success: async (r) => {
      if (!r.confirm) return
      const res = await wx.cloud.callFunction({
        name: 'game-service',
        data: { action: 'adminDeleteHonorRecord', data: { recordId: item.id || item._id } }
      })
      if (res.result?.code === 0) {
        uni.showToast({ title: '已删除', icon: 'success' })
        if (editingId.value && editingId.value === (item.id || item._id)) {
          resetForm()
        }
        await loadData()
      } else {
        uni.showToast({ title: res.result?.message || '删除失败', icon: 'none' })
      }
    }
  })
}

onShow(loadData)
</script>

<style scoped>
.page { min-height: 100vh; background:#f5f6f8; }
.scroll { height: 100vh; }
.card { margin:20rpx; background:#fff; border-radius:14rpx; padding:16rpx; }
.title { font-size:30rpx; font-weight:700; }
.sub { margin-top:6rpx; color:#6b7280; font-size:22rpx; }
.title-sm { font-size:26rpx; font-weight:700; margin-bottom:8rpx; }
.empty { color:#9ca3af; }
.form-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12rpx; }
.label { color:#374151; font-size:24rpx; }
.picker,.input,.textarea { margin-top:10rpx; width:100%; background:#f8fafc; border-radius:10rpx; padding:12rpx; box-sizing:border-box; font-size:24rpx; }
.textarea { min-height:120rpx; }
.actions { margin-top:14rpx; display:flex; gap:12rpx; }
.btn { flex:1; height:68rpx; border-radius:10rpx; display:flex; align-items:center; justify-content:center; font-size:24rpx; }
.btn.primary { background:#07c160; color:#fff; }
.btn.ghost { background:#eef2ff; color:#4338ca; }
.row { display:flex; justify-content:space-between; align-items:center; padding:12rpx 0; border-bottom:1rpx solid #f1f5f9; }
.info { flex:1; padding-right:12rpx; }
.line { display:flex; align-items:center; gap:10rpx; font-size:22rpx; color:#111827; }
.line.text { margin-top:8rpx; display:block; }
.badge { font-size:20rpx; padding:4rpx 12rpx; border-radius:999rpx; color:#fff; }
.badge-legend { background:linear-gradient(135deg,#f59e0b,#fcd34d); color:#7c2d12; }
.badge-epic { background:linear-gradient(135deg,#7c3aed,#8b5cf6); color:#fff; }
.badge-rare { background:linear-gradient(135deg,#2563eb,#38bdf8); color:#fff; }
.badge-common { background:#fff; color:#111827; border:1rpx solid #111827; }
.time { font-size:22rpx; color:#6b7280; }
.ops { display:flex; align-items:center; gap:10rpx; }
.op { min-width:88rpx; height:52rpx; border-radius:8rpx; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22rpx; }
.edit { background:#2563eb; }
.del { background:#ef4444; }
</style>
