"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "admin",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const saving = common_vendor.ref(false);
    const statusValues = ["available", "reserved", "occupied"];
    const now = /* @__PURE__ */ new Date();
    const selectedDate = common_vendor.ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
    const selectedDateLabel = common_vendor.computed(() => `日期：${selectedDate.value}`);
    const floor2Left = common_vendor.ref([
      { id: "f2-bg-1", name: "桌游房1", status: "available" },
      { id: "f2-mj-1", name: "立直麻将房1", status: "available" },
      { id: "f2-mj-2", name: "立直麻将房2", status: "available" },
      { id: "f2-mj-3", name: "立直麻将房3", status: "available" }
    ]);
    const floor2Bottom = common_vendor.ref([
      { id: "f2-bg-2", name: "桌游房2", status: "available" },
      { id: "f2-mj-4", name: "立直麻将房4", status: "available" }
    ]);
    const hallDeskRows = common_vendor.ref([
      [
        { id: "f1-desk-1", name: "大厅桌游1", status: "available" },
        { id: "f1-desk-2", name: "大厅桌游2", status: "available" }
      ],
      [
        { id: "f1-desk-3", name: "大厅桌游3", status: "available" },
        { id: "f1-desk-4", name: "大厅桌游4", status: "available" }
      ],
      [
        { id: "f1-desk-5", name: "大厅桌游5", status: "available" },
        { id: "f1-desk-6", name: "大厅桌游6", status: "available" }
      ]
    ]);
    const arcadeHall = common_vendor.ref({ id: "f1-arcade-hall", name: "电玩大厅", status: "available" });
    const interDesk = common_vendor.ref({ id: "f1-inter-desk", name: "间层桌游", status: "available" });
    const interArcade1 = common_vendor.ref({ id: "f1-inter-arcade-1", name: "间层电玩1", status: "available" });
    const interArcade2 = common_vendor.ref({ id: "f1-inter-arcade-2", name: "间层电玩2", status: "available" });
    const arcadeRoom = common_vendor.ref({ id: "f1-arcade-room", name: "电玩房", status: "available" });
    const getSeatStatusClass = (status) => ({
      available: "status-available",
      reserved: "status-reserved",
      occupied: "status-occupied"
    })[status] || "status-available";
    const getSeatStatusText = (status) => ({
      available: "空闲中",
      reserved: "预约中",
      occupied: "使用中"
    })[status] || "空闲中";
    const normalizeLocationName = (name = "") => String(name).replace(/\s+/g, "").trim();
    const setSeatStatusByName = (name, statusMap) => statusMap[normalizeLocationName(name)] || statusMap[name] || "available";
    const redirectNonAdmin = () => {
      common_vendor.index.showToast({ title: "仅管理员可访问", icon: "none" });
      setTimeout(() => {
        common_vendor.index.switchTab({ url: "/pages/user/user" });
      }, 300);
    };
    const checkAdmin = async () => {
      var _a, _b, _c;
      const res = await common_vendor.wx$1.cloud.callFunction({ name: "user-service", data: { action: "getMe", data: {} } });
      isAdmin.value = !!(((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0 && ((_c = (_b = res == null ? void 0 : res.result) == null ? void 0 : _b.data) == null ? void 0 : _c.isAdmin));
      if (!isAdmin.value)
        redirectNonAdmin();
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
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: { action: "getSeatStatus", data: { date: selectedDate.value } }
        });
        const rawStatusMap = ((_b = (_a = res == null ? void 0 : res.result) == null ? void 0 : _a.data) == null ? void 0 : _b.statusByLocation) || {};
        const statusMap = {};
        Object.keys(rawStatusMap).forEach((key) => {
          statusMap[normalizeLocationName(key)] = rawStatusMap[key];
        });
        floor2Left.value = floor2Left.value.map((item) => ({ ...item, status: setSeatStatusByName(item.name, statusMap) }));
        floor2Bottom.value = floor2Bottom.value.map((item) => ({ ...item, status: setSeatStatusByName(item.name, statusMap) }));
        hallDeskRows.value = hallDeskRows.value.map((row) => row.map((item) => ({ ...item, status: setSeatStatusByName(item.name, statusMap) })));
        arcadeHall.value = { ...arcadeHall.value, status: setSeatStatusByName(arcadeHall.value.name, statusMap) };
        interDesk.value = { ...interDesk.value, status: setSeatStatusByName(interDesk.value.name, statusMap) };
        interArcade1.value = { ...interArcade1.value, status: setSeatStatusByName(interArcade1.value.name, statusMap) };
        interArcade2.value = { ...interArcade2.value, status: setSeatStatusByName(interArcade2.value.name, statusMap) };
        arcadeRoom.value = { ...arcadeRoom.value, status: setSeatStatusByName(arcadeRoom.value.name, statusMap) };
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:273", "刷新管理员座位数据失败:", error);
        common_vendor.index.showToast({ title: "刷新失败", icon: "none" });
      } finally {
        refreshing.value = false;
      }
    };
    const cycleStatus = (status) => {
      const idx = statusValues.indexOf(status || "available");
      return statusValues[(idx + 1) % statusValues.length];
    };
    const onAdminSeatTap = (seat) => {
      seat.status = cycleStatus(seat.status);
    };
    const collectOverrides = () => {
      const flatSeats = [
        ...floor2Left.value,
        ...floor2Bottom.value,
        ...hallDeskRows.value.flat(),
        arcadeHall.value,
        interDesk.value,
        interArcade1.value,
        interArcade2.value,
        arcadeRoom.value
      ];
      const overrides = {};
      flatSeats.forEach((seat) => {
        overrides[seat.name] = seat.status || "available";
      });
      return overrides;
    };
    const saveOverrides = async () => {
      var _a, _b;
      if (!isAdmin.value || saving.value)
        return;
      saving.value = true;
      try {
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: {
            action: "setSeatStatusOverrides",
            data: { date: selectedDate.value, overrides: collectOverrides() }
          }
        });
        if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
          await refreshData();
        } else {
          common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "保存失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:325", "保存管理员座位状态失败:", error);
        common_vendor.index.showToast({ title: "保存失败", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    const resetManualOverrides = () => {
      if (!isAdmin.value || saving.value)
        return;
      common_vendor.index.showModal({
        title: "确认清空",
        content: `将清空 ${selectedDate.value} 的手工座位状态，仅保留组局自动状态。`,
        success: async (res) => {
          var _a, _b;
          if (!res.confirm)
            return;
          saving.value = true;
          try {
            const result = await common_vendor.wx$1.cloud.callFunction({
              name: "game-service",
              data: {
                action: "setSeatStatusOverrides",
                data: { date: selectedDate.value, overrides: {} }
              }
            });
            if (((_a = result == null ? void 0 : result.result) == null ? void 0 : _a.code) === 0) {
              common_vendor.index.showToast({ title: "已清空", icon: "success" });
              await refreshData();
            } else {
              common_vendor.index.showToast({ title: ((_b = result == null ? void 0 : result.result) == null ? void 0 : _b.message) || "清空失败", icon: "none" });
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/admin/admin.vue:355", "清空手工状态失败:", error);
            common_vendor.index.showToast({ title: "清空失败", icon: "none" });
          } finally {
            saving.value = false;
          }
        }
      });
    };
    const onDateChange = async (e) => {
      selectedDate.value = e.detail.value;
      await refreshData();
    };
    const guardAdmin = () => {
      if (!isAdmin.value) {
        redirectNonAdmin();
        return false;
      }
      return true;
    };
    const goAnnouncementManage = () => {
      if (guardAdmin())
        common_vendor.index.navigateTo({ url: "/pages/admin/announcement" });
    };
    const goHonorManage = () => {
      if (guardAdmin())
        common_vendor.index.navigateTo({ url: "/pages/admin/honor" });
    };
    const goWikiManage = () => {
      if (guardAdmin())
        common_vendor.index.navigateTo({ url: "/pages/admin/wiki" });
    };
    const goUserManage = () => {
      if (guardAdmin())
        common_vendor.index.navigateTo({ url: "/pages/admin/user-manage" });
    };
    const goAdminGuide = () => {
      if (guardAdmin())
        common_vendor.index.navigateTo({ url: "/pages/admin/guide" });
    };
    common_vendor.onShow(() => {
      refreshData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(selectedDateLabel.value),
        b: selectedDate.value,
        c: common_vendor.o(onDateChange, "1d"),
        d: common_vendor.t(refreshing.value ? "刷新中..." : "刷新"),
        e: refreshing.value ? 1 : "",
        f: common_vendor.o(refreshData, "d8"),
        g: !isAdmin.value
      }, !isAdmin.value ? {} : {
        h: common_vendor.t(arcadeRoom.value.name),
        i: common_vendor.t(getSeatStatusText(arcadeRoom.value.status)),
        j: common_vendor.n(getSeatStatusClass(arcadeRoom.value.status)),
        k: common_vendor.o(($event) => onAdminSeatTap(arcadeRoom.value), "98"),
        l: common_vendor.t(interArcade1.value.name),
        m: common_vendor.t(getSeatStatusText(interArcade1.value.status)),
        n: common_vendor.n(getSeatStatusClass(interArcade1.value.status)),
        o: common_vendor.o(($event) => onAdminSeatTap(interArcade1.value), "70"),
        p: common_vendor.t(interArcade2.value.name),
        q: common_vendor.t(getSeatStatusText(interArcade2.value.status)),
        r: common_vendor.n(getSeatStatusClass(interArcade2.value.status)),
        s: common_vendor.o(($event) => onAdminSeatTap(interArcade2.value), "88"),
        t: common_vendor.t(interDesk.value.name),
        v: common_vendor.t(getSeatStatusText(interDesk.value.status)),
        w: common_vendor.n(getSeatStatusClass(interDesk.value.status)),
        x: common_vendor.o(($event) => onAdminSeatTap(interDesk.value), "83"),
        y: common_vendor.t(hallDeskRows.value[2][1].name),
        z: common_vendor.t(getSeatStatusText(hallDeskRows.value[2][1].status)),
        A: common_vendor.n(getSeatStatusClass(hallDeskRows.value[2][1].status)),
        B: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[2][1]), "0e"),
        C: common_vendor.t(hallDeskRows.value[2][0].name),
        D: common_vendor.t(getSeatStatusText(hallDeskRows.value[2][0].status)),
        E: common_vendor.n(getSeatStatusClass(hallDeskRows.value[2][0].status)),
        F: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[2][0]), "9a"),
        G: common_vendor.t(arcadeHall.value.name),
        H: common_vendor.t(getSeatStatusText(arcadeHall.value.status)),
        I: common_vendor.n(getSeatStatusClass(arcadeHall.value.status)),
        J: common_vendor.o(($event) => onAdminSeatTap(arcadeHall.value), "dc"),
        K: common_vendor.t(hallDeskRows.value[0][0].name),
        L: common_vendor.t(getSeatStatusText(hallDeskRows.value[0][0].status)),
        M: common_vendor.n(getSeatStatusClass(hallDeskRows.value[0][0].status)),
        N: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[0][0]), "9f"),
        O: common_vendor.t(hallDeskRows.value[0][1].name),
        P: common_vendor.t(getSeatStatusText(hallDeskRows.value[0][1].status)),
        Q: common_vendor.n(getSeatStatusClass(hallDeskRows.value[0][1].status)),
        R: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[0][1]), "f1"),
        S: common_vendor.t(hallDeskRows.value[1][0].name),
        T: common_vendor.t(getSeatStatusText(hallDeskRows.value[1][0].status)),
        U: common_vendor.n(getSeatStatusClass(hallDeskRows.value[1][0].status)),
        V: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[1][0]), "2c"),
        W: common_vendor.t(hallDeskRows.value[1][1].name),
        X: common_vendor.t(getSeatStatusText(hallDeskRows.value[1][1].status)),
        Y: common_vendor.n(getSeatStatusClass(hallDeskRows.value[1][1].status)),
        Z: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[1][1]), "09"),
        aa: common_vendor.t(floor2Bottom.value[1].name),
        ab: common_vendor.t(getSeatStatusText(floor2Bottom.value[1].status)),
        ac: common_vendor.n(getSeatStatusClass(floor2Bottom.value[1].status)),
        ad: common_vendor.o(($event) => onAdminSeatTap(floor2Bottom.value[1]), "49"),
        ae: common_vendor.t(floor2Bottom.value[0].name),
        af: common_vendor.t(getSeatStatusText(floor2Bottom.value[0].status)),
        ag: common_vendor.n(getSeatStatusClass(floor2Bottom.value[0].status)),
        ah: common_vendor.o(($event) => onAdminSeatTap(floor2Bottom.value[0]), "65"),
        ai: common_vendor.t(floor2Left.value[3].name),
        aj: common_vendor.t(getSeatStatusText(floor2Left.value[3].status)),
        ak: common_vendor.n(getSeatStatusClass(floor2Left.value[3].status)),
        al: common_vendor.o(($event) => onAdminSeatTap(floor2Left.value[3]), "1a"),
        am: common_vendor.t(floor2Left.value[2].name),
        an: common_vendor.t(getSeatStatusText(floor2Left.value[2].status)),
        ao: common_vendor.n(getSeatStatusClass(floor2Left.value[2].status)),
        ap: common_vendor.o(($event) => onAdminSeatTap(floor2Left.value[2]), "ab"),
        aq: common_vendor.t(floor2Left.value[1].name),
        ar: common_vendor.t(getSeatStatusText(floor2Left.value[1].status)),
        as: common_vendor.n(getSeatStatusClass(floor2Left.value[1].status)),
        at: common_vendor.o(($event) => onAdminSeatTap(floor2Left.value[1]), "82"),
        av: common_vendor.t(floor2Left.value[0].name),
        aw: common_vendor.t(getSeatStatusText(floor2Left.value[0].status)),
        ax: common_vendor.n(getSeatStatusClass(floor2Left.value[0].status)),
        ay: common_vendor.o(($event) => onAdminSeatTap(floor2Left.value[0]), "97"),
        az: common_vendor.t(saving.value ? "保存中..." : "保存所有修改"),
        aA: saving.value ? 1 : "",
        aB: common_vendor.o(saveOverrides, "05"),
        aC: saving.value ? 1 : "",
        aD: common_vendor.o(resetManualOverrides, "de"),
        aE: common_vendor.o(goAnnouncementManage, "46"),
        aF: common_vendor.o(goHonorManage, "98"),
        aG: common_vendor.o(goWikiManage, "0e"),
        aH: common_vendor.o(goUserManage, "a7"),
        aI: common_vendor.o(goAdminGuide, "c7")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dbc77958"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/admin.js.map
