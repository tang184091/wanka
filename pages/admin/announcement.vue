<template>
  <view class="page">
    <scroll-view class="scroll" scroll-y>
      <view class="card">
        <view class="title">公告管理</view>
        <view class="sub">座位详情页底部公告，最多 1000 字</view>
      </view>

      <view class="card">
        <textarea
          v-model="content"
          class="textarea"
          maxlength="1000"
          placeholder="请输入公告内容（最多1000字）"
        />
        <view class="count">{{ content.length }}/1000</view>
        <view class="meta" v-if="updatedAtText">最近更新：{{ updatedAtText }} {{ updatedByNickname ? `· ${updatedByNickname}` : '' }}</view>
        <view class="btn save-btn" @tap="saveNotice" :class="{ disabled: saving }">
          {{ saving ? '保存中...' : '保存公告' }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const content = ref('')
const saving = ref(false)
const updatedAt = ref('')
const updatedByNickname = ref('')

const updatedAtText = computed(() => {
  if (!updatedAt.value) return ''
  const d = new Date(updatedAt.value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})

const loadNotice = async () => {
  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: { action: 'getSeatAnnouncement', data: {} }
  })
  if (res?.result?.code === 0) {
    content.value = String(res.result?.data?.content || '')
    updatedAt.value = res.result?.data?.updatedAt || ''
    updatedByNickname.value = String(res.result?.data?.updatedByNickname || '')
  } else {
    uni.showToast({ title: res?.result?.message || '加载失败', icon: 'none' })
  }
}

const saveNotice = async () => {
  if (saving.value) return
  if (content.value.length > 1000) {
    uni.showToast({ title: '公告最多1000字', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: { action: 'setSeatAnnouncement', data: { content: content.value } }
    })
    if (res?.result?.code === 0) {
      uni.showToast({ title: '保存成功', icon: 'success' })
      updatedAt.value = res.result?.data?.updatedAt || new Date().toISOString()
      updatedByNickname.value = String(res.result?.data?.updatedByNickname || '')
    } else {
      uni.showToast({ title: res?.result?.message || '保存失败', icon: 'none' })
    }
  } catch (error) {
    console.error('saveNotice failed:', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onShow(() => {
  loadNotice()
})
</script>

<style scoped>
.page { min-height: 100vh; background:#f5f6f8; }
.scroll { height: 100vh; }
.card { margin:20rpx; background:#fff; border-radius:12rpx; padding:16rpx; border:1rpx solid #e5e7eb; }
.title { font-size:30rpx; font-weight:700; color:#111827; }
.sub { margin-top:8rpx; font-size:22rpx; color:#6b7280; line-height:1.6; }
.textarea {
  width: 100%;
  min-height: 360rpx;
  background: #f8fafc;
  border-radius: 10rpx;
  padding: 16rpx;
  box-sizing: border-box;
  font-size: 24rpx;
  line-height: 1.6;
}
.count { margin-top: 10rpx; text-align: right; font-size: 22rpx; color: #6b7280; }
.meta { margin-top: 8rpx; font-size: 22rpx; color: #6b7280; }
.btn { margin-top: 16rpx; height: 72rpx; border-radius: 10rpx; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26rpx; }
.save-btn { background: #07c160; }
.disabled { opacity: .55; }
</style>
