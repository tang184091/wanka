"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "admin",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const saving = common_vendor.ref(false);
    const statusValues = ["available", "reserved", "occupied"];
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
    const getSeatStatusClass = (status) => ({ available: "status-available", reserved: "status-reserved", occupied: "status-occupied" })[status] || "status-available";
    const getSeatStatusText = (status) => ({ available: "空闲中", reserved: "预约中", occupied: "使用中" })[status] || "空闲中";
    const setSeatStatusByName = (name, statusMap) => statusMap[name] || "available";
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
      if (!isAdmin.value) {
        redirectNonAdmin();
      }
    };
    const loadManageData = async () => {
      await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "getAdminManageData", data: {} } });
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
        floor2Left.value = floor2Left.value.map((item) => ({ ...item, status: setSeatStatusByName(item.name, statusMap) }));
        floor2Bottom.value = floor2Bottom.value.map((item) => ({ ...item, status: setSeatStatusByName(item.name, statusMap) }));
        hallDeskRows.value = hallDeskRows.value.map((row) => row.map((item) => ({ ...item, status: setSeatStatusByName(item.name, statusMap) })));
        arcadeHall.value = { ...arcadeHall.value, status: setSeatStatusByName(arcadeHall.value.name, statusMap) };
        interDesk.value = { ...interDesk.value, status: setSeatStatusByName(interDesk.value.name, statusMap) };
        interArcade1.value = { ...interArcade1.value, status: setSeatStatusByName(interArcade1.value.name, statusMap) };
        interArcade2.value = { ...interArcade2.value, status: setSeatStatusByName(interArcade2.value.name, statusMap) };
        arcadeRoom.value = { ...arcadeRoom.value, status: setSeatStatusByName(arcadeRoom.value.name, statusMap) };
        await loadManageData();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:238", "刷新管理员数据失败:", error);
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
      flatSeats.forEach((item) => {
        overrides[item.name] = item.status || "available";
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
          data: { action: "setSeatStatusOverrides", data: { overrides: collectOverrides() } }
        });
        if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
          await refreshData();
        } else {
          common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "保存失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/admin/admin.vue:288", "保存管理员座位状态失败:", error);
        common_vendor.index.showToast({ title: "保存失败", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    const goYakumanManage = () => {
      if (!isAdmin.value)
        return redirectNonAdmin();
      common_vendor.index.navigateTo({ url: "/pages/admin/yakuman" });
    };
    const goRecordManage = () => {
      if (!isAdmin.value)
        return redirectNonAdmin();
      common_vendor.index.navigateTo({ url: "/pages/admin/records" });
    };
    const goGameManage = () => {
      if (!isAdmin.value)
        return redirectNonAdmin();
      common_vendor.index.navigateTo({ url: "/pages/admin/games" });
    };
    const goHonorManage = () => {
      if (!isAdmin.value)
        return redirectNonAdmin();
      common_vendor.index.navigateTo({ url: "/pages/admin/honor" });
    };
    common_vendor.onShow(() => {
      refreshData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(refreshing.value ? "刷新中..." : "刷新"),
        b: refreshing.value ? 1 : "",
        c: common_vendor.o(refreshData, "d6"),
        d: !isAdmin.value
      }, !isAdmin.value ? {} : {
        e: common_vendor.t(arcadeRoom.value.name),
        f: common_vendor.t(getSeatStatusText(arcadeRoom.value.status)),
        g: common_vendor.n(getSeatStatusClass(arcadeRoom.value.status)),
        h: common_vendor.o(($event) => onAdminSeatTap(arcadeRoom.value), "f5"),
        i: common_vendor.t(interArcade1.value.name),
        j: common_vendor.t(getSeatStatusText(interArcade1.value.status)),
        k: common_vendor.n(getSeatStatusClass(interArcade1.value.status)),
        l: common_vendor.o(($event) => onAdminSeatTap(interArcade1.value), "31"),
        m: common_vendor.t(interArcade2.value.name),
        n: common_vendor.t(getSeatStatusText(interArcade2.value.status)),
        o: common_vendor.n(getSeatStatusClass(interArcade2.value.status)),
        p: common_vendor.o(($event) => onAdminSeatTap(interArcade2.value), "b0"),
        q: common_vendor.t(interDesk.value.name),
        r: common_vendor.t(getSeatStatusText(interDesk.value.status)),
        s: common_vendor.n(getSeatStatusClass(interDesk.value.status)),
        t: common_vendor.o(($event) => onAdminSeatTap(interDesk.value), "99"),
        v: common_vendor.t(hallDeskRows.value[2][1].name),
        w: common_vendor.t(getSeatStatusText(hallDeskRows.value[2][1].status)),
        x: common_vendor.n(getSeatStatusClass(hallDeskRows.value[2][1].status)),
        y: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[2][1]), "6b"),
        z: common_vendor.t(hallDeskRows.value[2][0].name),
        A: common_vendor.t(getSeatStatusText(hallDeskRows.value[2][0].status)),
        B: common_vendor.n(getSeatStatusClass(hallDeskRows.value[2][0].status)),
        C: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[2][0]), "ca"),
        D: common_vendor.t(arcadeHall.value.name),
        E: common_vendor.t(getSeatStatusText(arcadeHall.value.status)),
        F: common_vendor.n(getSeatStatusClass(arcadeHall.value.status)),
        G: common_vendor.o(($event) => onAdminSeatTap(arcadeHall.value), "d9"),
        H: common_vendor.t(hallDeskRows.value[0][0].name),
        I: common_vendor.t(getSeatStatusText(hallDeskRows.value[0][0].status)),
        J: common_vendor.n(getSeatStatusClass(hallDeskRows.value[0][0].status)),
        K: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[0][0]), "c9"),
        L: common_vendor.t(hallDeskRows.value[0][1].name),
        M: common_vendor.t(getSeatStatusText(hallDeskRows.value[0][1].status)),
        N: common_vendor.n(getSeatStatusClass(hallDeskRows.value[0][1].status)),
        O: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[0][1]), "41"),
        P: common_vendor.t(hallDeskRows.value[1][0].name),
        Q: common_vendor.t(getSeatStatusText(hallDeskRows.value[1][0].status)),
        R: common_vendor.n(getSeatStatusClass(hallDeskRows.value[1][0].status)),
        S: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[1][0]), "8d"),
        T: common_vendor.t(hallDeskRows.value[1][1].name),
        U: common_vendor.t(getSeatStatusText(hallDeskRows.value[1][1].status)),
        V: common_vendor.n(getSeatStatusClass(hallDeskRows.value[1][1].status)),
        W: common_vendor.o(($event) => onAdminSeatTap(hallDeskRows.value[1][1]), "e0"),
        X: common_vendor.t(floor2Bottom.value[1].name),
        Y: common_vendor.t(getSeatStatusText(floor2Bottom.value[1].status)),
        Z: common_vendor.n(getSeatStatusClass(floor2Bottom.value[1].status)),
        aa: common_vendor.o(($event) => onAdminSeatTap(floor2Bottom.value[1]), "35"),
        ab: common_vendor.t(floor2Bottom.value[0].name),
        ac: common_vendor.t(getSeatStatusText(floor2Bottom.value[0].status)),
        ad: common_vendor.n(getSeatStatusClass(floor2Bottom.value[0].status)),
        ae: common_vendor.o(($event) => onAdminSeatTap(floor2Bottom.value[0]), "3a"),
        af: common_vendor.t(floor2Left.value[3].name),
        ag: common_vendor.t(getSeatStatusText(floor2Left.value[3].status)),
        ah: common_vendor.n(getSeatStatusClass(floor2Left.value[3].status)),
        ai: common_vendor.o(($event) => onAdminSeatTap(floor2Left.value[3]), "c1"),
        aj: common_vendor.t(floor2Left.value[2].name),
        ak: common_vendor.t(getSeatStatusText(floor2Left.value[2].status)),
        al: common_vendor.n(getSeatStatusClass(floor2Left.value[2].status)),
        am: common_vendor.o(($event) => onAdminSeatTap(floor2Left.value[2]), "9b"),
        an: common_vendor.t(floor2Left.value[1].name),
        ao: common_vendor.t(getSeatStatusText(floor2Left.value[1].status)),
        ap: common_vendor.n(getSeatStatusClass(floor2Left.value[1].status)),
        aq: common_vendor.o(($event) => onAdminSeatTap(floor2Left.value[1]), "53"),
        ar: common_vendor.t(floor2Left.value[0].name),
        as: common_vendor.t(getSeatStatusText(floor2Left.value[0].status)),
        at: common_vendor.n(getSeatStatusClass(floor2Left.value[0].status)),
        av: common_vendor.o(($event) => onAdminSeatTap(floor2Left.value[0]), "7f"),
        aw: common_vendor.t(saving.value ? "保存中..." : "保存所有修改"),
        ax: saving.value ? 1 : "",
        ay: common_vendor.o(saveOverrides, "f7"),
        az: common_vendor.o(goYakumanManage, "5f"),
        aA: common_vendor.o(goRecordManage, "88"),
        aB: common_vendor.o(goGameManage, "66"),
        aC: common_vendor.o(goHonorManage, "00")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dbc77958"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/admin.js.map
