// env.js
// 环境配置

// 开发环境
const development = {
  baseURL: 'http://localhost:3000', // 开发环境API地址
  debug: true,
  version: '1.0.0-dev'
}

// 测试环境
const staging = {
  baseURL: 'https://staging-api.example.com', // 测试环境API地址
  debug: true,
  version: '1.0.0-staging'
}

// 生产环境
const production = {
  baseURL: 'https://api.example.com', // 生产环境API地址
  debug: false,
  version: '1.0.0'
}

// 获取当前环境
const getEnv = () => {
  // #ifdef MP-WEIXIN
  // 微信小程序中可以根据版本号判断环境
  const accountInfo = uni.getAccountInfoSync()
  const version = accountInfo.miniProgram.version
  
  if (version === 'develop') {
    return development
  } else if (version === 'trial') {
    return staging
  } else {
    return production
  }
  // #endif
  
  // 默认开发环境
  return development
}

// 当前环境配置
const env = getEnv()

export default env