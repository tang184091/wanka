<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="header-card">
        <view>
          <view class="title">桌游工具</view>
          <view class="sub">为线下桌游场景准备的快捷辅助工具</view>
        </view>
      </view>

      <view class="grid">
        <view class="item" @tap="goWarRoom">
          <image class="cover" :src="toolCoverUrls.warroom || defaultCover" mode="aspectFill" />
          <view class="info">
            <text class="name">War Room 战斗结算</text>
            <text class="desc">单次骰掷 + 概率模拟</text>
          </view>
          <view v-if="isAdmin" class="ops">
            <view class="upload-btn" @tap.stop="uploadCover('warroom')">上传封面</view>
          </view>
        </view>

        <view class="item" @tap="goTurnScore">
          <image class="cover" :src="toolCoverUrls.turnscore || defaultCover" mode="aspectFill" />
          <view class="info">
            <text class="name">桌游先后手及计分</text>
            <text class="desc">随机顺位 + 实时加减分 + 历史记录</text>
          </view>
          <view v-if="isAdmin" class="ops">
            <view class="upload-btn" @tap.stop="uploadCover('turnscore')">上传封面</view>
          </view>
        </view>

        <view class="item" @tap="goDice">
          <image class="cover" :src="toolCoverUrls.dice || defaultCover" mode="aspectFill" />
          <view class="info">
            <text class="name">骰子工具</text>
            <text class="desc">自定义骰子库存 + 骰盘投掷</text>
          </view>
          <view v-if="isAdmin" class="ops">
            <view class="upload-btn" @tap.stop="uploadCover('dice')">上传封面</view>
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
const defaultCover = '/static/empty.png'
const toolCovers = ref({})
const toolCoverUrls = ref({})

const resolveCoverUrls = async () => {
  const map = toolCovers.value || {}
  const keys = Object.keys(map)
  const cloudIds = keys.map((k) => String(map[k]?.fileId || '')).filter((v) => v.startsWith('cloud://'))
  if (!cloudIds.length) {
    toolCoverUrls.value = {}
    return
  }

  const unique = [...new Set(cloudIds)]
  const idToUrl = {}
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50)
    const res = await wx.cloud.getTempFileURL({ fileList: chunk })
    ;(res.fileList || []).forEach((it) => {
      if (it?.fileID && it?.tempFileURL) idToUrl[it.fileID] = it.tempFileURL
    })
  }

  const next = {}
  keys.forEach((k) => {
    const fid = String(map[k]?.fileId || '')
    next[k] = idToUrl[fid] || ''
  })
  toolCoverUrls.value = next
}

const loadData = async () => {
  const meRes = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!(meRes?.result?.code === 0 && meRes?.result?.data?.isAdmin)

  const coverRes = await wx.cloud.callFunction({
    name: 'game-service',
    data: { action: 'getBoardgameToolCovers', data: {} }
  })
  if (coverRes?.result?.code === 0) {
    toolCovers.value = coverRes.result.data?.covers || {}
    await resolveCoverUrls()
  } else {
    toolCovers.value = {}
    toolCoverUrls.value = {}
  }
}

const uploadCover = (toolKey) => {
  if (!isAdmin.value) return
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const path = (res.tempFilePaths || [])[0]
      if (!path) return
      try {
        uni.showLoading({ title: '上传中...', mask: true })
        const ext = (path.split('.').pop() || 'jpg').toLowerCase()
        const cloudPath = `tool-covers/${toolKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
        const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: path })
        const fileId = String(uploadRes?.fileID || '')
        if (!fileId) throw new Error('上传失败')

        const saveRes = await wx.cloud.callFunction({
          name: 'game-service',
          data: { action: 'setBoardgameToolCover', data: { toolKey, coverFileId: fileId } }
        })
        if (saveRes?.result?.code === 0) {
          uni.showToast({ title: '封面已更新', icon: 'success' })
          await loadData()
        } else {
          uni.showToast({ title: saveRes?.result?.message || '保存失败', icon: 'none' })
        }
      } catch (error) {
        console.error('uploadCover failed:', error)
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const goWarRoom = () => {
  uni.navigateTo({ url: '/pages/tools/warroom' })
}

const goTurnScore = () => {
  uni.navigateTo({ url: '/pages/tools/turnscore' })
}

const goDice = () => {
  uni.navigateTo({ url: '/pages/tools/dice' })
}

onShow(loadData)
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6f8; }
.scroll { height: 100vh; }
.header-card { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 20rpx; }
.title { font-size: 30rpx; font-weight: 700; color: #111827; }
.sub { margin-top: 6rpx; font-size: 22rpx; color: #6b7280; }

.grid { margin: 20rpx; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; }
.item { background: #fff; border-radius: 12rpx; overflow: hidden; display: flex; flex-direction: column; }
.cover { width: 100%; height: 220rpx; background: #e5e7eb; }
.info { padding: 12rpx; display: flex; flex-direction: column; gap: 6rpx; min-height: 108rpx; box-sizing: border-box; }
.name { font-size: 24rpx; font-weight: 700; color: #111827; }
.desc { font-size: 22rpx; color: #6b7280; }
.ops { padding: 0 12rpx 12rpx; margin-top: auto; }
.upload-btn { width: 100%; height: 52rpx; border-radius: 8rpx; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22rpx; }
</style>
