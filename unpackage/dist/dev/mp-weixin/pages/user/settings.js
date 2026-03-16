"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const utils_store = require("../../utils/store.js");
const _sfc_main = {
  __name: "settings",
  setup(__props) {
    const notificationSettings = common_vendor.ref({
      gameReminder: true,
      message: true,
      vibration: false
    });
    const cacheSize = common_vendor.ref("0KB");
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const goToAccountInfo = () => {
      common_vendor.index.showModal({
        title: "账号信息",
        content: "功能开发中，敬请期待",
        showCancel: false
      });
    };
    const changePassword = () => {
      common_vendor.index.showModal({
        title: "修改密码",
        content: "功能开发中，敬请期待",
        showCancel: false
      });
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
    const blockedUsers = () => {
      common_vendor.index.showModal({
        title: "屏蔽用户",
        content: "功能开发中，敬请期待",
        showCancel: false
      });
    };
    const clearCache = () => {
      common_vendor.index.showModal({
        title: "清理缓存",
        content: "确定要清理缓存吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({
              title: "清理中...",
              mask: true
            });
            setTimeout(() => {
              common_vendor.index.clearStorageSync();
              cacheSize.value = "0KB";
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "清理完成",
                icon: "success"
              });
            }, 1e3);
          }
        }
      });
    };
    const checkUpdate = () => {
      const updateManager = common_vendor.index.getUpdateManager();
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          common_vendor.index.showModal({
            title: "更新提示",
            content: "发现新版本，是否更新？",
            success: (res2) => {
              if (res2.confirm) {
                updateManager.onUpdateReady(() => {
                  common_vendor.index.showModal({
                    title: "更新提示",
                    content: "新版本下载完成，是否重启应用？",
                    success: (res3) => {
                      if (res3.confirm) {
                        updateManager.applyUpdate();
                      }
                    }
                  });
                });
                updateManager.onUpdateFailed(() => {
                  common_vendor.index.showToast({
                    title: "更新失败",
                    icon: "none"
                  });
                });
              }
            }
          });
        } else {
          common_vendor.index.showToast({
            title: "已是最新版本",
            icon: "success"
          });
        }
      });
    };
    const feedback = () => {
      common_vendor.index.navigateTo({
        url: "/pages/user/feedback"
      });
    };
    const about = () => {
      common_vendor.index.showModal({
        title: "关于玩咖约局",
        content: "版本：v1.0.0\n\n一个专注于日麻、桌游、电玩组局的小程序\n\n联系我们：support@wankayueju.com",
        showCancel: false
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
    const calculateCacheSize = () => {
      let total = 0;
      const info = common_vendor.index.getStorageInfoSync();
      info.keys.forEach((key) => {
        const data = common_vendor.index.getStorageSync(key);
        if (data) {
          total += JSON.stringify(data).length;
        }
      });
      if (total < 1024) {
        cacheSize.value = total + "B";
      } else if (total < 1024 * 1024) {
        cacheSize.value = (total / 1024).toFixed(2) + "KB";
      } else {
        cacheSize.value = (total / (1024 * 1024)).toFixed(2) + "MB";
      }
    };
    const loadNotificationSettings = () => {
      const saved = common_vendor.index.getStorageSync("notification_settings");
      if (saved) {
        notificationSettings.value = saved;
      }
    };
    common_vendor.onMounted(() => {
      calculateCacheSize();
      loadNotificationSettings();
    });
    return (_ctx, _cache) => {
      return {
        a: common_assets._imports_0$3,
        b: common_vendor.o(goBack),
        c: common_assets._imports_1$2,
        d: common_assets._imports_2$1,
        e: common_vendor.o(goToAccountInfo),
        f: common_assets._imports_3$3,
        g: common_assets._imports_2$1,
        h: common_vendor.o(changePassword),
        i: common_assets._imports_4$2,
        j: notificationSettings.value.gameReminder,
        k: common_vendor.o(onGameReminderChange),
        l: common_assets._imports_5$1,
        m: notificationSettings.value.message,
        n: common_vendor.o(onMessageChange),
        o: common_assets._imports_6$2,
        p: notificationSettings.value.vibration,
        q: common_vendor.o(onVibrationChange),
        r: common_assets._imports_7$1,
        s: common_assets._imports_2$1,
        t: common_assets._imports_8$1,
        v: common_assets._imports_2$1,
        w: common_vendor.o(blockedUsers),
        x: common_assets._imports_9$1,
        y: common_vendor.t(cacheSize.value),
        z: common_assets._imports_2$1,
        A: common_vendor.o(clearCache),
        B: common_assets._imports_10$1,
        C: common_assets._imports_2$1,
        D: common_vendor.o(checkUpdate),
        E: common_assets._imports_11$1,
        F: common_assets._imports_2$1,
        G: common_vendor.o(feedback),
        H: common_assets._imports_12,
        I: common_assets._imports_2$1,
        J: common_vendor.o(about),
        K: common_vendor.o(handleLogout)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ce914230"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/settings.js.map
