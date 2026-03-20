<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">用户昵称头像管理</view>
        <view class="sub">管理员可搜索用户并修改昵称、头像</view>
      </view>

      <view v-if="!isAdmin" class="empty">仅管理员可访问</view>
      <view v-else>
        <view class="card">
          <view class="search-row">
            <input
              v-model="keyword"
              class="input"
              placeholder="输入昵称关键词"
              @confirm="searchUsers"
            />
            <view class="search-btn" @tap="searchUsers">搜索</view>
          </view>

          <view v-if="resultList.length === 0" class="empty">暂无匹配用户</view>
          <view v-for="item in resultList" :key="item.id" class="user-row" @tap="pickUser(item)">
            <image :src="item.avatar || defaultAvatar" class="avatar" mode="aspectFill" />
            <view class="user-info">
              <text class="name">{{ item.nickname || '未命名用户' }}</text>
              <text class="id">ID: {{ item.id }}</text>
            </view>
            <view class="pick">{{ selectedUser && selectedUser.id === item.id ? '已选中' : '选择' }}</view>
          </view>
        </view>

        <view class="card" v-if="selectedUser">
          <view class="title-sm">编辑用户信息</view>
          <view class="current">
            <image :src="editAvatar || selectedUser.avatar || defaultAvatar" class="avatar large" mode="aspectFill" />
            <view class="pick upload" @tap="chooseAvatar">上传头像</view>
          </view>
          <input class="input" v-model="editNickname" placeholder="输入新昵称" />

          <view class="tag-title">自定义标签</view>
          <view class="tag-row" v-for="(tag, index) in customTags" :key="`${tag.id}-${index}`">
            <input v-model="customTags[index].name" class="input tag-input" maxlength="12" placeholder="输入标签（最多12字）" />
            <view class="tag-del" @tap="removeCustomTag(index)">删除</view>
          </view>
          <view class="tag-add" @tap="addCustomTag">+ 添加自定义标签</view>

          <view class="actions">
            <view class="btn primary" @tap="submit">保存修改</view>
            <view class="btn ghost" @tap="resetEdit">重置</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const defaultAvatar = 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png'
const isAdmin = ref(false)
const keyword = ref('')
const resultList = ref([])
const selectedUser = ref(null)
const editNickname = ref('')
const editAvatar = ref('')
const editAvatarSize = ref(0)
const allTags = ref([])
const customTags = ref([])
const systemTagIds = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])

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

const searchUsers = async () => {
  const key = keyword.value.trim()
  if (!key) {
    uni.showToast({ title: '请输入关键词', icon: 'none' })
    return
  }
  const res = await wx.cloud.callFunction({
    name: 'user-service',
    data: { action: 'searchUsers', data: { keyword: key } }
  })
  if (res?.result?.code === 0) {
    resultList.value = res.result.data.list || []
  } else {
    uni.showToast({ title: res?.result?.message || '搜索失败', icon: 'none' })
  }
}

