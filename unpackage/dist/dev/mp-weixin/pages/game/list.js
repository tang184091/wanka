"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const utils_user = require("../../utils/user.js");
const _sfc_main = {
  __name: "list",
  setup(__props) {
    const tabs = common_vendor.ref([
      { id: "all", name: "全部" },
      { id: "created", name: "我发起的" },
      { id: "joined", name: "我参与的" },
      { id: "pending", name: "进行中" },
      { id: "completed", name: "已完成" }
    ]);
    const activeTab = common_vendor.ref("all");
    const games = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const refreshing = common_vendor.ref(false);
    const hasMore = common_vendor.ref(true);
    const currentPage = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const userId = common_vendor.ref("");
    const pageParams = common_vendor.ref({});
    const filteredGames = common_vendor.computed(() => {
      let filtered = [...games.value];
      filtered = filtered.map((game) => {
        const enhancedGame = { ...game };
        enhancedGame.isCreator = game.creatorId === userId.value;
        if (game.participants && Array.isArray(game.participants)) {
          if (game.participants.length > 0 && typeof game.participants[0] === "object") {
            enhancedGame.isJoined = game.participants.some((p) => p.id === userId.value);
          } else {
            enhancedGame.isJoined = game.participants.includes(userId.value);
          }
        } else {
          enhancedGame.isJoined = false;
        }
        enhancedGame.isFull = (game.currentPlayers || 1) >= (game.maxPlayers || 4);
        return enhancedGame;
      });
      switch (activeTab.value) {
        case "created":
          filtered = filtered.filter((game) => game.isCreator);
          break;
        case "joined":
          filtered = filtered.filter((game) => game.isJoined);
          break;
        case "pending":
          filtered = filtered.filter((game) => game.status === "pending" || !game.status);
          break;
        case "completed":
          filtered = filtered.filter((game) => game.status === "completed");
          break;
      }
      return filtered.sort((a, b) => new Date(b.time) - new Date(a.time));
    });
    const groupedGames = common_vendor.computed(() => {
      const groups = {};
      filteredGames.value.forEach((game) => {
        const date = new Date(game.time);
        const now = /* @__PURE__ */ new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        let dateKey = "";
        if (date.toDateString() === now.toDateString()) {
          dateKey = "今天";
        } else if (date.toDateString() === yesterday.toDateString()) {
          dateKey = "昨天";
        } else if (date.toDateString() === tomorrow.toDateString()) {
          dateKey = "明天";
        } else if (date > now) {
          dateKey = "未来活动";
        } else {
          dateKey = "历史活动";
        }
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(game);
      });
      const order = ["今天", "明天", "未来活动", "昨天", "历史活动"];
      return order.filter((key) => groups[key]).map((key) => ({
        date: key,
        games: groups[key]
      }));
    });
    common_vendor.onLoad((options) => {
      if (options.tab) {
        activeTab.value = options.tab;
      }
      pageParams.value = options;
      common_vendor.index.__f__("log", "at pages/game/list.vue:281", "页面参数:", options);
    });
    common_vendor.onShow(() => {
      common_vendor.index.__f__("log", "at pages/game/list.vue:285", "页面显示，检查是否需要刷新数据");
      const needRefresh = common_vendor.index.getStorageSync("needRefreshGameList");
      if (needRefresh) {
        common_vendor.index.__f__("log", "at pages/game/list.vue:289", "检测到需要刷新游戏列表，执行刷新");
        common_vendor.index.removeStorageSync("needRefreshGameList");
        onRefresh();
      }
    });
    common_vendor.onMounted(() => {
      loadUserInfo();
      loadGameList();
      updateTabCounts();
    });
    const loadUserInfo = () => {
      const currentUser = utils_user.UserService.getCurrentUser();
      if (currentUser) {
        userId.value = currentUser.id;
      }
    };
    const loadGameList = async () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
      if (loading.value)
        return;
      loading.value = true;
      try {
        const currentUser = utils_user.UserService.getCurrentUser();
        if (!currentUser) {
          common_vendor.index.showToast({
            title: "请先登录",
            icon: "none"
          });
          setTimeout(() => {
            common_vendor.index.switchTab({
              url: "/pages/user/user"
            });
          }, 1500);
          return;
        }
        userId.value = currentUser.id;
        let response = null;
        if (activeTab.value === "created" || activeTab.value === "joined") {
          try {
            common_vendor.index.__f__("log", "at pages/game/list.vue:339", `开始获取${activeTab.value === "created" ? "我创建的" : "我参与的"}组局...`);
            common_vendor.index.__f__("log", "at pages/game/list.vue:340", "当前用户ID:", userId.value);
            const cloudResult = await common_vendor.wx$1.cloud.callFunction({
              name: "game-service",
              data: {
                action: "getMyGames",
                userId: userId.value,
                type: activeTab.value,
                // 'created' 或 'joined'
                page: currentPage.value,
                pageSize: pageSize.value
              }
            });
            common_vendor.index.__f__("log", "at pages/game/list.vue:355", "【getMyGames】云函数返回原始数据:", cloudResult);
            common_vendor.index.__f__("log", "at pages/game/list.vue:356", "【getMyGames】result数据结构:", typeof cloudResult.result, cloudResult.result);
            common_vendor.index.__f__("log", "at pages/game/list.vue:357", "【getMyGames】result.code:", (_a = cloudResult.result) == null ? void 0 : _a.code);
            common_vendor.index.__f__("log", "at pages/game/list.vue:358", "【getMyGames】result.data:", (_b = cloudResult.result) == null ? void 0 : _b.data);
            common_vendor.index.__f__("log", "at pages/game/list.vue:359", "【getMyGames】result.message:", (_c = cloudResult.result) == null ? void 0 : _c.message);
            if (cloudResult && cloudResult.errMsg === "cloud.callFunction:ok") {
              if (cloudResult.result && cloudResult.result.code === 0) {
                const gamesData = cloudResult.result.data || [];
                common_vendor.index.__f__("log", "at pages/game/list.vue:365", `获取到${activeTab.value === "created" ? "我创建的" : "我参与的"}组局数据:`, gamesData.length, "条");
                const formattedGames = gamesData.map((game) => {
                  return {
                    ...game,
                    id: game._id || game.id,
                    participants: Array.isArray(game.participants) ? game.participants : [],
                    currentPlayers: game.currentPlayers || 1
                  };
                });
                response = formattedGames;
              } else {
                throw new Error(((_d = cloudResult.result) == null ? void 0 : _d.message) || "获取数据失败");
              }
            } else {
              throw new Error((cloudResult == null ? void 0 : cloudResult.errMsg) || "获取数据失败");
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/game/list.vue:385", `获取${activeTab.value}组局失败:`, error);
            throw error;
          }
        } else if (activeTab.value === "all") {
          try {
            common_vendor.index.__f__("log", "at pages/game/list.vue:391", "开始获取所有组局...");
            const cloudResult = await common_vendor.wx$1.cloud.callFunction({
              name: "game-service",
              data: {
                action: "getGameList",
                page: currentPage.value,
                pageSize: pageSize.value
              }
            });
            common_vendor.index.__f__("log", "at pages/game/list.vue:403", "【getGameList-all】云函数返回原始数据:", cloudResult);
            common_vendor.index.__f__("log", "at pages/game/list.vue:404", "【getGameList-all】result数据结构:", typeof cloudResult.result, cloudResult.result);
            common_vendor.index.__f__("log", "at pages/game/list.vue:405", "【getGameList-all】result.code:", (_e = cloudResult.result) == null ? void 0 : _e.code);
            common_vendor.index.__f__("log", "at pages/game/list.vue:406", "【getGameList-all】result.data:", (_f = cloudResult.result) == null ? void 0 : _f.data);
            common_vendor.index.__f__("log", "at pages/game/list.vue:407", "【getGameList-all】result.message:", (_g = cloudResult.result) == null ? void 0 : _g.message);
            if (cloudResult && cloudResult.errMsg === "cloud.callFunction:ok") {
              if (cloudResult.result && cloudResult.result.code === 0) {
                const gamesData = ((_h = cloudResult.result.data) == null ? void 0 : _h.list) || [];
                common_vendor.index.__f__("log", "at pages/game/list.vue:413", "获取到所有组局数据:", gamesData.length, "条");
                const formattedGames = gamesData.map((game) => {
                  return {
                    ...game,
                    id: game._id || game.id,
                    participants: Array.isArray(game.participants) ? game.participants : [],
                    currentPlayers: game.currentPlayers || 1
                  };
                });
                response = formattedGames;
              } else {
                throw new Error(((_i = cloudResult.result) == null ? void 0 : _i.message) || "获取数据失败");
              }
            } else {
              throw new Error((cloudResult == null ? void 0 : cloudResult.errMsg) || "获取数据失败");
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/game/list.vue:432", "获取所有组局失败:", error);
            throw error;
          }
        } else if (activeTab.value === "pending" || activeTab.value === "completed") {
          try {
            common_vendor.index.__f__("log", "at pages/game/list.vue:438", `开始获取${activeTab.value === "pending" ? "进行中" : "已完成"}的组局...`);
            const cloudResult = await common_vendor.wx$1.cloud.callFunction({
              name: "game-service",
              data: {
                action: "getGameList",
                status: activeTab.value,
                page: currentPage.value,
                pageSize: pageSize.value
              }
            });
            common_vendor.index.__f__("log", "at pages/game/list.vue:451", `【getGameList-${activeTab.value}】云函数返回原始数据:`, cloudResult);
            common_vendor.index.__f__("log", "at pages/game/list.vue:452", `【getGameList-${activeTab.value}】result数据结构:`, typeof cloudResult.result, cloudResult.result);
            common_vendor.index.__f__("log", "at pages/game/list.vue:453", `【getGameList-${activeTab.value}】result.code:`, (_j = cloudResult.result) == null ? void 0 : _j.code);
            common_vendor.index.__f__("log", "at pages/game/list.vue:454", `【getGameList-${activeTab.value}】result.data:`, (_k = cloudResult.result) == null ? void 0 : _k.data);
            common_vendor.index.__f__("log", "at pages/game/list.vue:455", `【getGameList-${activeTab.value}】result.message:`, (_l = cloudResult.result) == null ? void 0 : _l.message);
            if (cloudResult && cloudResult.errMsg === "cloud.callFunction:ok") {
              if (cloudResult.result && cloudResult.result.code === 0) {
                const gamesData = ((_m = cloudResult.result.data) == null ? void 0 : _m.list) || [];
                common_vendor.index.__f__("log", "at pages/game/list.vue:461", `获取到${activeTab.value === "pending" ? "进行中" : "已完成"}组局数据:`, gamesData.length, "条");
                const formattedGames = gamesData.map((game) => {
                  return {
                    ...game,
                    id: game._id || game.id,
                    participants: Array.isArray(game.participants) ? game.participants : [],
                    currentPlayers: game.currentPlayers || 1
                  };
                });
                response = formattedGames;
              } else {
                throw new Error(((_n = cloudResult.result) == null ? void 0 : _n.message) || "获取数据失败");
              }
            } else {
              throw new Error((cloudResult == null ? void 0 : cloudResult.errMsg) || "获取数据失败");
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/game/list.vue:480", `获取${activeTab.value}组局失败:`, error);
            throw error;
          }
        }
        if (response) {
          if (currentPage.value === 1) {
            games.value = response;
          } else {
            games.value = [...games.value, ...response];
          }
          hasMore.value = response.length >= pageSize.value;
          common_vendor.index.__f__("log", "at pages/game/list.vue:495", "处理后games.value:", games.value.length, "条");
        } else {
          games.value = [];
          hasMore.value = false;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/game/list.vue:502", "加载组局列表失败:", error);
        common_vendor.index.showToast({
          title: "加载失败: " + (error.message || "请检查网络"),
          icon: "none",
          duration: 3e3
        });
        games.value = [];
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    };
    const updateTabCounts = () => {
      tabs.value.forEach((tab) => {
        let count = 0;
        switch (tab.id) {
          case "created":
            count = filteredGames.value.filter((g) => g.creatorId === userId.value).length;
            break;
          case "joined":
            count = filteredGames.value.filter((g) => {
              if (g.participants && Array.isArray(g.participants)) {
                if (g.participants.length > 0 && typeof g.participants[0] === "object") {
                  return g.participants.some((p) => p.id === userId.value);
                } else {
                  return g.participants.includes(userId.value);
                }
              }
              return false;
            }).length;
            break;
          case "pending":
            count = games.value.filter((g) => g.status === "pending" || !g.status).length;
            break;
          case "completed":
            count = games.value.filter((g) => g.status === "completed").length;
            break;
          case "all":
            count = games.value.length;
            break;
        }
        tab.count = count;
      });
    };
    const switchTab = async (tabId) => {
      activeTab.value = tabId;
      currentPage.value = 1;
      games.value = [];
      await loadGameList();
      updateTabCounts();
    };
    const onRefresh = async () => {
      refreshing.value = true;
      currentPage.value = 1;
      games.value = [];
      await loadGameList();
      updateTabCounts();
    };
    const onLoadMore = async () => {
      if (!hasMore.value || loading.value)
        return;
      currentPage.value++;
      await loadGameList();
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const refreshPage = () => {
      common_vendor.index.showLoading({
        title: "刷新中...",
        mask: true
      });
      setTimeout(() => {
        onRefresh();
        common_vendor.index.hideLoading();
      }, 500);
    };
    const getTypeClass = (type) => {
      const classMap = {
        "mahjong": "tag-mahjong",
        "boardgame": "tag-boardgame",
        "videogame": "tag-videogame",
        "competition": "tag-competition"
      };
      return classMap[type] || "tag-mahjong";
    };
    const getTypeText = (type) => {
      const textMap = {
        "mahjong": "立直麻将",
        "boardgame": "桌游",
        "videogame": "电玩",
        "competition": "比赛"
      };
      return textMap[type] || "立直麻将";
    };
    const getStatusClass = (status) => {
      const classMap = {
        "pending": "tag-status-pending",
        "completed": "tag-status-completed",
        "cancelled": "tag-status-cancelled",
        "full": "tag-status-full"
      };
      return classMap[status] || "tag-status-pending";
    };
    const getStatusText = (status) => {
      const textMap = {
        "pending": "进行中",
        "completed": "已完成",
        "cancelled": "已取消",
        "full": "已满员"
      };
      return textMap[status] || "进行中";
    };
    const formatGameTime = (datetime) => {
      if (!datetime)
        return "";
      const date = new Date(datetime);
      const now = /* @__PURE__ */ new Date();
      const diff = date - now;
      if (diff > 0) {
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    };
    const getEmptyImage = () => {
      const images = {
        "all": "/static/empty-games.png",
        "created": "/static/empty-created.png",
        "joined": "/static/empty-joined.png",
        "pending": "/static/empty-pending.png",
        "completed": "/static/empty-completed.png"
      };
      return images[activeTab.value] || "/static/empty-games.png";
    };
    const getEmptyText = () => {
      const texts = {
        "all": "暂无组局记录",
        "created": "您还没有发起过组局",
        "joined": "您还没有加入过组局",
        "pending": "没有进行中的组局",
        "completed": "没有已完成的组局"
      };
      return texts[activeTab.value] || "暂无数据";
    };
    const goToCreate = () => {
      common_vendor.index.navigateTo({
        url: "/pages/create/create"
      });
    };
    const goToHome = () => {
      common_vendor.index.switchTab({
        url: "/pages/index/index"
      });
    };
    const goToDetail = (gameId) => {
      common_vendor.index.navigateTo({
        url: `/pages/detail/detail?id=${gameId}`
      });
    };
    const joinGame = async (game) => {
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
        content: `确定要加入 "${game.title}" 吗？`,
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({
              title: "加入中...",
              mask: true
            });
            try {
              const result = await common_vendor.wx$1.cloud.callFunction({
                name: "game-service",
                data: {
                  action: "joinGame",
                  gameId: game.id || game._id,
                  userId: userId.value
                }
              });
              if (result && result.errMsg === "cloud.callFunction:ok") {
                common_vendor.index.setStorageSync("needRefreshGameList", true);
                await loadGameList();
                updateTabCounts();
                common_vendor.index.showToast({
                  title: "加入成功",
                  icon: "success"
                });
              } else {
                throw new Error((result == null ? void 0 : result.errMsg) || "加入失败");
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/game/list.vue:758", "加入游戏失败:", error);
              common_vendor.index.showToast({
                title: error.message || "加入失败",
                icon: "none"
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const quitGame = async (game) => {
      const currentUser = utils_user.UserService.getCurrentUser();
      if (!currentUser) {
        common_vendor.index.showModal({
          title: "需要登录",
          content: "请先登录后再操作",
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
        title: "确认退出",
        content: `确定要退出 "${game.title}" 吗？`,
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({
              title: "退出中...",
              mask: true
            });
            try {
              const result = await common_vendor.wx$1.cloud.callFunction({
                name: "game-service",
                data: {
                  action: "quitGame",
                  gameId: game.id || game._id,
                  userId: userId.value
                }
              });
              if (result && result.errMsg === "cloud.callFunction:ok") {
                common_vendor.index.setStorageSync("needRefreshGameList", true);
                await loadGameList();
                updateTabCounts();
                common_vendor.index.showToast({
                  title: "已退出",
                  icon: "success"
                });
              } else {
                throw new Error((result == null ? void 0 : result.errMsg) || "退出失败");
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/game/list.vue:826", "退出游戏失败:", error);
              common_vendor.index.showToast({
                title: error.message || "退出失败",
                icon: "none"
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const manageGame = (game) => {
      common_vendor.index.showActionSheet({
        itemList: ["编辑组局", "取消组局", "复制组局"],
        success: (res) => {
          switch (res.tapIndex) {
            case 0:
              editGame(game);
              break;
            case 1:
              cancelGame(game);
              break;
            case 2:
              copyGame(game);
              break;
          }
        }
      });
    };
    const editGame = (game) => {
      common_vendor.index.navigateTo({
        url: `/pages/create/create?edit=1&id=${game.id || game._id}`,
        events: {
          // 监听编辑页面的事件
          refreshList: async () => {
            common_vendor.index.__f__("log", "at pages/game/list.vue:867", "收到编辑页面刷新事件");
            common_vendor.index.setStorageSync("needRefreshGameList", true);
            await loadGameList();
            updateTabCounts();
          }
        },
        success: (res) => {
          res.eventChannel.on("onGameUpdated", async (data) => {
            common_vendor.index.__f__("log", "at pages/game/list.vue:878", "编辑页面关闭，收到组局更新事件:", data);
            if (data.success) {
              common_vendor.index.setStorageSync("needRefreshGameList", true);
              await loadGameList();
              updateTabCounts();
              common_vendor.index.showToast({
                title: "编辑成功",
                icon: "success",
                duration: 2e3
              });
            }
          });
        }
      });
    };
    const cancelGame = (game) => {
      const currentUser = utils_user.UserService.getCurrentUser();
      if (!currentUser) {
        common_vendor.index.showModal({
          title: "需要登录",
          content: "请先登录后再操作",
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
        title: "确认取消",
        content: `确定要取消 "${game.title}" 吗？此操作不可撤销。`,
        confirmColor: "#ff4d4f",
        success: async (res) => {
          var _a;
          if (res.confirm) {
            common_vendor.index.showLoading({
              title: "取消中...",
              mask: true
            });
            try {
              const result = await common_vendor.wx$1.cloud.callFunction({
                name: "game-service",
                data: {
                  action: "deleteGame",
                  // ✅ 使用 deleteGame
                  data: {
                    // ✅ 注意参数要放在 data 对象中
                    gameId: game.id || game._id,
                    userId: userId.value
                  }
                }
              });
              if (result && result.errMsg === "cloud.callFunction:ok" && result.result.code === 0) {
                common_vendor.index.setStorageSync("needRefreshGameList", true);
                await loadGameList();
                updateTabCounts();
                common_vendor.index.showToast({
                  title: "已取消",
                  icon: "success",
                  duration: 2e3
                });
                common_vendor.index.__f__("log", "at pages/game/list.vue:952", "组局取消成功，已重新加载列表");
              } else {
                common_vendor.index.__f__("error", "at pages/game/list.vue:955", "取消失败返回结果:", result);
                throw new Error(((_a = result == null ? void 0 : result.result) == null ? void 0 : _a.message) || "取消失败");
              }
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/game/list.vue:960", "取消组局失败:", error);
              common_vendor.index.showToast({
                title: error.message || "取消失败",
                icon: "none",
                duration: 3e3
              });
              if (error.message.includes("权限") || error.message.includes("权限不足")) {
                common_vendor.index.showModal({
                  title: "权限不足",
                  content: "您没有权限取消此组局",
                  showCancel: false
                });
              }
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const copyGame = (game) => {
      const gameCopy = {
        type: game.type,
        title: `${game.title} (副本)`,
        project: game.project,
        location: game.location,
        maxPlayers: game.maxPlayers,
        description: game.description
      };
      common_vendor.index.setStorageSync("game_copy", gameCopy);
      common_vendor.index.showToast({
        title: "已复制，可在创建页面粘贴",
        icon: "success"
      });
      setTimeout(() => {
        common_vendor.index.navigateTo({
          url: "/pages/create/create?copy=1"
        });
      }, 1e3);
    };
    const reviewGame = (game) => {
      common_vendor.index.showModal({
        title: "回顾组局",
        content: "回顾功能开发中，敬请期待",
        showCancel: false
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0$3,
        b: common_vendor.o(goBack, "55"),
        c: common_assets._imports_1,
        d: common_vendor.o(refreshPage, "fb"),
        e: common_vendor.f(tabs.value, (tab, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(tab.name),
            b: tab.count
          }, tab.count ? {
            c: common_vendor.t(tab.count)
          } : {}, {
            d: tab.id,
            e: activeTab.value === tab.id ? 1 : "",
            f: common_vendor.o(($event) => switchTab(tab.id), tab.id)
          });
        }),
        f: !loading.value && filteredGames.value.length === 0
      }, !loading.value && filteredGames.value.length === 0 ? common_vendor.e({
        g: getEmptyImage(),
        h: common_vendor.t(getEmptyText()),
        i: activeTab.value === "all" || activeTab.value === "created"
      }, activeTab.value === "all" || activeTab.value === "created" ? {
        j: common_vendor.o(goToCreate, "05")
      } : {}, {
        k: activeTab.value === "joined"
      }, activeTab.value === "joined" ? {
        l: common_vendor.o(goToHome, "9b")
      } : {}) : common_vendor.e({
        m: common_vendor.f(groupedGames.value, (group, k0, i0) => {
          return {
            a: common_vendor.t(group.date),
            b: common_vendor.f(group.games, (game, k1, i1) => {
              return common_vendor.e({
                a: common_vendor.t(getTypeText(game.type)),
                b: common_vendor.n(getTypeClass(game.type)),
                c: game.isCreator || game.creatorId === userId.value
              }, game.isCreator || game.creatorId === userId.value ? {} : {}, {
                d: common_vendor.t(getStatusText(game.status || "pending")),
                e: common_vendor.n(getStatusClass(game.status || "pending")),
                f: common_vendor.t(game.title),
                g: common_vendor.t(game.project),
                h: common_vendor.t(formatGameTime(game.time)),
                i: game.location
              }, game.location ? {
                j: common_assets._imports_3,
                k: common_vendor.t(game.location)
              } : {}, {
                l: common_vendor.f((game.players || []).slice(0, 4), (player, index, i2) => {
                  return {
                    a: player.avatar || "/static/avatar/default.png",
                    b: player.id || index,
                    c: 10 - index
                  };
                }),
                m: game.currentPlayers > 4
              }, game.currentPlayers > 4 ? {
                n: common_vendor.t(game.currentPlayers - 4)
              } : {}, {
                o: common_vendor.t(game.currentPlayers || 1),
                p: common_vendor.t(game.maxPlayers || 4),
                q: (game.status === "pending" || !game.status) && (game.isCreator || game.creatorId === userId.value)
              }, (game.status === "pending" || !game.status) && (game.isCreator || game.creatorId === userId.value) ? {
                r: common_vendor.o(($event) => manageGame(game), game.id || game._id)
              } : {}, {
                s: (game.status === "pending" || !game.status) && game.isJoined && !game.isCreator && game.creatorId !== userId.value
              }, (game.status === "pending" || !game.status) && game.isJoined && !game.isCreator && game.creatorId !== userId.value ? {
                t: common_vendor.o(($event) => quitGame(game), game.id || game._id)
              } : {}, {
                v: (game.status === "pending" || !game.status) && !game.isJoined && !game.isFull && game.creatorId !== userId.value
              }, (game.status === "pending" || !game.status) && !game.isJoined && !game.isFull && game.creatorId !== userId.value ? {
                w: common_vendor.o(($event) => joinGame(game), game.id || game._id)
              } : {}, {
                x: game.status === "completed"
              }, game.status === "completed" ? {
                y: common_vendor.o(($event) => reviewGame(), game.id || game._id)
              } : {}, {
                z: game.status === "cancelled"
              }, game.status === "cancelled" ? {} : {}, {
                A: game.id || game._id,
                B: common_vendor.o(($event) => goToDetail(game.id || game._id), game.id || game._id)
              });
            }),
            c: group.date
          };
        }),
        n: common_assets._imports_2,
        o: loading.value
      }, loading.value ? {} : {}, {
        p: hasMore.value && !loading.value
      }, hasMore.value && !loading.value ? {
        q: common_vendor.o(onLoadMore, "e9")
      } : {}, {
        r: !hasMore.value && filteredGames.value.length > 0
      }, !hasMore.value && filteredGames.value.length > 0 ? {} : {}), {
        s: refreshing.value,
        t: common_vendor.o(onRefresh, "79"),
        v: common_vendor.o(onLoadMore, "32")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-54b926a2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/game/list.js.map
