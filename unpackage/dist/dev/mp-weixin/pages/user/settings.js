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
    });
    return (_ctx, _cache) => {
      return {
        a: common_assets._imports_0$3,
        b: common_vendor.o(goBack, "99"),
        c: common_assets._imports_1$2,
        d: notificationSettings.value.gameReminder,
        e: common_vendor.o(onGameReminderChange, "26"),
        f: common_assets._imports_2$2,
        g: notificationSettings.value.message,
        h: common_vendor.o(onMessageChange, "14"),
        i: common_assets._imports_3$3,
        j: notificationSettings.value.vibration,
        k: common_vendor.o(onVibrationChange, "76"),
        l: common_assets._imports_4,
        m: common_assets._imports_5$1,
        n: common_vendor.o(about, "a0"),
        o: common_vendor.o(handleLogout, "6a")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ce914230"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/settings.js.map
