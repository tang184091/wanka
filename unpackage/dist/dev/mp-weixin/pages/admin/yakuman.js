"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "yakuman",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const list = common_vendor.ref([]);
    const formatTime = (t) => {
      if (!t)
        return "-";
      const d = new Date(t);
      const pad = (n) => `${n}`.padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const loadData = async () => {
      var _a, _b, _c;
      const me = await common_vendor.wx$1.cloud.callFunction({ name: "user-service", data: { action: "getMe", data: {} } });
      isAdmin.value = !!((_b = (_a = me == null ? void 0 : me.result) == null ? void 0 : _a.data) == null ? void 0 : _b.isAdmin);
      if (!isAdmin.value)
        return;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "getAdminManageData", data: {} }
      });
      if (((_c = res.result) == null ? void 0 : _c.code) === 0) {
        list.value = res.result.data.yakumanRecords || [];
      }
    };
    const deleteYakuman = (item) => {
      common_vendor.index.showModal({
        title: "确认删除役满记录",
        content: "删除后不可恢复，确认继续？",
        success: async (res) => {
          var _a, _b;
          if (!res.confirm)
            return;
          const r = await common_vendor.wx$1.cloud.callFunction({
            name: "game-service",
            data: { action: "adminDeleteYakumanRecord", data: { recordId: item.id } }
          });
          if (((_a = r.result) == null ? void 0 : _a.code) === 0) {
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            await loadData();
          } else {
            common_vendor.index.showToast({ title: ((_b = r.result) == null ? void 0 : _b.message) || "删除失败", icon: "none" });
          }
        }
      });
    };
    common_vendor.onShow(loadData);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : !list.value.length ? {} : {
        c: common_vendor.f(list.value, (item, k0, i0) => {
          return {
            a: item.imageFileId,
            b: common_vendor.t(item.playerNickname),
            c: common_vendor.t(item.yakumanType),
            d: common_vendor.t(formatTime(item.achievedAt)),
            e: common_vendor.t(item.uploaderNickname),
            f: common_vendor.o(($event) => deleteYakuman(item), item.id),
            g: item.id
          };
        })
      }, {
        b: !list.value.length
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-cbb466bd"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/yakuman.js.map