const pickUser = async (item) => {
  selectedUser.value = item
  editAvatarSize.value = 0
  const res = await wx.cloud.callFunction({
    name: 'user-service',
    data: { action: 'getUserInfo', data: { userId: item.id } }
  })
  if (res?.result?.code !== 0) {
    uni.showToast({ title: res?.result?.message || '加载用户失败', icon: 'none' })
    return
  }
  const detail = res.result.data || {}
  selectedUser.value = {
    id: detail.id || item.id,
    nickname: detail.nickname || item.nickname || '',
    avatar: detail.avatar || item.avatar || ''
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
}

const resetEdit = () => {
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
}

const addCustomTag = () => {
  if (customTags.value.length >= 8) {
    uni.showToast({ title: '最多 8 个自定义标签', icon: 'none' })
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
        uni.showToast({ title: '头像上传成功', icon: 'success' })
      } catch (error) {
        console.error('upload avatar failed', error)
        uni.showToast({ title: '头像上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
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

  if (Object.keys(payload).length === 1) {
    payload._noProfileChange = true
  }

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
    uni.showToast({ title: '没有改动', icon: 'none' })
    return
  }

  try {
    if (hasProfileChange) {
      const resProfile = await wx.cloud.callFunction({
        name: 'user-service',
        data: { action: 'adminUpdateUserProfile', data: payload }
      })
      if (resProfile?.result?.code !== 0) {
        uni.showToast({ title: resProfile?.result?.message || '资料修改失败', icon: 'none' })
        return
      }
      const updated = resProfile.result.data
      selectedUser.value = {
        id: updated.id,
        nickname: updated.nickname,
        avatar: updated.avatar
      }
      editNickname.value = updated.nickname || ''
      editAvatar.value = updated.avatar || ''
      resultList.value = resultList.value.map((item) => (
        item.id === updated.id
          ? { ...item, nickname: updated.nickname, avatar: updated.avatar }
          : item
      ))
    }

    if (hasTagChange) {
      const resTags = await wx.cloud.callFunction({
        name: 'user-service',
        data: {
          action: 'adminUpdateUserTags',
          data: { userId: selectedUser.value.id, tags: mergedTags }
        }
      })
      if (resTags?.result?.code !== 0) {
        uni.showToast({ title: resTags?.result?.message || '标签修改失败', icon: 'none' })
        return
      }
      allTags.value = mergedTags
      customTags.value = normalizedCustomTags
    }
    uni.showToast({ title: '修改成功', icon: 'success' })
  } catch (error) {
    console.error('admin update user failed', error)
    uni.showToast({ title: '修改失败', icon: 'none' })
  }
}

onShow(async () => {
  await checkAdmin()
})
</script>

<style scoped>
.page { min-height: 100vh; background:#f5f6f8; }
.scroll { height: 100vh; }
.card { margin:20rpx; background:#fff; border-radius:14rpx; padding:16rpx; }
.title { font-size:30rpx; font-weight:700; }
.sub { margin-top:6rpx; color:#6b7280; font-size:22rpx; }
.title-sm { font-size:26rpx; font-weight:700; margin-bottom:10rpx; }
.search-row { display:flex; gap:10rpx; }
.input { flex:1; height:68rpx; border-radius:10rpx; background:#f8fafc; padding:0 14rpx; box-sizing:border-box; font-size:24rpx; }
.search-btn { width:120rpx; height:68rpx; border-radius:10rpx; background:#07c160; color:#fff; display:flex; align-items:center; justify-content:center; font-size:24rpx; }
.empty { color:#9ca3af; font-size:24rpx; margin-top:12rpx; }
.user-row { margin-top:12rpx; border:1rpx solid #e5e7eb; border-radius:10rpx; padding:12rpx; display:flex; align-items:center; gap:12rpx; }
.avatar { width:68rpx; height:68rpx; border-radius:50%; background:#f1f5f9; }
.avatar.large { width:96rpx; height:96rpx; }
.user-info { flex:1; min-width:0; }
.name { display:block; font-size:24rpx; color:#111827; font-weight:700; }
.id { display:block; margin-top:6rpx; font-size:20rpx; color:#9ca3af; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pick { min-width:92rpx; height:52rpx; border-radius:8rpx; background:#2563eb; color:#fff; font-size:22rpx; display:flex; align-items:center; justify-content:center; }
.pick.upload { background:#f59e0b; }
.current { display:flex; align-items:center; justify-content:space-between; margin-bottom:10rpx; }
.tag-title { margin-top:12rpx; font-size:24rpx; color:#374151; font-weight:600; }
.tag-row { margin-top:10rpx; display:flex; align-items:center; gap:10rpx; }
.tag-input { flex:1; }
.tag-del { width:86rpx; height:56rpx; border-radius:8rpx; background:#ef4444; color:#fff; font-size:22rpx; display:flex; align-items:center; justify-content:center; }
.tag-add { margin-top:10rpx; height:56rpx; border-radius:8rpx; background:#eff6ff; color:#1d4ed8; font-size:23rpx; display:flex; align-items:center; justify-content:center; }
.actions { margin-top:14rpx; display:flex; gap:12rpx; }
.btn { flex:1; height:68rpx; border-radius:10rpx; display:flex; align-items:center; justify-content:center; font-size:24rpx; }
.btn.primary { background:#07c160; color:#fff; }
.btn.ghost { background:#eef2ff; color:#4338ca; }
</style>
