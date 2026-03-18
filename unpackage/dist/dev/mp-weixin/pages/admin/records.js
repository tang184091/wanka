"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "records",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const list = common_vendor.ref([]);
    const formatTime = (t) => new Date(t).toLocaleString();
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
        list.value = res.result.data.records || [];
    };
    const removeItem = (item) => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "删除后不可恢复",
        success: async (r) => {
          var _a;
          if (!r.confirm)
            return;
          const res = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "adminDeleteMahjongRecord", data: { recordId: item._id } } });
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
            a: common_vendor.t(formatTime(item.createdAt)),
            b: common_vendor.t((item.players || []).map((p) => p.nickname || p.userId || "未知").join(" / ")),
            c: common_vendor.o(($event) => removeItem(item), item._id),
            d: item._id
          };
        })
      }));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-7da4118b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/records.js.map
