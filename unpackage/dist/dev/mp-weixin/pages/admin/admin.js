"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_constants = require("../../utils/constants.js");
const _sfc_main = {
  __name: "admin",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const saving = common_vendor.ref(false);
    const statusOptions = ["空闲中", "预约中", "使用中"];
    const statusValues = ["available", "reserved", "occupied"];
    const seatItems = common_vendor.ref(utils_constants.constants.GAME_LOCATIONS.map((item) => ({
      name: item.name,
      status: "available"
    })));
    const statusIndex = (value) => {
      const i = statusValues.indexOf(value || "available");
      return i >= 0 ? i : 0;
    };
    const statusText = (value) => statusOptions[statusIndex(value)];
    const checkAdmin = async () => {
      var _a, _b, _c;
      const res = await common_vendor.wx$1.cloud.callFunction({ name: "user-service", data: { action: "getMe", data: {} } });
      isAdmin.value = !!(((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0 && ((_c = (_b = res == null ? void 0 : res.result) == null ? void 0 : _b.data) == null ? void 0 : _c.isAdmin));
    };
    const refreshData = async () => {
      var _a, _b;
      if (refreshing.value)
        return;
      refreshing.value = true;
      try {
        await checkAdmin();
        if (!isAdmin.value)
          return;
        const res = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "getSeatStatus", data: {} } });
        const statusMap = ((_b = (_a = res == null ? void 0 : res.result) == null ? void 0 : _a.data) == null ? void 0 : _b.statusByLocation) || {};
        seatItems.value = utils_constants.constants.GAME_LOCATIONS.map((item) => ({
          name: item.name,
          status: statusMap[item.name] || "available"
        }));
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:76", "刷新管理员座位状态失败:", error);
        common_vendor.index.showToast({ title: "刷新失败", icon: "none" });
      } finally {
        refreshing.value = false;
      }
    };
    const changeStatus = (seatName, e) => {
      const index = Number(e.detail.value);
      seatItems.value = seatItems.value.map((item) => {
        if (item.name !== seatName)
          return item;
        return {
          ...item,
          status: statusValues[index] || "available"
        };
      });
    };
    const saveOverrides = async () => {
      var _a, _b;
      if (!isAdmin.value || saving.value)
        return;
      saving.value = true;
      try {
        const overrides = {};
        seatItems.value.forEach((item) => {
          overrides[item.name] = item.status || "available";
        });
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: { action: "setSeatStatusOverrides", data: { overrides } }
        });
        if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
          await refreshData();
        } else {
          common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "保存失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:115", "保存管理员座位状态失败:", error);
        common_vendor.index.showToast({ title: "保存失败", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    common_vendor.onShow(() => {
      refreshData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : {
        b: common_vendor.t(refreshing.value ? "刷新中..." : "刷新状态"),
        c: refreshing.value ? 1 : "",
        d: common_vendor.o(refreshData, "5d"),
        e: common_vendor.t(saving.value ? "保存中..." : "保存修改"),
        f: saving.value ? 1 : "",
        g: common_vendor.o(saveOverrides, "cf"),
        h: common_vendor.f(seatItems.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: common_vendor.t(statusText(item.status)),
            c: common_vendor.n(`current-${item.status}`),
            d: common_vendor.t(statusText(item.status)),
            e: statusIndex(item.status),
            f: common_vendor.o((e) => changeStatus(item.name, e), item.name),
            g: item.name
          };
        }),
        i: statusOptions
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dbc77958"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/admin.js.map
