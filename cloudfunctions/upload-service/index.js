// 上传服务云函数
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const success = (data = null, message = 'ok') => ({ code: 0, message, data })
const fail = (code, message, data = null) => ({ code, message, data })

exports.main = async (event) => {
  const { action, data } = event || {}
  const wxContext = cloud.getWXContext()

  console.log('upload-service 调用:', { action, openid: wxContext.OPENID })

  try {
    switch (action) {
      case 'test':
        return success({
          timestamp: new Date().toISOString(),
          openid: wxContext.OPENID,
          appid: wxContext.APPID
        }, 'upload-service 运行正常')
      case 'uploadImage':
        return await uploadImage(data)
      case 'uploadAvatar':
        return await uploadAvatar(data, wxContext)
      case 'getUploadToken':
        return await getUploadToken()
      default:
        return fail(400, '未知操作')
    }
  } catch (error) {
    console.error('upload-service 未捕获错误:', error)
    return fail(500, `服务器内部错误: ${error.message}`)
  }
}

function buildCloudPath(prefix, openid) {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).slice(2, 8)
  if (openid) return `${prefix}/${openid}_${timestamp}_${randomStr}.jpg`
  return `${prefix}/${timestamp}_${randomStr}.jpg`
}

async function uploadImage(data) {
  const payload = data || {}


  const cloudPath = buildCloudPath('images')
  const uploadResult = await cloud.uploadFile({ cloudPath, filePath })

  return success({
    fileID: uploadResult.fileID,
    cloudPath
  }, '上传成功')
}

async function uploadAvatar(data, wxContext) {
  const payload = data || {}


  const cloudPath = buildCloudPath('avatars', wxContext.OPENID || 'unknown')
  const uploadResult = await cloud.uploadFile({ cloudPath, filePath })

  return success({
    fileID: uploadResult.fileID,
    cloudPath
  }, '头像上传成功')
}

async function getUploadToken() {
  return success({
    token: `upload_token_${Date.now()}`,
    expiredAt: new Date(Date.now() + 60 * 60 * 1000)
  }, '获取成功')

