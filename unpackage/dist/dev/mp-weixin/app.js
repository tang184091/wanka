"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const utils_store = require("./utils/store.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/wiki/list.js";
  "./pages/seat/seat.js";
  "./pages/user/user.js";
  "./pages/create/create.js";
  "./pages/detail/detail.js";
  "./pages/game/list.js";
  "./pages/user/tags.js";
  "./pages/user/games.js";
  "./pages/user/settings.js";
  "./pages/record/record.js";
  "./pages/record/detail.js";
  "./pages/admin/admin.js";
  "./pages/record/yakuman.js";
  "./pages/record/yakuman-upload.js";
  "./pages/admin/yakuman.js";
  "./pages/record/honor.js";
  "./pages/admin/honor.js";
  "./pages/admin/guide.js";
  "./pages/admin/records.js";
  "./pages/admin/games.js";
  "./pages/wiki/detail.js";
  "./pages/wiki/submit.js";
  "./pages/admin/wiki.js";
  "./pages/admin/user-manage.js";
}
const _sfc_main = {
  onLaunch: function(options) {
    common_vendor.index.__f__("log", "at App.vue:7", "App Launch - 玩咖约局小程序启动");
    common_vendor.index.__f__("log", "at App.vue:8", "启动参数:", options);
    if (common_vendor.wx$1.cloud) {
      common_vendor.index.__f__("log", "at App.vue:12", "开始初始化云开发...");
      common_vendor.wx$1.cloud.init({
        // 使用微信开发者工具分配的云环境ID
        env: "cloud1-6glnv3cs9b44417a",
        // 是否在将用户访问记录到用户管理中，在控制台中可见
        traceUser: true
      });
      common_vendor.index.__f__("log", "at App.vue:22", "云开发初始化成功");
      common_vendor.index.__f__("log", "at App.vue:23", "环境ID: cloud1-6glnv3cs9b44417a");
      common_vendor.index.__f__("log", "at App.vue:24", "小程序ID: wx6639309919ac9170");
      this.testCloudConnection();
    } else {
      common_vendor.index.__f__("error", "at App.vue:29", "当前微信版本不支持云开发，请升级微信版本");
      common_vendor.index.showModal({
        title: "提示",
        content: "当前微信版本过低，无法使用全部功能，请升级到最新微信版本",
        showCancel: false
      });
    }
    common_vendor.index.__f__("log", "at App.vue:38", "开始初始化全局状态...");
    utils_store.initStore();
    common_vendor.index.__f__("log", "at App.vue:40", "全局状态初始化完成");
    this.checkLoginStatus();
    this.getSystemInfo();
    this.checkUpdate();
  },
  onShow: function(options) {
    common_vendor.index.__f__("log", "at App.vue:53", "App Show - 小程序显示");
    common_vendor.index.__f__("log", "at App.vue:54", "显示参数:", options);
    if (options && options.scene) {
      common_vendor.index.__f__("log", "at App.vue:58", "场景值:", options.scene);
    }
    if (options && options.query) {
      common_vendor.index.__f__("log", "at App.vue:65", "分享卡片参数:", options.query);
    }
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:72", "App Hide - 小程序隐藏");
    this.saveAppState();
  },
  onError: function(error) {
    common_vendor.index.__f__("error", "at App.vue:79", "App Error - 小程序发生错误:", error);
    common_vendor.index.showToast({
      title: "程序发生错误，请稍后重试",
      icon: "none",
      duration: 3e3
    });
  },
  onPageNotFound: function(res) {
    common_vendor.index.__f__("warn", "at App.vue:93", "App PageNotFound - 页面不存在:", res);
    common_vendor.index.redirectTo({
      url: "/pages/index/index"
    });
  },
  methods: {
    // 测试云开发连接
    async testCloudConnection() {
      try {
        common_vendor.index.__f__("log", "at App.vue:105", "开始测试云开发连接...");
        const result = await common_vendor.wx$1.cloud.callFunction({
          name: "user-service",
          data: {
            action: "test"
          }
        });
        common_vendor.index.__f__("log", "at App.vue:115", "云开发连接测试成功:", result);
        return true;
      } catch (error) {
        common_vendor.index.__f__("warn", "at App.vue:119", "云开发连接测试失败，可能是云函数未部署或环境问题:", error);
        common_vendor.index.showModal({
          title: "云服务连接失败",
          content: "云服务连接失败，部分功能可能无法使用。可能是云函数未部署或网络问题。",
          showCancel: false
        });
        return false;
      }
    },
    // 检查登录状态
    checkLoginStatus() {
      try {
        const userInfo = common_vendor.index.getStorageSync("user_info");
        const userToken = common_vendor.index.getStorageSync("user_token");
        if (userInfo && userToken) {
          common_vendor.index.__f__("log", "at App.vue:139", "检测到已登录用户:", userInfo.nickname);
          const loginTime = common_vendor.index.getStorageSync("login_time");
          const now = Date.now();
          const loginDuration = now - loginTime;
          const sevenDays = 7 * 24 * 60 * 60 * 1e3;
          if (loginDuration > sevenDays) {
            common_vendor.index.__f__("log", "at App.vue:148", "登录已过期，清除登录状态");
            this.clearLoginData();
          } else {
            common_vendor.index.__f__("log", "at App.vue:151", "登录状态有效，剩余时间:", Math.round((sevenDays - loginDuration) / (24 * 60 * 60 * 1e3)), "天");
          }
        } else {
          common_vendor.index.__f__("log", "at App.vue:154", "未检测到登录状态");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:157", "检查登录状态失败:", error);
      }
    },
    // 清除登录数据
    clearLoginData() {
      const keys = ["user_info", "user_token", "user_stats", "login_time"];
      keys.forEach((key) => {
        common_vendor.index.removeStorageSync(key);
      });
      common_vendor.index.__f__("log", "at App.vue:167", "已清除所有登录数据");
    },
    // 获取系统信息
    getSystemInfo() {
      try {
        const systemInfo = common_vendor.index.getSystemInfoSync();
        common_vendor.index.__f__("log", "at App.vue:174", "系统信息:", {
          platform: systemInfo.platform,
          system: systemInfo.system,
          version: systemInfo.version,
          SDKVersion: systemInfo.SDKVersion,
          brand: systemInfo.brand,
          model: systemInfo.model,
          screenWidth: systemInfo.screenWidth,
          screenHeight: systemInfo.screenHeight,
          windowWidth: systemInfo.windowWidth,
          windowHeight: systemInfo.windowHeight,
          pixelRatio: systemInfo.pixelRatio,
          language: systemInfo.language
        });
        common_vendor.index.setStorageSync("system_info", systemInfo);
        this.setPlatformStyle(systemInfo);
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:196", "获取系统信息失败:", error);
      }
    },
    // 根据平台设置样式
    setPlatformStyle(systemInfo) {
      var _a;
      common_vendor.index.__f__("log", "at App.vue:204", "平台信息:", {
        isIOS: systemInfo.platform === "ios",
        statusBarHeight: systemInfo.statusBarHeight,
        safeArea: systemInfo.safeArea
      });
      common_vendor.index.setStorageSync("platform_info", {
        isIOS: systemInfo.platform === "ios",
        statusBarHeight: systemInfo.statusBarHeight,
        safeAreaTop: ((_a = systemInfo.safeArea) == null ? void 0 : _a.top) || 0,
        safeAreaBottom: systemInfo.safeArea ? systemInfo.screenHeight - systemInfo.safeArea.bottom : 0
      });
    },
    // 检查更新
    checkUpdate() {
      {
        common_vendor.index.__f__("log", "at App.vue:223", "开发环境，跳过更新检查");
        return;
      }
    },
    // 保存应用状态
    saveAppState() {
      try {
        const state = {
          lastHideTime: (/* @__PURE__ */ new Date()).getTime()
        };
        common_vendor.index.setStorageSync("app_state", state);
        common_vendor.index.__f__("log", "at App.vue:260", "应用状态已保存");
      } catch (error) {
        common_vendor.index.__f__("error", "at App.vue:262", "保存应用状态失败:", error);
      }
    }
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
