"use strict";
const common_vendor = require("../../common/vendor.js");
const STORAGE_KEY = "boardgame_turnscore_matches_v1";
const ACTIVE_KEY = "boardgame_turnscore_active_v1";
const _sfc_main = {
  __name: "turnscore",
  setup(__props) {
    const step = common_vendor.ref("entry");
    const selectedColors = common_vendor.ref([]);
    const matches = common_vendor.ref([]);
    const activeMatchId = common_vendor.ref("");
    const deltas = [1, 2, 5, 10];
    const colorOptions = [
      { key: "blue", label: "蓝色", hex: "#2563eb" },
      { key: "green", label: "绿色", hex: "#16a34a" },
      { key: "orange", label: "橙色", hex: "#f97316" },
      { key: "red", label: "红色", hex: "#dc2626" },
      { key: "black", label: "黑色", hex: "#111827" },
      { key: "purple", label: "紫色", hex: "#7c3aed" },
      { key: "white", label: "白色", hex: "#ffffff" },
      { key: "yellow", label: "黄色", hex: "#eab308" },
      { key: "pink", label: "粉色", hex: "#ec4899" },
      { key: "cyan", label: "青色", hex: "#06b6d4" },
      { key: "brown", label: "棕色", hex: "#92400e" },
      { key: "gray", label: "灰色", hex: "#6b7280" }
    ];
    const activeMatch = common_vendor.computed(() => matches.value.find((m) => m.id === activeMatchId.value) || null);
    const orderText = common_vendor.computed(() => {
      const m = activeMatch.value;
      if (!m)
        return "-";
      return m.players.map((p) => p.colorLabel).join(" → ");
    });
    const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
    const randomId = () => `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const safeParse = (v) => {
      try {
        return JSON.parse(v);
      } catch (e) {
        return null;
      }
    };
    const normalizeMatch = (m) => ({
      ...m,
      players: Array.isArray(m.players) ? m.players.map((p) => {
        var _a, _b;
        return {
          ...p,
          score: Number(p.score || 0),
          colorLabel: p.colorLabel || ((_a = colorOptions.find((c) => c.key === p.colorKey)) == null ? void 0 : _a.label) || "玩家",
          colorHex: p.colorHex || ((_b = colorOptions.find((c) => c.key === p.colorKey)) == null ? void 0 : _b.hex) || "#2563eb"
        };
      }) : [],
      logs: Array.isArray(m.logs) ? m.logs : []
    });
    const loadMatches = () => {
      const raw = common_vendor.index.getStorageSync(STORAGE_KEY);
      const parsed = typeof raw === "string" ? safeParse(raw) : raw;
      matches.value = Array.isArray(parsed) ? parsed.map(normalizeMatch) : [];
    };
    const persistMatches = () => {
      common_vendor.index.setStorageSync(STORAGE_KEY, JSON.stringify(matches.value));
    };
    const startNewMatch = () => {
      selectedColors.value = [];
      step.value = "colors";
    };
    const openHistory = () => {
      loadMatches();
      step.value = "history";
    };
    const backToEntry = () => {
      step.value = "entry";
    };
    const toggleColor = (key) => {
      const set = new Set(selectedColors.value);
      if (set.has(key)) {
        set.delete(key);
      } else {
        if (set.size >= 8) {
          common_vendor.index.showToast({ title: "最多8名玩家", icon: "none" });
          return;
        }
        set.add(key);
      }
      selectedColors.value = [...set];
    };
    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const randomizeAndCreate = () => {
      const playerCount = selectedColors.value.length;
      if (playerCount < 1) {
        common_vendor.index.showToast({ title: "请至少选择1种颜色", icon: "none" });
        return;
      }
      const colorKeys = shuffle(selectedColors.value);
      const players = colorKeys.map((key, idx) => {
        const color = colorOptions.find((c) => c.key === key);
        return {
          seat: idx + 1,
          colorKey: key,
          colorLabel: (color == null ? void 0 : color.label) || key,
          colorHex: (color == null ? void 0 : color.hex) || "#2563eb",
          score: 0
        };
      });
      const match = {
        id: randomId(),
        playerCount,
        players,
        logs: [],
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      loadMatches();
      matches.value.unshift(match);
      activeMatchId.value = match.id;
      persistMatches();
      common_vendor.index.setStorageSync(ACTIVE_KEY, match.id);
      step.value = "play";
    };
    const loadMatch = (id) => {
      activeMatchId.value = id;
      common_vendor.index.setStorageSync(ACTIVE_KEY, id);
      step.value = "play";
    };
    const removeMatch = (id) => {
      matches.value = matches.value.filter((m) => m.id !== id);
      if (activeMatchId.value === id) {
        activeMatchId.value = "";
        common_vendor.index.removeStorageSync(ACTIVE_KEY);
      }
      persistMatches();
    };
    const clearAllMatches = () => {
      if (!matches.value.length)
        return;
      common_vendor.index.showModal({
        title: "确认清空",
        content: "将删除所有本地历史对局记录，是否继续？",
        success: (res) => {
          if (!res.confirm)
            return;
          matches.value = [];
          activeMatchId.value = "";
          persistMatches();
          common_vendor.index.removeStorageSync(ACTIVE_KEY);
          common_vendor.index.showToast({ title: "已清空", icon: "success" });
        }
      });
    };
    const appendLog = (m, log) => {
      if (!Array.isArray(m.logs))
        m.logs = [];
      m.logs.unshift(log);
      if (m.logs.length > 300)
        m.logs = m.logs.slice(0, 300);
    };
    const changeScore = (seat, delta) => {
      const m = activeMatch.value;
      if (!m)
        return;
      const player = m.players.find((p) => p.seat === seat);
      if (!player)
        return;
      player.score += delta;
      appendLog(m, {
        type: "score",
        seat,
        colorKey: player.colorKey,
        colorLabel: player.colorLabel,
        delta,
        ts: nowIso()
      });
      m.updatedAt = nowIso();
      persistMatches();
    };
    const markRoundEnd = () => {
      const m = activeMatch.value;
      if (!m)
        return;
      appendLog(m, { type: "round_end", ts: nowIso() });
      m.updatedAt = nowIso();
      persistMatches();
      common_vendor.index.showToast({ title: "已记录回合结束", icon: "none" });
    };
    const undoLastAction = () => {
      const m = activeMatch.value;
      if (!m || !Array.isArray(m.logs) || !m.logs.length) {
        common_vendor.index.showToast({ title: "没有可撤销记录", icon: "none" });
        return;
      }
      const last = m.logs.shift();
      if ((last == null ? void 0 : last.type) === "score") {
        const player = m.players.find((p) => p.seat === last.seat);
        if (player)
          player.score -= Number(last.delta || 0);
      }
      m.updatedAt = nowIso();
      persistMatches();
    };
    const formatDelta = (delta) => {
      const d = Number(delta || 0);
      return `${d >= 0 ? "+" : ""}${d}`;
    };
    const resolveColorKeyFromLog = (log) => {
      const key = String((log == null ? void 0 : log.colorKey) || "").toLowerCase();
      if (key)
        return key;
      const label = String((log == null ? void 0 : log.colorLabel) || "").toLowerCase();
      if (label.includes("蓝") || label.includes("blue"))
        return "blue";
      if (label.includes("绿") || label.includes("green"))
        return "green";
      if (label.includes("橙") || label.includes("orange"))
        return "orange";
      if (label.includes("红") || label.includes("red"))
        return "red";
      if (label.includes("黑") || label.includes("black"))
        return "black";
      if (label.includes("紫") || label.includes("purple"))
        return "purple";
      if (label.includes("白") || label.includes("white"))
        return "white";
      if (label.includes("黄") || label.includes("yellow"))
        return "yellow";
      if (label.includes("粉") || label.includes("pink"))
        return "pink";
      if (label.includes("青") || label.includes("cyan"))
        return "cyan";
      if (label.includes("棕") || label.includes("brown"))
        return "brown";
      if (label.includes("灰") || label.includes("gray"))
        return "gray";
      return "";
    };
    const logPlayerStyle = (log) => {
      var _a;
      if (!log || log.type !== "score")
        return {};
      const key = resolveColorKeyFromLog(log);
      const color = ((_a = colorOptions.find((c) => c.key === key)) == null ? void 0 : _a.hex) || "#111827";
      if (key === "white")
        return { color: "#111827" };
      return { color };
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
    const colorBorder = (hex) => {
      const { r, g, b } = hexToRgb(hex);
      if (r + g + b > 600)
        return "#111827";
      return "transparent";
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
    const scoreBtnStyle = (hex) => ({
      backgroundColor: hex,
      color: textColor(hex),
      borderColor: colorBorder(hex)
    });
    const formatTime = (iso) => {
      if (!iso)
        return "-";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime()))
        return "-";
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getMonth() + 1}-${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const formatClock = (iso) => {
      if (!iso)
        return "--:--";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime()))
        return "--:--";
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    common_vendor.onShow(() => {
      loadMatches();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: step.value === "entry"
      }, step.value === "entry" ? {
        b: common_vendor.o(startNewMatch, "de"),
        c: common_vendor.o(openHistory, "7c")
      } : {}, {
        d: step.value === "colors"
      }, step.value === "colors" ? {
        e: common_vendor.f(colorOptions, (color, k0, i0) => {
          return common_vendor.e({
            a: color.hex,
            b: colorBorder(color.hex),
            c: selectedColors.value.includes(color.key)
          }, selectedColors.value.includes(color.key) ? {} : {}, {
            d: color.key,
            e: selectedColors.value.includes(color.key) ? 1 : "",
            f: common_vendor.o(($event) => toggleColor(color.key), color.key)
          });
        }),
        f: common_vendor.t(selectedColors.value.length),
        g: common_vendor.o(backToEntry, "7c"),
        h: selectedColors.value.length < 1 ? 1 : "",
        i: common_vendor.o(randomizeAndCreate, "04")
      } : {}, {
        j: step.value === "history"
      }, step.value === "history" ? common_vendor.e({
        k: !matches.value.length
      }, !matches.value.length ? {} : {}, {
        l: common_vendor.f(matches.value, (m, k0, i0) => {
          return {
            a: common_vendor.t(m.playerCount),
            b: common_vendor.t(formatTime(m.createdAt)),
            c: common_vendor.t(formatTime(m.updatedAt)),
            d: common_vendor.f(m.players, (p, k1, i1) => {
              return {
                a: common_vendor.t(p.score),
                b: `${m.id}-${p.seat}`
              };
            }),
            e: common_vendor.o(($event) => loadMatch(m.id), m.id),
            f: common_vendor.o(($event) => removeMatch(m.id), m.id),
            g: m.id
          };
        }),
        m: common_vendor.o(backToEntry, "fc"),
        n: !matches.value.length ? 1 : "",
        o: common_vendor.o(clearAllMatches, "e2")
      }) : {}, {
        p: step.value === "play" && activeMatch.value
      }, step.value === "play" && activeMatch.value ? common_vendor.e({
        q: common_vendor.o(undoLastAction, "b1"),
        r: common_vendor.o(markRoundEnd, "50"),
        s: common_vendor.t(activeMatch.value.playerCount),
        t: common_vendor.t(orderText.value),
        v: common_vendor.f(activeMatch.value.players, (p, k0, i0) => {
          return {
            a: common_vendor.t(p.score),
            b: p.colorHex,
            c: textColor(p.colorHex),
            d: colorBorder(p.colorHex),
            e: common_vendor.f(deltas, (delta, k1, i1) => {
              return {
                a: common_vendor.t(delta),
                b: `plus-${p.seat}-${delta}`,
                c: common_vendor.o(($event) => changeScore(p.seat, delta), `plus-${p.seat}-${delta}`)
              };
            }),
            f: common_vendor.s(scoreBtnStyle(p.colorHex)),
            g: common_vendor.f(deltas, (delta, k1, i1) => {
              return {
                a: common_vendor.t(delta),
                b: `minus-${p.seat}-${delta}`,
                c: common_vendor.o(($event) => changeScore(p.seat, -delta), `minus-${p.seat}-${delta}`)
              };
            }),
            h: common_vendor.s(scoreBtnStyle(p.colorHex)),
            i: `player-${p.seat}`
          };
        }),
        w: !activeMatch.value.logs.length
      }, !activeMatch.value.logs.length ? {} : {}, {
        x: common_vendor.f(activeMatch.value.logs, (log, idx, i0) => {
          return common_vendor.e({
            a: log.type === "score"
          }, log.type === "score" ? {
            b: common_vendor.t(log.colorLabel || "玩家"),
            c: common_vendor.s(logPlayerStyle(log)),
            d: common_vendor.t(formatDelta(log.delta)),
            e: common_vendor.n(Number(log.delta || 0) >= 0 ? "delta-plus" : "delta-minus")
          } : {}, {
            f: common_vendor.t(formatClock(log.ts)),
            g: `global-${idx}`
          });
        })
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-327359d9"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/tools/turnscore.js.map
