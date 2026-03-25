"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_store = require("../../utils/store.js");
const utils_user = require("../../utils/user.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const tabs = common_vendor.ref([
      { id: "mahjong", name: "立直麻将" },
      { id: "boardgame", name: "桌游" },
      { id: "videogame", name: "电玩" },
      { id: "cardgame", name: "打牌" },
      { id: "competition", name: "比赛" },
      { id: "ongoing", name: "进行中" }
    ]);
    const activeTab = common_vendor.ref("all");
    const gameList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const hasMore = common_vendor.ref(true);
    const currentPage = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const firstRowTabs = common_vendor.ref(tabs.value.slice(0, 3));
    const secondRowTabs = common_vendor.ref(tabs.value.slice(3, 6));
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
        "videogame": "tag-videogame",
        "cardgame": "tag-cardgame",
        "competition": "tag-competition"
      };
      return classMap[type] || "tag-mahjong";
    };
    const getTypeText = (type) => {
      const textMap = {
        "mahjong": "立直麻将",
        "boardgame": "桌游",
        "videogame": "电玩",
        "cardgame": "打牌",
        "competition": "比赛"
      };
      return textMap[type] || "立直麻将";
    };
    const getCurrentUser = () => utils_user.UserService.getCurrentUser() || null;
    const canCompleteGame = (game) => {
      if (!game || game.status !== "ongoing")
        return false;
      const user = getCurrentUser();
      if (!user)
        return false;
      const userId = String(user.id || user._id || "");
      if (!userId)
        return false;
      if (user.isAdmin)
        return true;
      if (String(game.creatorId || "") === userId)
        return true;
      return !!game.isJoined;
    };
    const getGameStatusText = (status) => {
      const textMap = {
        pending: "预约中",
        ongoing: "进行中",
        completed: "已完成"
      };
      return textMap[status] || "预约中";
    };
    const getGameStatusClass = (status) => {
      const classMap = {
        pending: "status-pending",
        ongoing: "status-ongoing",
        completed: "status-completed"
      };
      return classMap[status] || "status-pending";
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
        common_vendor.index.__f__("log", "at pages/index/index.vue:276", "开始加载组局列表...");
        const params = {
          page: currentPage.value,
          pageSize: pageSize.value
        };
        if (activeTab.value === "ongoing") {
          params.status = "ongoing";
        } else if (activeTab.value !== "all") {
          params.type = activeTab.value;
        }
        common_vendor.index.__f__("log", "at pages/index/index.vue:289", "调用参数:", params);
        const games = await utils_store.gameActions.getGameList(params);
        common_vendor.index.__f__("log", "at pages/index/index.vue:293", "获取到的组局列表:", games);
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
          common_vendor.index.__f__("warn", "at pages/index/index.vue:318", "返回数据格式异常:", games);
          gameList.value = [];
          hasMore.value = false;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:324", "加载组局列表失败，完整错误:", error);
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
              common_vendor.index.__f__("error", "at pages/index/index.vue:448", "加入组局失败:", error);
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
      common_vendor.index.__f__("log", "at pages/index/index.vue:464", "首页加载，开始获取组局列表");
      loadGameList();
    });
    const markCompleted = async (game) => {
      const gameId = game.id || game._id;
      if (!gameId)
        return;
      if (!canCompleteGame(game)) {
        common_vendor.index.showToast({ title: "无权限操作", icon: "none" });
        return;
      }
      common_vendor.index.showModal({
        title: "确认完成",
        content: "将该进行中组局标记为已完成？",
        success: async (res) => {
          var _a, _b;
          if (!res.confirm)
            return;
          common_vendor.index.showLoading({ title: "提交中...", mask: true });
          try {
            const result = await common_vendor.wx$1.cloud.callFunction({
              name: "game-service",
              data: { action: "completeGame", data: { gameId } }
            });
            if (((_a = result == null ? void 0 : result.result) == null ? void 0 : _a.code) === 0) {
              common_vendor.index.showToast({ title: "已标记完成", icon: "success" });
              currentPage.value = 1;
              gameList.value = [];
              hasMore.value = true;
              await loadGameList();
            } else {
              throw new Error(((_b = result == null ? void 0 : result.result) == null ? void 0 : _b.message) || "操作失败");
            }
          } catch (error) {
            common_vendor.index.showToast({ title: error.message || "操作失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: activeTab.value === "all" ? 1 : "",
        b: common_vendor.o(($event) => switchTab("all"), "97"),
        c: common_vendor.f(firstRowTabs.value, (tab, k0, i0) => {
          return {
            a: common_vendor.t(tab.name),
            b: tab.id,
            c: activeTab.value === tab.id ? 1 : "",
            d: common_vendor.o(($event) => switchTab(tab.id), tab.id)
          };
        }),
        d: common_vendor.f(secondRowTabs.value, (tab, k0, i0) => {
          return {
            a: common_vendor.t(tab.name),
            b: tab.id,
            c: activeTab.value === tab.id ? 1 : "",
            d: common_vendor.o(($event) => switchTab(tab.id), tab.id)
          };
        }),
        e: common_vendor.o(goToCreate, "95"),
        f: refreshing.value
      }, refreshing.value ? {} : {}, {
        g: gameList.value.length === 0 && !loading.value
      }, gameList.value.length === 0 && !loading.value ? {
        h: common_vendor.o(goToCreate, "81")
      } : {}, {
        i: common_vendor.f(gameList.value, (game, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(getTypeText(game.type)),
            b: common_vendor.n(getTypeClass(game.type)),
            c: common_vendor.t(getGameStatusText(game.status)),
            d: common_vendor.n(getGameStatusClass(game.status)),
            e: common_vendor.t(game.isFull ? "已满员" : `缺${game.maxPlayers - game.currentPlayers}人`),
            f: common_vendor.n(game.isFull ? "tag-status-full" : "tag-status"),
            g: common_vendor.t(game.title),
            h: common_vendor.t(game.project),
            i: common_vendor.t(formatTime(game.time)),
            j: common_vendor.t(game.location),
            k: common_vendor.t(game.currentPlayers),
            l: common_vendor.t(game.maxPlayers),
            m: game.players && game.players.length > 0
          }, game.players && game.players.length > 0 ? common_vendor.e({
            n: common_vendor.f(game.players.slice(0, 5), (player, index, i1) => {
              return {
                a: player.avatar,
                b: index
              };
            }),
            o: game.players.length > 5
          }, game.players.length > 5 ? {
            p: common_vendor.t(game.players.length - 5)
          } : {}) : {}, {
            q: game.status === "pending" && !game.isFull && !game.isJoined
          }, game.status === "pending" && !game.isFull && !game.isJoined ? {
            r: common_vendor.o(($event) => joinGame(game.id || game._id), game.id || game._id)
          } : {}, {
            s: game.status === "pending" && game.isJoined
          }, game.status === "pending" && game.isJoined ? {} : {}, {
            t: game.status === "pending" && game.isFull && !game.isJoined
          }, game.status === "pending" && game.isFull && !game.isJoined ? {} : {}, {
            v: game.status === "ongoing" && canCompleteGame(game)
          }, game.status === "ongoing" && canCompleteGame(game) ? {
            w: common_vendor.o(($event) => markCompleted(game), game.id || game._id)
          } : {}, {
            x: game.id || game._id,
            y: common_vendor.o(($event) => goToDetail(game.id || game._id), game.id || game._id)
          });
        }),
        j: common_assets._imports_1,
        k: common_assets._imports_2,
        l: common_assets._imports_3,
        m: loading.value
      }, loading.value ? {} : {}, {
        n: hasMore.value && !loading.value
      }, hasMore.value && !loading.value ? {
        o: common_vendor.o(onLoadMore, "bf")
      } : {}, {
        p: !hasMore.value && gameList.value.length > 0
      }, !hasMore.value && gameList.value.length > 0 ? {} : {}, {
        q: refreshing.value,
        r: common_vendor.o(onRefresh, "f4"),
        s: common_vendor.o(onLoadMore, "ad")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
