<template>
  <view class="page">
    <scroll-view scroll-y class="scroll">
      <view class="card">
        <view class="title">用户管理</view>
        <view class="sub">用户列表按创建时间分页，每页10条</view>
      </view>

      <view v-if="!isAdmin" class="empty">仅管理员可访问</view>
      <view v-else>
        <view class="card">
          <view class="search-row">
            <input
              v-model="keyword"
              class="input"
              placeholder="搜索昵称"
              @confirm="searchUsers"
            />
            <view class="search-btn" @tap="searchUsers">搜索</view>
          </view>

          <view v-if="resultList.length === 0" class="empty">暂无匹配用户</view>
          <view
            v-for="item in resultList"
            :key="`search-${item.id}`"
            class="user-row"
            @tap="goToEdit(item.id)"
          >
            <view class="user-info">
              <text class="name">{{ item.nickname || '未命名用户' }}</text>
              <text class="id">ID: {{ item.id }}</text>
              <view class="tags-line">
                <text v-if="item.isAdmin" class="role-tag">管理员</text>
                <text v-if="item.isBlacklisted" class="black-tag">黑名单</text>
              </view>
            </view>
            <view class="pick">编辑</view>
          </view>
        </view>

        <view class="card">
          <view class="row-head">
            <view class="title-sm">全部用户（按创建时间）</view>
            <view class="search-btn small" @tap="refreshAllUsers">刷新</view>
          </view>

          <view v-if="allUsers.length === 0" class="empty">{{ loadingAllUsers ? '加载中...' : '暂无用户' }}</view>
          <view
            v-for="item in allUsers"
            :key="`all-${item.id}`"
            class="user-row"
            @tap="goToEdit(item.id)"
          >
            <view class="user-info">
              <text class="name">{{ item.nickname || '未命名用户' }}</text>
              <text class="id">ID: {{ item.id }}</text>
              <view class="tags-line">
                <text v-if="item.isAdmin" class="role-tag">管理员</text>
                <text v-if="item.isBlacklisted" class="black-tag">黑名单</text>
              </view>
            </view>
            <view class="pick">编辑</view>
          </view>

          <view v-if="hasMoreAllUsers" class="more-wrap">
            <view class="more-btn" @tap="loadMoreAllUsers">{{ loadingAllUsers ? '加载中...' : '加载更多' }}</view>
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
const keyword = ref('')
const resultList = ref([])
const allUsers = ref([])
const allUsersPage = ref(1)
const allUsersPageSize = ref(10)
const hasMoreAllUsers = ref(true)
const loadingAllUsers = ref(false)

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

const loadAllUsers = async (append = false) => {
  if (!isAdmin.value || loadingAllUsers.value) return
  loadingAllUsers.value = true
  try {
    const page = append ? allUsersPage.value + 1 : 1
    const res = await wx.cloud.callFunction({
      name: 'user-service',
      data: {
        action: 'adminListUsers',
        data: { page, pageSize: allUsersPageSize.value }
      }
    })
    if (res?.result?.code === 0) {
      const list = res.result?.data?.list || []
      allUsers.value = append ? [...allUsers.value, ...list] : list
      allUsersPage.value = page
      hasMoreAllUsers.value = !!res.result?.data?.hasMore
    } else {
      uni.showToast({ title: res?.result?.message || '加载用户失败', icon: 'none' })
    }
  } catch (error) {
    console.error('load all users failed', error)
    uni.showToast({ title: '加载用户失败', icon: 'none' })
  } finally {
    loadingAllUsers.value = false
  }
}

const refreshAllUsers = async () => {
  allUsersPage.value = 1
  hasMoreAllUsers.value = true
  await loadAllUsers(false)
}

const loadMoreAllUsers = async () => {
  if (!hasMoreAllUsers.value) return
  await loadAllUsers(true)
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

const goToEdit = (userId) => {
  if (!userId) return
  uni.navigateTo({ url: `/pages/user/profile?userId=${userId}&adminEdit=1` })
}

onShow(async () => {
  await checkAdmin()
  if (isAdmin.value) {
    await refreshAllUsers()
  }
})
</script>

<style scoped>
.page { min-height: 100vh; background:#f5f6f8; }
.scroll { height: 100vh; }
.card { margin:20rpx; background:#fff; border-radius:14rpx; padding:16rpx; }
.title { font-size:30rpx; font-weight:700; }
.sub { margin-top:6rpx; color:#6b7280; font-size:22rpx; }
.title-sm { font-size:26rpx; font-weight:700; margin-bottom:10rpx; }
.row-head { display:flex; align-items:center; justify-content:space-between; gap:12rpx; }
.search-row { display:flex; gap:10rpx; }
.input { flex:1; height:68rpx; border-radius:10rpx; background:#f8fafc; padding:0 14rpx; box-sizing:border-box; font-size:24rpx; }
.search-btn { width:120rpx; height:68rpx; border-radius:10rpx; background:#07c160; color:#fff; display:flex; align-items:center; justify-content:center; font-size:24rpx; }
.search-btn.small { width:100rpx; height:56rpx; font-size:22rpx; }
.empty { color:#9ca3af; font-size:24rpx; margin-top:12rpx; }
.user-row { margin-top:12rpx; border:1rpx solid #e5e7eb; border-radius:10rpx; padding:12rpx; display:flex; align-items:center; }
.user-info { flex:1; min-width:0; }
.name { display:block; font-size:24rpx; color:#111827; font-weight:700; }
.id { display:block; margin-top:6rpx; font-size:20rpx; color:#9ca3af; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tags-line { margin-top:8rpx; display:flex; gap:8rpx; }
.role-tag { display:inline-flex; align-items:center; justify-content:center; height:34rpx; padding:0 10rpx; border-radius:999rpx; background:#eff6ff; color:#1d4ed8; font-size:20rpx; }
.black-tag { display:inline-flex; align-items:center; justify-content:center; height:34rpx; padding:0 10rpx; border-radius:999rpx; background:#fef2f2; color:#dc2626; font-size:20rpx; }
.pick { min-width:92rpx; height:52rpx; border-radius:8rpx; background:#2563eb; color:#fff; font-size:22rpx; display:flex; align-items:center; justify-content:center; }
.more-wrap { margin-top:12rpx; display:flex; justify-content:center; }
.more-btn { min-width:180rpx; height:56rpx; padding:0 18rpx; border-radius:8rpx; background:#eff6ff; color:#1d4ed8; font-size:23rpx; display:flex; align-items:center; justify-content:center; }
</style>
