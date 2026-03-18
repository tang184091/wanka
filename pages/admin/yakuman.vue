<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="header-card">
        <view class="title">役满图片管理</view>
        <view class="sub">管理员可删除违规或错误记录</view>
      </view>

      <view v-if="!isAdmin" class="empty">仅管理员可访问</view>
      <view v-else-if="!list.length" class="empty">暂无可管理役满记录</view>

      <view class="grid" v-else>
        <view class="item" v-for="item in list" :key="item.id">
          <image class="photo" :src="item.imageFileId" mode="aspectFill" />
          <view class="info">
            <text class="line">{{ item.playerNickname }} · {{ item.yakumanType }}</text>
            <text class="line subline">{{ formatTime(item.achievedAt) }} · 上传: {{ item.uploaderNickname }}</text>
          </view>
          <view class="delete-btn" @tap="deleteYakuman(item)">删除</view>
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

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const loadData = async () => {
  const me = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!me?.result?.data?.isAdmin
  if (!isAdmin.value) return redirectNonAdmin()

  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: { action: 'getAdminManageData', data: {} }
  })

  if (res.result?.code === 0) {
    list.value = res.result.data.yakumanRecords || []
  }
}

const deleteYakuman = (item) => {
  uni.showModal({
    title: '确认删除役满记录',
    content: '删除后不可恢复，确认继续？',
    success: async (res) => {
      if (!res.confirm) return
      const r = await wx.cloud.callFunction({
        name: 'game-service',
        data: { action: 'adminDeleteYakumanRecord', data: { recordId: item.id } }
      })
      if (r.result?.code === 0) {
        uni.showToast({ title: '已删除', icon: 'success' })
        await loadData()
      } else {
        uni.showToast({ title: r.result?.message || '删除失败', icon: 'none' })
      }
    }
  })
}

onShow(loadData)
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.header-card { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 20rpx; }
.title { font-size: 30rpx; font-weight: 700; }
.sub { margin-top: 6rpx; font-size: 22rpx; color: #6b7280; }
.empty { margin: 20rpx; color: #9ca3af; }
.grid { margin: 20rpx; display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16rpx; }
.item { background:#fff; border-radius: 12rpx; overflow:hidden; display:flex; flex-direction:column; }
.photo { width:100%; height:220rpx; }
.info { padding: 10rpx; display:flex; flex-direction:column; gap:4rpx; }
.line { font-size: 22rpx; color:#111827; }
.subline { color:#6b7280; }
.delete-btn { height: 60rpx; background:#ef4444; color:#fff; display:flex; align-items:center; justify-content:center; font-size:24rpx; }
</style>