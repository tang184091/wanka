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
    const loadData = async () => {
      var _a;
      const listRes = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "getHonorList", data: {} } });
      if (((_a = listRes.result) == null ? void 0 : _a.code) === 0)
        list.value = listRes.result.data.list || [];
    };
    common_vendor.onShow(loadData);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !list.value.length
      }, !list.value.length ? {} : {}, {
        b: common_vendor.f(list.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.type === "tournament" ? "比赛" : "段位"),
            b: common_vendor.n(item.type === "tournament" ? "badge-match" : "badge-rank"),
            c: common_vendor.t(formatTime(item.achievedAt)),
            d: item.type === "tournament"
          }, item.type === "tournament" ? {
            e: common_vendor.t(item.championNickname || "-")
          } : {}, {
            f: item.type === "tournament"
          }, item.type === "tournament" ? {
            g: common_vendor.t(item.participantCount || "-")
          } : {}, {
            h: item.type === "tournament"
          }, item.type === "tournament" ? {
            i: common_vendor.t(item.title || "店内比赛")
          } : {}, {
            j: item.type === "rank"
          }, item.type === "rank" ? {
            k: common_vendor.t(item.playerNickname || "-")
          } : {}, {
            l: item.type === "rank"
          }, item.type === "rank" ? {
            m: common_vendor.t(item.rankName || "-")
          } : {}, {
            n: item.note
          }, item.note ? {
            o: common_vendor.t(item.note)
          } : {}, {
            p: item._id
          });
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d6d8b840"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/honor.js.map
