"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_user = require("../../utils/user.js");
const _sfc_main = {
  __name: "seat",
  setup(__props) {
    const seatLegend = common_vendor.ref([
      { status: "available", label: "空闲" },
      { status: "occupied", label: "使用中" },
      { status: "reserved", label: "预约中" }
    ]);
    const upperRooms = common_vendor.ref([
      { id: "bg1", name: "桌游房1", type: "boardgame", status: "available", location: "玩咖二楼A房", capacity: 10, device: "桌游桌 + 置物架" },
      { id: "mj1", name: "日麻房1", type: "mahjong", status: "occupied", location: "玩咖二楼B房", capacity: 4, device: "自动麻将机" },
      { id: "mj2", name: "日麻房2", type: "mahjong", status: "available", location: "玩咖二楼C房", capacity: 4, device: "自动麻将机" },
      { id: "mj3", name: "日麻房3", type: "mahjong", status: "reserved", location: "玩咖二楼D房", capacity: 4, device: "自动麻将机" },
      { id: "mj4", name: "日麻房4", type: "mahjong", status: "available", location: "玩咖二楼E房", capacity: 4, device: "自动麻将机" },
      { id: "bg2", name: "桌游房2", type: "boardgame", status: "available", location: "玩咖二楼F房", capacity: 8, device: "桌游桌 + 展示柜" }
    ]);
    const hallSeats = common_vendor.ref([
      { id: "hbg1", name: "大厅桌游1", type: "boardgame", status: "available", location: "玩咖一楼大厅", capacity: 6, device: "桌游桌" },
      { id: "hbg2", name: "大厅桌游2", type: "boardgame", status: "available", location: "玩咖一楼大厅", capacity: 6, device: "桌游桌" },
      { id: "hbg3", name: "大厅桌游3", type: "boardgame", status: "occupied", location: "玩咖一楼大厅", capacity: 6, device: "桌游桌" },
      { id: "hbg4", name: "大厅桌游4", type: "boardgame", status: "available", location: "玩咖一楼大厅", capacity: 6, device: "桌游桌" },
      { id: "hbg5", name: "大厅桌游5", type: "boardgame", status: "reserved", location: "玩咖一楼大厅", capacity: 6, device: "桌游桌" },
      { id: "hbg6", name: "大厅桌游6", type: "boardgame", status: "available", location: "玩咖一楼大厅", capacity: 6, device: "桌游桌" },
      { id: "ivg1", name: "间层电玩1", type: "videogame", status: "available", location: "玩咖电玩区", capacity: 2, device: "PS5 + 电视" },
      { id: "ivg2", name: "间层电玩2", type: "videogame", status: "reserved", location: "玩咖电玩区", capacity: 2, device: "Switch + 显示器" }
    ]);
    const lowerArea = common_vendor.ref([
      { id: "vg-room", name: "电玩房", type: "videogame", status: "available", location: "玩咖电玩区", capacity: 4, device: "PS5 + Xbox + 4K电视" },
      { id: "inter-bg", name: "间层桌游", type: "boardgame", status: "available", location: "玩咖一楼大厅", capacity: 6, device: "桌游桌" }
    ]);
    const getSeatTypeClass = (type) => {
      const map = {
        videogame: "type-videogame",
        boardgame: "type-boardgame",
        mahjong: "type-mahjong"
      };
      return map[type] || "type-boardgame";
    };
    const getSeatStatusClass = (status) => {
      const map = {
        available: "status-available",
        occupied: "status-occupied",
        reserved: "status-reserved"
      };
      return map[status] || "status-available";
    };
    const getSeatStatusText = (status) => {
      const map = {
        available: "空闲",
        occupied: "使用中",
        reserved: "预约中"
      };
      return map[status] || "空闲";
    };
    const goToCreateWithPreset = (seat) => {
      const currentUser = utils_user.UserService.getCurrentUser();
      if (!currentUser) {
        common_vendor.index.showModal({
          title: "需要登录",
          content: "请先登录后再创建组局",
          confirmText: "去登录",
          success: (res) => {
            if (res.confirm) {
              common_vendor.index.switchTab({
                url: "/pages/user/user"
              });
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
      const query = [
        `type=${encodeURIComponent(seat.type)}`,
        `location=${encodeURIComponent(seat.location)}`,
        `project=${encodeURIComponent(typeProjectMap[seat.type] || "娱乐局")}`
      ];
      common_vendor.index.navigateTo({
        url: `/pages/create/create?${query.join("&")}`
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

该区域空闲，可快速创建对应类型组局。`,
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
        b: common_vendor.f(upperRooms.value, (room, k0, i0) => {
          return {
            a: common_vendor.t(room.name),
            b: common_vendor.t(getSeatStatusText(room.status)),
            c: room.id,
            d: common_vendor.n(getSeatTypeClass(room.type)),
            e: common_vendor.n(getSeatStatusClass(room.status)),
            f: common_vendor.o(($event) => onSeatTap(room), room.id)
          };
        }),
        c: common_vendor.f(hallSeats.value, (seat, k0, i0) => {
          return {
            a: common_vendor.t(seat.name),
            b: seat.id,
            c: common_vendor.n(getSeatTypeClass(seat.type)),
            d: common_vendor.n(getSeatStatusClass(seat.status)),
            e: common_vendor.o(($event) => onSeatTap(seat), seat.id)
          };
        }),
        d: common_vendor.f(lowerArea.value, (seat, k0, i0) => {
          return {
            a: common_vendor.t(seat.name),
            b: common_vendor.t(getSeatStatusText(seat.status)),
            c: seat.id,
            d: common_vendor.n(getSeatTypeClass(seat.type)),
            e: common_vendor.n(getSeatStatusClass(seat.status)),
            f: common_vendor.o(($event) => onSeatTap(seat), seat.id)
          };
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f89a1d25"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/seat/seat.js.map
