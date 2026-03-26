<template>
  <view class="profile-container">
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <scroll-view v-else class="profile-scroll" scroll-y>
      <view class="user-header card">
        <view class="avatar-section">
          <image :src="displayAvatar || userInfo.avatar || constants.DEFAULT_AVATAR" class="user-avatar" mode="aspectFill" />
          <view class="user-basic">
            <text class="user-nickname">{{ userInfo.nickname || '未知用户' }}</text>
            <view v-if="userInfo.gender" class="user-gender">
              <text class="gender-text">{{ userInfo.gender === 1 ? '男' : '女' }}</text>
            </view>
          </view>
        </view>

        <view class="profile-section">
          <view class="profile-section-header">
            <text class="profile-section-title">个人标签</text>
          </view>
          <view v-if="userInfo.tags && userInfo.tags.length > 0" class="user-tags">
            <view v-for="(tag, index) in userInfo.tags" :key="index" class="user-tag">
              {{ getTagDisplay(tag) }}
            </view>
          </view>
          <view v-else class="empty-section-text">暂无标签</view>
        </view>

        <view class="user-equipments">
          <view class="profile-section-header">
            <text class="profile-section-title">个人设备游戏</text>
          </view>
          <view v-if="userInfo.games && userInfo.games.length > 0" class="equip-list">
            <view v-for="(game, index) in userInfo.games" :key="index" class="equip-item">
              <text class="equip-type">{{ getEquipmentTypeText(game.type) }}</text>
              <text class="equip-name">{{ game.name || '未命名' }}</text>
            </view>
          </view>
          <view v-else class="empty-section-text">暂无设备游戏</view>
        </view>
      </view>

      <view v-if="editable" class="admin-edit card">
        <view class="section-title">管理员编辑</view>
        <view class="sub-title">可直接修改该用户头像、昵称、标签与设备</view>

        <view class="current-row">
          <image :src="editDisplayAvatar || displayAvatar || constants.DEFAULT_AVATAR" class="edit-avatar" mode="aspectFill" />
          <view class="pick upload" @tap="chooseAvatar">上传头像</view>
        </view>

        <input v-model="editNickname" class="input" placeholder="请输入昵称" maxlength="32" />

        <view class="edit-block">
          <view class="block-title">标签管理</view>
          <view v-if="editTags.length === 0" class="empty-section-text">暂无标签</view>
          <view v-for="(tag, index) in editTags" :key="`tag-${index}`" class="edit-row">
            <input v-model="editTags[index].name" class="input row-input" maxlength="12" placeholder="标签名称（最多12字）" />
            <view class="del-btn" @tap="removeTag(index)">删除</view>
          </view>
          <view class="add-btn" @tap="addTag">+ 添加标签</view>
        </view>

        <view class="edit-block">
          <view class="block-title">设备管理</view>
          <view v-if="editGames.length === 0" class="empty-section-text">暂无设备</view>
          <view v-for="(game, index) in editGames" :key="`game-${index}`" class="edit-game">
            <picker class="game-type-picker" :range="gameTypeOptions" range-key="label" :value="getGameTypeIndex(game.type)" @change="onGameTypeChange($event, index)">
              <view class="picker-text">{{ getEquipmentTypeText(game.type) }}</view>
            </picker>
            <input v-model="editGames[index].name" class="input row-input" maxlength="24" placeholder="设备名称（最多24字）" />
            <view class="del-btn" @tap="removeGame(index)">删除</view>
          </view>
          <view class="add-btn" @tap="addGame">+ 添加设备</view>
        </view>

        <view class="actions">
          <view class="btn primary" @tap="saveAllAdminChanges">保存全部修改</view>
        </view>

        <view class="admin-actions">
          <view class="btn warning" @tap="toggleBlacklist">
            {{ userInfo.isBlacklisted ? '移出黑名单' : '加入黑名单' }}
          </view>
          <view class="btn royal" @tap="toggleAdmin">
            {{ userInfo.isAdmin ? '取消管理员' : '加冕管理员' }}
          </view>
        </view>
      </view>

      <view class="stats-section card">
        <view class="section-title">统计数据</view>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-value">{{ stats.createdCount || 0 }}</text>
            <text class="stat-label">创建组局</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ stats.joinedCount || 0 }}</text>
            <text class="stat-label">参与组局</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ stats.completedCount || 0 }}</text>
            <text class="stat-label">完成组局</text>
          </view>
        </view>
      </view>

      <view class="games-section card">
        <view class="section-title">个人荣誉</view>
        <view v-if="userHonors.length === 0" class="empty-section-text">暂无荣誉</view>
        <view v-else class="honor-list">
          <view v-for="honor in userHonors" :key="honor._id || honor.id" class="honor-item">
            <view class="honor-head">
              <view class="honor-rarity" :class="`honor-${normalizeHonorRarity(honor.rarity)}`">
                {{ getHonorRarityText(honor.rarity) }}
              </view>
              <text class="honor-time">{{ formatHonorDate(honor.achievedAt) }}</text>
            </view>
            <text class="honor-title">
              {{ honor.type === 'tournament' ? `${honor.title || '店内比赛'} · 冠军:${honor.championNickname || '-'}` : `${honor.rankName || '-'} · ${honor.playerNickname || '-'}` }}
            </text>
          </view>
        </view>
      </view>

      <view v-if="createdGames.length > 0" class="games-section card">
        <view class="section-title">创建的组局</view>
        <view class="games-list">
          <view
            v-for="game in createdGames"
            :key="game.id"
            class="game-item"
            @tap="goToGameDetail(game.id)"
          >
            <view class="game-header">
              <view :class="['type-tag', getTypeClass(game.type)]">
                {{ getTypeText(game.type) }}
              </view>
              <view :class="['status-tag', getStatusClass(game.status)]">
                {{ getStatusText(game.status) }}
              </view>
            </view>
            <view class="game-title">{{ game.title || '未命名' }}</view>
            <view class="game-time">{{ formatDateTime(game.time) }}</view>
            <view class="game-info">
              <view class="info-item">
                <image :src="icons.location" class="info-icon" />
                <text class="info-text">{{ game.location || '未设置地点' }}</text>
              </view>
              <view class="info-item">
                <image :src="icons.people" class="info-icon" />
                <text class="info-text">{{ game.currentPlayers || 0 }}/{{ game.maxPlayers }}人</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="joinedGames.length > 0" class="games-section card">
        <view class="section-title">参与的组局</view>
        <view class="games-list">
          <view
            v-for="game in joinedGames"
            :key="game.id"
            class="game-item"
            @tap="goToGameDetail(game.id)"
          >
            <view class="game-header">
              <view :class="['type-tag', getTypeClass(game.type)]">
                {{ getTypeText(game.type) }}
              </view>
              <view class="creator-info">
                <image :src="game.creatorInfo?.displayAvatar || game.creatorInfo?.avatar || constants.DEFAULT_AVATAR" class="creator-avatar" />
                <text class="creator-name">{{ game.creatorInfo?.nickname || '未知用户' }}</text>
              </view>
            </view>
            <view class="game-title">{{ game.title || '未命名' }}</view>
            <view class="game-time">{{ formatDateTime(game.time) }}</view>
            <view class="game-info">
              <view class="info-item">
                <image :src="icons.location" class="info-icon" />
                <text class="info-text">{{ game.location || '未设置地点' }}</text>
              </view>
              <view class="info-item">
                <image :src="icons.people" class="info-icon" />
                <text class="info-text">{{ game.currentPlayers || 0 }}/{{ game.maxPlayers }}人</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="safe-area"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import constants from '@/utils/constants.js'
