"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_store = require("../../utils/store.js");
const _sfc_main = {
  __name: "settings",
  setup(__props) {
    const notificationSettings = common_vendor.ref({
      gameReminder: true,
      message: true,
      vibration: false
    });
    const cacheSizeText = common_vendor.ref("0KB");
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const onGameReminderChange = (e) => {
      notificationSettings.value.gameReminder = e.detail.value;
      saveNotificationSettings();
    };
    const onMessageChange = (e) => {
      notificationSettings.value.message = e.detail.value;
      saveNotificationSettings();
    };
    const onVibrationChange = (e) => {
      notificationSettings.value.vibration = e.detail.value;
      saveNotificationSettings();
    };
    const saveNotificationSettings = () => {
      common_vendor.index.setStorageSync("notification_settings", notificationSettings.value);
      common_vendor.index.showToast({
        title: "设置已保存",
        icon: "success"
      });
    };
    const about = () => {
      common_vendor.index.showModal({
        title: "关于玩咖约局",
        content: "版本：v1.0.0\n\n一个专注于日麻、桌游、电玩组局的小程序\n\n联系我们：support@wankayueju.com",
        showCancel: false
      });
    };
    const updateCacheSize = () => {
      try {
        const info = common_vendor.index.getStorageInfoSync();
        const kb = Math.round((info.currentSize || 0) * 100) / 100;
        cacheSizeText.value = `${kb}KB`;
      } catch (error) {
        cacheSizeText.value = "--";
      }
    };
    const clearCache = () => {
      common_vendor.index.showModal({
        title: "确认清理",
        content: "将清理本地缓存（包含设置与本地临时数据），是否继续？",
        success: (res) => {
          if (!res.confirm)
            return;
          try {
            common_vendor.index.clearStorageSync();
            notificationSettings.value = {
              gameReminder: true,
              message: true,
              vibration: false
            };
            saveNotificationSettings();
            updateCacheSize();
            common_vendor.index.showToast({ title: "缓存已清理", icon: "success" });
          } catch (error) {
            common_vendor.index.showToast({ title: "清理失败", icon: "none" });
          }
        }
      });
    };
    const checkForUpdate = () => {
      const updateManager = common_vendor.wx$1.getUpdateManager();
      updateManager.onCheckForUpdate((res) => {
        if (!res.hasUpdate) {
          common_vendor.index.showToast({ title: "已是最新版本", icon: "none" });
        }
      });
      updateManager.onUpdateReady(() => {
        common_vendor.index.showModal({
          title: "更新提示",
          content: "新版本已准备好，是否立即重启更新？",
          success: (res) => {
            if (res.confirm)
              updateManager.applyUpdate();
          }
        });
      });
      updateManager.onUpdateFailed(() => {
        common_vendor.index.showToast({ title: "新版本下载失败", icon: "none" });
      });
    };
    const handleLogout = () => {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            utils_store.userActions.logout();
            common_vendor.index.showToast({
              title: "已退出登录",
              icon: "success"
            });
            setTimeout(() => {
              common_vendor.index.switchTab({
                url: "/pages/index/index"
              });
            }, 1500);
          }
        }
      });
    };
    const loadNotificationSettings = () => {
      const saved = common_vendor.index.getStorageSync("notification_settings");
      if (saved) {
        notificationSettings.value = saved;
      }
    };
    common_vendor.onMounted(() => {
      loadNotificationSettings();
      updateCacheSize();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(goBack, "4c"),
        b: notificationSettings.value.gameReminder,
        c: common_vendor.o(onGameReminderChange, "bc"),
        d: notificationSettings.value.message,
        e: common_vendor.o(onMessageChange, "44"),
        f: notificationSettings.value.vibration,
        g: common_vendor.o(onVibrationChange, "29"),
        h: common_vendor.t(cacheSizeText.value),
        i: common_vendor.o(clearCache, "c2"),
        j: common_vendor.o(checkForUpdate, "cf"),
        k: common_vendor.o(about, "07"),
        l: common_vendor.o(handleLogout, "fa")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ce914230"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/settings.js.map
