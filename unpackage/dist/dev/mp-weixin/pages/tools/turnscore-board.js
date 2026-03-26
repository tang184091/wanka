"use strict";
const common_vendor = require("../../common/vendor.js");
const STORAGE_KEY = "boardgame_turnscore_matches_v1";
const ACTIVE_KEY = "boardgame_turnscore_active_v1";
const _sfc_main = {
  __name: "turnscore-board",
  setup(__props) {
    const matchId = common_vendor.ref("");
    const match = common_vendor.ref(null);
    const safeParse = (v) => {
      try {
        return JSON.parse(v);
      } catch (e) {
        return null;
      }
    };
    const loadData = () => {
      const raw = common_vendor.index.getStorageSync(STORAGE_KEY);
      const parsed = typeof raw === "string" ? safeParse(raw) : raw;
      const list = Array.isArray(parsed) ? parsed : [];
      match.value = list.find((m) => m.id === matchId.value) || null;
    };
    const hexToRgb = (hex) => {
      const h = String(hex || "").replace("#", "").trim();
      if (h.length !== 6)
        return { r: 0, g: 0, b: 0 };
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16)
      };
    };
    const textColor = (hex) => {
      if (String(hex).toLowerCase() === "#ffffff")
        return "#111827";
      if (String(hex).toLowerCase() === "#111827")
        return "#ffffff";
      const { r, g, b } = hexToRgb(hex);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.65 ? "#111827" : "#ffffff";
    };
    const borderColor = (hex) => {
      const { r, g, b } = hexToRgb(hex);
      if (r + g + b > 600)
        return "#111827";
      return "transparent";
    };
    common_vendor.onLoad((query) => {
      const fromQuery = String((query == null ? void 0 : query.matchId) || "").trim();
      const fromStorage = String(common_vendor.index.getStorageSync(ACTIVE_KEY) || "").trim();
      matchId.value = fromQuery || fromStorage;
      loadData();
    });
    common_vendor.onShow(() => {
      loadData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: match.value
      }, match.value ? {
        b: common_vendor.t(match.value.playerCount),
        c: common_vendor.f(match.value.players, (p, idx, i0) => {
          return {
            a: common_vendor.t(p.score),
            b: `board-${idx}`,
            c: p.colorHex,
            d: textColor(p.colorHex),
            e: borderColor(p.colorHex)
          };
        })
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bb086fb8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/tools/turnscore-board.js.map
