"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const record = common_vendor.ref(null);
    const recordId = common_vendor.ref("");
    const localScoreRecorded = common_vendor.ref(false);
    const originalScoreRecorded = common_vendor.ref(false);
    const isAdmin = common_vendor.ref(false);
    let saving = false;
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
      return scores.map((score, idx) => (score - returnPoint) / divisor + (umaList[idx] || 0));
    };
    const getResultLabel = (index) => {
      const result = getResultList()[index] || 0;
      return `${result > 0 ? "+" : ""}${result.toFixed(1)}P`;
    };
    const toggleScoreRecorded = () => {
      localScoreRecorded.value = !localScoreRecorded.value;
      if (record.value) {
        record.value.scoreRecorded = localScoreRecorded.value;
      }
    };
    const saveScoreRecordedIfDirty = async () => {
      var _a;
      if (!recordId.value)
        return;
      if (saving)
        return;
      if (localScoreRecorded.value === originalScoreRecorded.value)
        return;
      saving = true;
      try {
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: {
            action: "updateMahjongRecordScoreRecorded",
            data: {
              recordId: recordId.value,
              scoreRecorded: localScoreRecorded.value
            }
          }
        });
        if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
          originalScoreRecorded.value = localScoreRecorded.value;
          common_vendor.index.setStorageSync("record_need_refresh", Date.now());
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/record/detail.vue:126", "保存录分状态失败", error);
      } finally {
        saving = false;
      }
    };
    common_vendor.onLoad(async (options) => {
      var _a, _b, _c, _d, _e;
      try {
        const me = await common_vendor.wx$1.cloud.callFunction({ name: "user-service", data: { action: "getMe", data: {} } });
        isAdmin.value = !!((_b = (_a = me == null ? void 0 : me.result) == null ? void 0 : _a.data) == null ? void 0 : _b.isAdmin);
      } catch (error) {
        isAdmin.value = false;
      }
      const id = options == null ? void 0 : options.id;
      if (!id)
        return;
      recordId.value = id;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "getMahjongRecordDetail", data: { recordId: id } }
      });
      if (((_c = res.result) == null ? void 0 : _c.code) === 0) {
        record.value = res.result.data;
        localScoreRecorded.value = ((_d = res.result.data) == null ? void 0 : _d.scoreRecorded) === true;
        originalScoreRecorded.value = localScoreRecorded.value;
      } else {
        common_vendor.index.showToast({ title: ((_e = res.result) == null ? void 0 : _e.message) || "加载失败", icon: "none" });
      }
    });
    common_vendor.onHide(() => {
      saveScoreRecordedIfDirty();
    });
    common_vendor.onUnload(() => {
      saveScoreRecordedIfDirty();
    });
    const deleteRecord = () => {
      if (!isAdmin.value)
        return;
      if (!recordId.value)
        return;
      common_vendor.index.showModal({
        title: "确认删除战绩",
        content: "删除后不可恢复，确认继续？",
        success: async (res) => {
          var _a, _b;
          if (!res.confirm)
            return;
          const result = await common_vendor.wx$1.cloud.callFunction({
            name: "game-service",
            data: {
              action: "adminDeleteMahjongRecord",
              data: { recordId: recordId.value }
            }
          });
          if (((_a = result == null ? void 0 : result.result) == null ? void 0 : _a.code) === 0) {
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            common_vendor.index.setStorageSync("record_need_refresh", Date.now());
            setTimeout(() => {
              common_vendor.index.navigateBack();
            }, 400);
          } else {
            common_vendor.index.showToast({ title: ((_b = result == null ? void 0 : result.result) == null ? void 0 : _b.message) || "删除失败", icon: "none" });
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: record.value
      }, record.value ? common_vendor.e({
        b: common_vendor.t(formatTime(record.value.createdAt)),
        c: common_vendor.t(localScoreRecorded.value ? "已录分" : "未录分"),
        d: common_vendor.n(localScoreRecorded.value ? "state-recorded" : "state-unrecorded"),
        e: common_vendor.f(record.value.players, (player, index, i0) => {
          return {
            a: common_vendor.t(player.nickname || player.userId || "未知玩家"),
            b: common_vendor.t(player.score),
            c: common_vendor.t(getResultLabel(index)),
            d: index
          };
        }),
        f: common_vendor.t(exportText.value),
        g: common_vendor.o(copyExport, "17"),
        h: common_vendor.o(toggleScoreRecorded, "f2"),
        i: isAdmin.value
      }, isAdmin.value ? {
        j: common_vendor.o(deleteRecord, "e6")
      } : {}) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-58524edd"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/detail.js.map
