<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">用户信息编辑</view>
        <view class="sub">可修改头像、昵称与自定义标签，并设置黑名单/管理员</view>
      </view>

      <view v-if="!isAdmin" class="empty">仅管理员可访问</view>
      <view v-else-if="!selectedUser" class="empty">未找到用户或参数无效</view>
      <view v-else class="card">
        <view class="state-row">
          <text class="state-item" :class="{ on: selectedUser.isAdmin }">管理员：{{ selectedUser.isAdmin ? '是' : '否' }}</text>
          <text class="state-item danger" :class="{ on: selectedUser.isBlacklisted }">黑名单：{{ selectedUser.isBlacklisted ? '是' : '否' }}</text>
        </view>

        <view class="current">
          <image :src="displayAvatar" class="avatar large" mode="aspectFill" />
          <view class="pick upload" @tap="chooseAvatar">上传头像</view>
        </view>
        <input class="input" v-model="editNickname" placeholder="请输入昵称" />

        <view class="tag-title">自定义标签</view>
        <view class="tag-row" v-for="(tag, index) in customTags" :key="`${tag.id}-${index}`">
          <input v-model="customTags[index].name" class="input tag-input" maxlength="12" placeholder="标签名（最多12字）" />
          <view class="tag-del" @tap="removeCustomTag(index)">删除</view>
        </view>
        <view class="tag-add" @tap="addCustomTag">+ 添加自定义标签</view>

        <view class="admin-actions">
          <view class="btn warning" @tap="toggleBlacklist">{{ selectedUser.isBlacklisted ? '移出黑名单' : '加入黑名单' }}</view>
          <view class="btn royal" @tap="toggleAdmin">{{ selectedUser.isAdmin ? '取消管理员' : '加冕管理员' }}</view>
        </view>

        <view class="actions">
          <view class="btn primary" @tap="submit">保存</view>
          <view class="btn ghost" @tap="resetEdit">重置</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const defaultAvatar = 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png'
const localFallbackAvatar = '/static/empty.png'
const isAdmin = ref(false)
const selectedUser = ref(null)
const editNickname = ref('')
const editAvatar = ref('')
const editAvatarSize = ref(0)
const allTags = ref([])
const customTags = ref([])
const displayAvatar = ref(localFallbackAvatar)
const systemTagIds = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])

const isCloudFileId = (value) => typeof value === 'string' && value.startsWith('cloud://')
const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//.test(value)

const resolveCloudImageUrl = async (rawUrl) => {
  const url = String(rawUrl || '').trim()
  if (!url) return localFallbackAvatar
  if (isHttpUrl(url) || url.startsWith('/')) return url
  if (!isCloudFileId(url)) return localFallbackAvatar
  try {
    const res = await wx.cloud.getTempFileURL({ fileList: [url] })
    const first = (res?.fileList || [])[0]
    if (first?.status === 0 && first?.tempFileURL) return first.tempFileURL
    return localFallbackAvatar
  } catch (error) {
    console.warn('resolveCloudImageUrl failed:', error)
    return localFallbackAvatar
  }
}

const refreshDisplayAvatar = async () => {
  const source = editAvatar.value || selectedUser.value?.avatar || defaultAvatar
  displayAvatar.value = await resolveCloudImageUrl(source)
}

const checkAdmin = async () => {
  const me = await wx.cloud.callFunction({ name: 'user-service', data: { action: 'getMe', data: {} } })
  isAdmin.value = !!me?.result?.data?.isAdmin
  if (!isAdmin.value) {
    uni.showToast({ title: '仅管理员可访问', icon: 'none' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/user/user' })
    }, 300)
  }
}

const loadUser = async (userId) => {
  const res = await wx.cloud.callFunction({
    name: 'user-service',
    data: { action: 'getUserInfo', data: { userId } }
  })
  if (res?.result?.code !== 0) {
    uni.showToast({ title: res?.result?.message || '加载用户失败', icon: 'none' })
    return
  }

  const detail = res.result.data || {}
  selectedUser.value = {
    id: detail.id || userId,
    nickname: detail.nickname || '',
    avatar: detail.avatar || '',
    isAdmin: !!detail.isAdmin,
    isBlacklisted: !!detail.isBlacklisted
  }
  editNickname.value = detail.nickname || ''
  editAvatar.value = detail.avatar || ''
  allTags.value = detail.tags || []
  customTags.value = allTags.value
    .filter((tag) => !systemTagIds.has(Number(tag.id)))
    .map((tag, idx) => ({
      id: tag.id || (10000 + idx),
      name: String(tag.name || '').trim()
    }))
  await refreshDisplayAvatar()
}

