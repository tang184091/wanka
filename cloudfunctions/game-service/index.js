/// 组局服务云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const { success, fail } = require('./lib/shared')
const gameActions = require('./lib/game-actions')
const seatActions = require('./lib/seat-actions')
const recordActions = require('./lib/record-actions')
const adminActions = require('./lib/admin-actions')

exports.main = async (event) => {
  const { action, data } = event || {}
  const wxContext = cloud.getWXContext()

  console.log('game-service 调用:', { action, openid: wxContext.OPENID })

  try {
    switch (action) {
      case 'test':
        return success({
          timestamp: new Date().toISOString(),
          openid: wxContext.OPENID,
          appid: wxContext.APPID
        }, 'game-service 运行正常')

      // 组局
      case 'createGame':
        return await gameActions.createGame(data, wxContext)
      case 'getGameList':
        return await gameActions.getGameList(data, wxContext)
      case 'getGameDetail':
        return await gameActions.getGameDetail(data, wxContext)
      case 'updateGame':
        return await gameActions.updateGame(data, wxContext)
      case 'deleteGame':
        return await gameActions.deleteGame(data, wxContext)
      case 'joinGame':
        return await gameActions.joinGame(data, wxContext)
      case 'quitGame':
        return await gameActions.quitGame(data, wxContext)
      case 'getMyGames':
        return await gameActions.getMyGames(data, wxContext)
      case 'getCreatedGames':
        return await gameActions.getCreatedGames(data)
      case 'getJoinedGames':
        return await gameActions.getJoinedGames(data)
      case 'searchGames':
        return await gameActions.searchGames(data)

      // 座位状态
      case 'getSeatStatus':
        return await seatActions.getSeatStatus()
      case 'getSeatStatusOverrides':
        return await seatActions.getSeatStatusOverrides()
      case 'setSeatStatusOverrides':
        return await seatActions.setSeatStatusOverrides(data, wxContext)

      // 战绩
      case 'getMahjongRecords':
        return await recordActions.getMahjongRecords()
      case 'getMahjongRecordDetail':
        return await recordActions.getMahjongRecordDetail(data)
      case 'createMahjongRecord':
        return await recordActions.createMahjongRecord(data, wxContext)
      case 'getYakumanList':
        return await recordActions.getYakumanList()
      case 'createYakumanRecord':
        return await recordActions.createYakumanRecord(data, wxContext)
      case 'getHonorList':
        return await recordActions.getHonorList()
      case 'createHonorRecord':
        return await recordActions.createHonorRecord(data, wxContext)

      // 管理员
      case 'adminDeleteMahjongRecord':
        return await adminActions.adminDeleteMahjongRecord(data, wxContext)
      case 'adminDeleteGame':
        return await adminActions.adminDeleteGame(data, wxContext)
      case 'getAdminManageData':
        return await adminActions.getAdminManageData(wxContext)
      case 'adminDeleteYakumanRecord':
        return await adminActions.adminDeleteYakumanRecord(data, wxContext)
      case 'adminDeleteHonorRecord':
        return await adminActions.adminDeleteHonorRecord(data, wxContext)

      default:
        return fail(400, '未知操作')
    }
  } catch (error) {
    console.error('game-service 未捕获错误:', error)
    return fail(500, `服务器内部错误: ${error.message}`)
  }
}