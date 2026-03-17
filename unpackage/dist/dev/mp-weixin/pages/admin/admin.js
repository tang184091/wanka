"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_constants = require("../../utils/constants.js");
const _sfc_main = {
  __name: "admin",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const overrides = common_vendor.ref({});
    const seats = utils_constants.constants.GAME_LOCATIONS.map((item) => item.name);
    const statusOptions = ["空闲中", "预约中", "使用中"];
    const statusValues = ["available", "reserved", "occupied"];
    const statusIndex = (value) => {
      const i = statusValues.indexOf(value || "available");
      return i >= 0 ? i : 0;
    };
    const statusText = (value) => statusOptions[statusIndex(value)];
    const checkAdmin = async () => {
      var _a;
      const res = await common_vendor.wx$1.cloud.callFunction({ name: "user-service", data: { action: "getMe", data: {} } });
      if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
        isAdmin.value = !!res.result.data.isAdmin;
      }
    };
    const load = async () => {
      var _a;
      const res = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "getSeatStatusOverrides", data: {} } });
      if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
        overrides.value = res.result.data.overrides || {};
      }
    };
    const changeStatus = (seat, e) => {
      const index = Number(e.detail.value);
      overrides.value = { ...overrides.value, [seat]: statusValues[index] };
    };
    const save = async () => {
      var _a, _b;
      const res = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "setSeatStatusOverrides", data: { overrides: overrides.value } } });
      if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
        common_vendor.index.showToast({ title: "保存成功", icon: "success" });
      } else {
        common_vendor.index.showToast({ title: ((_b = res.result) == null ? void 0 : _b.message) || "保存失败", icon: "none" });
      }
    };
    common_vendor.onShow(async () => {
      await checkAdmin();
      if (isAdmin.value)
        await load();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : {
        b: common_vendor.f(common_vendor.unref(seats), (seat, k0, i0) => {
          return {
            a: common_vendor.t(seat),
            b: common_vendor.t(statusText(overrides.value[seat] || "available")),
            c: statusIndex(overrides.value[seat]),
            d: common_vendor.o((e) => changeStatus(seat, e), seat),
            e: seat
          };
        }),
        c: statusOptions,
        d: common_vendor.o(save, "0f")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dbc77958"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/admin.js.map
