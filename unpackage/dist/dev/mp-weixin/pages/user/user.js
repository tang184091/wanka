"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_user = require("../../utils/user.js");
const utils_store = require("../../utils/store.js");
const utils_cloudImage = require("../../utils/cloud-image.js");
const _sfc_main = {
  __name: "user",
  setup(__props) {
    const userInfo = common_vendor.ref(null);
    const userStats = common_vendor.ref(null);
    const displayAvatar = common_vendor.ref("");
    const userHonors = common_vendor.ref([]);
    const refreshDisplayAvatar = async () => {
      var _a;
      if (!((_a = userInfo.value) == null ? void 0 : _a.avatar)) {
        displayAvatar.value = "";
        return;
      }
      displayAvatar.value = await utils_cloudImage.resolveCloudFileUrl(userInfo.value.avatar);
    };
    const syncUserInfo = async (nextUser) => {
      userInfo.value = nextUser || null;
      await refreshDisplayAvatar();
    };
    const loadUserStats = async () => {
      if (!userInfo.value) {
        common_vendor.index.__f__("log", "at pages/user/user.vue:235", "用户未登录，跳过加载统计");
        return;
      }
      try {
        common_vendor.index.__f__("log", "at pages/user/user.vue:240", "开始加载用户统计...");
        const stats = await utils_user.UserService.fetchUserStats();
        if (stats) {
          userStats.value = stats;
          common_vendor.index.__f__("log", "at pages/user/user.vue:247", "用户统计加载成功:", stats);
        } else {
          common_vendor.index.__f__("log", "at pages/user/user.vue:249", "用户统计为空，使用默认值");
          userStats.value = {
            createdGames: 0,
            joinedGames: 0,
            completedGames: 0
          };
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/user.vue:257", "加载用户统计失败:", error);
        userStats.value = {
          createdGames: 0,
          joinedGames: 0,
          completedGames: 0
        };
      }
    };
    const getGameTypeClass = (type) => {
      const classMap = {
        "mahjong": "game-tag-mahjong",
        "boardgame": "game-tag-boardgame",
        "videogame": "game-tag-videogame",
        "deck": "game-tag-deck",
        "other": "game-tag-other"
      };
      return classMap[type] || "game-tag-mahjong";
    };
    const getGameTypeText = (type) => {
      const textMap = {
        "mahjong": "立直麻将",
        "boardgame": "桌游",
        "videogame": "电玩",
        "deck": "卡组",
        "other": "其他"
      };
      return textMap[type] || "立直麻将";
    };
    const handleLogin = () => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:293", "开始微信登录流程");
      common_vendor.index.getUserProfile({
        desc: "用于完善会员资料",
        success: async (userRes) => {
          common_vendor.index.__f__("log", "at pages/user/user.vue:299", "✅ 获取用户信息成功:", userRes.userInfo.nickName);
          const userInfoData = {
            nickname: userRes.userInfo.nickName,
            avatar: userRes.userInfo.avatarUrl,
            gender: userRes.userInfo.gender,
            province: userRes.userInfo.province,
            city: userRes.userInfo.city,
            country: userRes.userInfo.country
          };
          common_vendor.index.showLoading({ title: "登录中...", mask: true });
          const loginRes = await new Promise((resolve, reject) => {
            common_vendor.index.login({
              provider: "weixin",
              success: resolve,
              fail: reject
            });
          });
          if (!loginRes.code) {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: "获取登录凭证失败", icon: "none" });
            return;
          }
          common_vendor.index.__f__("log", "at pages/user/user.vue:328", "✅ 获取微信code成功");
          try {
            const loginResult = await utils_user.UserService.cloudLoginWithCaptcha(loginRes.code, userInfoData);
            if (loginResult.success) {
              common_vendor.index.__f__("log", "at pages/user/user.vue:335", "✅ 云函数登录成功");
              utils_user.UserService.saveUserData(
                loginResult.userInfo,
                loginResult.token,
                loginResult.stats
              );
              await syncUserInfo(loginResult.userInfo);
              userStats.value = loginResult.stats || {
                createdGames: 0,
                joinedGames: 0,
                completedGames: 0
              };
              common_vendor.index.showToast({ title: "登录成功", icon: "success" });
            } else {
              throw new Error(loginResult.error || "登录失败");
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/user/user.vue:358", "登录失败:", error);
            common_vendor.index.showToast({
              title: "登录失败: " + error.message,
              icon: "none",
              duration: 3e3
            });
          } finally {
            common_vendor.index.hideLoading();
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/user/user.vue:369", "获取用户信息失败:", err);
          common_vendor.index.showToast({
            title: "获取用户信息失败: " + err.errMsg,
            icon: "none"
          });
        }
      });
    };
    const handleLogout = () => {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？",
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.__f__("log", "at pages/user/user.vue:385", "用户确认退出登录");
            common_vendor.index.showLoading({ title: "退出中...", mask: true });
            try {
              utils_user.UserService.logout();
              common_vendor.index.__f__("log", "at pages/user/user.vue:394", "✅ UserService.logout() 执行完成 - 已清除存储");
              if (utils_store.userActions && utils_store.userActions.logout) {
                utils_store.userActions.logout();
                common_vendor.index.__f__("log", "at pages/user/user.vue:400", "✅ userActions.logout() 执行完成 - 已更新全局状态");
              } else {
                common_vendor.index.__f__("warn", "at pages/user/user.vue:402", "userActions.logout 未找到，全局状态可能未更新");
              }
              await syncUserInfo(null);
              userStats.value = null;
              common_vendor.index.__f__("log", "at pages/user/user.vue:408", "✅ 本地响应式数据已清空");
              common_vendor.index.showToast({
                title: "已退出登录",
                icon: "success",
                duration: 1500
              });
              setTimeout(() => {
                common_vendor.index.__f__("log", "at pages/user/user.vue:418", "退出登录完成，页面状态已更新");
              }, 100);
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/user/user.vue:422", "退出登录过程中出错:", error);
              common_vendor.index.showToast({
                title: "退出登录失败: " + error.message,
                icon: "none",
                duration: 2e3
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    };
    const normalizeHonorRarity = (rarity) => {
      const v = String(rarity || "").trim().toLowerCase();
      if (v === "legend" || v === "gold")
        return "legend";
      if (v === "epic" || v === "purple")
        return "epic";
      if (v === "rare" || v === "blue" || v === "silver")
        return "rare";
      return "common";
    };
    const getHonorRarityText = (rarity) => {
      const v = normalizeHonorRarity(rarity);
      if (v === "legend")
        return "传说";
      if (v === "epic")
        return "史诗";
      if (v === "rare")
        return "稀有";
      return "普通";
    };
    const formatHonorDate = (value) => {
      if (!value)
        return "-";
      const d = new Date(value);
      if (Number.isNaN(d.getTime()))
        return "-";
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const loadUserHonors = async () => {
      var _a, _b;
      if (!((_a = userInfo.value) == null ? void 0 : _a.id)) {
        userHonors.value = [];
        return;
      }
      try {
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: { action: "getHonorList", data: { ownerUserId: userInfo.value.id, limit: 20 } }
        });
        if (((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.code) === 0) {
          userHonors.value = res.result.data.list || [];
        } else {
          userHonors.value = [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/user.vue:476", "加载我的荣誉失败:", error);
        userHonors.value = [];
      }
    };
    const checkLoginStatus = async () => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:483", "执行登录状态检查");
      const isLoggedIn = utils_user.UserService.isLoggedIn();
      common_vendor.index.__f__("log", "at pages/user/user.vue:486", "登录状态检查结果:", isLoggedIn ? "已登录" : "未登录");
      if (isLoggedIn) {
        const currentUser = utils_user.UserService.getCurrentUser();
        const currentStats = utils_user.UserService.getUserStats();
        common_vendor.index.__f__("log", "at pages/user/user.vue:492", "获取到的用户信息:", currentUser);
        common_vendor.index.__f__("log", "at pages/user/user.vue:493", "获取到的用户统计（本地）:", currentStats);
        await syncUserInfo(currentUser);
        if (currentStats) {
          userStats.value = currentStats;
        } else {
          userStats.value = {
            createdGames: 0,
            joinedGames: 0,
            completedGames: 0
          };
        }
        loadUserStats();
        loadUserHonors();
      } else {
        await syncUserInfo(null);
        userStats.value = null;
        userHonors.value = [];
      }
    };
    const setupUserListeners = () => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:521", "设置全局事件监听器");
      common_vendor.index.$on("user:login", async (data) => {
        common_vendor.index.__f__("log", "at pages/user/user.vue:525", "监听到用户登录事件:", data);
        await syncUserInfo(data.userInfo);
        if (data.stats) {
          userStats.value = data.stats;
        } else {
          userStats.value = {
            createdGames: 0,
            joinedGames: 0,
            completedGames: 0
          };
        }
        loadUserStats();
      });
      common_vendor.index.$on("user:logout", async () => {
        common_vendor.index.__f__("log", "at pages/user/user.vue:545", "监听到用户退出事件");
        await syncUserInfo(null);
        userStats.value = null;
      });
      common_vendor.index.$on("user:updated", async (updatedUser) => {
        common_vendor.index.__f__("log", "at pages/user/user.vue:553", "监听到用户信息更新:", updatedUser);
        await syncUserInfo(updatedUser);
      });
      common_vendor.index.$on("game:stats-changed", () => {
        common_vendor.index.__f__("log", "at pages/user/user.vue:559", "监听到对局数据变化，刷新统计");
        loadUserStats();
      });
    };
    common_vendor.onShow(async () => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:566", "用户中心页面显示，刷新统计");
      await checkLoginStatus();
      loadUserStats();
      loadUserHonors();
    });
    common_vendor.onMounted(async () => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:574", "个人中心页面加载");
      setupUserListeners();
      await checkLoginStatus();
    });
    const removeUserListeners = () => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:585", "移除全局事件监听器");
      common_vendor.index.$off("user:login");
      common_vendor.index.$off("user:logout");
      common_vendor.index.$off("user:updated");
      common_vendor.index.$off("game:stats-changed");
    };
    common_vendor.onUnmounted(() => {
      removeUserListeners();
    });
    const chooseAvatar = () => {
      if (!userInfo.value) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0];
          common_vendor.index.showLoading({
            title: "上传中...",
            mask: true
          });
          try {
            common_vendor.index.__f__("log", "at pages/user/user.vue:620", "开始上传头像到云存储...");
            const uploadResult = await utils_user.UserService.uploadImage(tempFilePath);
            common_vendor.index.__f__("log", "at pages/user/user.vue:624", "头像上传成功，云存储文件ID:", uploadResult);
            if (!uploadResult) {
              throw new Error("头像上传失败");
            }
            const fileID = uploadResult;
            const avatarUrl = fileID;
            common_vendor.index.__f__("log", "at pages/user/user.vue:634", "调用云函数更新用户头像，URL:", avatarUrl);
            const updatedUser = await utils_user.UserService.updateUserAvatar(avatarUrl);
            common_vendor.index.__f__("log", "at pages/user/user.vue:639", "云函数返回的更新后用户:", updatedUser);
            if (!updatedUser || !updatedUser.avatar) {
              throw new Error("头像更新失败，返回数据异常");
            }
            utils_user.UserService.saveUserData(
              updatedUser,
              utils_user.UserService.getToken(),
              userStats.value
            );
            await syncUserInfo(updatedUser);
            common_vendor.index.showToast({
              title: "头像更新成功",
              icon: "success",
              duration: 1500
            });
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/user/user.vue:662", "头像更新失败:", error);
            common_vendor.index.showToast({
              title: "头像更新失败: " + error.message,
              icon: "none",
              duration: 3e3
            });
          } finally {
            common_vendor.index.hideLoading();
          }
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/user/user.vue:674", "选择图片失败:", err);
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "none",
            duration: 2e3
          });
        }
      });
    };
    const editNickname = () => {
      if (!userInfo.value) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "修改昵称",
        content: "请输入新的昵称",
        editable: true,
        placeholderText: userInfo.value.nickname,
        success: async (res) => {
          if (res.confirm && res.content) {
            const newNickname = res.content.trim();
            if (!newNickname) {
              common_vendor.index.showToast({
                title: "昵称不能为空",
                icon: "none"
              });
              return;
            }
            if (newNickname === userInfo.value.nickname) {
              common_vendor.index.showToast({
                title: "昵称未变化",
                icon: "none"
              });
              return;
            }
            common_vendor.index.showLoading({
              title: "更新中...",
              mask: true
            });
            try {
              common_vendor.index.__f__("log", "at pages/user/user.vue:726", "开始更新用户昵称:", newNickname);
              const updatedUser = await utils_user.UserService.updateUserInfo({
                nickname: newNickname
              });
              common_vendor.index.__f__("log", "at pages/user/user.vue:733", "云函数返回的更新后用户:", updatedUser);
              if (!updatedUser || !updatedUser.nickname) {
                throw new Error("昵称更新失败，返回数据异常");
              }
              utils_user.UserService.saveUserData(
                updatedUser,
                utils_user.UserService.getToken(),
                userStats.value
              );
              await syncUserInfo(updatedUser);
              common_vendor.index.showToast({
                title: "昵称更新成功",
                icon: "success",
                duration: 1500
              });
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/user/user.vue:756", "昵称更新失败:", error);
              common_vendor.index.showToast({
                title: "昵称更新失败: " + error.message,
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
    const editTags = () => {
      if (!userInfo.value) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: "/pages/user/tags"
      });
    };
    const editGames = () => {
      if (!userInfo.value) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: "/pages/user/games"
      });
    };
    const goToMyGames = (type) => {
      if (!userInfo.value) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/game/list?tab=${type}`
      });
    };
    const goToAdmin = () => {
      if (!userInfo.value || !userInfo.value.isAdmin) {
        common_vendor.index.showToast({ title: "仅管理员可访问", icon: "none" });
        return;
      }
      common_vendor.index.navigateTo({
        url: "/pages/admin/admin"
      });
    };
    const goToSettings = () => {
      common_vendor.index.navigateTo({
        url: "/pages/user/settings"
      });
    };
    const goToAbout = () => {
      common_vendor.index.showModal({
        title: "关于玩咖约局",
        content: "玩咖约局 v1.0.0\n一个专注于立直麻将、桌游、电玩组局的小程序\n祝您玩得开心！",
        showCancel: false
      });
    };
    const goToBoardgameTools = () => {
      common_vendor.index.navigateTo({
        url: "/pages/tools/list"
      });
    };
    common_vendor.onShareAppMessage(() => ({
      title: "玩咖约局",
      path: "/pages/index/index"
    }));
    common_vendor.onShareTimeline(() => ({
      title: "玩咖约局"
    }));
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: userInfo.value
      }, userInfo.value ? common_vendor.e({
        b: displayAvatar.value || userInfo.value.avatar,
        c: common_vendor.o(chooseAvatar, "76"),
        d: common_vendor.o(chooseAvatar, "f5"),
        e: common_vendor.t(userInfo.value.nickname),
        f: common_vendor.o(editNickname, "e5"),
        g: common_vendor.t(userInfo.value.id),
        h: common_vendor.o(editTags, "25"),
        i: userInfo.value.tags && userInfo.value.tags.length === 0
      }, userInfo.value.tags && userInfo.value.tags.length === 0 ? {} : {
        j: common_vendor.f(userInfo.value.tags, (tag, k0, i0) => {
          return {
            a: common_vendor.t(tag.name),
            b: tag.id
          };
        })
      }, {
        k: common_vendor.o(editGames, "aa"),
        l: userInfo.value.games && userInfo.value.games.length === 0
      }, userInfo.value.games && userInfo.value.games.length === 0 ? {} : {
        m: common_vendor.f(userInfo.value.games, (game, k0, i0) => {
          return {
            a: common_vendor.t(getGameTypeText(game.type)),
            b: common_vendor.n(getGameTypeClass(game.type)),
            c: common_vendor.t(game.name),
            d: game.id
          };
        })
      }, {
        n: userHonors.value.length === 0
      }, userHonors.value.length === 0 ? {} : {
        o: common_vendor.f(userHonors.value, (honor, k0, i0) => {
          return {
            a: common_vendor.t(getHonorRarityText(honor.rarity)),
            b: common_vendor.n(`honor-${normalizeHonorRarity(honor.rarity)}`),
            c: common_vendor.t(formatHonorDate(honor.achievedAt)),
            d: common_vendor.t(honor.type === "tournament" ? `${honor.title || "店内比赛"} · 冠军:${honor.championNickname || "-"}` : `${honor.rankName || "-"} · ${honor.playerNickname || "-"}`),
            e: honor._id || honor.id
          };
        })
      }, {
        p: userStats.value
      }, userStats.value ? {
        q: common_vendor.t(userStats.value.createdGames || 0),
        r: common_vendor.t(userStats.value.joinedGames || 0),
        s: common_vendor.t(userStats.value.completedGames || 0)
      } : {}) : {}, {
        t: userStats.value
      }, userStats.value ? {
        v: common_vendor.t(userStats.value.createdGames || 0)
      } : {}, {
        w: common_vendor.o(($event) => goToMyGames("created"), "16"),
        x: userStats.value
      }, userStats.value ? {
        y: common_vendor.t(userStats.value.joinedGames || 0)
      } : {}, {
        z: common_vendor.o(($event) => goToMyGames("joined"), "96"),
        A: common_vendor.o(($event) => goToMyGames("history"), "68"),
        B: common_vendor.o(goToBoardgameTools, "9a"),
        C: userInfo.value && userInfo.value.isAdmin
      }, userInfo.value && userInfo.value.isAdmin ? {
        D: common_vendor.o(goToAdmin, "6f")
      } : {}, {
        E: common_vendor.o(goToSettings, "5d"),
        F: common_vendor.o(goToAbout, "ce"),
        G: !userInfo.value
      }, !userInfo.value ? {
        H: common_vendor.o(handleLogin, "07")
      } : {
        I: common_vendor.o(handleLogout, "d5")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0f7520f0"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/user.js.map
