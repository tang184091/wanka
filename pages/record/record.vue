<template>
  <view class="record-page">
    <scroll-view scroll-y class="record-scroll">
      <view class="card">
        <view class="card-title">近7天立直麻将战绩</view>
        <view class="card-sub">按时间倒序展示</view>

        <view v-if="records.length === 0" class="empty">暂无战绩</view>
        <view v-for="item in records" :key="item._id" class="record-item" @tap="openDetail(item)">
          <view class="record-head">
            <text class="time">{{ formatTime(item.createdAt) }}</text>
            <text class="detail-link">查看详情</text>
          </view>
          <view class="row" v-for="(player, index) in item.players" :key="index">
            <text class="name">{{ player.nickname || player.userId || '未知玩家' }}</text>
            <text class="score">{{ player.score }}</text>
          </view>
        </view>
      </view>

      <view class="card">
        <view class="card-title">上传战绩</view>
        <view class="hint">支持输入 4 名玩家，分数总和必须为 100000（或 1000）</view>

        <view v-for="(player, index) in form.players" :key="index" class="form-row">
          <input
            class="input"
            v-model="player.keyword"
            :placeholder="`玩家${index + 1} ID或昵称`"
            @input="onSearch(index)"
          />
          <input class="input score" type="number" v-model="player.score" :placeholder="`分数`" />
          <view v-if="searchingIndex === index && searchResults.length" class="search-box">
            <view class="search-item" v-for="u in searchResults" :key="u.id" @tap="pickUser(index, u)">
              {{ u.nickname }}
            </view>
          </view>
        </view>

        <view class="sum" :class="{ok: scoreValid}">当前总和：{{ totalScore }} / 100000（或1000）</view>
        <view class="btn" @tap="submit">提交战绩</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const records = ref([])
const emptyPlayers = () => ([
  { keyword: '', userId: '', nickname: '', score: '' },
  { keyword: '', userId: '', nickname: '', score: '' },
  { keyword: '', userId: '', nickname: '', score: '' },
  { keyword: '', userId: '', nickname: '', score: '' }
])

const form = ref({ players: emptyPlayers() })
const searchResults = ref([])
const searchingIndex = ref(-1)
let timer = null

const toNumber = (v) => Number(v || 0)
const totalScore = computed(() => form.value.players.reduce((sum, p) => sum + toNumber(p.score), 0))
const scoreValid = computed(() => totalScore.value === 100000 || totalScore.value === 1000)

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const loadRecords = async () => {
  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: { action: 'getMahjongRecords', data: {} }
  })
  if (res.result?.code === 0) {
    records.value = res.result.data.list || []
  }
}

const onSearch = (index) => {
  searchingIndex.value = index
  const player = form.value.players[index]
  const keyword = (player.keyword || '').trim()

  if (player.nickname && keyword !== player.nickname) {
    player.nickname = ''
    player.userId = ''
  }

  clearTimeout(timer)
  timer = setTimeout(async () => {
    if (keyword.length < 2) {
      searchResults.value = []
      return
    }

    const res = await wx.cloud.callFunction({
      name: 'user-service',
      data: { action: 'searchUsers', data: { keyword } }
    })
    if (res.result?.code === 0) {
      searchResults.value = (res.result.data.list || []).slice(0, 5)
    }
  }, 220)
}

const pickUser = (index, user) => {
  form.value.players[index].userId = user.id
  form.value.players[index].nickname = user.nickname
  form.value.players[index].keyword = user.nickname
  searchResults.value = []
}

const submit = async () => {
  const players = form.value.players.map(p => {
    const typed = (p.keyword || '').trim()
    const userId = (p.userId || typed).trim()
    const nickname = p.nickname || ''
    return {
      userId,
      nickname,
      score: Number(p.score || 0)
    }
  })

  if (players.some(p => !p.userId)) {
    uni.showToast({ title: '请填写4位玩家ID或昵称', icon: 'none' })
    return
  }
  if (!scoreValid.value) {
    uni.showToast({ title: '分数总和必须为100000或1000', icon: 'none' })
    return
  }

  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: { action: 'createMahjongRecord', data: { players } }
  })

  if (res.result?.code === 0) {
    uni.showToast({ title: '提交成功', icon: 'success' })
    form.value.players = emptyPlayers()
    await loadRecords()
  } else {
    uni.showToast({ title: res.result?.message || '提交失败', icon: 'none' })
  }
}

const openDetail = (item) => {
  uni.navigateTo({ url: `/pages/record/detail?id=${item._id}` })
}

onShow(loadRecords)
</script>

<style scoped>
.record-page { min-height: 100vh; background: #f5f6f8; }
.record-scroll { height: 100vh; }
.card { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 20rpx; }
.card-title { font-size: 30rpx; font-weight: 700; }
.card-sub,.hint { color: #6b7280; font-size: 22rpx; margin-top: 8rpx; }
.record-item { margin-top: 14rpx; padding: 14rpx; background: #f8fafc; border-radius: 12rpx; }
.record-head { display:flex; justify-content:space-between; align-items:center; }
.detail-link { color:#2563eb; font-size:22rpx; }
.time { font-size: 22rpx; color: #6b7280; }
.row { display: flex; justify-content: space-between; margin-top: 6rpx; }
.form-row { position: relative; display: flex; gap: 12rpx; margin-top: 14rpx; }
.input { flex: 1; height: 70rpx; border: 1rpx solid #d1d5db; border-radius: 10rpx; padding: 0 16rpx; background:#fff; }
.input.score { flex: 0.8; }
.search-box { position: absolute; top: 74rpx; left: 0; right: 0; z-index: 10; background:#fff; border:1rpx solid #d1d5db; border-radius:10rpx; }
.search-item { padding: 12rpx 14rpx; border-bottom: 1rpx solid #eef2f7; }
.sum { margin-top: 16rpx; color:#ef4444; font-weight:700; }
.sum.ok { color:#16a34a; }
.btn { margin-top: 14rpx; height: 72rpx; background:#07c160; color:#fff; border-radius: 10rpx; display:flex; align-items:center; justify-content:center; }
.empty { margin-top: 10rpx; color:#9ca3af; }
.name { color:#111827; }
.score { color:#0891b2; font-weight:700; }
</style>

