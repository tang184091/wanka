"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
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
    common_vendor.onLoad(async (options) => {
      if (options.id) {
        gameId.value = options.id;
        common_vendor.index.__f__("log", "at pages/detail/detail.vue:315", "开始加载组局详情，ID:", gameId.value);
        await getCurrentUser();
        await loadGameDetail();
      } else {
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:323", "未传递游戏ID");
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
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:348", "获取用户信息失败:", err);
      }
    };
    const loadGameDetail = async () => {
      var _a, _b;
      loading.value = true;
      error.value = "";
      try {
        common_vendor.index.__f__("log", "at pages/detail/detail.vue:358", "调用game-service获取详情，参数:", { gameId: gameId.value });
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: {
            action: "getGameDetail",
            data: { gameId: gameId.value }
          }
        });
        common_vendor.index.__f__("log", "at pages/detail/detail.vue:368", "获取组局详情结果:", res);
        if (res.result && res.result.code === 0) {
          const game = res.result.data;
          let isJoined = false;
          if (currentUser.value) {
            isJoined = ((_a = game.participants) == null ? void 0 : _a.some((p) => p.id === currentUser.value.id)) || false;
          }
          const isCreator = currentUser.value && game.creatorId === currentUser.value.id;
          const currentPlayers = (game.participants || []).length + 1;
          const isFull = currentPlayers >= (game.maxPlayers || 4);
          gameDetail.value = {
            ...game,
            id: game._id || game.id,
            creatorInfo: game.creatorInfo || {
              nickname: "未知用户",
              avatar: "/static/images/default-avatar.png",
              tags: []
            },
            participants: game.participants || [],
            activities: game.activities || [],
            currentPlayers,
            isFull,
            isJoined,
            isCreator
          };
          common_vendor.index.__f__("log", "at pages/detail/detail.vue:402", "处理后的游戏数据:", gameDetail.value);
        } else {
          throw new Error(((_b = res.result) == null ? void 0 : _b.message) || "获取游戏详情失败");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:407", "加载组局详情失败:", err);
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
        "sports": "tag-sports",
        "other": "tag-other"
      };
      return classMap[type] || "tag-mahjong";
    };
    const getTypeText = (type) => {
      const textMap = {
        "mahjong": "日麻",
        "boardgame": "桌游",
        "videogame": "电玩",
        "sports": "运动",
        "other": "其他"
      };
      return textMap[type] || "日麻";
    };
    const getStatusText = (game) => {
      if (game.status === "cancelled") {
        return "已取消";
      } else if (game.isFull) {
        return "已满员";
      } else {
        return `缺${(game.maxPlayers || 4) - (game.currentPlayers || 1)}人`;
      }
    };
    const getActivityIcon = (type) => {
      const iconMap = {
        "create": "/static/icons/create.png",
        "join": "/static/icons/join.png",
        "quit": "/static/icons/quit.png",
        "cancel": "/static/icons/cancel.png",
        "update": "/static/icons/update.png"
      };
      return iconMap[type] || "/static/icons/default-activity.png";
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
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:510", "格式化时间错误:", e);
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
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:525", "格式化创建时间错误:", e);
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
        common_vendor.index.__f__("error", "at pages/detail/detail.vue:556", "格式化相对时间错误:", e);
        return "";
      }
    };
    const handleAvatarError = (e) => {
      common_vendor.index.__f__("log", "at pages/detail/detail.vue:563", "头像加载失败:", e);
      e.detail.target.src = "/static/images/default-avatar.png";
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
              common_vendor.index.__f__("log", "at pages/detail/detail.vue:627", "加入组局结果:", result);
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
              common_vendor.index.__f__("error", "at pages/detail/detail.vue:643", "加入组局失败:", err);
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
              common_vendor.index.__f__("log", "at pages/detail/detail.vue:692", "退出组局结果:", result);
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
              common_vendor.index.__f__("error", "at pages/detail/detail.vue:708", "退出组局失败:", err);
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
    const handleShare = () => {
      common_vendor.index.showActionSheet({
        itemList: ["分享给好友", "分享到朋友圈"],
        success: (res) => {
          if (res.tapIndex === 0) {
            common_vendor.index.showShareMenu({
              withShareTicket: true
            });
          } else if (res.tapIndex === 1) {
            common_vendor.index.showModal({
              title: "提示",
              content: '请点击右上角菜单，选择"分享到朋友圈"',
              showCancel: false
            });
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
              common_vendor.index.__f__("log", "at pages/detail/detail.vue:791", "取消组局结果:", result);
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
              common_vendor.index.__f__("error", "at pages/detail/detail.vue:812", "取消组局失败:", err);
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
      var _a;
      return {
        title: `${gameDetail.value.title} - 玩咖约局`,
        path: `/pages/detail/detail?id=${gameId.value}`,
        imageUrl: ((_a = gameDetail.value.creatorInfo) == null ? void 0 : _a.avatar) || "/static/images/share-default.jpg"
      };
    });
    common_vendor.onShareTimeline(() => {
      var _a;
      return {
        title: `玩咖约局：${gameDetail.value.title}`,
        query: `id=${gameId.value}`,
        imageUrl: ((_a = gameDetail.value.creatorInfo) == null ? void 0 : _a.avatar) || "/static/images/share-default.jpg"
      };
    });
    return (_ctx, _cache) => {
      var _a, _b;
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : error.value ? {
        c: common_assets._imports_0$2,
        d: common_vendor.t(error.value),
        e: common_vendor.o(loadGameDetail),
        f: common_vendor.o(handleBack)
      } : common_vendor.e({
        g: common_vendor.t(getTypeText(gameDetail.value.type)),
        h: common_vendor.n(getTypeClass(gameDetail.value.type)),
        i: common_vendor.t(getStatusText(gameDetail.value)),
        j: common_vendor.n(gameDetail.value.status !== "pending" ? "tag-status-cancelled" : gameDetail.value.isFull ? "tag-status-full" : "tag-status"),
        k: common_vendor.t(gameDetail.value.title || "未命名活动"),
        l: gameDetail.value.project
      }, gameDetail.value.project ? {
        m: common_vendor.t(gameDetail.value.project)
      } : {}, {
        n: common_assets._imports_2,
        o: common_vendor.t(formatDateTime(gameDetail.value.time)),
        p: common_assets._imports_3,
        q: common_vendor.t(gameDetail.value.location || "未设置地点"),
        r: common_assets._imports_3$1,
        s: common_vendor.t(gameDetail.value.currentPlayers || 1),
        t: common_vendor.t(gameDetail.value.maxPlayers || 4),
        v: !gameDetail.value.isFull
      }, !gameDetail.value.isFull ? {
        w: common_vendor.t((gameDetail.value.maxPlayers || 4) - (gameDetail.value.currentPlayers || 1))
      } : {}, {
        x: gameDetail.value.description
      }, gameDetail.value.description ? {
        y: common_assets._imports_4$1,
        z: common_vendor.t(gameDetail.value.description)
      } : {}, {
        A: common_vendor.t(formatCreateTime(gameDetail.value.createdAt)),
        B: gameDetail.value.creatorInfo
      }, gameDetail.value.creatorInfo ? common_vendor.e({
        C: gameDetail.value.creatorInfo.avatar || "/static/images/default-avatar.png",
        D: common_vendor.o(handleAvatarError),
        E: common_vendor.t(gameDetail.value.creatorInfo.nickname || "未知用户"),
        F: gameDetail.value.creatorInfo.gender
      }, gameDetail.value.creatorInfo.gender ? {
        G: gameDetail.value.creatorInfo.gender === 1 ? "/static/icons/male.png" : "/static/icons/female.png"
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
        R: ((_a = gameDetail.value.creatorInfo) == null ? void 0 : _a.avatar) || "/static/images/default-avatar.png",
        S: common_vendor.o(handleAvatarError),
        T: common_vendor.t(((_b = gameDetail.value.creatorInfo) == null ? void 0 : _b.nickname) || "未知用户"),
        U: common_assets._imports_6$1,
        V: common_vendor.f(gameDetail.value.participants, (player, index, i0) => {
          return common_vendor.e({
            a: player.avatar || "/static/images/default-avatar.png",
            b: common_vendor.o(handleAvatarError, index),
            c: common_vendor.t(player.nickname || "玩家" + (index + 1)),
            d: player.joinTime
          }, player.joinTime ? {
            e: common_vendor.t(formatRelativeTime(player.joinTime))
          } : {}, {
            f: index
          });
        }),
        W: common_assets._imports_7,
        X: !gameDetail.value.isFull
      }, !gameDetail.value.isFull ? {
        Y: common_vendor.f((gameDetail.value.maxPlayers || 4) - (gameDetail.value.currentPlayers || 1), (n, k0, i0) => {
          return {
            a: n
          };
        })
      } : {}, {
        Z: gameDetail.value.activities && gameDetail.value.activities.length > 0
      }, gameDetail.value.activities && gameDetail.value.activities.length > 0 ? {
        aa: common_vendor.f(gameDetail.value.activities, (activity, index, i0) => {
          return {
            a: getActivityIcon(activity.type),
            b: common_vendor.t(activity.text || "未知操作"),
            c: common_vendor.t(formatRelativeTime(activity.createdAt)),
            d: index
          };
        })
      } : {}, {
        ab: refreshing.value,
        ac: common_vendor.o(onRefresh),
        ad: common_vendor.o(onLoadMore)
      }), {
        b: error.value,
        ae: !loading.value && !error.value && gameDetail.value.status === "pending"
      }, !loading.value && !error.value && gameDetail.value.status === "pending" ? common_vendor.e({
        af: common_assets._imports_8,
        ag: common_vendor.o(handleShare),
        ah: !gameDetail.value.isJoined
      }, !gameDetail.value.isJoined ? common_vendor.e({
        ai: !gameDetail.value.isFull
      }, !gameDetail.value.isFull ? {
        aj: common_assets._imports_9,
        ak: common_vendor.o(handleJoin)
      } : {
        al: common_assets._imports_10
      }) : !gameDetail.value.isCreator ? {
        an: common_assets._imports_11,
        ao: common_vendor.o(handleQuit)
      } : {
        ap: common_assets._imports_12$1,
        aq: common_vendor.o(handleEdit),
        ar: common_assets._imports_13,
        as: common_vendor.o(handleCancel)
      }, {
        am: !gameDetail.value.isCreator
      }) : {}, {
        at: !loading.value && !error.value && gameDetail.value.status === "cancelled"
      }, !loading.value && !error.value && gameDetail.value.status === "cancelled" ? {
        av: common_assets._imports_14
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-eca06f3c"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/detail/detail.js.map
