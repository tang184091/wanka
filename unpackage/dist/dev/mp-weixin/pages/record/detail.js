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
            a: common_vendor.t(player.nickname || "未知玩家"),
            b: common_vendor.t(player.score),
            c: index
          };
        }),
        d: common_vendor.t(exportText.value),
        e: common_vendor.o(copyExport, "85")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-58524edd"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/detail.js.map
