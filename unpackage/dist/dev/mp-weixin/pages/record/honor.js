"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "honor",
  setup(__props) {
    const list = common_vendor.ref([]);
    const formatTime = (t) => {
      if (!t)
        return "-";
      const d = new Date(t);
      const pad = (n) => `${n}`.padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const getTypeClass = (type) => {
      return type === "rank" ? "badge-rank" : "badge-match";
    };
    const getRarityClass = (rarity) => {
      if (rarity === "legend" || rarity === "gold")
        return "badge-legend";
      if (rarity === "epic" || rarity === "purple")
        return "badge-epic";
      if (rarity === "rare" || rarity === "blue" || rarity === "silver")
        return "badge-rare";
      return "badge-common";
    };
    const loadData = async () => {
      var _a;
      const listRes = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "getHonorList", data: {} } });
      if (((_a = listRes.result) == null ? void 0 : _a.code) === 0) {
        list.value = (listRes.result.data.list || []).map((item) => ({
          ...item,
          rarity: ["legend", "epic", "rare", "common", "gold", "purple", "blue", "silver"].includes(item.rarity) ? item.rarity : "epic"
        }));
      }
    };
    common_vendor.onShow(loadData);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !list.value.length
      }, !list.value.length ? {} : {}, {
        b: common_vendor.f(list.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.type === "tournament" ? "比赛" : "段位"),
            b: common_vendor.n(getTypeClass(item.type)),
            c: common_vendor.n(getRarityClass(item.rarity)),
            d: common_vendor.t(formatTime(item.achievedAt)),
            e: item.type === "tournament"
          }, item.type === "tournament" ? {
            f: common_vendor.t(item.championNickname || "-")
          } : {}, {
            g: item.type === "tournament"
          }, item.type === "tournament" ? {
            h: common_vendor.t(item.participantCount || "-")
          } : {}, {
            i: item.type === "tournament"
          }, item.type === "tournament" ? {
            j: common_vendor.t(item.title || "店内比赛")
          } : {}, {
            k: item.type === "rank"
          }, item.type === "rank" ? {
            l: common_vendor.t(item.playerNickname || "-")
          } : {}, {
            m: item.type === "rank"
          }, item.type === "rank" ? {
            n: common_vendor.t(item.rankName || "-")
          } : {}, {
            o: item.note
          }, item.note ? {
            p: common_vendor.t(item.note)
          } : {}, {
            q: item._id || item.id
          });
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d6d8b840"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/honor.js.map
