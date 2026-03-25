"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_user = require("../../utils/user.js");
const SEAT_REFRESH_INTERVAL = 1e4;
const _sfc_main = {
  __name: "seat",
  setup(__props) {
    const refreshing = common_vendor.ref(false);
    const announcementContent = common_vendor.ref("");
    const today = /* @__PURE__ */ new Date();
    const selectedDate = common_vendor.ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
    const selectedDateLabel = common_vendor.computed(() => `日期：${selectedDate.value}`);
    const pickerMode = common_vendor.ref(false);
    let seatRefreshTimer = null;
    const floor2Left = common_vendor.ref([
      { id: "f2-bg-1", name: "桌游房1", type: "boardgame", status: "available", capacity: 8, device: "桌游桌" },
      { id: "f2-mj-1", name: "立直麻将房1", type: "mahjong", status: "available", capacity: 4, device: "四口机" },
      { id: "f2-mj-2", name: "立直麻将房2", type: "mahjong", status: "available", capacity: 4, device: "四口机/八口机" },
      { id: "f2-mj-3", name: "立直麻将房3", type: "mahjong", status: "available", capacity: 4, device: "八口机" }
    ]);
    const floor2Bottom = common_vendor.ref([
      { id: "f2-bg-2", name: "桌游房2", type: "boardgame", status: "available", capacity: 8, device: "桌游桌 + 展示柜" },
      { id: "f2-mj-4", name: "立直麻将房4", type: "mahjong", status: "available", capacity: 4, device: "八口机" }
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
    const interArcade1 = common_vendor.ref({ id: "f1-inter-arcade-1", name: "间层电玩1", type: "videogame", status: "available", capacity: 2, device: "主机 + 电视" });
    const interArcade2 = common_vendor.ref({ id: "f1-inter-arcade-2", name: "间层电玩2", type: "videogame", status: "available", capacity: 2, device: "主机 + 电视" });
    const arcadeRoom = common_vendor.ref({ id: "f1-arcade-room", name: "电玩房", type: "videogame", status: "available", capacity: 4, device: "主机 + 电视" });
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
    const refreshSeatStatus = async () => {
      var _a, _b;
      try {
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
        common_vendor.index.__f__("error", "at pages/seat/seat.vue:200", "获取座位状态失败:", error);
      }
    };
    const loadSeatAnnouncement = async () => {
      var _a, _b, _c;
      try {
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: { action: "getSeatAnnouncement", data: {} }
        });
        if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
          announcementContent.value = String(((_c = (_b = res.result) == null ? void 0 : _b.data) == null ? void 0 : _c.content) || "");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/seat/seat.vue:214", "获取公告失败:", error);
      }
    };
    const handleRefresh = async () => {
      if (refreshing.value)
        return;
      refreshing.value = true;
      try {
        await Promise.all([refreshSeatStatus(), loadSeatAnnouncement()]);
        common_vendor.index.showToast({ title: "已刷新", icon: "success", duration: 1200 });
      } finally {
        refreshing.value = false;
      }
    };
    common_vendor.onLoad((options = {}) => {
      if (String(options.picker || "") === "1") {
        pickerMode.value = true;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(options.date || ""))) {
        selectedDate.value = String(options.date);
      }
    });
    const onDateChange = async (e) => {
      selectedDate.value = e.detail.value;
      await handleRefresh();
    };
    const stopAutoRefresh = () => {
      if (seatRefreshTimer) {
        clearInterval(seatRefreshTimer);
        seatRefreshTimer = null;
      }
    };
    common_vendor.onShow(() => {
      handleRefresh();
      stopAutoRefresh();
      seatRefreshTimer = setInterval(() => {
        refreshSeatStatus();
      }, SEAT_REFRESH_INTERVAL);
    });
    common_vendor.onHide(() => {
      stopAutoRefresh();
    });
    common_vendor.onUnload(() => {
      stopAutoRefresh();
    });
    const goToCreateWithPreset = (seat) => {
      const currentUser = utils_user.UserService.getCurrentUser();
      if (!currentUser) {
        common_vendor.index.showModal({
          title: "需要登录",
          content: "请先登录后再创建组局",
          confirmText: "去登录",
          success: (res) => {
            if (res.confirm)
              common_vendor.index.switchTab({ url: "/pages/user/user" });
          }
        });
        return;
      }
      const typeProjectMap = {
        mahjong: "立直麻将局",
        boardgame: "桌游局",
        videogame: "电玩局",
        cardgame: "打牌局"
      };
      common_vendor.index.navigateTo({
        url: `/pages/create/create?type=${encodeURIComponent(seat.type)}&location=${encodeURIComponent(seat.name)}&project=${encodeURIComponent(typeProjectMap[seat.type] || "娱乐局")}&date=${encodeURIComponent(selectedDate.value)}`
      });
    };
    const onSeatTap = (seat) => {
      if (pickerMode.value) {
        if (seat.status !== "available") {
          common_vendor.index.showToast({ title: "该座位已被占用或预约", icon: "none" });
          return;
        }
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const eventChannel = currentPage && currentPage.getOpenerEventChannel ? currentPage.getOpenerEventChannel() : null;
        if (eventChannel) {
          eventChannel.emit("seatPicked", {
            location: seat.name,
            type: seat.type,
            date: selectedDate.value
          });
        }
        common_vendor.index.navigateBack();
        return;
      }
      const baseInfo = `${seat.name}
状态：${getSeatStatusText(seat.status)}
容量：${seat.capacity}人
设备：${seat.device}`;
      if (seat.status !== "available") {
        common_vendor.index.showModal({ title: "座位详情", content: baseInfo, showCancel: false });
        return;
      }
      common_vendor.index.showModal({
        title: "快捷创建组局",
        content: `${baseInfo}

该位置空闲，是否立即创建对应类型组局？`,
        confirmText: "立即创建",
        success: (res) => {
          if (res.confirm)
            goToCreateWithPreset(seat);
        }
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(selectedDateLabel.value),
        b: selectedDate.value,
        c: common_vendor.o(onDateChange, "86"),
        d: common_vendor.t(refreshing.value ? "刷新中..." : "刷新"),
        e: refreshing.value ? 1 : "",
        f: common_vendor.o(handleRefresh, "53"),
        g: common_vendor.t(arcadeRoom.value.name),
        h: common_vendor.t(getSeatStatusText(arcadeRoom.value.status)),
        i: common_vendor.n(getSeatStatusClass(arcadeRoom.value.status)),
        j: common_vendor.o(($event) => onSeatTap(arcadeRoom.value), "12"),
        k: common_vendor.t(interArcade1.value.name),
        l: common_vendor.t(getSeatStatusText(interArcade1.value.status)),
        m: common_vendor.n(getSeatStatusClass(interArcade1.value.status)),
        n: common_vendor.o(($event) => onSeatTap(interArcade1.value), "94"),
        o: common_vendor.t(interArcade2.value.name),
        p: common_vendor.t(getSeatStatusText(interArcade2.value.status)),
        q: common_vendor.n(getSeatStatusClass(interArcade2.value.status)),
        r: common_vendor.o(($event) => onSeatTap(interArcade2.value), "25"),
        s: common_vendor.t(interDesk.value.name),
        t: common_vendor.t(getSeatStatusText(interDesk.value.status)),
        v: common_vendor.n(getSeatStatusClass(interDesk.value.status)),
        w: common_vendor.o(($event) => onSeatTap(interDesk.value), "33"),
        x: common_vendor.t(hallDeskRows.value[2][1].name),
        y: common_vendor.t(getSeatStatusText(hallDeskRows.value[2][1].status)),
        z: common_vendor.n(getSeatStatusClass(hallDeskRows.value[2][1].status)),
        A: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[2][1]), "67"),
        B: common_vendor.t(hallDeskRows.value[2][0].name),
        C: common_vendor.t(getSeatStatusText(hallDeskRows.value[2][0].status)),
        D: common_vendor.n(getSeatStatusClass(hallDeskRows.value[2][0].status)),
        E: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[2][0]), "a5"),
        F: common_vendor.t(arcadeHall.value.name),
        G: common_vendor.t(getSeatStatusText(arcadeHall.value.status)),
        H: common_vendor.n(getSeatStatusClass(arcadeHall.value.status)),
        I: common_vendor.o(($event) => onSeatTap(arcadeHall.value), "9a"),
        J: common_vendor.t(hallDeskRows.value[0][0].name),
        K: common_vendor.t(getSeatStatusText(hallDeskRows.value[0][0].status)),
        L: common_vendor.n(getSeatStatusClass(hallDeskRows.value[0][0].status)),
        M: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[0][0]), "73"),
        N: common_vendor.t(hallDeskRows.value[0][1].name),
        O: common_vendor.t(getSeatStatusText(hallDeskRows.value[0][1].status)),
        P: common_vendor.n(getSeatStatusClass(hallDeskRows.value[0][1].status)),
        Q: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[0][1]), "d4"),
        R: common_vendor.t(hallDeskRows.value[1][0].name),
        S: common_vendor.t(getSeatStatusText(hallDeskRows.value[1][0].status)),
        T: common_vendor.n(getSeatStatusClass(hallDeskRows.value[1][0].status)),
        U: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[1][0]), "ff"),
        V: common_vendor.t(hallDeskRows.value[1][1].name),
        W: common_vendor.t(getSeatStatusText(hallDeskRows.value[1][1].status)),
        X: common_vendor.n(getSeatStatusClass(hallDeskRows.value[1][1].status)),
        Y: common_vendor.o(($event) => onSeatTap(hallDeskRows.value[1][1]), "eb"),
        Z: common_vendor.t(floor2Bottom.value[1].name),
        aa: common_vendor.t(getSeatStatusText(floor2Bottom.value[1].status)),
        ab: common_vendor.n(getSeatStatusClass(floor2Bottom.value[1].status)),
        ac: common_vendor.o(($event) => onSeatTap(floor2Bottom.value[1]), "16"),
        ad: common_vendor.t(floor2Bottom.value[0].name),
        ae: common_vendor.t(getSeatStatusText(floor2Bottom.value[0].status)),
        af: common_vendor.n(getSeatStatusClass(floor2Bottom.value[0].status)),
        ag: common_vendor.o(($event) => onSeatTap(floor2Bottom.value[0]), "65"),
        ah: common_vendor.t(floor2Left.value[3].name),
        ai: common_vendor.t(getSeatStatusText(floor2Left.value[3].status)),
        aj: common_vendor.n(getSeatStatusClass(floor2Left.value[3].status)),
        ak: common_vendor.o(($event) => onSeatTap(floor2Left.value[3]), "87"),
        al: common_vendor.t(floor2Left.value[2].name),
        am: common_vendor.t(getSeatStatusText(floor2Left.value[2].status)),
        an: common_vendor.n(getSeatStatusClass(floor2Left.value[2].status)),
        ao: common_vendor.o(($event) => onSeatTap(floor2Left.value[2]), "4e"),
        ap: common_vendor.t(floor2Left.value[1].name),
        aq: common_vendor.t(getSeatStatusText(floor2Left.value[1].status)),
        ar: common_vendor.n(getSeatStatusClass(floor2Left.value[1].status)),
        as: common_vendor.o(($event) => onSeatTap(floor2Left.value[1]), "fa"),
        at: common_vendor.t(floor2Left.value[0].name),
        av: common_vendor.t(getSeatStatusText(floor2Left.value[0].status)),
        aw: common_vendor.n(getSeatStatusClass(floor2Left.value[0].status)),
        ax: common_vendor.o(($event) => onSeatTap(floor2Left.value[0]), "6c"),
        ay: common_vendor.t(announcementContent.value || "暂无公告")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f89a1d25"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/seat/seat.js.map