import * as icons from '@/utils/icons.js'
import { resolveCloudFileUrl, resolveCloudFileUrls } from '@/utils/cloud-image.js'

const loading = ref(true)
const userId = ref('')
const userInfo = ref({})
const stats = ref({})
const createdGames = ref([])
const joinedGames = ref([])
const displayAvatar = ref('')
const userHonors = ref([])

const adminEditMode = ref(false)
const isAdminViewer = ref(false)
const editable = ref(false)

const editNickname = ref('')
const editAvatar = ref('')
const editAvatarSize = ref(0)
const editDisplayAvatar = ref('')
const editTags = ref([])
const editGames = ref([])

const gameTypeOptions = [
  { value: 'mahjong', label: '立直麻将' },
  { value: 'boardgame', label: '桌游' },
  { value: 'videogame', label: '电玩' },
  { value: 'deck', label: '卡组' },
  { value: 'other', label: '其他' }
]

const genId = () => String(Date.now()) + Math.random().toString(36).slice(2, 8)
const normalizeTagName = (name) => String(name || '').trim().slice(0, 12)
const normalizeGameName = (name) => String(name || '').trim().slice(0, 24)
const normalizeTags = (tags = []) => tags
  .map((tag, idx) => ({
    id: tag?.id || (10000 + idx),
    name: normalizeTagName(tag?.name)
  }))
  .filter((tag) => !!tag.name)

