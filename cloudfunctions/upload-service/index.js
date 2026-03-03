// 上传服务云函数
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  
  console.log('upload-service 调用:', { action, data, openid: wxContext.OPENID })
  
  try {
    switch (action) {
      case 'test':
        return handleTest(wxContext)
      case 'uploadImage':
        return await uploadImage(data, wxContext)
      case 'uploadAvatar':
        return await uploadAvatar(data, wxContext)
      case 'getUploadToken':
        return await getUploadToken(wxContext)
      default:
        return { code: 400, message: '未知操作' }
    }
  } catch (error) {
    console.error('upload-service 错误:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 测试接口
function handleTest(wxContext) {
  return {
    code: 0,
    message: 'upload-service 运行正常',
    data: {
      timestamp: new Date().toISOString(),
      openid: wxContext.OPENID,
      appid: wxContext.APPID
    }
  }
}

// 上传图片
async function uploadImage(data, wxContext) {
  const { filePath, options = {} } = data
  
  if (!filePath) {
    return { code: 400, message: '缺少文件路径' }
  }
  
  try {
    // 生成文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substr(2, 6)
    const cloudPath = `images/${timestamp}_${randomStr}.jpg`
    
    console.log('上传图片到云存储:', cloudPath)
    
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath
    })
    
    console.log('图片上传成功:', uploadResult.fileID)
    
    return {
      code: 0,
      message: '上传成功',
      data: {
        fileID: uploadResult.fileID,
        cloudPath: cloudPath
      }
    }
  } catch (error) {
    console.error('上传图片错误:', error)
    throw error
  }
}

// 上传头像
async function uploadAvatar(data, wxContext) {
  const { filePath } = data
  
  if (!filePath) {
    return { code: 400, message: '缺少文件路径' }
  }
  
  try {
    // 生成头像文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substr(2, 6)
    const cloudPath = `avatars/${wxContext.OPENID}_${timestamp}_${randomStr}.jpg`
    
    console.log('上传头像到云存储:', cloudPath)
    
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath
    })
    
    console.log('头像上传成功:', uploadResult.fileID)
    
    return {
      code: 0,
      message: '头像上传成功',
      data: {
        fileID: uploadResult.fileID,
        cloudPath: cloudPath
      }
    }
  } catch (error) {
    console.error('上传头像错误:', error)
    throw error
  }
}

// 获取上传凭证
async function getUploadToken(wxContext) {
  try {
    // 返回一个模拟的上传凭证
    // 实际生产中可能需要更复杂的凭证生成逻辑
    return {
      code: 0,
      data: {
        token: `upload_token_${Date.now()}`,
        expiredAt: new Date(Date.now() + 3600000) // 1小时后过期
      }
    }
  } catch (error) {
    console.error('获取上传凭证错误:', error)
    throw error
  }
}