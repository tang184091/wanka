"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "record",
  setup(__props) {
    const records = common_vendor.ref([]);
    const emptyPlayers = () => [
      { keyword: "", userId: "", nickname: "", score: "" },
      { keyword: "", userId: "", nickname: "", score: "" },
      { keyword: "", userId: "", nickname: "", score: "" },
      { keyword: "", userId: "", nickname: "", score: "" }
    ];
    const form = common_vendor.ref({ players: emptyPlayers() });
    const searchResults = common_vendor.ref([]);
    const searchingIndex = common_vendor.ref(-1);
    let timer = null;
    const toNumber = (v) => Number(v || 0);
    const totalScore = common_vendor.computed(() => form.value.players.reduce((sum, p) => sum + toNumber(p.score), 0));
    const scoreValid = common_vendor.computed(() => totalScore.value === 1e5 || totalScore.value === 1e3);
    const formatTime = (t) => {
      if (!t)
        return "-";
      const d = new Date(t);
      const pad = (n) => `${n}`.padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const loadRecords = async () => {
      var _a;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "getMahjongRecords", data: {} }
      });
      if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
        records.value = res.result.data.list || [];
      }
    };
    const onSearch = (index) => {
      searchingIndex.value = index;
      const player = form.value.players[index];
      const keyword = (player.keyword || "").trim();
      if (player.nickname && keyword !== player.nickname) {
        player.nickname = "";
        player.userId = "";
      }
      clearTimeout(timer);
      timer = setTimeout(async () => {
        var _a;
        if (keyword.length < 2) {
          searchResults.value = [];
          return;
        }
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "user-service",
          data: { action: "searchUsers", data: { keyword } }
        });
        if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
          searchResults.value = (res.result.data.list || []).slice(0, 5);
        }
      }, 220);
    };
    const pickUser = (index, user) => {
      form.value.players[index].userId = user.id;
      form.value.players[index].nickname = user.nickname;
      form.value.players[index].keyword = user.nickname;
      searchResults.value = [];
    };
    const submit = async () => {
      var _a, _b;
      const players = form.value.players.map((p) => {
        const typed = (p.keyword || "").trim();
        const userId = (p.userId || typed).trim();
        const nickname = p.nickname || "";
        return {
          userId,
          nickname,
          score: Number(p.score || 0)
        };
      });
      if (players.some((p) => !p.userId)) {
        common_vendor.index.showToast({ title: "请填写4位玩家ID或昵称", icon: "none" });
        return;
      }
      if (!scoreValid.value) {
        common_vendor.index.showToast({ title: "分数总和必须为100000或1000", icon: "none" });
        return;
      }
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "createMahjongRecord", data: { players } }
      });
      if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
        common_vendor.index.showToast({ title: "提交成功", icon: "success" });
        form.value.players = emptyPlayers();
        await loadRecords();
      } else {
        common_vendor.index.showToast({ title: ((_b = res.result) == null ? void 0 : _b.message) || "提交失败", icon: "none" });
      }
    };
    const openDetail = (item) => {
      common_vendor.index.navigateTo({ url: `/pages/record/detail?id=${item._id}` });
    };
    const goToYakuman = () => {
      common_vendor.index.navigateTo({ url: "/pages/record/yakuman" });
    };
    const goToHonor = () => {
      common_vendor.index.navigateTo({ url: "/pages/record/honor" });
    };
    common_vendor.onShow(loadRecords);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(form.value.players, (player, index, i0) => {
          return common_vendor.e({
            a: `玩家${index + 1} 昵称或ID`,
            b: common_vendor.o([($event) => player.keyword = $event.detail.value, ($event) => onSearch(index)], index),
            c: player.keyword,
            d: player.score,
            e: common_vendor.o(($event) => player.score = $event.detail.value, index),
            f: searchingIndex.value === index && searchResults.value.length
          }, searchingIndex.value === index && searchResults.value.length ? {
            g: common_vendor.f(searchResults.value, (u, k1, i1) => {
              return {
                a: common_vendor.t(u.nickname),
                b: u.id,
                c: common_vendor.o(($event) => pickUser(index, u), u.id)
              };
            })
          } : {}, {
            h: index
          });
        }),
        b: `分数`,
        c: common_vendor.t(totalScore.value),
        d: scoreValid.value ? 1 : "",
        e: common_vendor.o(submit, "9a"),
        f: common_vendor.o(goToYakuman, "9c"),
        g: common_vendor.o(goToHonor, "e0"),
        h: records.value.length === 0
      }, records.value.length === 0 ? {} : {}, {
        i: common_vendor.f(records.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(formatTime(item.createdAt)),
            b: common_vendor.f(item.players, (player, index, i1) => {
              return {
                a: common_vendor.t(player.nickname || player.userId || "未知玩家"),
                b: common_vendor.t(player.score),
                c: index
              };
            }),
            c: item._id,
            d: common_vendor.o(($event) => openDetail(item), item._id)
          };
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ef6850c5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/record.js.map