const normalizeGames = (games = []) => games
  .map((game) => ({
    id: game?.id || genId(),
    type: String(game?.type || 'other'),
    name: normalizeGameName(game?.name)
  }))
  .filter((game) => !!game.name)

const getGameTypeIndex = (type) => {
  const idx = gameTypeOptions.findIndex((item) => item.value === type)
  return idx >= 0 ? idx : gameTypeOptions.length - 1
}

const onGameTypeChange = (e, index) => {
  const nextType = gameTypeOptions[Number(e?.detail?.value || 0)]?.value || 'other'
  if (!editGames.value[index]) return
  editGames.value[index].type = nextType
}

const checkViewerAdmin = async () => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'user-service',
      data: { action: 'getMe', data: {} }
    })
    isAdminViewer.value = !!(res?.result?.code === 0 && res?.result?.data?.isAdmin)
  } catch (error) {
    isAdminViewer.value = false
  }
}

const loadUserProfile = async () => {
  loading.value = true
  try {
    await loadUserInfo()
    await loadUserHonors()
    await loadUserGames()
    await loadUserStats()
  } catch (error) {
    console.error('加载用户资料失败:', error)
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const loadUserInfo = async () => {
  const res = await wx.cloud.callFunction({
    name: 'user-service',
    data: {
      action: 'getUserInfo',
      data: { userId: userId.value }
    }
  })
  if (res?.result?.code !== 0) {
    throw new Error(res?.result?.message || '加载用户信息失败')
  }
  userInfo.value = res.result.data || {}
  if (!Array.isArray(userInfo.value.tags)) userInfo.value.tags = []
  if (!Array.isArray(userInfo.value.games)) userInfo.value.games = []
  displayAvatar.value = await resolveCloudFileUrl(userInfo.value.avatar)

  if (editable.value) {
    editNickname.value = userInfo.value.nickname || ''
    editAvatar.value = userInfo.value.avatar || ''
    editAvatarSize.value = 0
    editDisplayAvatar.value = displayAvatar.value || constants.DEFAULT_AVATAR
    editTags.value = normalizeTags(userInfo.value.tags)
    editGames.value = normalizeGames(userInfo.value.games)
  }
}

const loadUserGames = async () => {
  try {
    const [createdRes, joinedRes] = await Promise.all([
      wx.cloud.callFunction({
        name: 'game-service',
        data: {
          action: 'getCreatedGames',
          data: { userId: userId.value }
        }
      }),
      wx.cloud.callFunction({
        name: 'game-service',
        data: {
          action: 'getJoinedGames',
          data: { userId: userId.value }
        }
      })
    ])

    if (createdRes?.result?.code === 0) {
      createdGames.value = createdRes.result.data || []
    } else {
      createdGames.value = []
    }

    if (joinedRes?.result?.code === 0) {
      joinedGames.value = joinedRes.result.data || []
      const creatorAvatars = joinedGames.value.map((item) => item?.creatorInfo?.avatar || '')
      const resolvedAvatars = await resolveCloudFileUrls(creatorAvatars)
      joinedGames.value.forEach((item, index) => {
        if (!item.creatorInfo) item.creatorInfo = {}
        item.creatorInfo.displayAvatar = resolvedAvatars[index] || item.creatorInfo.avatar || ''
      })
    } else {
      joinedGames.value = []
    }
  } catch (error) {
    console.error('加载用户游戏失败:', error)
  }
}

const loadUserStats = async () => {
  const statRes = await wx.cloud.callFunction({
    name: 'user-service',
    data: {
      action: 'getUserStats',
      data: { userId: userId.value }
    }
  })
  if (statRes?.result?.code === 0) {
    const data = statRes.result.data || {}
    stats.value = {
      createdCount: data.createdGames || 0,
      joinedCount: data.joinedGames || 0,
      completedCount: data.completedGames || 0
    }
    return
  }
  stats.value = {
    createdCount: createdGames.value.length,
    joinedCount: joinedGames.value.length,
    completedCount: Math.floor((createdGames.value.length + joinedGames.value.length) / 2)
  }
}

const normalizeHonorRarity = (rarity) => {
  const v = String(rarity || '').trim().toLowerCase()
  if (v === 'legend' || v === 'gold') return 'legend'
  if (v === 'epic' || v === 'purple') return 'epic'
  if (v === 'rare' || v === 'blue' || v === 'silver') return 'rare'
  return 'common'
}

const getHonorRarityText = (rarity) => {
  const v = normalizeHonorRarity(rarity)
  if (v === 'legend') return '传说'
  if (v === 'epic') return '史诗'
  if (v === 'rare') return '稀有'
  return '普通'
}

const formatHonorDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const loadUserHonors = async () => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'game-service',
      data: { action: 'getHonorList', data: { ownerUserId: userId.value, limit: 20 } }
    })
    if (res?.result?.code === 0) {
      userHonors.value = res.result.data.list || []
    } else {
      userHonors.value = []
    }
  } catch (error) {
    console.error('加载用户荣誉失败:', error)
    userHonors.value = []
  }
}

