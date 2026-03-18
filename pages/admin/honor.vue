<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">荣誉榜管理</view>
        <view class="sub">管理员可新增比赛荣誉或段位荣誉</view>
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

          <template v-if="form.type === 'tournament'">
            <input class="input" v-model="form.title" placeholder="比赛名称（可选）" />
            <input class="input" v-model="form.championNickname" placeholder="冠军昵称" />
            <input class="input" v-model="form.participantCount" type="number" placeholder="参赛人数（4-32）" />
          </template>
          <template v-else>
            <input class="input" v-model="form.playerNickname" placeholder="玩家昵称" />
            <input class="input" v-model="form.rankName" placeholder="段位名称（如：雀豪1）" />
          </template>

          <picker mode="date" :value="dateValue" @change="onDateChange">
            <view class="picker">达成日期：{{ dateValue }}</view>
          </picker>
          <textarea class="textarea" v-model="form.note" placeholder="备注（可选）" />
          <view class="btn" @tap="submit">上传荣誉</view>
        </view>

        <view class="card">
          <view class="title-sm">已上传荣誉</view>
          <view v-if="!list.length" class="empty">暂无记录</view>
          <view class="row" v-for="item in list" :key="item.id">
            <view class="info">
              <text class="line">{{ item.type === 'tournament' ? `比赛冠军：${item.championNickname || '-'}` : `段位：${item.playerNickname || '-'} · ${item.rankName || '-'}` }}</text>
              <text class="line sub">{{ formatTime(item.achievedAt) }}</text>
            </view>
            <view class="del" @tap="removeItem(item)">删除</view>
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
const redirectNonAdmin = () => {
  uni.showToast({ title: '仅管理员可访问', icon: 'none' })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/user/user' })
  }, 300)
}
const typeOptions = ['比赛荣誉', '段位荣誉']
const typeIndex = ref(0)
const dateValue = ref(new Date().toISOString().slice(0, 10))
const form = ref({
  type: 'tournament',
  title: '',
  championNickname: '',
  participantCount: '',
  playerNickname: '',
  rankName: '',
  note: ''
})

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`
}

const loadData = async () => {
  const me = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!me?.result?.data?.isAdmin
  if (!isAdmin.value) return redirectNonAdmin()
  const res = await wx.cloud.callFunction({ name: 'game-service', data: { action: 'getAdminManageData', data: {} } })
  if (res.result?.code === 0) list.value = res.result.data.honorRecords || []
}

const onTypeChange = (e) => {
  typeIndex.value = Number(e.detail.value)
  form.value.type = typeIndex.value === 0 ? 'tournament' : 'rank'
}
const onDateChange = (e) => { dateValue.value = e.detail.value }

const submit = async () => {
  const payload = { ...form.value, achievedAt: dateValue.value }
  const res = await wx.cloud.callFunction({ name: 'game-service', data: { action: 'createHonorRecord', data: payload } })
  if (res.result?.code === 0) {
    uni.showToast({ title: '上传成功', icon: 'success' })
    await loadData()
  } else {
    uni.showToast({ title: res.result?.message || '上传失败', icon: 'none' })
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
        data: { action: 'adminDeleteHonorRecord', data: { recordId: item.id } }
      })
      if (res.result?.code === 0) {
        uni.showToast({ title: '已删除', icon: 'success' })
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
.btn { margin-top:14rpx; height:68rpx; border-radius:10rpx; background:#07c160; color:#fff; display:flex; align-items:center; justify-content:center; }
.row { display:flex; justify-content:space-between; align-items:center; padding:12rpx 0; border-bottom:1rpx solid #f1f5f9; }
.info { flex:1; padding-right:12rpx; }
.line { font-size:22rpx; color:#111827; display:block; }
.sub { color:#6b7280; }
.del { min-width:88rpx; height:52rpx; border-radius:8rpx; background:#ef4444; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22rpx; }
</style>
