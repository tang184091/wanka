"use strict";
const common_vendor = require("../common/vendor.js");
const utils_store = require("./store.js");
const STORAGE_KEYS = {
  USER_INFO: "user_info",
  USER_TOKEN: "user_token",
  USER_STATS: "user_stats",
  LOGIN_TIME: "login_time",
  CLOUD_ENV: "cloud_env",
  APP_CONFIG: "app_config"
};
class UserService {
  // 检查是否已登录
  static isLoggedIn() {
    const userInfo = common_vendor.index.getStorageSync(STORAGE_KEYS.USER_INFO);
    const token = common_vendor.index.getStorageSync(STORAGE_KEYS.USER_TOKEN);
    return !!(userInfo && token);
  }
  // 获取当前用户信息
  static getCurrentUser() {
    return common_vendor.index.getStorageSync(STORAGE_KEYS.USER_INFO) || null;
  }
  // 获取当前用户统计
  static getUserStats() {
    return common_vendor.index.getStorageSync(STORAGE_KEYS.USER_STATS) || null;
  }
  // 获取用户token
  static getToken() {
    return common_vendor.index.getStorageSync(STORAGE_KEYS.USER_TOKEN) || "";
  }
  // 获取云开发环境
  static getCloudEnv() {
    return common_vendor.index.getStorageSync(STORAGE_KEYS.CLOUD_ENV) || "cloud1-6glnv3cs9b44417a";
  }
  // 检查云开发是否可用
  static isCloudAvailable() {
    return !!(common_vendor.wx$1 && common_vendor.wx$1.cloud);
  }
  // 微信登录 - 只获取登录code
  static async wechatLogin() {
    return new Promise((resolve, reject) => {
      common_vendor.index.__f__("log", "at utils/user.js:53", "开始获取微信登录code...");
      common_vendor.index.login({
        provider: "weixin",
        success: async (loginRes) => {
          if (loginRes.code) {
            common_vendor.index.__f__("log", "at utils/user.js:59", "✅ 获取微信code成功");
            resolve({ code: loginRes.code });
          } else {
            common_vendor.index.__f__("error", "at utils/user.js:62", "获取微信code失败");
            reject(new Error("获取微信登录code失败"));
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at utils/user.js:67", "uni.login失败:", err);
          reject(new Error("微信登录失败: " + err.errMsg));
        }
      });
    });
  }
  // 云开发登录
  static async cloudLogin(code, userInfo, captchaPayload = null) {
    var _a, _b;
    try {
      common_vendor.index.__f__("log", "at utils/user.js:77", "调用云函数 user-service 登录");
      const result = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "login",
          data: {
            userInfo,
            ...captchaPayload || {}
          }
        }
      });
      common_vendor.index.__f__("log", "at utils/user.js:91", "云函数调用结果:", result);
      if (result.result && result.result.code === 0) {
        return {
          success: true,
          userInfo: result.result.data.userInfo,
          token: result.result.data.token,
          stats: result.result.data.stats,
          needCaptcha: false
        };
      }
      if (result.result && result.result.code === 429 && ((_a = result.result.data) == null ? void 0 : _a.needCaptcha)) {
        return {
          success: false,
          needCaptcha: true,
          captchaId: result.result.data.captchaId,
          captchaHint: result.result.data.captchaHint,
          forceLogout: !!result.result.data.forceLogout,
          error: result.result.message || "需要验证码"
        };
      }
      const errorMsg = ((_b = result.result) == null ? void 0 : _b.message) || "云函数登录失败";
      common_vendor.index.__f__("error", "at utils/user.js:115", "云函数返回错误:", errorMsg);
      throw new Error(errorMsg);
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/user.js:118", "云函数调用失败:", error);
      throw error;
    }
  }
  // 保存用户数据
  static saveUserData(userInfo, token, stats = null) {
    const now = (/* @__PURE__ */ new Date()).getTime();
    common_vendor.index.__f__("log", "at utils/user.js:127", "保存用户数据:", { userInfo, token, stats });
    common_vendor.index.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo);
    common_vendor.index.setStorageSync(STORAGE_KEYS.USER_TOKEN, token);
    common_vendor.index.setStorageSync(STORAGE_KEYS.LOGIN_TIME, now);
    if (stats) {
      common_vendor.index.setStorageSync(STORAGE_KEYS.USER_STATS, stats);
    }
    if (utils_store.userActions && utils_store.userActions.updateUserInfo) {
      utils_store.userActions.updateUserInfo(userInfo);
      if (stats) {
        utils_store.userActions.updateUserStats(stats);
      }
    }
    common_vendor.index.$emit("user:login", { userInfo, token, stats });
    return true;
  }
  // 退出登录 - 已修复，不再调用 userActions.logout() 避免循环
  static logout() {
    common_vendor.index.__f__("log", "at utils/user.js:159", "开始执行 UserService.logout() - 只处理数据清理");
    const storageKeys = [
      STORAGE_KEYS.USER_INFO,
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USER_STATS,
      STORAGE_KEYS.LOGIN_TIME
    ];
    storageKeys.forEach((key) => {
      common_vendor.index.__f__("log", "at utils/user.js:170", `清除存储: ${key}`);
      common_vendor.index.removeStorageSync(key);
    });
    common_vendor.index.__f__("log", "at utils/user.js:174", "✅ 本地存储已清除");
    common_vendor.index.__f__("log", "at utils/user.js:181", "触发 user:logout 事件，通知所有监听组件");
    common_vendor.index.$emit("user:logout");
    common_vendor.index.__f__("log", "at utils/user.js:184", "✅ UserService.logout() 执行完成");
    return true;
  }
  // 更新用户信息
  static async updateUserInfo(updates) {
    var _a;
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error("用户未登录");
    }
    try {
      const result = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "updateUserInfo",
          data: {
            userId: currentUser.id,
            updates
          }
        }
      });
      common_vendor.index.__f__("log", "at utils/user.js:208", "更新用户信息结果:", result);
      if (result.result && result.result.code === 0) {
        const updatedUser = { ...currentUser, ...updates };
        common_vendor.index.setStorageSync(STORAGE_KEYS.USER_INFO, updatedUser);
        if (utils_store.userActions && utils_store.userActions.updateUserInfo) {
          utils_store.userActions.updateUserInfo(updates);
        }
        common_vendor.index.$emit("user:updated", updatedUser);
        return updatedUser;
      } else {
        throw new Error(((_a = result.result) == null ? void 0 : _a.message) || "更新用户信息失败");
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/user.js:229", "更新用户信息失败:", error);
      throw error;
    }
  }
  // 更新用户标签
  static async updateUserTags(tags) {
    var _a;
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error("用户未登录");
    }
    try {
      const result = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "updateUserTags",
          data: {
            userId: currentUser.id,
            tags
          }
        }
      });
      if (result.result && result.result.code === 0) {
        const updatedUser = { ...currentUser, tags };
        common_vendor.index.setStorageSync(STORAGE_KEYS.USER_INFO, updatedUser);
        if (utils_store.userActions && utils_store.userActions.updateUserInfo) {
          utils_store.userActions.updateUserInfo({ tags });
        }
        common_vendor.index.$emit("user:updated", updatedUser);
        return updatedUser;
      } else {
        throw new Error(((_a = result.result) == null ? void 0 : _a.message) || "更新用户标签失败");
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/user.js:268", "更新用户标签失败:", error);
      throw error;
    }
  }
  // 更新用户标签
  static async updateUserTags(tags) {
    var _a;
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error("用户未登录");
    }
    try {
      const result = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "updateUserTags",
          data: {
            userId: currentUser.id,
            tags
          }
        }
      });
      if (result.result && result.result.code === 0) {
        const updatedUser = { ...currentUser, tags };
        common_vendor.index.setStorageSync(STORAGE_KEYS.USER_INFO, updatedUser);
        if (utils_store.userActions && utils_store.userActions.updateUserInfo) {
          utils_store.userActions.updateUserInfo({ tags });
        }
        common_vendor.index.$emit("user:updated", updatedUser);
        return updatedUser;
      } else {
        throw new Error(((_a = result.result) == null ? void 0 : _a.message) || "更新用户标签失败");
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/user.js:307", "更新用户标签失败:", error);
      throw error;
    }
  }
  // 更新用户游戏/装备
  static async updateUserGames(games) {
    var _a;
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error("用户未登录");
    }
    try {
      const result = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "updateUserGames",
          data: {
            userId: currentUser.id,
            games
          }
        }
      });
      if (result.result && result.result.code === 0) {
        const updatedUser = { ...currentUser, games };
        common_vendor.index.setStorageSync(STORAGE_KEYS.USER_INFO, updatedUser);
        if (utils_store.userActions && utils_store.userActions.updateUserInfo) {
          utils_store.userActions.updateUserInfo({ games });
        }
        common_vendor.index.$emit("user:updated", updatedUser);
        return updatedUser;
      } else {
        throw new Error(((_a = result.result) == null ? void 0 : _a.message) || "更新用户游戏失败");
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/user.js:346", "更新用户游戏失败:", error);
      throw error;
    }
  }
  // 更新用户头像
  static async updateUserAvatar(avatarUrl, avatarSize = 0) {
    var _a;
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error("用户未登录");
    }
    try {
      const result = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "updateUserAvatar",
          data: {
            userId: currentUser.id,
            avatarUrl,
            avatarSize
          }
        }
      });
      if (result.result && result.result.code === 0) {
        const updatedUser = { ...currentUser, avatar: avatarUrl };
        common_vendor.index.setStorageSync(STORAGE_KEYS.USER_INFO, updatedUser);
        if (utils_store.userActions && utils_store.userActions.updateUserInfo) {
          utils_store.userActions.updateUserInfo({ avatar: avatarUrl });
        }
        common_vendor.index.$emit("user:updated", updatedUser);
        return updatedUser;
      } else {
        throw new Error(((_a = result.result) == null ? void 0 : _a.message) || "更新用户头像失败");
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/user.js:386", "更新用户头像失败:", error);
      throw error;
    }
  }
  // 获取用户统计
  static async fetchUserStats() {
    var _a;
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error("用户未登录");
    }
    try {
      const result = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "getUserStats",
          data: {
            userId: currentUser.id
          }
        }
      });
      if (result.result && result.result.code === 0) {
        const stats = result.result.data;
        const formattedStats = {
          createdGames: stats.createdGames || 0,
          joinedGames: stats.joinedGames || 0,
          completedGames: stats.completedGames || 0
        };
        common_vendor.index.setStorageSync(STORAGE_KEYS.USER_STATS, formattedStats);
        if (utils_store.userActions && utils_store.userActions.updateUserStats) {
          utils_store.userActions.updateUserStats(formattedStats);
        }
        common_vendor.index.__f__("log", "at utils/user.js:425", "获取用户统计成功:", formattedStats);
        return formattedStats;
      } else {
        const errorMsg = ((_a = result.result) == null ? void 0 : _a.message) || "获取用户统计失败";
        common_vendor.index.__f__("error", "at utils/user.js:429", "获取用户统计失败:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/user.js:433", "获取用户统计失败:", error);
      const cachedStats = common_vendor.index.getStorageSync(STORAGE_KEYS.USER_STATS);
      if (cachedStats) {
        common_vendor.index.__f__("log", "at utils/user.js:438", "使用本地缓存的统计:", cachedStats);
        return cachedStats;
      }
      return {
        createdGames: 0,
        joinedGames: 0,
        completedGames: 0
      };
    }
  }
  // 检查token是否过期
  static isTokenExpired() {
    const loginTime = common_vendor.index.getStorageSync(STORAGE_KEYS.LOGIN_TIME);
    if (!loginTime)
      return true;
    const now = (/* @__PURE__ */ new Date()).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1e3;
    return now - loginTime > sevenDays;
  }
  // 上传图片到云存储
  static async uploadImage(filePath) {
    if (!this.isCloudAvailable()) {
      throw new Error("云开发不可用");
    }
    try {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substr(2, 6);
      const cloudPath = `images/${timestamp}_${randomStr}.jpg`;
      common_vendor.index.__f__("log", "at utils/user.js:474", "开始上传图片到云存储:", cloudPath);
      const uploadResult = await common_vendor.wx$1.cloud.uploadFile({
        cloudPath,
        filePath
      });
      common_vendor.index.__f__("log", "at utils/user.js:481", "图片上传成功:", uploadResult.fileID);
      return uploadResult.fileID;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/user.js:484", "图片上传失败:", error);
      throw error;
    }
  }
  // 清理所有本地数据（调试用）
  static clearAllData() {
    common_vendor.index.__f__("log", "at utils/user.js:491", "清理所有本地数据");
    const keys = [
      STORAGE_KEYS.USER_INFO,
      STORAGE_KEYS.USER_TOKEN,
      STORAGE_KEYS.USER_STATS,
      STORAGE_KEYS.LOGIN_TIME,
      STORAGE_KEYS.CLOUD_ENV,
      STORAGE_KEYS.APP_CONFIG
    ];
    keys.forEach((key) => {
      common_vendor.index.removeStorageSync(key);
    });
    return true;
  }
}
exports.UserService = UserService;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/user.js.map
