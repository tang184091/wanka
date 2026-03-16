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
    { id: 'wanka-1f-hall', name: '玩咖一楼大厅' },
    { id: 'wanka-2f-room-a', name: '玩咖二楼A房' },
    { id: 'wanka-2f-room-b', name: '玩咖二楼B房' },
    { id: 'wanka-2f-room-c', name: '玩咖二楼C房' },
    { id: 'wanka-vr-zone', name: '玩咖电玩区' }
  ]

}