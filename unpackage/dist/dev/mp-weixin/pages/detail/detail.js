"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const utils_constants = require("../../utils/constants.js");
const LOCAL_DEFAULT_AVATAR = "/static/empty.png";
const LOCAL_SHARE_IMAGE = "/static/empty.png";
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const gameDetail = common_vendor.ref({
      creatorInfo: {},
      participants: [],
      activities: [],
      type: "mahjong",
      status: "pending",
      isFull: false,
      isJoined: false,
      isCreator: false
    });
    const loading = common_vendor.ref(true);
    const refreshing = common_vendor.ref(false);
    const error = common_vendor.ref("");
    const gameId = common_vendor.ref("");
    const currentUser = common_vendor.ref(null);
    const creatorAvatarError = common_vendor.ref(false);
    const participantAvatarErrors = common_vendor.ref({});
    const isCloudFileId = (value) => typeof value === "string" && value.startsWith("cloud://");
    const isHttpUrl = (value) => typeof value === "string" && /^https?:\/\//.test(value);
    const normalizeAvatarUrl = (avatar, tempUrlMap = {}) => {
      if (!avatar)
        return LOCAL_DEFAULT_AVATAR;
      if (isCloudFileId(avatar)) {
        return tempUrlMap[avatar] || LOCAL_DEFAULT_AVATAR;
      }
      if (isHttpUrl(avatar) || avatar.startsWith("/")) {
        return avatar;
      }
      return LOCAL_DEFAULT_AVATAR;
    };
    const getParticipantAvatarKey = (player, index) => {
      return (player == null ? void 0 : player.id) || (player == null ? void 0 : player._id) || (player == null ? void 0 : player.openid) || `player-${index}`;
    };
    const getParticipantAvatarSrc = (player, index) => {
      const key = getParticipantAvatarKey(player, index);
      if (participantAvatarErrors.value[key]) {
        return LOCAL_DEFAULT_AVATAR;
      }
      return (player == null ? void 0 : player.avatar) || LOCAL_DEFAULT_AVATAR;
    };
    const creatorAvatarSrc = common_vendor.computed(() => {
      var _a, _b;
      if (creatorAvatarError.value)
        return LOCAL_DEFAULT_AVATAR;
      return ((_b = (_a = gameDetail.value) == null ? void 0 : _a.creatorInfo) == null ? void 0 : _b.avatar) || LOCAL_DEFAULT_AVATAR;
    });
    const getCloudTempUrlMap = async (fileList = []) => {
      const uniqueFileList = [...new Set(fileList.filter(Boolean))];
      if (!uniqueFileList.length)
        return {};
      try {
        const res = await common_vendor.wx$1.cloud.getTempFileURL({ fileList: uniqueFileList });
        const tempUrlMap = {};
        const entries = (res == null ? void 0 : res.fileList) || [];
        entries.forEach((item) => {
          if (!(item == null ? void 0 : item.fileID))
            return;
          if (item.status === 0 && item.tempFileURL) {
            tempUrlMap[item.fileID] = item.tempFileURL;
          }
        });
        return tempUrlMap;
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:358", "获取云文件临时链接失败:", err);
        return {};
      }
    };
    common_vendor.onLoad(async (options) => {
      common_vendor.index.showShareMenu({
        withShareTicket: true,
        menus: ["shareAppMessage", "shareTimeline"]
      });
      if (options.id) {
        gameId.value = options.id;
        common_vendor.index.__f__("log", "at pages/detail/detail.vue:371", "开始加载组局详情，ID:", gameId.value);
        await getCurrentUser();
        await loadGameDetail();
      } else {
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:379", "未传递游戏ID");
        error.value = "参数错误：缺少游戏ID";
        loading.value = false;
      }
    });
    const getCurrentUser = async () => {
      try {
        const userInfo = common_vendor.index.getStorageSync("userInfo");
        if (userInfo) {
          currentUser.value = userInfo;
        } else {
          const res = await common_vendor.wx$1.cloud.callFunction({
            name: "user-service",
            data: { action: "getCurrentUser" }
          });
          if (res.result && res.result.code === 0) {
            currentUser.value = res.result.data;
            common_vendor.index.setStorageSync("userInfo", res.result.data);
          }
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:404", "获取用户信息失败:", err);
      }
    };
    const loadGameDetail = async () => {
      var _a, _b, _c, _d, _e;
      loading.value = true;
      error.value = "";
      creatorAvatarError.value = false;
      participantAvatarErrors.value = {};
      try {
        common_vendor.index.__f__("log", "at pages/detail/detail.vue:416", "调用game-service获取详情，参数:", { gameId: gameId.value });
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: {
            action: "getGameDetail",
            data: { gameId: gameId.value }
          }
        });
        common_vendor.index.__f__("log", "at pages/detail/detail.vue:426", "获取组局详情结果:", res);
        if (res.result && res.result.code === 0) {
          const game = res.result.data || {};
          const participants = Array.isArray(game.participants) ? game.participants : [];
          const cloudFileIds = [
            ((_a = game == null ? void 0 : game.creatorInfo) == null ? void 0 : _a.avatar) || utils_constants.constants.DEFAULT_AVATAR,
            ...participants.map((player) => player == null ? void 0 : player.avatar)
          ].filter((value) => isCloudFileId(value));
          const cloudTempUrlMap = await getCloudTempUrlMap(cloudFileIds);
          let isJoined = false;
          if (currentUser.value) {
            isJoined = participants.some((p) => p.id === currentUser.value.id);
          }
          const currentId = currentUser.value ? String(currentUser.value.id || currentUser.value._id || "") : "";
          const isCreator = !!currentId && String(game.creatorId || "") === currentId;
          const currentPlayers = participants.length + 1;
          const isFull = currentPlayers >= (game.maxPlayers || 4);
          gameDetail.value = {
            ...game,
            id: game._id || game.id,
            creatorInfo: {
              ...game.creatorInfo || {},
              nickname: ((_b = game == null ? void 0 : game.creatorInfo) == null ? void 0 : _b.nickname) || "未知用户",
              tags: ((_c = game == null ? void 0 : game.creatorInfo) == null ? void 0 : _c.tags) || [],
              avatar: normalizeAvatarUrl(((_d = game == null ? void 0 : game.creatorInfo) == null ? void 0 : _d.avatar) || utils_constants.constants.DEFAULT_AVATAR, cloudTempUrlMap)
            },
            participants: participants.map((player) => ({
              ...player,
              avatar: normalizeAvatarUrl(player == null ? void 0 : player.avatar, cloudTempUrlMap)
            })),
            activities: game.activities || [],
            currentPlayers,
            isFull,
            isJoined,
            isCreator
          };
          common_vendor.index.__f__("log", "at pages/detail/detail.vue:471", "处理后的游戏数据:", gameDetail.value);
        } else {
          throw new Error(((_e = res.result) == null ? void 0 : _e.message) || "获取游戏详情失败");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:476", "加载组局详情失败:", err);
        error.value = err.message || "加载失败，请稍后重试";
      } finally {
        loading.value = false;
        refreshing.value = false;
      }
    };
    const onRefresh = () => {
      if (!refreshing.value) {
        refreshing.value = true;
        loadGameDetail();
      }
    };
    const onLoadMore = () => {
    };
    const handleBack = () => {
      common_vendor.index.navigateBack();
    };
    const getTypeClass = (type) => {
      const classMap = {
        "mahjong": "tag-mahjong",
        "boardgame": "tag-boardgame",
        "videogame": "tag-videogame",
        "cardgame": "tag-cardgame",
        "competition": "tag-competition",
        "sports": "tag-sports",
        "other": "tag-other"
      };
      return classMap[type] || "tag-mahjong";
    };
    const getTypeText = (type) => {
      const textMap = {
        "mahjong": "立直麻将",
        "boardgame": "桌游",
        "videogame": "电玩",
        "cardgame": "打牌",
        "competition": "比赛",
        "sports": "运动",
        "other": "其他"
      };
      return textMap[type] || "立直麻将";
    };
    const getStatusClass = (game) => {
      if ((game == null ? void 0 : game.status) === "ongoing")
        return "tag-status-ongoing";
      if ((game == null ? void 0 : game.status) === "cancelled")
        return "tag-status-cancelled";
      if (game == null ? void 0 : game.isFull)
        return "tag-status-full";
      return "tag-status";
    };
    const getStatusTextSafe = (game) => {
      if ((game == null ? void 0 : game.status) === "ongoing")
        return "使用中";
      if ((game == null ? void 0 : game.status) === "cancelled")
        return "已取消";
      if (game == null ? void 0 : game.isFull)
        return "已满员";
      return `缺${((game == null ? void 0 : game.maxPlayers) || 4) - ((game == null ? void 0 : game.currentPlayers) || 1)}人`;
    };
    const formatDateTime = (datetime) => {
      if (!datetime)
        return "未设置";
      try {
        const date = new Date(datetime);
        if (isNaN(date.getTime()))
          return "时间格式错误";
        const now = /* @__PURE__ */ new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.floor((targetDate - today) / (1e3 * 60 * 60 * 24));
        let dateStr = "";
        if (diffDays === 0) {
          dateStr = "今天";
        } else if (diffDays === 1) {
          dateStr = "明天";
        } else if (diffDays === 2) {
          dateStr = "后天";
        } else {
          const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
          dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
        }
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${dateStr} ${hours}:${minutes}`;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:585", "格式化时间错误:", e);
        return "时间格式错误";
      }
    };
    const formatCreateTime = (datetime) => {
      if (!datetime)
        return "";
      try {
        const date = new Date(datetime);
        if (isNaN(date.getTime()))
          return "";
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:600", "格式化创建时间错误:", e);
        return "";
      }
    };
    const formatRelativeTime = (datetime) => {
      if (!datetime)
        return "";
      try {
        const date = new Date(datetime);
        if (isNaN(date.getTime()))
          return "";
        const now = /* @__PURE__ */ new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1e3 * 60));
        const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
        if (diffMins < 1) {
          return "刚刚";
        } else if (diffMins < 60) {
          return `${diffMins}分钟前`;
        } else if (diffHours < 24) {
          return `${diffHours}小时前`;
        } else if (diffDays < 7) {
          return `${diffDays}天前`;
        } else {
          return `${date.getMonth() + 1}月${date.getDate()}日`;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:631", "格式化相对时间错误:", e);
        return "";
      }
    };
    const handleAvatarError = (key) => {
      common_vendor.index.__f__("log", "at pages/detail/detail.vue:638", "头像加载失败:", key);
      if (key === "creator") {
        creatorAvatarError.value = true;
        return;
      }
      participantAvatarErrors.value = {
        ...participantAvatarErrors.value,
        [key]: true
      };
    };
    const handleJoin = async () => {
      if (!currentUser.value) {
        common_vendor.index.showModal({
          title: "需要登录",
          content: "请先登录后再加入组局",
          confirmText: "去登录",
          cancelText: "取消",
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
      if (gameDetail.value.status !== "pending") {
        common_vendor.index.showToast({
          title: "此组局已不可加入",
          icon: "none"
        });
        return;
      }
      if (gameDetail.value.isFull) {
        common_vendor.index.showToast({
          title: "组局已满员",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "确认加入",
        content: "确定要加入这个组局吗？",
        confirmText: "确定",
        cancelText: "取消",
        success: async (res) => {
          var _a;
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
                  data: {
                    gameId: gameId.value,
                    userId: currentUser.value.id
                  }
                }
              });
              common_vendor.index.__f__("log", "at pages/detail/detail.vue:709", "加入组局结果:", result);
              if (result.result && result.result.code === 0) {
                await loadGameDetail();
                common_vendor.index.showToast({
                  title: "加入成功",
                  icon: "success",
                  duration: 2e3
                });
              } else {
                throw new Error(((_a = result.result) == null ? void 0 : _a.message) || "加入失败");
              }
            } catch (err) {
              common_vendor.index.__f__("error", "at pages/detail/detail.vue:725", "加入组局失败:", err);
              common_vendor.index.showToast({
                title: err.message || "加入失败",
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
    const handleQuit = async () => {
      if (!currentUser.value) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出这个组局吗？",
        confirmText: "确定",
        cancelText: "取消",
        confirmColor: "#ff4d4f",
        success: async (res) => {
          var _a;
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
                  data: {
                    gameId: gameId.value,
                    userId: currentUser.value.id
                  }
                }
              });
              common_vendor.index.__f__("log", "at pages/detail/detail.vue:774", "退出组局结果:", result);
              if (result.result && result.result.code === 0) {
                await loadGameDetail();
                common_vendor.index.showToast({
                  title: "已退出",
                  icon: "success",
                  duration: 2e3
                });
              } else {
                throw new Error(((_a = result.result) == null ? void 0 : _a.message) || "退出失败");
              }
            } catch (err) {
              common_vendor.index.__f__("error", "at pages/detail/detail.vue:790", "退出组局失败:", err);
              common_vendor.index.showToast({
                title: err.message || "退出失败",
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
    const handleKickPlayer = (player) => {
      var _a, _b, _c;
      const currentId = String(((_a = currentUser.value) == null ? void 0 : _a.id) || ((_b = currentUser.value) == null ? void 0 : _b._id) || "");
      const creatorId = String(((_c = gameDetail.value) == null ? void 0 : _c.creatorId) || "");
      if (!currentId || currentId !== creatorId) {
        common_vendor.index.showToast({ title: "只有创建者可操作", icon: "none" });
        return;
      }
      if (gameDetail.value.status !== "pending") {
        common_vendor.index.showToast({ title: "当前状态不可移除", icon: "none" });
        return;
      }
      const targetUserId = (player == null ? void 0 : player.id) || (player == null ? void 0 : player._id) || "";
      if (!targetUserId) {
        common_vendor.index.showToast({ title: "玩家信息异常", icon: "none" });
        return;
      }
      const targetName = (player == null ? void 0 : player.nickname) || "该玩家";
      common_vendor.index.showModal({
        title: "确认移除",
        content: `确定将“${targetName}”移出本组局吗？`,
        confirmText: "移除",
        confirmColor: "#ef4444",
        success: async (res) => {
          var _a2;
          if (!res.confirm)
            return;
          common_vendor.index.showLoading({ title: "移除中...", mask: true });
          try {
            const result = await common_vendor.wx$1.cloud.callFunction({
              name: "game-service",
              data: {
                action: "removeParticipant",
                data: { gameId: gameId.value, targetUserId }
              }
            });
            if (result.result && result.result.code === 0) {
              await loadGameDetail();
              common_vendor.index.showToast({ title: "已移除", icon: "success" });
            } else {
              throw new Error(((_a2 = result.result) == null ? void 0 : _a2.message) || "移除失败");
            }
          } catch (err) {
            common_vendor.index.showToast({ title: err.message || "移除失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    };
    const handleEdit = () => {
      if (!currentUser.value || !gameDetail.value.isCreator) {
        common_vendor.index.showToast({
          title: "只有创建者可以编辑",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/create/create?edit=1&id=${gameId.value}`
      });
    };
    const handleCancel = () => {
      if (!currentUser.value || !gameDetail.value.isCreator) {
        common_vendor.index.showToast({
          title: "只有创建者可以取消",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "确认取消",
        content: "确定要取消这个组局吗？此操作不可撤销，已加入的用户会收到通知。",
        confirmText: "确定取消",
        cancelText: "再想想",
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
                  data: { gameId: gameId.value }
                }
              });
              common_vendor.index.__f__("log", "at pages/detail/detail.vue:904", "取消组局结果:", result);
              if (result.result && result.result.code === 0) {
                await loadGameDetail();
                common_vendor.index.showToast({
                  title: "组局已取消",
                  icon: "success",
                  duration: 2e3
                });
                setTimeout(() => {
                  common_vendor.index.navigateBack();
                }, 2e3);
              } else {
                throw new Error(((_a = result.result) == null ? void 0 : _a.message) || "取消失败");
              }
            } catch (err) {
              common_vendor.index.__f__("error", "at pages/detail/detail.vue:925", "取消组局失败:", err);
              common_vendor.index.showToast({
                title: err.message || "取消失败",
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
    const getTagDisplay = (tag) => {
      if (!tag)
        return "";
      if (typeof tag === "string") {
        return tag;
      }
      if (tag && typeof tag === "object") {
        if (tag.name) {
          return tag.name;
        }
        if (tag.text) {
          return tag.text;
        }
        if (tag.label) {
          return tag.label;
        }
      }
      return String(tag);
    };
    common_vendor.onShareAppMessage(() => {
      return {
        title: `${gameDetail.value.title} - 玩咖约局`,
        path: `/pages/detail/detail?id=${gameId.value}`,
        imageUrl: LOCAL_SHARE_IMAGE
      };
    });
    common_vendor.onShow(async () => {
      if (gameId.value) {
        await getCurrentUser();
        await loadGameDetail();
      }
    });
    common_vendor.onShareTimeline(() => {
      return {
        title: `玩咖约局：${gameDetail.value.title}`,
        query: `id=${gameId.value}`,
        imageUrl: LOCAL_SHARE_IMAGE
      };
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : error.value ? {
        c: common_assets._imports_0,
        d: common_vendor.t(error.value),
        e: common_vendor.o(loadGameDetail, "02"),
        f: common_vendor.o(handleBack, "66")
      } : common_vendor.e({
        g: common_vendor.t(getTypeText(gameDetail.value.type)),
        h: common_vendor.n(getTypeClass(gameDetail.value.type)),
        i: common_vendor.t(getStatusTextSafe(gameDetail.value)),
        j: common_vendor.n(getStatusClass(gameDetail.value)),
        k: common_vendor.t(gameDetail.value.title || "未命名活动"),
        l: gameDetail.value.project
      }, gameDetail.value.project ? {
        m: common_vendor.t(gameDetail.value.project)
      } : {}, {
        n: common_assets._imports_1,
        o: common_vendor.t(formatDateTime(gameDetail.value.time)),
        p: common_assets._imports_2,
        q: common_vendor.t(gameDetail.value.location || "未设置地点"),
        r: common_assets._imports_3,
        s: common_vendor.t(gameDetail.value.currentPlayers || 1),
        t: common_vendor.t(gameDetail.value.maxPlayers || 4),
        v: !gameDetail.value.isFull
      }, !gameDetail.value.isFull ? {
        w: common_vendor.t((gameDetail.value.maxPlayers || 4) - (gameDetail.value.currentPlayers || 1))
      } : {}, {
        x: gameDetail.value.description
      }, gameDetail.value.description ? {
        y: common_assets._imports_4,
        z: common_vendor.t(gameDetail.value.description)
      } : {}, {
        A: common_vendor.t(formatCreateTime(gameDetail.value.createdAt)),
        B: gameDetail.value.creatorInfo
      }, gameDetail.value.creatorInfo ? common_vendor.e({
        C: creatorAvatarSrc.value,
        D: common_vendor.o(($event) => handleAvatarError("creator"), "ee"),
        E: common_vendor.t(gameDetail.value.creatorInfo.nickname || "未知用户"),
        F: gameDetail.value.creatorInfo.gender
      }, gameDetail.value.creatorInfo.gender ? {
        G: common_vendor.t(gameDetail.value.creatorInfo.gender === 1 ? "男" : "女")
      } : {}, {
        H: gameDetail.value.creatorInfo.tags && gameDetail.value.creatorInfo.tags.length > 0
      }, gameDetail.value.creatorInfo.tags && gameDetail.value.creatorInfo.tags.length > 0 ? common_vendor.e({
        I: common_vendor.f(gameDetail.value.creatorInfo.tags.slice(0, 3), (tag, index, i0) => {
          return {
            a: common_vendor.t(getTagDisplay(tag)),
            b: index
          };
        }),
        J: gameDetail.value.creatorInfo.tags.length > 3
      }, gameDetail.value.creatorInfo.tags.length > 3 ? {
        K: common_vendor.t(gameDetail.value.creatorInfo.tags.length - 3)
      } : {}) : {}, {
        L: gameDetail.value.creatorInfo.intro
      }, gameDetail.value.creatorInfo.intro ? {
        M: common_vendor.t(gameDetail.value.creatorInfo.intro)
      } : {}, {
        N: gameDetail.value.creatorContact
      }, gameDetail.value.creatorContact ? {
        O: common_assets._imports_5,
        P: common_vendor.t(gameDetail.value.creatorContact)
      } : {}) : {}, {
        Q: common_vendor.t((gameDetail.value.participants || []).length + 1),
        R: creatorAvatarSrc.value,
        S: common_vendor.o(($event) => handleAvatarError("creator"), "46"),
        T: common_vendor.t(((_a = gameDetail.value.creatorInfo) == null ? void 0 : _a.nickname) || "未知用户"),
        U: common_vendor.f(gameDetail.value.participants, (player, index, i0) => {
          return common_vendor.e({
            a: getParticipantAvatarSrc(player, index),
            b: common_vendor.o(($event) => handleAvatarError(getParticipantAvatarKey(player, index)), index),
            c: common_vendor.t(player.nickname || "玩家" + (index + 1)),
            d: player.joinTime
          }, player.joinTime ? {
            e: common_vendor.t(formatRelativeTime(player.joinTime))
          } : {}, currentUser.value && String(currentUser.value.id || currentUser.value._id || "") === String(gameDetail.value.creatorId || "") && gameDetail.value.status === "pending" ? {
            f: common_vendor.o(($event) => handleKickPlayer(player), index)
          } : {}, {
            g: index
          });
        }),
        V: currentUser.value && String(currentUser.value.id || currentUser.value._id || "") === String(gameDetail.value.creatorId || "") && gameDetail.value.status === "pending",
        W: !gameDetail.value.isFull
      }, !gameDetail.value.isFull ? {
        X: common_vendor.f((gameDetail.value.maxPlayers || 4) - (gameDetail.value.currentPlayers || 1), (n, k0, i0) => {
          return {
            a: n
          };
        })
      } : {}, {
        Y: gameDetail.value.activities && gameDetail.value.activities.length > 0
      }, gameDetail.value.activities && gameDetail.value.activities.length > 0 ? {
        Z: common_vendor.f(gameDetail.value.activities, (activity, index, i0) => {
          return {
            a: common_vendor.t(activity.text || "未知操作"),
            b: common_vendor.t(formatRelativeTime(activity.createdAt)),
            c: index
          };
        })
      } : {}, {
        aa: refreshing.value,
        ab: common_vendor.o(onRefresh, "af"),
        ac: common_vendor.o(onLoadMore, "72")
      }), {
        b: error.value,
        ad: !loading.value && !error.value && gameDetail.value.status === "pending"
      }, !loading.value && !error.value && gameDetail.value.status === "pending" ? common_vendor.e({
        ae: common_assets._imports_6,
        af: !gameDetail.value.isJoined
      }, !gameDetail.value.isJoined ? common_vendor.e({
        ag: !gameDetail.value.isFull
      }, !gameDetail.value.isFull ? {
        ah: common_vendor.o(handleJoin, "51")
      } : {}) : !gameDetail.value.isCreator ? {
        aj: common_vendor.o(handleQuit, "82")
      } : {
        ak: common_vendor.o(handleEdit, "d2"),
        al: common_vendor.o(handleCancel, "b2")
      }, {
        ai: !gameDetail.value.isCreator
      }) : {}, {
        am: !loading.value && !error.value && gameDetail.value.status === "cancelled"
      }, !loading.value && !error.value && gameDetail.value.status === "cancelled" ? {} : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-eca06f3c"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/detail/detail.js.map