const uploadAvatar = async (path) => {
  const ext = (path.split('.').pop() || 'jpg').toLowerCase()
  const cloudPath = `admin-avatar/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const res = await wx.cloud.uploadFile({ cloudPath, filePath: path })
  return res.fileID
}

const chooseAvatar = () => {
  if (!editable.value) return
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
        editDisplayAvatar.value = await resolveCloudFileUrl(fileID)
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

const addTag = () => {
  editTags.value.push({ id: genId(), name: '' })
}

const removeTag = (index) => {
  editTags.value.splice(index, 1)
}

const addGame = () => {
  editGames.value.push({ id: genId(), type: 'other', name: '' })
}

const removeGame = (index) => {
  editGames.value.splice(index, 1)
}

const saveAllAdminChanges = async () => {
  if (!editable.value) return
  const nickname = String(editNickname.value || '').trim()
  if (!nickname) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' })
    return
  }
  const tagsPayload = normalizeTags(editTags.value)
  const gamesPayload = normalizeGames(editGames.value)

  try {
    uni.showLoading({ title: '保存中...', mask: true })

    const profilePayload = {
      userId: userId.value,
      nickname
    }
    if (editAvatar.value && editAvatar.value !== (userInfo.value.avatar || '')) {
      profilePayload.avatarUrl = editAvatar.value
      profilePayload.avatarSize = editAvatarSize.value
    }
    const profileRes = await wx.cloud.callFunction({
      name: 'user-service',
      data: { action: 'adminUpdateUserProfile', data: profilePayload }
    })
    if (profileRes?.result?.code !== 0) {
      uni.showToast({ title: profileRes?.result?.message || '保存昵称/头像失败', icon: 'none' })
      return
    }

    const tagRes = await wx.cloud.callFunction({
      name: 'user-service',
      data: { action: 'adminUpdateUserTags', data: { userId: userId.value, tags: tagsPayload } }
    })
    if (tagRes?.result?.code !== 0) {
      uni.showToast({ title: tagRes?.result?.message || '保存标签失败', icon: 'none' })
      return
    }

    const gameRes = await wx.cloud.callFunction({
      name: 'user-service',
      data: { action: 'adminUpdateUserGames', data: { userId: userId.value, games: gamesPayload } }
    })
    if (gameRes?.result?.code !== 0) {
      uni.showToast({ title: gameRes?.result?.message || '保存设备失败', icon: 'none' })
      return
    }

    uni.showToast({ title: '保存成功', icon: 'success' })
    await loadUserProfile()
  } catch (error) {
    console.error('saveAllAdminChanges failed', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const toggleBlacklist = async () => {
  if (!editable.value) return
  if (String(userInfo.value?.id || userInfo.value?._id || '') === '') return
  const nextStatus = !userInfo.value.isBlacklisted
  const res = await wx.cloud.callFunction({
    name: 'user-service',
    data: {
      action: 'adminSetUserBlacklist',
      data: { userId: userId.value, isBlacklisted: nextStatus }
    }
  })
  if (res?.result?.code !== 0) {
    uni.showToast({ title: res?.result?.message || '操作失败', icon: 'none' })
    return
  }
  userInfo.value.isBlacklisted = nextStatus
  uni.showToast({ title: nextStatus ? '已加入黑名单' : '已移出黑名单', icon: 'success' })
}

const toggleAdmin = async () => {
  if (!editable.value) return
  const nextStatus = !userInfo.value.isAdmin
  const res = await wx.cloud.callFunction({
    name: 'user-service',
    data: {
      action: 'adminSetUserAdmin',
      data: { userId: userId.value, isAdmin: nextStatus }
    }
  })
  if (res?.result?.code !== 0) {
    uni.showToast({ title: res?.result?.message || '操作失败', icon: 'none' })
    return
  }
  userInfo.value.isAdmin = nextStatus
  uni.showToast({ title: nextStatus ? '已加冕管理员' : '已取消管理员', icon: 'success' })
}

const getTypeClass = (type) => {
  const classMap = {
    mahjong: 'tag-mahjong',
    boardgame: 'tag-boardgame',
    videogame: 'tag-videogame'
  }
  return classMap[type] || 'tag-mahjong'
}

const getTypeText = (type) => {
  const textMap = {
    mahjong: '立直麻将',
    boardgame: '桌游',
    videogame: '电玩',
    deck: '卡组',
    other: '其他'
  }
  return textMap[type] || '立直麻将'
}

const getTagDisplay = (tag) => {
  if (!tag) return ''
  if (typeof tag === 'string') return tag
  if (typeof tag === 'object') return tag.name || tag.label || tag.text || ''
  return String(tag)
}

const getEquipmentTypeText = (type) => {
  const textMap = {
    mahjong: '立直麻将',
    boardgame: '桌游',
    videogame: '电玩',
    deck: '卡组',
    other: '其他'
  }
  return textMap[type] || '其他'
}

const getStatusClass = (status) => {
  const classMap = {
    pending: 'status-pending',
    full: 'status-full',
    ongoing: 'status-ongoing',
    cancelled: 'status-cancelled',
    finished: 'status-finished'
  }
  return classMap[status] || 'status-pending'
}

const getStatusText = (status) => {
  const textMap = {
    pending: '招募中',
    full: '已满员',
    ongoing: '进行中',
    cancelled: '已取消',
    finished: '已结束'
  }
  return textMap[status] || '招募中'
}

const formatDateTime = (datetime) => {
  if (!datetime) return ''
  const date = new Date(datetime)
  const now = new Date()
  const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === 2) return '后天'
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const goToGameDetail = (gameId) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${gameId}`
  })
}

