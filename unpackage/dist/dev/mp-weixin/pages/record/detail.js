"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const record = common_vendor.ref(null);
    const formatTime = (t) => {
      if (!t)
        return "-";
      const d = new Date(t);
      const pad = (n) => `${n}`.padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const exportText = common_vendor.computed(() => {
      if (!record.value)
        return "";
      const names = record.value.players.map((p) => p.nickname || p.userId || "-").join(" ");
      const scores = record.value.players.map((p) => p.score ?? 0).join(" ");
      return `${names}
${scores}`;
    });
    const copyExport = () => {
      common_vendor.index.setClipboardData({ data: exportText.value });
    };
    const parseScore = (raw) => {
      const n = Number(String(raw ?? "").replace(/,/g, ""));
      return Number.isFinite(n) ? n : 0;
    };
    const detectScoreRule = (scores) => {
      const maxAbs = Math.max(...scores.map((n) => Math.abs(n)), 0);
      if (maxAbs >= 1e4)
        return { returnPoint: 3e4, divisor: 1e3 };
      if (maxAbs >= 1e3)
        return { returnPoint: 3e3, divisor: 100 };
      if (maxAbs >= 100)
        return { returnPoint: 300, divisor: 10 };
      return { returnPoint: 30, divisor: 1 };
    };
    const getUmaList = (scores) => {
      if (!scores.length)
        return [];
      const rankScores = scores.map((score, idx) => ({ idx, score }));
      rankScores.sort((a, b) => b.score - a.score);
      const points = [40, 10, -10, -20];
      const umaByIndex = {};
      rankScores.forEach((item, rank) => {
        umaByIndex[item.idx] = points[rank] || 0;
      });
      return scores.map((_, idx) => umaByIndex[idx] || 0);
    };
    const getResultList = () => {
      var _a, _b;
      if (!((_b = (_a = record.value) == null ? void 0 : _a.players) == null ? void 0 : _b.length))
        return [];
      const scores = record.value.players.map((p) => parseScore(p.score));
      const { returnPoint, divisor } = detectScoreRule(scores);
      const umaList = getUmaList(scores);
      return scores.map((score, idx) => {
        const base = (score - returnPoint) / divisor;
        return base + (umaList[idx] || 0);
      });
    };
    const getResultLabel = (index) => {
      const result = getResultList()[index] || 0;
      return `${result > 0 ? "+" : ""}${result.toFixed(1)}P`;
    };
    common_vendor.onLoad(async (options) => {
      var _a, _b;
      const id = options == null ? void 0 : options.id;
      if (!id)
        return;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "getMahjongRecordDetail", data: { recordId: id } }
      });
      if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
        record.value = res.result.data;
      } else {
        common_vendor.index.showToast({ title: ((_b = res.result) == null ? void 0 : _b.message) || "加载失败", icon: "none" });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: record.value
      }, record.value ? {
        b: common_vendor.t(formatTime(record.value.createdAt)),
        c: common_vendor.f(record.value.players, (player, index, i0) => {
          return {
            a: common_vendor.t(player.nickname || player.userId || "未知玩家"),
            b: common_vendor.t(player.score),
            c: common_vendor.t(getResultLabel(index)),
            d: index
          };
        }),
        d: common_vendor.t(exportText.value),
        e: common_vendor.o(copyExport, "3b")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-58524edd"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/detail.js.map
