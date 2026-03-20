<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">投稿词条</view>
        <view class="sub">普通用户可投稿，提交后需管理员审核发布</view>
      </view>

      <view class="card">
        <input class="input" v-model="form.title" placeholder="词条标题" />
        <input class="input" v-model="form.summary" placeholder="词条摘要（可选）" />
        <textarea class="textarea" v-model="form.content" placeholder="词条正文（最多1000字）" maxlength="1000" />
        <view class="count">{{ form.content.length }}/1000</view>
        <input class="input" v-model="tagsText" placeholder="标签（可选，多个标签用逗号分隔）" />

        <view class="img-head">
          <text class="label">词条图片（最多9张）</text>
          <view class="img-btn" @tap="chooseImages">选择图片</view>
        </view>
        <view class="img-list" v-if="form.images.length">
          <view class="img-item" v-for="(img, index) in form.images" :key="img + index">
            <image :src="img" class="img" mode="aspectFill" />
            <view class="img-del" @tap="removeImage(index)">删除</view>
          </view>
        </view>

        <view class="btn" @tap="submit">提交审核</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const tagsText = ref('')
const form = ref({
  title: '',
  summary: '',
  content: '',
  images: []
})

const parseTags = () => {
  return tagsText.value
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10)
}

const uploadSingleImage = async (filePath) => {
  const ext = (filePath.split('.').pop() || 'jpg').toLowerCase()
  const cloudPath = `wiki/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const res = await wx.cloud.uploadFile({ cloudPath, filePath })
  return res.fileID
}

const chooseImages = () => {
  const remain = Math.max(0, 9 - form.value.images.length)
  if (!remain) {
    uni.showToast({ title: '最多 9 张图片', icon: 'none' })
    return
  }
  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...', mask: true })
        const files = res.tempFilePaths || []
        for (const path of files) {
          const fileID = await uploadSingleImage(path)
          form.value.images.push(fileID)
        }
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (error) {
        console.error('upload wiki images failed', error)
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const removeImage = (index) => {
  form.value.images.splice(index, 1)
}

const submit = async () => {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  if (!form.value.content.trim()) {
    uni.showToast({ title: '请填写正文', icon: 'none' })
    return
  }

  const res = await wx.cloud.callFunction({
    name: 'game-service',
    data: {
      action: 'submitWiki',
      data: {
        title: form.value.title,
        summary: form.value.summary,
        content: form.value.content,
        images: form.value.images,
        tags: parseTags()
      }
    }
  })
  if (res?.result?.code === 0) {
    uni.showToast({ title: '提交成功，待审核', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 600)
  } else {
    uni.showToast({ title: res?.result?.message || '提交失败', icon: 'none' })
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background:#f5f6f8; }
.scroll { height: 100vh; }
.card { margin:20rpx; background:#fff; border-radius:14rpx; padding:16rpx; }
.title { font-size:30rpx; font-weight:700; }
.sub { margin-top:6rpx; color:#6b7280; font-size:22rpx; }
.input,.textarea { margin-top:10rpx; width:100%; background:#f8fafc; border-radius:10rpx; padding:12rpx; box-sizing:border-box; font-size:24rpx; }
.textarea { min-height:180rpx; }
.count { margin-top:6rpx; text-align:right; font-size:20rpx; color:#9ca3af; }
.img-head { margin-top:12rpx; display:flex; justify-content:space-between; align-items:center; }
.label { color:#374151; font-size:24rpx; }
.img-btn { min-width:120rpx; height:56rpx; border-radius:8rpx; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22rpx; padding:0 10rpx; }
.img-list { margin-top:10rpx; display:flex; flex-wrap:wrap; gap:12rpx; }
.img-item { width:160rpx; }
.img { width:160rpx; height:160rpx; border-radius:10rpx; background:#f1f5f9; }
.img-del { margin-top:6rpx; height:44rpx; border-radius:8rpx; background:#ef4444; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22rpx; }
.btn { margin-top:14rpx; height:68rpx; border-radius:10rpx; background:#07c160; color:#fff; display:flex; align-items:center; justify-content:center; font-size:24rpx; }
</style>