onLoad(async (options) => {
  const targetUserId = String(options?.userId || '').trim()
  if (!targetUserId) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1200)
    return
  }
  userId.value = targetUserId
  adminEditMode.value = String(options?.adminEdit || '') === '1'

  await checkViewerAdmin()
  editable.value = adminEditMode.value && isAdminViewer.value

  if (adminEditMode.value && !isAdminViewer.value) {
    uni.showToast({ title: '仅管理员可编辑', icon: 'none' })
  }

  await loadUserProfile()
})
</script>

<style scoped>
.profile-container { min-height: 100vh; background: #f5f6f8; }
.profile-scroll { height: 100vh; padding-bottom: 24rpx; box-sizing: border-box; }
.card { margin: 20rpx; background: #fff; border-radius: 16rpx; padding: 20rpx; }

.loading-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.loading-spinner { width: 52rpx; height: 52rpx; border-radius: 50%; border: 6rpx solid #dcfce7; border-top-color: #07c160; animation: spin 1s linear infinite; }
.loading-text { margin-top: 12rpx; font-size: 24rpx; color: #6b7280; }
@keyframes spin { to { transform: rotate(360deg); } }

.avatar-section { display: flex; align-items: center; gap: 18rpx; }
.user-avatar { width: 112rpx; height: 112rpx; border-radius: 50%; background: #f1f5f9; border: 2rpx solid #e2e8f0; }
.user-basic { display: flex; align-items: center; gap: 12rpx; }
.user-nickname { font-size: 34rpx; font-weight: 700; color: #111827; }
.user-gender { min-width: 40rpx; height: 40rpx; padding: 0 10rpx; border-radius: 999rpx; background: #e0f2fe; display: flex; align-items: center; justify-content: center; }
.gender-text { font-size: 22rpx; color: #0c4a6e; }

.profile-section { margin-top: 20rpx; }
.profile-section-header { margin-bottom: 10rpx; }
.profile-section-title { font-size: 24rpx; color: #6b7280; font-weight: 600; }
.empty-section-text { font-size: 22rpx; color: #9ca3af; }

.user-tags { display: flex; flex-wrap: wrap; gap: 10rpx; }
.user-tag { padding: 8rpx 16rpx; border-radius: 999rpx; background: #eff6ff; color: #2563eb; font-size: 22rpx; }

.user-equipments { margin-top: 20rpx; }
.equip-list { display: flex; flex-direction: column; gap: 10rpx; }
.equip-item { display: flex; align-items: center; gap: 12rpx; padding: 10rpx 12rpx; border-radius: 10rpx; background: #f8fafc; }
.equip-type { min-width: 108rpx; text-align: center; font-size: 20rpx; color: #2563eb; background: #dbeafe; padding: 6rpx 10rpx; border-radius: 8rpx; }
.equip-name { font-size: 24rpx; color: #374151; }

.admin-edit .sub-title { margin-top: 6rpx; font-size: 22rpx; color: #6b7280; }
.current-row { margin-top: 14rpx; display: flex; align-items: center; justify-content: space-between; }
.edit-avatar { width: 96rpx; height: 96rpx; border-radius: 50%; background: #f1f5f9; border: 2rpx solid #e2e8f0; }
.pick.upload { min-width: 120rpx; height: 56rpx; border-radius: 8rpx; background: #f59e0b; color: #fff; font-size: 22rpx; display: flex; align-items: center; justify-content: center; }
.input { width: 100%; height: 68rpx; border-radius: 10rpx; background: #f8fafc; padding: 0 14rpx; box-sizing: border-box; font-size: 24rpx; margin-top: 10rpx; }
.edit-block { margin-top: 14rpx; }
.block-title { font-size: 24rpx; color: #374151; font-weight: 600; margin-bottom: 8rpx; }
.edit-row { margin-top: 8rpx; display: flex; align-items: center; gap: 10rpx; }
.row-input { flex: 1; margin-top: 0; }
.del-btn { width: 86rpx; height: 56rpx; border-radius: 8rpx; background: #ef4444; color: #fff; font-size: 22rpx; display: flex; align-items: center; justify-content: center; }
.add-btn { margin-top: 8rpx; height: 56rpx; border-radius: 8rpx; background: #eff6ff; color: #1d4ed8; font-size: 23rpx; display: flex; align-items: center; justify-content: center; }
.edit-game { margin-top: 8rpx; display: flex; align-items: center; gap: 10rpx; }
.game-type-picker { width: 160rpx; height: 56rpx; border-radius: 8rpx; background: #e5e7eb; display: flex; align-items: center; justify-content: center; }
.picker-text { font-size: 22rpx; color: #374151; text-align: center; }

.actions { margin-top: 14rpx; }
.admin-actions { margin-top: 12rpx; display: flex; gap: 12rpx; }
.btn { flex: 1; height: 68rpx; border-radius: 10rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; }
.btn.primary { background: #07c160; color: #fff; }
.btn.warning { background: #f97316; color: #fff; }
.btn.royal { background: #2563eb; color: #fff; }

.section-title { font-size: 28rpx; font-weight: 700; color: #111827; }
.stats-grid { margin-top: 14rpx; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10rpx; }
.stat-item { text-align: center; background: #f8fafc; border-radius: 12rpx; padding: 14rpx 8rpx; }
.stat-value { display: block; font-size: 34rpx; color: #07c160; font-weight: 700; }
.stat-label { display: block; margin-top: 6rpx; font-size: 22rpx; color: #6b7280; }

.games-list { margin-top: 12rpx; display: flex; flex-direction: column; gap: 12rpx; }
.game-item { background: #f8fafc; border-radius: 12rpx; padding: 14rpx; }
.game-header { display: flex; align-items: center; justify-content: space-between; gap: 10rpx; }
.game-title { margin-top: 8rpx; font-size: 30rpx; font-weight: 700; color: #111827; }
.game-time { margin-top: 8rpx; font-size: 22rpx; color: #6b7280; }
.game-info { margin-top: 8rpx; display: flex; flex-direction: column; gap: 8rpx; }
.info-item { display: flex; align-items: center; gap: 10rpx; }
.info-icon { width: 28rpx; height: 28rpx; }
.info-text { font-size: 22rpx; color: #4b5563; }
.creator-info { display: flex; align-items: center; gap: 8rpx; }
.creator-avatar { width: 36rpx; height: 36rpx; border-radius: 50%; background: #e2e8f0; }
.creator-name { font-size: 22rpx; color: #4b5563; }

.type-tag, .status-tag { padding: 6rpx 14rpx; border-radius: 999rpx; font-size: 20rpx; color: #fff; }
.tag-mahjong { background: #f97316; }
.tag-boardgame { background: #0ea5e9; }
.tag-videogame { background: #14b8a6; }
.status-pending { background: #22c55e; }
.status-full { background: #94a3b8; }
.status-ongoing { background: #fb923c; }
.status-cancelled { background: #ef4444; }
.status-finished { background: #64748b; }

.safe-area { height: 30rpx; }

.honor-list { margin-top: 12rpx; display: flex; flex-direction: column; gap: 10rpx; }
.honor-item { background: #f8fafc; border-radius: 10rpx; padding: 12rpx; }
.honor-head { display: flex; align-items: center; justify-content: space-between; }
.honor-rarity { min-width: 84rpx; text-align: center; padding: 4rpx 12rpx; border-radius: 999rpx; font-size: 21rpx; font-weight: 600; }
.honor-legend { background: linear-gradient(135deg,#f59e0b,#fcd34d); color:#7c2d12; }
.honor-epic { background: linear-gradient(135deg,#7c3aed,#8b5cf6); color:#fff; }
.honor-rare { background: linear-gradient(135deg,#2563eb,#38bdf8); color:#fff; }
.honor-common { background:#fff; color:#111827; border:1rpx solid #111827; }
.honor-time { font-size: 22rpx; color:#6b7280; }
.honor-title { margin-top: 8rpx; font-size: 24rpx; color:#1f2937; }
</style>
