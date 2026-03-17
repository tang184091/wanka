"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_user = require("../../utils/user.js");
const _sfc_main = {
  __name: "seat",
  setup(__props) {
    const refreshing = common_vendor.ref(false);
    const seatLegend = common_vendor.ref([
      { status: "available", label: "空闲中" },
      { status: "reserved", label: "预约中" },
      { status: "occupied", label: "使用中" }
    ]);
    const floor2Left = common_vendor.ref([
      { id: "f2-bg-1", name: "桌游房1", type: "boardgame", status: "available", capacity: 8, device: "桌游桌 + 置物架" },
      { id: "f2-mj-1", name: "立直麻将房1", type: "mahjong", status: "available", capacity: 4, device: "自动麻将机" },
      { id: "f2-mj-2", name: "立直麻将房2", type: "mahjong", status: "available", capacity: 4, device: "自动麻将机" },
      { id: "f2-mj-3", name: "立直麻将房3", type: "mahjong", status: "available", capacity: 4, device: "自动麻将机" }
    ]);
    const floor2Bottom = common_vendor.ref([
      { id: "f2-bg-2", name: "桌游房2", type: "boardgame", status: "available", capacity: 8, device: "桌游桌 + 展示柜" },
      { id: "f2-mj-4", name: "立直麻将房4", type: "mahjong", status: "available", capacity: 4, device: "自动麻将机" }
    ]);
    const hallDeskRows = common_vendor.ref([
      [
        { id: "f1-desk-1", name: "大厅桌游1", type: "boardgame", status: "available", capacity: 6, device: "桌游桌" },
        { id: "f1-desk-2", name: "大厅桌游2", type: "boardgame", status: "available", capacity: 6, device: "桌游桌" }
      ],
      [
        { id: "f1-desk-3", name: "大厅桌游3", type: "boardgame", status: "available", capacity: 6, device: "桌游桌" },
        { id: "f1-desk-4", name: "大厅桌游4", type: "boardgame", status: "available", capacity: 6, device: "桌游桌" }
      ],
      [
        { id: "f1-desk-5", name: "大厅桌游5", type: "boardgame", status: "available", capacity: 6, device: "桌游桌" },
        { id: "f1-desk-6", name: "大厅桌游6", type: "boardgame", status: "available", capacity: 6, device: "桌游桌" }
      ]
    ]);
    const arcadeHall = common_vendor.ref({ id: "f1-arcade-hall", name: "电玩大厅", type: "videogame", status: "available", capacity: 8, device: "多台主机 + 大屏显示器" });
    const interDesk = common_vendor.ref({ id: "f1-inter-desk", name: "间层桌游", type: "boardgame", status: "available", capacity: 8, device: "桌游桌" });
    const interArcade1 = common_vendor.ref({ id: "f1-inter-arcade-1", name: "间层电玩1", type: "videogame", status: "available", capacity: 2, device: "PS5 + 电视" });
    const interArcade2 = common_vendor.ref({ id: "f1-inter-arcade-2", name: "间层电玩2", type: "videogame", status: "available", capacity: 2, device: "Switch + 显示器" });
    const arcadeRoom = common_vendor.ref({ id: "f1-arcade-room", name: "电玩房", type: "videogame", status: "available", capacity: 4, device: "PS5 + Xbox + 4K电视" });
    const getSeatStatusClass = (status) => {
      const map = {
        available: "status-available",
        reserved: "status-reserved",
        occupied: "status-occupied"
      };
      return map[status] || "status-available";
    };
    const getSeatStatusText = (status) => {
      const map = {
        available: "空闲中",
        reserved: "预约中",
        occupied: "使用中"
      };
      return map[status] || "空闲中";
    };
    const setSeatStatusByName = (name, statusMap) => {
      return statusMap[name] || "available";
    };
    const refreshSeatStatus = async () => {
      var _a, _b;
      try {
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: {
            action: "getSeatStatus",
            data: {}
          }
        });
        const statusMap = ((_b = (_a = res == null ? void 0 : res.result) == null ? void 0 : _a.data) == null ? void 0 : _b.statusByLocation) || {};
        floor2Left.value = floor2Left.value.map((item) => ({
          ...item,
          status: setSeatStatusByName(item.name, statusMap)
        }));
        floor2Bottom.value = floor2Bottom.value.map((item) => ({
          ...item,
          status: setSeatStatusByName(item.name, statusMap)
        }));
        hallDeskRows.value = hallDeskRows.value.map((row) => row.map((item) => ({
          ...item,
          status: setSeatStatusByName(item.name, statusMap)
        })));
        arcadeHall.value = { ...arcadeHall.value, status: setSeatStatusByName(arcadeHall.value.name, statusMap) };
        interDesk.value = { ...interDesk.value, status: setSeatStatusByName(interDesk.value.name, statusMap) };
        interArcade1.value = { ...interArcade1.value, status: setSeatStatusByName(interArcade1.value.name, statusMap) };
        interArcade2.value = { ...interArcade2.value, status: setSeatStatusByName(interArcade2.value.name, statusMap) };
        arcadeRoom.value = { ...arcadeRoom.value, status: setSeatStatusByName(arcadeRoom.value.name, statusMap) };
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/seat/seat.vue:220", "获取座位状态失败:", error);
      }
    };
    const handleRefresh = async () => {
      if (refreshing.value)
        return;
      refreshing.value = true;
      try {
        await refreshSeatStatus();
        common_vendor.index.showToast({ title: "已刷新", icon: "success", duration: 1200 });
      } finally {
        refreshing.value = false;
      }
    };
    common_vendor.onShow(() => {
      handleRefresh();
    });
    const goToCreateWithPreset = (seat) => {
      const currentUser = utils_user.UserService.getCurrentUser();
      if (!currentUser) {
        common_vendor.index.showModal({
          title: "需要登录",
          content: "请先登录后再创建组局",
          confirmText: "去登录",
          success: (res) => {
            if (res.confirm) {
              common_vendor.index.switchTab({ url: "/pages/user/user" });
            }
          }
        });
        return;
      }
      const typeProjectMap = {
        mahjong: "立直麻将局",
        boardgame: "桌游局",
        videogame: "电玩局"
      };
      common_vendor.index.navigateTo({
        url: `/pages/create/create?type=${encodeURIComponent(seat.type)}&location=${encodeURIComponent(seat.name)}&project=${encodeURIComponent(typeProjectMap[seat.type] || "娱乐局")}`
      });
    };
    const onSeatTap = (seat) => {
      const baseInfo = `${seat.name}
状态：${getSeatStatusText(seat.status)}
容量：${seat.capacity}人
设备：${seat.device}`;
      if (seat.status !== "available") {
        common_vendor.index.showModal({
          title: "座位详情",
          content: baseInfo,
          showCancel: false
        });
        return;
      }
      common_vendor.index.showModal({
        title: "快捷创建组局",
        content: `${baseInfo}

该位置空闲，是否立即创建对应类型组局？`,
        confirmText: "立即创建",
        success: (res) => {
          if (res.confirm) {
            goToCreateWithPreset(seat);
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(refreshing.value ? "刷新中..." : "刷新"),
        b: refreshing.value ? 1 : "",
        c: common_vendor.o(handleRefresh, "7f"),
        d: common_vendor.f(seatLegend.value, (item, k0, i0) => {
          return {
            a: common_vendor.n(`dot-${item.status}`),
            b: common_vendor.t(item.label),
            c: item.status
          };
        }),
        e: common_vendor.t(hallDeskRows.value[0][0].name),
        f: common_vendor.t(getSeatStatusText(hallDeskRows.value[0][0].status)),
        g: common_vendor.n(getSeatStatusClass(hallDeskRows.value[0][0].status)),
        h: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[0][0]), "5f"),
        i: common_vendor.t(hallDeskRows.value[0][1].name),
        j: common_vendor.t(getSeatStatusText(hallDeskRows.value[0][1].status)),
        k: common_vendor.n(getSeatStatusClass(hallDeskRows.value[0][1].status)),
        l: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[0][1]), "f2"),
        m: common_vendor.t(arcadeHall.value.name),
        n: common_vendor.t(getSeatStatusText(arcadeHall.value.status)),
        o: common_vendor.n(getSeatStatusClass(arcadeHall.value.status)),
        p: common_vendor.o(($event) => onSeatTap(arcadeHall.value), "6a"),
        q: common_vendor.t(hallDeskRows.value[1][0].name),
        r: common_vendor.t(getSeatStatusText(hallDeskRows.value[1][0].status)),
        s: common_vendor.n(getSeatStatusClass(hallDeskRows.value[1][0].status)),
        t: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[1][0]), "c1"),
        v: common_vendor.t(hallDeskRows.value[1][1].name),
        w: common_vendor.t(getSeatStatusText(hallDeskRows.value[1][1].status)),
        x: common_vendor.n(getSeatStatusClass(hallDeskRows.value[1][1].status)),
        y: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[1][1]), "b6"),
        z: common_vendor.t(interDesk.value.name),
        A: common_vendor.t(getSeatStatusText(interDesk.value.status)),
        B: common_vendor.n(getSeatStatusClass(interDesk.value.status)),
        C: common_vendor.o(($event) => onSeatTap(interDesk.value), "9b"),
        D: common_vendor.t(hallDeskRows.value[2][0].name),
        E: common_vendor.t(getSeatStatusText(hallDeskRows.value[2][0].status)),
        F: common_vendor.n(getSeatStatusClass(hallDeskRows.value[2][0].status)),
        G: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[2][0]), "02"),
        H: common_vendor.t(hallDeskRows.value[2][1].name),
        I: common_vendor.t(getSeatStatusText(hallDeskRows.value[2][1].status)),
        J: common_vendor.n(getSeatStatusClass(hallDeskRows.value[2][1].status)),
        K: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[2][1]), "d1"),
        L: common_vendor.t(interArcade1.value.name),
        M: common_vendor.t(getSeatStatusText(interArcade1.value.status)),
        N: common_vendor.n(getSeatStatusClass(interArcade1.value.status)),
        O: common_vendor.o(($event) => onSeatTap(interArcade1.value), "3b"),
        P: common_vendor.t(interArcade2.value.name),
        Q: common_vendor.t(getSeatStatusText(interArcade2.value.status)),
        R: common_vendor.n(getSeatStatusClass(interArcade2.value.status)),
        S: common_vendor.o(($event) => onSeatTap(interArcade2.value), "a7"),
        T: common_vendor.t(arcadeRoom.value.name),
        U: common_vendor.t(getSeatStatusText(arcadeRoom.value.status)),
        V: common_vendor.n(getSeatStatusClass(arcadeRoom.value.status)),
        W: common_vendor.o(($event) => onSeatTap(arcadeRoom.value), "c8"),
        X: common_vendor.t(floor2Left.value[0].name),
        Y: common_vendor.t(getSeatStatusText(floor2Left.value[0].status)),
        Z: common_vendor.n(getSeatStatusClass(floor2Left.value[0].status)),
        aa: common_vendor.o(($event) => onSeatTap(floor2Left.value[0]), "56"),
        ab: common_vendor.t(floor2Left.value[1].name),
        ac: common_vendor.t(getSeatStatusText(floor2Left.value[1].status)),
        ad: common_vendor.n(getSeatStatusClass(floor2Left.value[1].status)),
        ae: common_vendor.o(($event) => onSeatTap(floor2Left.value[1]), "72"),
        af: common_vendor.t(floor2Left.value[2].name),
        ag: common_vendor.t(getSeatStatusText(floor2Left.value[2].status)),
        ah: common_vendor.n(getSeatStatusClass(floor2Left.value[2].status)),
        ai: common_vendor.o(($event) => onSeatTap(floor2Left.value[2]), "b6"),
        aj: common_vendor.t(floor2Left.value[3].name),
        ak: common_vendor.t(getSeatStatusText(floor2Left.value[3].status)),
        al: common_vendor.n(getSeatStatusClass(floor2Left.value[3].status)),
        am: common_vendor.o(($event) => onSeatTap(floor2Left.value[3]), "ae"),
        an: common_vendor.t(floor2Bottom.value[0].name),
        ao: common_vendor.t(getSeatStatusText(floor2Bottom.value[0].status)),
        ap: common_vendor.n(getSeatStatusClass(floor2Bottom.value[0].status)),
        aq: common_vendor.o(($event) => onSeatTap(floor2Bottom.value[0]), "12"),
        ar: common_vendor.t(floor2Bottom.value[1].name),
        as: common_vendor.t(getSeatStatusText(floor2Bottom.value[1].status)),
        at: common_vendor.n(getSeatStatusClass(floor2Bottom.value[1].status)),
        av: common_vendor.o(($event) => onSeatTap(floor2Bottom.value[1]), "0a")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f89a1d25"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/seat/seat.js.map
