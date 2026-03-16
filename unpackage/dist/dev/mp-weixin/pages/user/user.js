"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const utils_user = require("../../utils/user.js");
const utils_store = require("../../utils/store.js");
const _sfc_main = {
  __name: "user",
  setup(__props) {
    const userInfo = common_vendor.ref(null);
    const userStats = common_vendor.ref(null);
    const loadUserStats = async () => {
      if (!userInfo.value) {
        common_vendor.index.__f__("log", "at pages/user/user.vue:167", "用户未登录，跳过加载统计");
        return;
      }
      try {
        common_vendor.index.__f__("log", "at pages/user/user.vue:172", "开始加载用户统计...");
        const stats = await utils_user.UserService.fetchUserStats();
        if (stats) {
          userStats.value = stats;
          common_vendor.index.__f__("log", "at pages/user/user.vue:179", "用户统计加载成功:", stats);
        } else {
          common_vendor.index.__f__("log", "at pages/user/user.vue:181", "用户统计为空，使用默认值");
          userStats.value = {
            createdGames: 0,
            joinedGames: 0,
            completedGames: 0
          };
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/user.vue:189", "加载用户统计失败:", error);
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
        "videogame": "game-tag-videogame"
      };
      return classMap[type] || "game-tag-mahjong";
    };
    const getGameTypeText = (type) => {
      const textMap = {
        "mahjong": "日麻",
        "boardgame": "桌游",
        "videogame": "电玩"
      };
      return textMap[type] || "日麻";
    };
    const handleLogin = () => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:221", "开始微信登录流程");
      common_vendor.index.getUserProfile({
        desc: "用于完善会员资料",
        success: async (userRes) => {
          common_vendor.index.__f__("log", "at pages/user/user.vue:227", "✅ 获取用户信息成功:", userRes.userInfo.nickName);
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
          common_vendor.index.__f__("log", "at pages/user/user.vue:256", "✅ 获取微信code成功");
          try {
            const loginResult = await utils_user.UserService.cloudLogin(loginRes.code, userInfoData);
            if (loginResult.success) {
              common_vendor.index.__f__("log", "at pages/user/user.vue:263", "✅ 云函数登录成功");
              utils_user.UserService.saveUserData(
                loginResult.userInfo,
                loginResult.token,
                loginResult.stats
              );
              userInfo.value = loginResult.userInfo;
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
            common_vendor.index.__f__("error", "at pages/user/user.vue:286", "登录失败:", error);
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
          common_vendor.index.__f__("error", "at pages/user/user.vue:297", "获取用户信息失败:", err);
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
            common_vendor.index.__f__("log", "at pages/user/user.vue:313", "用户确认退出登录");
            common_vendor.index.showLoading({ title: "退出中...", mask: true });
            try {
              utils_user.UserService.logout();
              common_vendor.index.__f__("log", "at pages/user/user.vue:322", "✅ UserService.logout() 执行完成 - 已清除存储");
              if (utils_store.userActions && utils_store.userActions.logout) {
                utils_store.userActions.logout();
                common_vendor.index.__f__("log", "at pages/user/user.vue:328", "✅ userActions.logout() 执行完成 - 已更新全局状态");
              } else {
                common_vendor.index.__f__("warn", "at pages/user/user.vue:330", "userActions.logout 未找到，全局状态可能未更新");
              }
              userInfo.value = null;
              userStats.value = null;
              common_vendor.index.__f__("log", "at pages/user/user.vue:336", "✅ 本地响应式数据已清空");
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "已退出登录",
                icon: "success",
                duration: 1500
              });
              setTimeout(() => {
                common_vendor.index.__f__("log", "at pages/user/user.vue:348", "退出登录完成，页面状态已更新");
              }, 100);
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/user/user.vue:353", "退出登录过程中出错:", error);
              common_vendor.index.showToast({
                title: "退出登录失败: " + error.message,
                icon: "none",
                duration: 2e3
              });
            }
          }
        }
      });
    };
    const checkLoginStatus = () => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:367", "执行登录状态检查");
      const isLoggedIn = utils_user.UserService.isLoggedIn();
      common_vendor.index.__f__("log", "at pages/user/user.vue:370", "登录状态检查结果:", isLoggedIn ? "已登录" : "未登录");
      if (isLoggedIn) {
        const currentUser = utils_user.UserService.getCurrentUser();
        const currentStats = utils_user.UserService.getUserStats();
        common_vendor.index.__f__("log", "at pages/user/user.vue:376", "获取到的用户信息:", currentUser);
        common_vendor.index.__f__("log", "at pages/user/user.vue:377", "获取到的用户统计（本地）:", currentStats);
        userInfo.value = currentUser;
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
      } else {
        userInfo.value = null;
        userStats.value = null;
      }
    };
    const setupUserListeners = () => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:403", "设置全局事件监听器");
      common_vendor.index.$on("user:login", async (data) => {
        common_vendor.index.__f__("log", "at pages/user/user.vue:407", "监听到用户登录事件:", data);
        userInfo.value = data.userInfo;
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
      common_vendor.index.$on("user:logout", () => {
        common_vendor.index.__f__("log", "at pages/user/user.vue:427", "监听到用户退出事件");
        userInfo.value = null;
        userStats.value = null;
      });
      common_vendor.index.$on("user:updated", (updatedUser) => {
        common_vendor.index.__f__("log", "at pages/user/user.vue:435", "监听到用户信息更新:", updatedUser);
        userInfo.value = updatedUser;
      });
      common_vendor.index.$on("game:stats-changed", () => {
        common_vendor.index.__f__("log", "at pages/user/user.vue:441", "监听到对局数据变化，刷新统计");
        loadUserStats();
      });
    };
    common_vendor.onShow(() => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:448", "用户中心页面显示，刷新统计");
      loadUserStats();
    });
    common_vendor.onMounted(() => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:454", "个人中心页面加载");
      setupUserListeners();
      checkLoginStatus();
    });
    const removeUserListeners = () => {
      common_vendor.index.__f__("log", "at pages/user/user.vue:465", "移除全局事件监听器");
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
            common_vendor.index.__f__("log", "at pages/user/user.vue:500", "开始上传头像到云存储...");
            const uploadResult = await utils_user.UserService.uploadImage(tempFilePath);
            common_vendor.index.__f__("log", "at pages/user/user.vue:504", "头像上传成功，云存储文件ID:", uploadResult);
            if (!uploadResult) {
              throw new Error("头像上传失败");
            }
            const fileID = uploadResult;
            const avatarUrl = fileID;
            common_vendor.index.__f__("log", "at pages/user/user.vue:514", "调用云函数更新用户头像，URL:", avatarUrl);
            const updatedUser = await utils_user.UserService.updateUserAvatar(avatarUrl);
            common_vendor.index.__f__("log", "at pages/user/user.vue:519", "云函数返回的更新后用户:", updatedUser);
            if (!updatedUser || !updatedUser.avatar) {
              throw new Error("头像更新失败，返回数据异常");
            }
            utils_user.UserService.saveUserData(
              updatedUser,
              utils_user.UserService.getToken(),
              userStats.value
            );
            userInfo.value = updatedUser;
            common_vendor.index.showToast({
              title: "头像更新成功",
              icon: "success",
              duration: 1500
            });
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/user/user.vue:542", "头像更新失败:", error);
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
          common_vendor.index.__f__("error", "at pages/user/user.vue:554", "选择图片失败:", err);
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
              common_vendor.index.__f__("log", "at pages/user/user.vue:606", "开始更新用户昵称:", newNickname);
              const updatedUser = await utils_user.UserService.updateUserInfo({
                nickname: newNickname
              });
              common_vendor.index.__f__("log", "at pages/user/user.vue:613", "云函数返回的更新后用户:", updatedUser);
              if (!updatedUser || !updatedUser.nickname) {
                throw new Error("昵称更新失败，返回数据异常");
              }
              utils_user.UserService.saveUserData(
                updatedUser,
                utils_user.UserService.getToken(),
                userStats.value
              );
              userInfo.value = updatedUser;
              common_vendor.index.showToast({
                title: "昵称更新成功",
                icon: "success",
                duration: 1500
              });
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/user/user.vue:636", "昵称更新失败:", error);
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
    const goToSettings = () => {
      common_vendor.index.navigateTo({
        url: "/pages/user/settings"
      });
    };
    const goToAbout = () => {
      common_vendor.index.showModal({
        title: "关于玩咖约局",
        content: "玩咖约局 v1.0.0\n一个专注于日麻、桌游、电玩组局的小程序\n祝您玩得开心！",
        showCancel: false
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: userInfo.value
      }, userInfo.value ? common_vendor.e({
        b: userInfo.value.avatar,
        c: common_vendor.o(chooseAvatar, "07"),
        d: common_vendor.o(chooseAvatar, "1f"),
        e: common_vendor.t(userInfo.value.nickname),
        f: common_vendor.o(editNickname, "bb"),
        g: common_vendor.t(userInfo.value.id),
        h: common_vendor.o(editTags, "66"),
        i: userInfo.value.tags && userInfo.value.tags.length === 0
      }, userInfo.value.tags && userInfo.value.tags.length === 0 ? {} : {
        j: common_vendor.f(userInfo.value.tags, (tag, k0, i0) => {
          return {
            a: common_vendor.t(tag.name),
            b: tag.id
          };
        })
      }, {
        k: common_vendor.o(editGames, "29"),
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
        n: userStats.value
      }, userStats.value ? {
        o: common_vendor.t(userStats.value.createdGames || 0),
        p: common_vendor.t(userStats.value.joinedGames || 0),
        q: common_vendor.t(userStats.value.completedGames || 0)
      } : {}) : {}, {
        r: common_assets._imports_0$1,
        s: userStats.value
      }, userStats.value ? {
        t: common_vendor.t(userStats.value.createdGames || 0)
      } : {}, {
        v: common_assets._imports_2$1,
        w: common_vendor.o(($event) => goToMyGames("created"), "6c"),
        x: common_assets._imports_2$2,
        y: userStats.value
      }, userStats.value ? {
        z: common_vendor.t(userStats.value.joinedGames || 0)
      } : {}, {
        A: common_assets._imports_2$1,
        B: common_vendor.o(($event) => goToMyGames("joined"), "c3"),
        C: common_assets._imports_3$2,
        D: common_assets._imports_2$1,
        E: common_vendor.o(($event) => goToMyGames("history"), "21"),
        F: common_assets._imports_4,
        G: common_assets._imports_2$1,
        H: common_vendor.o(goToSettings, "d1"),
        I: common_assets._imports_12,
        J: common_assets._imports_2$1,
        K: common_vendor.o(goToAbout, "bc"),
        L: !userInfo.value
      }, !userInfo.value ? {
        M: common_assets._imports_6,
        N: common_vendor.o(handleLogin, "22")
      } : {
        O: common_vendor.o(handleLogout, "2a")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0f7520f0"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/user.js.map
