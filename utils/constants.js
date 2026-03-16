// utils/constants.js
export default {
  // 默认头像
  DEFAULT_AVATAR: 'cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png',
  
  // 默认图片
  EMPTY_STATE_IMAGE: '/static/empty-games.png',
  EMPTY_PLAYERS_IMAGE: '/static/empty-players.png',
  
  // 分页大小
  PAGE_SIZE: 10,
  
  // 游戏类型
  GAME_TYPES: {
    'mahjong': { 
      name: '日麻', 
      color: '#1890ff',
      minPlayers: 3,
      maxPlayers: 4
    },
    'boardgame': { 
      name: '桌游', 
      color: '#52c41a',
      minPlayers: 2,
      maxPlayers: 10
    },
    'videogame': { 
      name: '电玩', 
      color: '#fa8c16',
      minPlayers: 2,
      maxPlayers: 8
    }
  },
  
  // 游戏状态
  GAME_STATUS: {
    'pending': { name: '招募中', color: '#1890ff' },
    'full': { name: '已满员', color: '#fa8c16' },
    'ongoing': { name: '进行中', color: '#52c41a' },
    'cancelled': { name: '已取消', color: '#999999' },
    'finished': { name: '已结束', color: '#666666' }
  },
  
  // 组局可选地点（统一下拉选择，避免自由输入导致地点不规范）
  GAME_LOCATIONS: [
    { id: 'f2-bg-1', name: '桌游房1' },
    { id: 'f2-mj-1', name: '日麻房1' },
    { id: 'f2-mj-2', name: '日麻房2' },
    { id: 'f2-mj-3', name: '日麻房3' },
    { id: 'f2-bg-2', name: '桌游房2' },
    { id: 'f2-mj-4', name: '日麻房4' },
    { id: 'f1-desk-1', name: '大厅桌游1' },
    { id: 'f1-desk-2', name: '大厅桌游2' },
    { id: 'f1-desk-3', name: '大厅桌游3' },
    { id: 'f1-desk-4', name: '大厅桌游4' },
    { id: 'f1-desk-5', name: '大厅桌游5' },
    { id: 'f1-desk-6', name: '大厅桌游6' },
    { id: 'f1-arcade-hall', name: '电玩大厅' },
    { id: 'f1-inter-desk', name: '间层桌游' },
    { id: 'f1-inter-arcade-1', name: '间层电玩1' },
    { id: 'f1-inter-arcade-2', name: '间层电玩2' },
    { id: 'f1-arcade-room', name: '电玩房' }
  ]
}