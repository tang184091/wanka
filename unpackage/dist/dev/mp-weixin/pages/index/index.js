"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const utils_store = require("../../utils/store.js");
const utils_user = require("../../utils/user.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const tabs = common_vendor.ref([
      { id: "all", name: "全部" },
      { id: "mahjong", name: "日麻" },
      { id: "boardgame", name: "桌游" },
      { id: "videogame", name: "电玩" }
    ]);
    const activeTab = common_vendor.ref("all");
    const gameList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const hasMore = common_vendor.ref(true);
    const currentPage = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const switchTab = (tabId) => {
      activeTab.value = tabId;
      currentPage.value = 1;
      gameList.value = [];
      hasMore.value = true;
      loadGameList();
    };
    const getTypeClass = (type) => {
      const classMap = {
        "mahjong": "tag-mahjong",
        "boardgame": "tag-boardgame",
        "videogame": "tag-videogame"
      };
      return classMap[type] || "tag-mahjong";
    };
    const getTypeText = (type) => {
      const textMap = {
        "mahjong": "日麻",
        "boardgame": "桌游",
        "videogame": "电玩"
      };
      return textMap[type] || "日麻";
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const now = /* @__PURE__ */ new Date();
      const target = new Date(time);
      const diff = target - now;
      const diffDays = Math.floor(diff / (1e3 * 60 * 60 * 24));
      if (diffDays === 0) {
        return `今天 ${target.getHours().toString().padStart(2, "0")}:${target.getMinutes().toString().padStart(2, "0")}`;
      } else if (diffDays === 1) {
        return `明天 ${target.getHours().toString().padStart(2, "0")}:${target.getMinutes().toString().padStart(2, "0")}`;
      } else if (diffDays < 7) {
        const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
        return `${days[target.getDay()]} ${target.getHours().toString().padStart(2, "0")}:${target.getMinutes().toString().padStart(2, "0")}`;
      } else {
        return `${target.getMonth() + 1}月${target.getDate()}日 ${target.getHours().toString().padStart(2, "0")}:${target.getMinutes().toString().padStart(2, "0")}`;
      }
    };
    const loadGameList = async () => {
      if (loading.value)
        return;
      loading.value = true;
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:211", "开始加载组局列表...");
        const params = {
          page: currentPage.value,
          pageSize: pageSize.value
        };
        if (activeTab.value !== "all") {
          params.type = activeTab.value;
        }
        common_vendor.index.__f__("log", "at pages/index/index.vue:222", "调用参数:", params);
        const games = await utils_store.gameActions.getGameList(params);
        common_vendor.index.__f__("log", "at pages/index/index.vue:226", "获取到的组局列表:", games);
        if (games && Array.isArray(games)) {
          const currentUser = utils_user.UserService.getCurrentUser();
          if (currentUser) {
            const userId = currentUser.id;
            games.forEach((game) => {
              if (game.participants && Array.isArray(game.participants)) {
                game.isJoined = game.participants.includes(userId);
              }
            });
          }
          if (currentPage.value === 1) {
            gameList.value = games;
          } else {
            gameList.value = [...gameList.value, ...games];
          }
          hasMore.value = games.length >= pageSize.value;
        } else {
          common_vendor.index.__f__("warn", "at pages/index/index.vue:251", "返回数据格式异常:", games);
          gameList.value = [];
          hasMore.value = false;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:257", "加载组局列表失败，完整错误:", error);
        if (currentPage.value === 1) {
          gameList.value = [];
        }
        common_vendor.index.showToast({
          title: "加载失败: " + (error.message || "请检查网络"),
          icon: "none",
          duration: 3e3
        });
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    };
    const onRefresh = () => {
      refreshing.value = true;
      currentPage.value = 1;
      gameList.value = [];
      hasMore.value = true;
      loadGameList();
    };
    const onLoadMore = () => {
      if (!hasMore.value || loading.value)
        return;
      currentPage.value++;
      loadGameList();
    };
    const goToCreate = () => {
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
      common_vendor.index.navigateTo({
        url: "/pages/create/create"
      });
    };
    const goToDetail = (gameId) => {
      common_vendor.index.navigateTo({
        url: `/pages/detail/detail?id=${gameId}`
      });
    };
    const joinGame = async (gameId) => {
      const currentUser = utils_user.UserService.getCurrentUser();
      if (!currentUser) {
        common_vendor.index.showModal({
          title: "需要登录",
          content: "请先登录后再加入组局",
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
      common_vendor.index.showModal({
        title: "确认加入",
        content: "确定要加入这个组局吗？",
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({
              title: "加入中...",
              mask: true
            });
            try {
              const result = await utils_store.gameActions.joinGame(gameId, currentUser.id);
              if (result && result.success) {
                const gameIndex = gameList.value.findIndex((g) => g.id === gameId || g._id === gameId);
                if (gameIndex !== -1) {
                  const game = gameList.value[gameIndex];
                  game.currentPlayers = result.currentPlayers || game.currentPlayers + 1;
                  game.isJoined = true;
                  if (game.currentPlayers >= game.maxPlayers) {
                    game.isFull = true;
                  }
                  gameList.value = [...gameList.value];
                }
                common_vendor.index.showToast({
                  title: "加入成功",
                  icon: "success",
                  duration: 2e3
                });
              } else {
                throw new Error((result == null ? void 0 : result.message) || "加入失败");
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/index/index.vue:381", "加入组局失败:", error);
              common_vendor.index.showToast({
                title: error.message || "加入失败",
                icon: "none",
                duration: 3e3
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    common_vendor.onMounted(() => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:397", "首页加载，开始获取组局列表");
      loadGameList();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(tabs.value, (tab, k0, i0) => {
          return {
            a: common_vendor.t(tab.name),
            b: tab.id,
            c: activeTab.value === tab.id ? 1 : "",
            d: common_vendor.o(($event) => switchTab(tab.id), tab.id)
          };
        }),
        b: common_vendor.o(goToCreate),
        c: refreshing.value
      }, refreshing.value ? {} : {}, {
        d: gameList.value.length === 0 && !loading.value
      }, gameList.value.length === 0 && !loading.value ? {
        e: common_assets._imports_0,
        f: common_vendor.o(goToCreate)
      } : {}, {
        g: common_vendor.f(gameList.value, (game, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(getTypeText(game.type)),
            b: common_vendor.n(getTypeClass(game.type)),
            c: common_vendor.t(game.isFull ? "已满员" : `缺${game.maxPlayers - game.currentPlayers}人`),
            d: common_vendor.n(game.isFull ? "tag-status-full" : "tag-status"),
            e: common_vendor.t(game.title),
            f: common_vendor.t(game.project),
            g: common_vendor.t(formatTime(game.time)),
            h: common_vendor.t(game.location),
            i: common_vendor.t(game.currentPlayers),
            j: common_vendor.t(game.maxPlayers),
            k: game.players && game.players.length > 0
          }, game.players && game.players.length > 0 ? common_vendor.e({
            l: common_vendor.f(game.players.slice(0, 5), (player, index, i1) => {
              return {
                a: player.avatar,
                b: index
              };
            }),
            m: game.players.length > 5
          }, game.players.length > 5 ? {
            n: common_vendor.t(game.players.length - 5)
          } : {}) : {}, {
            o: !game.isFull && !game.isJoined
          }, !game.isFull && !game.isJoined ? {
            p: common_vendor.o(($event) => joinGame(game.id || game._id), game.id || game._id)
          } : {}, {
            q: game.isJoined
          }, game.isJoined ? {} : {}, {
            r: game.isFull && !game.isJoined
          }, game.isFull && !game.isJoined ? {} : {}, {
            s: game.id || game._id,
            t: common_vendor.o(($event) => goToDetail(game.id || game._id), game.id || game._id)
          });
        }),
        h: common_assets._imports_2,
        i: common_assets._imports_3,
        j: common_assets._imports_3$1,
        k: loading.value
      }, loading.value ? {} : {}, {
        l: hasMore.value && !loading.value
      }, hasMore.value && !loading.value ? {
        m: common_vendor.o(onLoadMore)
      } : {}, {
        n: !hasMore.value && gameList.value.length > 0
      }, !hasMore.value && gameList.value.length > 0 ? {} : {}, {
        o: refreshing.value,
        p: common_vendor.o(onRefresh),
        q: common_vendor.o(onLoadMore)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
