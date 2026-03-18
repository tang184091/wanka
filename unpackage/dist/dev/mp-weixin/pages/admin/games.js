"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "games",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const list = common_vendor.ref([]);
    const redirectNonAdmin = () => {
      common_vendor.index.showToast({ title: "仅管理员可访问", icon: "none" });
      setTimeout(() => {
        common_vendor.index.switchTab({ url: "/pages/user/user" });
      }, 300);
    };
    const checkAdmin = async () => {
      var _a, _b;
      const me = await common_vendor.wx$1.cloud.callFunction({ name: "user-service", data: { action: "getMe", data: {} } });
      isAdmin.value = !!((_b = (_a = me == null ? void 0 : me.result) == null ? void 0 : _a.data) == null ? void 0 : _b.isAdmin);
      if (!isAdmin.value) {
        redirectNonAdmin();
      }
      return isAdmin.value;
    };
    const loadData = async () => {
      var _a;
      if (!await checkAdmin())
        return;
      const res = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "getAdminManageData", data: {} } });
      if (((_a = res.result) == null ? void 0 : _a.code) === 0)
        list.value = res.result.data.games || [];
    };
    const removeItem = (item) => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "删除后不可恢复",
        success: async (r) => {
          var _a;
          if (!r.confirm)
            return;
          const res = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "adminDeleteGame", data: { gameId: item.id } } });
          if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            loadData();
          }
        }
      });
    };
    common_vendor.onShow(loadData);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : common_vendor.e({
        b: !list.value.length
      }, !list.value.length ? {} : {}, {
        c: common_vendor.f(list.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.title || "未命名组局"),
            b: common_vendor.t(item.location || "-"),
            c: common_vendor.t(item.status || "-"),
            d: common_vendor.o(($event) => removeItem(item), item.id),
            e: item.id
          };
        })
      }));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e1573dd1"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/games.js.map