const resetEdit = async () => {
  if (!selectedUser.value) return
  editNickname.value = selectedUser.value.nickname || ''
  editAvatar.value = selectedUser.value.avatar || ''
  editAvatarSize.value = 0
  customTags.value = allTags.value
    .filter((tag) => !systemTagIds.has(Number(tag.id)))
    .map((tag, idx) => ({
      id: tag.id || (10000 + idx),
      name: String(tag.name || '').trim()
    }))
  await refreshDisplayAvatar()
}

const addCustomTag = () => {
  if (customTags.value.length >= 8) {
    uni.showToast({ title: '最多8个自定义标签', icon: 'none' })
    return
  }
  customTags.value.push({ id: 10000 + Date.now() + customTags.value.length, name: '' })
}

const removeCustomTag = (index) => {
  customTags.value.splice(index, 1)
}

const uploadAvatar = async (path) => {
  const ext = (path.split('.').pop() || 'jpg').toLowerCase()
  const cloudPath = `admin-avatar/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const res = await wx.cloud.uploadFile({ cloudPath, filePath: path })
  return res.fileID
}

const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: async (res) => {
      const filePath = (res.tempFilePaths || [])[0]
      const fileInfo = (res.tempFiles || [])[0]
      if (!filePath) return
      try {
        uni.showLoading({ title: '上传中...', mask: true })
        const fileID = await uploadAvatar(filePath)
        editAvatar.value = fileID
        editAvatarSize.value = Number(fileInfo?.size || 0)
        await refreshDisplayAvatar()
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (error) {
        console.error('upload avatar failed', error)
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const toggleBlacklist = async () => {
  if (!selectedUser.value?.id) return
  const nextStatus = !selectedUser.value.isBlacklisted
  const res = await wx.cloud.callFunction({
    name: 'user-service',
    data: {
      action: 'adminSetUserBlacklist',
      data: { userId: selectedUser.value.id, isBlacklisted: nextStatus }
    }
  })
  if (res?.result?.code !== 0) {
    uni.showToast({ title: res?.result?.message || '操作失败', icon: 'none' })
    return
  }
  selectedUser.value.isBlacklisted = nextStatus
  uni.showToast({ title: nextStatus ? '已加入黑名单' : '已移出黑名单', icon: 'success' })
}

const toggleAdmin = async () => {
  if (!selectedUser.value?.id) return
  const nextStatus = !selectedUser.value.isAdmin
  const res = await wx.cloud.callFunction({
    name: 'user-service',
    data: {
      action: 'adminSetUserAdmin',
      data: { userId: selectedUser.value.id, isAdmin: nextStatus }
    }
  })
  if (res?.result?.code !== 0) {
    uni.showToast({ title: res?.result?.message || '操作失败', icon: 'none' })
    return
  }
  selectedUser.value.isAdmin = nextStatus
  uni.showToast({ title: nextStatus ? '已加冕管理员' : '已取消管理员', icon: 'success' })
}

const submit = async () => {
  if (!selectedUser.value?.id) return

  const payload = { userId: selectedUser.value.id }
  const nickname = editNickname.value.trim()
  if (nickname && nickname !== (selectedUser.value.nickname || '')) payload.nickname = nickname
  if (editAvatar.value && editAvatar.value !== (selectedUser.value.avatar || '')) {
    payload.avatarUrl = editAvatar.value
    payload.avatarSize = editAvatarSize.value
  }
  if (Object.keys(payload).length === 1) payload._noProfileChange = true

  const normalizedCustomTags = customTags.value
    .map((tag, idx) => ({
      id: tag.id || (10000 + idx),
      name: String(tag.name || '').trim().slice(0, 12)
    }))
    .filter((tag) => !!tag.name)
  const systemTags = allTags.value.filter((tag) => systemTagIds.has(Number(tag.id)))
  const mergedTags = [...systemTags, ...normalizedCustomTags]

  const hasTagChange = JSON.stringify(mergedTags) !== JSON.stringify(allTags.value || [])
  const hasProfileChange = !payload._noProfileChange
  if (!hasTagChange && !hasProfileChange) {
    uni.showToast({ title: '没有可保存的改动', icon: 'none' })
    return
  }

  try {
    if (hasProfileChange) {
      const resProfile = await wx.cloud.callFunction({
        name: 'user-service',
        data: { action: 'adminUpdateUserProfile', data: payload }
      })
      if (resProfile?.result?.code !== 0) {
        uni.showToast({ title: resProfile?.result?.message || '用户信息保存失败', icon: 'none' })
        return
      }
      const updated = resProfile.result.data
      selectedUser.value = {
        ...selectedUser.value,
        id: updated.id,
        nickname: updated.nickname,
        avatar: updated.avatar,
        isAdmin: !!updated.isAdmin,
        isBlacklisted: !!updated.isBlacklisted
      }
      editNickname.value = updated.nickname || ''
      editAvatar.value = updated.avatar || ''
      await refreshDisplayAvatar()
    }

    if (hasTagChange) {
      const resTags = await wx.cloud.callFunction({
        name: 'user-service',
        data: { action: 'adminUpdateUserTags', data: { userId: selectedUser.value.id, tags: mergedTags } }
      })
      if (resTags?.result?.code !== 0) {
        uni.showToast({ title: resTags?.result?.message || '标签保存失败', icon: 'none' })
        return
      }
      allTags.value = mergedTags
      customTags.value = normalizedCustomTags
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    console.error('admin update user failed', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

onLoad(async (query) => {
  await checkAdmin()
  if (!isAdmin.value) return
  const userId = String(query?.userId || '').trim()
  if (!userId) {
    uni.showToast({ title: '缺少用户ID', icon: 'none' })
    return
  }
  await loadUser(userId)
})
</script>

<style scoped>
.page { min-height: 100vh; background:#f5f6f8; }
.scroll { height: 100vh; }
.card { margin:20rpx; background:#fff; border-radius:14rpx; padding:16rpx; }
.title { font-size:30rpx; font-weight:700; }
.sub { margin-top:6rpx; color:#6b7280; font-size:22rpx; }
.empty { color:#9ca3af; font-size:24rpx; margin:20rpx; }
.input { width:100%; height:68rpx; border-radius:10rpx; background:#f8fafc; padding:0 14rpx; box-sizing:border-box; font-size:24rpx; margin-top:10rpx; }
.avatar { width:68rpx; height:68rpx; border-radius:50%; background:#f1f5f9; }
.avatar.large { width:96rpx; height:96rpx; }
.pick { min-width:92rpx; height:52rpx; border-radius:8rpx; background:#2563eb; color:#fff; font-size:22rpx; display:flex; align-items:center; justify-content:center; }
.pick.upload { background:#f59e0b; }
.current { display:flex; align-items:center; justify-content:space-between; margin-bottom:10rpx; }
.state-row { display:flex; gap:12rpx; margin-bottom:12rpx; }
.state-item { font-size:22rpx; color:#6b7280; padding:6rpx 12rpx; border-radius:999rpx; background:#f3f4f6; }
.state-item.on { color:#1d4ed8; background:#eff6ff; }
.state-item.danger.on { color:#b91c1c; background:#fef2f2; }
.tag-title { margin-top:12rpx; font-size:24rpx; color:#374151; font-weight:600; }
.tag-row { margin-top:10rpx; display:flex; align-items:center; gap:10rpx; }
.tag-input { flex:1; }
.tag-del { width:86rpx; height:56rpx; border-radius:8rpx; background:#ef4444; color:#fff; font-size:22rpx; display:flex; align-items:center; justify-content:center; }
.tag-add { margin-top:10rpx; height:56rpx; border-radius:8rpx; background:#eff6ff; color:#1d4ed8; font-size:23rpx; display:flex; align-items:center; justify-content:center; }
.admin-actions { margin-top:12rpx; display:flex; gap:12rpx; }
.actions { margin-top:12rpx; display:flex; gap:12rpx; }
.btn { flex:1; height:68rpx; border-radius:10rpx; display:flex; align-items:center; justify-content:center; font-size:24rpx; }
.btn.primary { background:#07c160; color:#fff; }
.btn.ghost { background:#eef2ff; color:#4338ca; }
.btn.warning { background:#f97316; color:#fff; }
.btn.royal { background:#2563eb; color:#fff; }
</style>
