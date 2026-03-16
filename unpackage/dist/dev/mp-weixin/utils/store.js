"use strict";
const common_vendor = require("../common/vendor.js");
const utils_user = require("./user.js");
const state = common_vendor.reactive({
  // 用户相关
  user: {
    isLoggedIn: false,
    info: null,
    stats: null,
    token: null
  },
  // 应用相关
  app: {
    theme: "light",
    language: "zh-CN",
    isLoading: false
  },
  // 组局相关
  games: {
    list: [],
    currentPage: 1,
    hasMore: true
  },
  // 消息相关
  messages: {
    unreadCount: 0,
    list: []
  }
});
const userActions = {
  // 登录
  async login(userInfo) {
    state.app.isLoading = true;
    try {
      const loginResult = await utils_user.UserService.wechatLogin();
      if (loginResult.code) {
        const cloudResult = await utils_user.UserService.cloudLogin(loginResult.code, userInfo);
        if (cloudResult.success) {
          state.user.isLoggedIn = true;
          state.user.info = cloudResult.userInfo;
          state.user.token = cloudResult.token;
          state.user.stats = cloudResult.stats;
          const savedState = common_vendor.index.getStorageSync("global_state") || {};
          common_vendor.index.setStorageSync("global_state", JSON.stringify({
            ...savedState,
            user: state.user
          }));
          return { success: true, data: cloudResult };
        } else {
          return { success: false, error: cloudResult.error };
        }
      } else {
        return { success: false, error: "获取登录凭证失败" };
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:75", "登录失败:", error);
      common_vendor.index.showToast({
        title: "登录失败，请重试",
        icon: "none",
        duration: 2e3
      });
      return { success: false, error: error.message };
    } finally {
      state.app.isLoading = false;
    }
  },
  // 退出登录
  logout() {
    common_vendor.index.__f__("log", "at utils/store.js:89", "store.js: 开始执行 userActions.logout()");
    state.user.isLoggedIn = false;
    state.user.info = null;
    state.user.stats = null;
    state.user.token = null;
    const savedState = common_vendor.index.getStorageSync("global_state") || {};
    delete savedState.user;
    common_vendor.index.setStorageSync("global_state", JSON.stringify(savedState));
    state.games.list = [];
    state.games.currentPage = 1;
    state.games.hasMore = true;
    state.messages.unreadCount = 0;
    state.messages.list = [];
    common_vendor.index.__f__("log", "at utils/store.js:109", "✅ store.js: userActions.logout() 执行完成");
  },
  // 更新用户信息
  updateUserInfo(updates) {
    if (state.user.info) {
      state.user.info = { ...state.user.info, ...updates };
      const savedState = common_vendor.index.getStorageSync("global_state") || {};
      if (savedState.user) {
        savedState.user.info = { ...savedState.user.info, ...updates };
        common_vendor.index.setStorageSync("global_state", JSON.stringify(savedState));
      }
    }
  },
  // 更新用户统计
  updateUserStats(stats) {
    state.user.stats = { ...state.user.stats, ...stats };
  },
  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = utils_user.UserService.isLoggedIn();
    if (isLoggedIn) {
      state.user.isLoggedIn = true;
      state.user.info = utils_user.UserService.getCurrentUser();
      state.user.stats = utils_user.UserService.getUserStats();
      state.user.token = utils_user.UserService.getToken();
    } else {
      state.user.isLoggedIn = false;
      state.user.info = null;
      state.user.stats = null;
      state.user.token = null;
    }
    return isLoggedIn;
  },
  // 获取用户统计
  async fetchUserStats() {
    try {
      const stats = await utils_user.UserService.fetchUserStats();
      if (stats) {
        state.user.stats = stats;
      }
      return stats;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:158", "获取用户统计失败:", error);
      return null;
    }
  }
};
const callGameService = async (action, data = {}, options = {}) => {
  const { showLoading = true, loadingText = "处理中..." } = options;
  if (showLoading) {
    common_vendor.index.showLoading({ title: loadingText, mask: true });
  }
  try {
    common_vendor.index.__f__("log", "at utils/store.js:208", `[game-service] 调用 ${action}:`, data);
    const startTime = Date.now();
    const result = await common_vendor.wx$1.cloud.callFunction({
      name: "game-service",
      data: {
        action,
        data
      }
    });
    const costTime = Date.now() - startTime;
    common_vendor.index.__f__("log", "at utils/store.js:220", `[game-service] ${action} 成功，耗时${costTime}ms:`, result.result);
    if (result.result) {
      if (result.result.code === 0) {
        return {
          success: true,
          data: result.result.data,
          message: result.result.message,
          code: result.result.code
        };
      } else {
        return {
          success: false,
          error: result.result.message,
          code: result.result.code,
          data: result.result.data
        };
      }
    } else {
      return {
        success: false,
        error: "云函数返回格式错误",
        code: 500
      };
    }
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/store.js:246", `[game-service] ${action} 失败:`, error);
    return {
      success: false,
      error: error.message || "网络请求失败",
      code: 500
    };
  } finally {
    if (showLoading) {
      common_vendor.index.hideLoading();
    }
  }
};
const gameActions = {
  // 获取组局列表
  async getGameList(params = {}) {
    try {
      const result = await callGameService("getGameList", params, { showLoading: false });
      if (result.success && result.data) {
        const games = result.data.list || [];
        state.games.list = games;
        state.games.hasMore = result.data.hasMore || games.length >= 10;
        return games;
      } else {
        common_vendor.index.showToast({
          title: result.error || "获取列表失败",
          icon: "none",
          duration: 2e3
        });
        return [];
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:280", "获取组局列表失败:", error);
      common_vendor.index.showToast({
        title: "获取失败，请刷新重试",
        icon: "none",
        duration: 2e3
      });
      return [];
    }
  },
  // 获取更多组局
  async getMoreGames(params = {}) {
    if (!state.games.hasMore) {
      common_vendor.index.showToast({
        title: "没有更多了",
        icon: "none",
        duration: 1500
      });
      return [];
    }
    try {
      const page = state.games.currentPage + 1;
      const result = await callGameService("getGameList", { ...params, page }, { showLoading: false });
      if (result.success && result.data) {
        const games = result.data.list || [];
        if (games.length > 0) {
          state.games.list = [...state.games.list, ...games];
          state.games.currentPage = page;
          state.games.hasMore = result.data.hasMore || games.length >= 10;
        } else {
          state.games.hasMore = false;
        }
        return games;
      } else {
        return [];
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:321", "获取更多组局失败:", error);
      common_vendor.index.showToast({
        title: "加载失败，请重试",
        icon: "none",
        duration: 2e3
      });
      return [];
    }
  },
  // 获取组局详情 - 修复参数格式
  async getGameDetail(gameId) {
    if (!gameId) {
      common_vendor.index.showToast({ title: "缺少组局ID", icon: "none" });
      return null;
    }
    try {
      const result = await callGameService("getGameDetail", { gameId });
      if (result.success) {
        return result.data;
      } else {
        common_vendor.index.showToast({
          title: result.error || "获取详情失败",
          icon: "none",
          duration: 2e3
        });
        return null;
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:352", "获取组局详情失败:", error);
      common_vendor.index.showToast({
        title: "获取详情失败",
        icon: "none",
        duration: 2e3
      });
      return null;
    }
  },
  // 创建组局 - 统一调用方式
  async createGame(gameData) {
    try {
      const result = await callGameService("createGame", { gameData }, {
        loadingText: "创建中..."
      });
      if (result.success) {
        if (result.data) {
          state.games.list.unshift(result.data);
        }
        return {
          success: true,
          data: result.data,
          message: "创建成功"
        };
      } else {
        return {
          success: false,
          error: result.error || "创建失败",
          message: result.error
        };
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:387", "创建组局失败:", error);
      return {
        success: false,
        error: error.message,
        message: error.message
      };
    }
  },
  // 加入组局 - 修复userId问题
  async joinGame(gameId) {
    var _a, _b;
    const currentUser = utils_user.UserService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      common_vendor.index.showToast({
        title: "请先登录",
        icon: "none",
        duration: 2e3
      });
      return { success: false, error: "用户未登录" };
    }
    try {
      const result = await callGameService("joinGame", {
        gameId,
        userId: currentUser.id
      }, {
        loadingText: "加入中..."
      });
      if (result.success) {
        this.updateGame(gameId, {
          currentPlayers: (_a = result.data) == null ? void 0 : _a.currentPlayers,
          isJoined: true,
          isFull: ((_b = result.data) == null ? void 0 : _b.isFull) || false
        });
        return {
          success: true,
          message: "加入成功",
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error,
          message: result.error
        };
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:437", "加入组局失败:", error);
      return {
        success: false,
        error: error.message,
        message: error.message
      };
    }
  },
  // 退出组局 - 修复userId问题
  async quitGame(gameId) {
    var _a;
    const currentUser = utils_user.UserService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      common_vendor.index.showToast({
        title: "请先登录",
        icon: "none",
        duration: 2e3
      });
      return { success: false, error: "用户未登录" };
    }
    try {
      const result = await callGameService("quitGame", {
        gameId,
        userId: currentUser.id
      }, {
        loadingText: "退出中..."
      });
      if (result.success) {
        this.updateGame(gameId, {
          currentPlayers: (_a = result.data) == null ? void 0 : _a.currentPlayers,
          isJoined: false,
          isFull: false
        });
        return {
          success: true,
          message: "已退出",
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error,
          message: result.error
        };
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:487", "退出组局失败:", error);
      return {
        success: false,
        error: error.message,
        message: error.message
      };
    }
  },
  // 更新组局本地状态
  updateGame(gameId, updates) {
    const index = state.games.list.findIndex((g) => g._id === gameId || g.id === gameId);
    if (index !== -1) {
      state.games.list[index] = { ...state.games.list[index], ...updates };
    }
  },
  // 删除/取消组局
  async deleteGame(gameId) {
    try {
      const result = await callGameService("deleteGame", { gameId });
      if (result.success) {
        state.games.list = state.games.list.filter((g) => g._id !== gameId && g.id !== gameId);
        return {
          success: true,
          message: "已取消",
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error,
          message: result.error
        };
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:525", "删除组局失败:", error);
      return {
        success: false,
        error: error.message,
        message: error.message
      };
    }
  },
  // 获取创建的组局
  async getCreatedGames() {
    const userInfo = utils_user.UserService.getCurrentUser();
    if (!userInfo || !userInfo.id) {
      common_vendor.index.showToast({
        title: "请先登录",
        icon: "none",
        duration: 2e3
      });
      return [];
    }
    try {
      const result = await callGameService("getCreatedGames", { userId: userInfo.id });
      if (result.success) {
        return result.data || [];
      } else {
        common_vendor.index.showToast({
          title: result.error || "获取失败",
          icon: "none",
          duration: 2e3
        });
        return [];
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:560", "获取创建的组局失败:", error);
      common_vendor.index.showToast({
        title: "获取失败，请重试",
        icon: "none",
        duration: 2e3
      });
      return [];
    }
  },
  // 获取参与的组局
  async getJoinedGames() {
    const userInfo = utils_user.UserService.getCurrentUser();
    if (!userInfo || !userInfo.id) {
      common_vendor.index.showToast({
        title: "请先登录",
        icon: "none",
        duration: 2e3
      });
      return [];
    }
    try {
      const result = await callGameService("getJoinedGames", { userId: userInfo.id });
      if (result.success) {
        return result.data || [];
      } else {
        common_vendor.index.showToast({
          title: result.error || "获取失败",
          icon: "none",
          duration: 2e3
        });
        return [];
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:596", "获取参与的组局失败:", error);
      common_vendor.index.showToast({
        title: "获取失败，请重试",
        icon: "none",
        duration: 2e3
      });
      return [];
    }
  },
  // 获取我的组局
  async getMyGames(type = "all") {
    const userInfo = utils_user.UserService.getCurrentUser();
    if (!userInfo || !userInfo.id) {
      common_vendor.index.showToast({
        title: "请先登录",
        icon: "none",
        duration: 2e3
      });
      return [];
    }
    try {
      const result = await callGameService("getMyGames", {
        userId: userInfo.id,
        type
      });
      if (result.success) {
        return result.data || [];
      } else {
        common_vendor.index.showToast({
          title: result.error || "获取失败",
          icon: "none",
          duration: 2e3
        });
        return [];
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:635", "获取我的组局失败:", error);
      common_vendor.index.showToast({
        title: "获取失败，请重试",
        icon: "none",
        duration: 2e3
      });
      return [];
    }
  },
  // 搜索组局
  async searchGames(keyword, filters = {}) {
    try {
      const result = await callGameService("searchGames", { keyword, filters });
      if (result.success) {
        return result.data || [];
      } else {
        common_vendor.index.showToast({
          title: result.error || "搜索失败",
          icon: "none",
          duration: 2e3
        });
        return [];
      }
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/store.js:661", "搜索组局失败:", error);
      common_vendor.index.showToast({
        title: "搜索失败，请重试",
        icon: "none",
        duration: 2e3
      });
      return [];
    }
  }
};
const initStore = () => {
  common_vendor.index.__f__("log", "at utils/store.js:715", "初始化全局状态");
  try {
    const savedState = common_vendor.index.getStorageSync("global_state");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.user) {
        Object.assign(state.user, parsed.user);
      }
      if (parsed.app) {
        Object.assign(state.app, parsed.app);
      }
      common_vendor.index.__f__("log", "at utils/store.js:733", "从本地存储恢复状态:", {
        isLoggedIn: state.user.isLoggedIn,
        hasUserInfo: !!state.user.info,
        theme: state.app.theme,
        language: state.app.language
      });
    }
    if (state.user.isLoggedIn && state.user.token) {
      const isStillValid = utils_user.UserService.validateToken(state.user.token);
      if (!isStillValid) {
        common_vendor.index.__f__("log", "at utils/store.js:745", "登录状态已失效，重置为未登录状态");
        state.user.isLoggedIn = false;
        state.user.info = null;
        state.user.stats = null;
        state.user.token = null;
      }
    } else {
      const isLoggedIn = userActions.checkLoginStatus();
      common_vendor.index.__f__("log", "at utils/store.js:754", "检查登录状态结果:", isLoggedIn);
    }
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/store.js:758", "初始化状态失败:", error);
    state.user.isLoggedIn = false;
    state.user.info = null;
    state.user.stats = null;
    state.user.token = null;
  }
};
exports.gameActions = gameActions;
exports.initStore = initStore;
exports.userActions = userActions;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/store.js.map
