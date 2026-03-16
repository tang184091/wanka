"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_user = require("../../utils/user.js");
const _sfc_main = {
  __name: "seat",
  setup(__props) {
    const seatLegend = common_vendor.ref([
      { status: "available", label: "空闲中" },
      { status: "reserved", label: "预约中" },
      { status: "occupied", label: "使用中" }
    ]);
    const floor2Left = common_vendor.ref([
      { id: "f2-bg-1", name: "桌游房1", type: "boardgame", status: "available", capacity: 8, device: "桌游桌 + 置物架" },
      { id: "f2-mj-1", name: "日麻房1", type: "mahjong", status: "available", capacity: 4, device: "自动麻将机" },
      { id: "f2-mj-2", name: "日麻房2", type: "mahjong", status: "available", capacity: 4, device: "自动麻将机" },
      { id: "f2-mj-3", name: "日麻房3", type: "mahjong", status: "available", capacity: 4, device: "自动麻将机" }
    ]);
    const floor2Bottom = common_vendor.ref([
      { id: "f2-bg-2", name: "桌游房2", type: "boardgame", status: "available", capacity: 8, device: "桌游桌 + 展示柜" },
      { id: "f2-mj-4", name: "日麻房4", type: "mahjong", status: "available", capacity: 4, device: "自动麻将机" }
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
        common_vendor.index.__f__("error", "at pages/seat/seat.vue:187", "获取座位状态失败:", error);
      }
    };
    common_vendor.onShow(() => {
      refreshSeatStatus();
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
        mahjong: "日麻局",
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
        a: common_vendor.f(seatLegend.value, (item, k0, i0) => {
          return {
            a: common_vendor.n(`dot-${item.status}`),
            b: common_vendor.t(item.label),
            c: item.status
          };
        }),
        b: common_vendor.f(hallDeskRows.value, (row, k0, i0) => {
          return {
            a: common_vendor.f(row, (seat, k1, i1) => {
              return {
                a: common_vendor.t(seat.name),
                b: common_vendor.t(getSeatStatusText(seat.status)),
                c: seat.id,
                d: common_vendor.n(getSeatStatusClass(seat.status)),
                e: common_vendor.o(($event) => onSeatTap(seat), seat.id)
              };
            }),
            b: row[0].id
          };
        }),
        c: common_vendor.t(arcadeHall.value.name),
        d: common_vendor.t(getSeatStatusText(arcadeHall.value.status)),
        e: common_vendor.n(getSeatStatusClass(arcadeHall.value.status)),
        f: common_vendor.o(($event) => onSeatTap(arcadeHall.value), "09"),
        g: common_vendor.t(interDesk.value.name),
        h: common_vendor.t(getSeatStatusText(interDesk.value.status)),
        i: common_vendor.n(getSeatStatusClass(interDesk.value.status)),
        j: common_vendor.o(($event) => onSeatTap(interDesk.value), "31"),
        k: common_vendor.t(interArcade1.value.name),
        l: common_vendor.t(getSeatStatusText(interArcade1.value.status)),
        m: common_vendor.n(getSeatStatusClass(interArcade1.value.status)),
        n: common_vendor.o(($event) => onSeatTap(interArcade1.value), "d5"),
        o: common_vendor.t(interArcade2.value.name),
        p: common_vendor.t(getSeatStatusText(interArcade2.value.status)),
        q: common_vendor.n(getSeatStatusClass(interArcade2.value.status)),
        r: common_vendor.o(($event) => onSeatTap(interArcade2.value), "9e"),
        s: common_vendor.t(arcadeRoom.value.name),
        t: common_vendor.t(getSeatStatusText(arcadeRoom.value.status)),
        v: common_vendor.n(getSeatStatusClass(arcadeRoom.value.status)),
        w: common_vendor.o(($event) => onSeatTap(arcadeRoom.value), "4b"),
        x: common_vendor.f(floor2Left.value, (seat, k0, i0) => {
          return {
            a: common_vendor.t(seat.name),
            b: common_vendor.t(getSeatStatusText(seat.status)),
            c: seat.id,
            d: common_vendor.n(getSeatStatusClass(seat.status)),
            e: common_vendor.o(($event) => onSeatTap(seat), seat.id)
          };
        }),
        y: common_vendor.f(floor2Bottom.value, (seat, k0, i0) => {
          return {
            a: common_vendor.t(seat.name),
            b: common_vendor.t(getSeatStatusText(seat.status)),
            c: seat.id,
            d: common_vendor.n(getSeatStatusClass(seat.status)),
            e: common_vendor.o(($event) => onSeatTap(seat), seat.id)
          };
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f89a1d25"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/seat/seat.js.map
