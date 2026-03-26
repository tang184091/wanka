"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_constants = require("../../utils/constants.js");
const common_assets = require("../../common/assets.js");
const utils_cloudImage = require("../../utils/cloud-image.js");
const _sfc_main = {
  __name: "profile",
  setup(__props) {
    const loading = common_vendor.ref(true);
    const userId = common_vendor.ref("");
    const userInfo = common_vendor.ref({});
    const stats = common_vendor.ref({});
    const createdGames = common_vendor.ref([]);
    const joinedGames = common_vendor.ref([]);
    const displayAvatar = common_vendor.ref("");
    const userHonors = common_vendor.ref([]);
    const adminEditMode = common_vendor.ref(false);
    const isAdminViewer = common_vendor.ref(false);
    const editable = common_vendor.ref(false);
    const editNickname = common_vendor.ref("");
    const editAvatar = common_vendor.ref("");
    const editAvatarSize = common_vendor.ref(0);
    const editDisplayAvatar = common_vendor.ref("");
    const editTags = common_vendor.ref([]);
    const editGames = common_vendor.ref([]);
    const gameTypeOptions = [
      { value: "mahjong", label: "立直麻将" },
      { value: "boardgame", label: "桌游" },
      { value: "videogame", label: "电玩" },
      { value: "deck", label: "卡组" },
      { value: "other", label: "其他" }
    ];
    const genId = () => String(Date.now()) + Math.random().toString(36).slice(2, 8);
    const normalizeTagName = (name) => String(name || "").trim().slice(0, 12);
    const normalizeGameName = (name) => String(name || "").trim().slice(0, 24);
    const normalizeTags = (tags = []) => tags.map((tag, idx) => ({
      id: (tag == null ? void 0 : tag.id) || 1e4 + idx,
      name: normalizeTagName(tag == null ? void 0 : tag.name)
    })).filter((tag) => !!tag.name);
    const normalizeGames = (games = []) => games.map((game) => ({
      id: (game == null ? void 0 : game.id) || genId(),
      type: String((game == null ? void 0 : game.type) || "other"),
      name: normalizeGameName(game == null ? void 0 : game.name)
    })).filter((game) => !!game.name);
    const getGameTypeIndex = (type) => {
      const idx = gameTypeOptions.findIndex((item) => item.value === type);
      return idx >= 0 ? idx : gameTypeOptions.length - 1;
    };
    const onGameTypeChange = (e, index) => {
      var _a, _b;
      const nextType = ((_b = gameTypeOptions[Number(((_a = e == null ? void 0 : e.detail) == null ? void 0 : _a.value) || 0)]) == null ? void 0 : _b.value) || "other";
      if (!editGames.value[index])
        return;
      editGames.value[index].type = nextType;
    };
    const checkViewerAdmin = async () => {
      var _a, _b, _c;
      try {
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "user-service",
          data: { action: "getMe", data: {} }
        });
        isAdminViewer.value = !!(((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0 && ((_c = (_b = res == null ? void 0 : res.result) == null ? void 0 : _b.data) == null ? void 0 : _c.isAdmin));
      } catch (error) {
        isAdminViewer.value = false;
      }
    };
    const loadUserProfile = async () => {
      loading.value = true;
      try {
        await loadUserInfo();
        await loadUserHonors();
        await loadUserGames();
        await loadUserStats();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/profile.vue:286", "加载用户资料失败:", error);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const loadUserInfo = async () => {
      var _a, _b;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "getUserInfo",
          data: { userId: userId.value }
        }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) !== 0) {
        throw new Error(((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "加载用户信息失败");
      }
      userInfo.value = res.result.data || {};
      if (!Array.isArray(userInfo.value.tags))
        userInfo.value.tags = [];
      if (!Array.isArray(userInfo.value.games))
        userInfo.value.games = [];
      displayAvatar.value = await utils_cloudImage.resolveCloudFileUrl(userInfo.value.avatar);
      if (editable.value) {
        editNickname.value = userInfo.value.nickname || "";
        editAvatar.value = userInfo.value.avatar || "";
        editAvatarSize.value = 0;
        editDisplayAvatar.value = displayAvatar.value || utils_constants.constants.DEFAULT_AVATAR;
        editTags.value = normalizeTags(userInfo.value.tags);
        editGames.value = normalizeGames(userInfo.value.games);
      }
    };
    const loadUserGames = async () => {
      var _a, _b;
      try {
        const [createdRes, joinedRes] = await Promise.all([
          common_vendor.wx$1.cloud.callFunction({
            name: "game-service",
            data: {
              action: "getCreatedGames",
              data: { userId: userId.value }
            }
          }),
          common_vendor.wx$1.cloud.callFunction({
            name: "game-service",
            data: {
              action: "getJoinedGames",
              data: { userId: userId.value }
            }
          })
        ]);
        if (((_a = createdRes == null ? void 0 : createdRes.result) == null ? void 0 : _a.code) === 0) {
          createdGames.value = createdRes.result.data || [];
        } else {
          createdGames.value = [];
        }
        if (((_b = joinedRes == null ? void 0 : joinedRes.result) == null ? void 0 : _b.code) === 0) {
          joinedGames.value = joinedRes.result.data || [];
          const creatorAvatars = joinedGames.value.map((item) => {
            var _a2;
            return ((_a2 = item == null ? void 0 : item.creatorInfo) == null ? void 0 : _a2.avatar) || "";
          });
          const resolvedAvatars = await utils_cloudImage.resolveCloudFileUrls(creatorAvatars);
          joinedGames.value.forEach((item, index) => {
            if (!item.creatorInfo)
              item.creatorInfo = {};
            item.creatorInfo.displayAvatar = resolvedAvatars[index] || item.creatorInfo.avatar || "";
          });
        } else {
          joinedGames.value = [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/profile.vue:359", "加载用户游戏失败:", error);
      }
    };
    const loadUserStats = async () => {
      var _a;
      const statRes = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "getUserStats",
          data: { userId: userId.value }
        }
      });
      if (((_a = statRes == null ? void 0 : statRes.result) == null ? void 0 : _a.code) === 0) {
        const data = statRes.result.data || {};
        stats.value = {
          createdCount: data.createdGames || 0,
          joinedCount: data.joinedGames || 0,
          completedCount: data.completedGames || 0
        };
        return;
      }
      stats.value = {
        createdCount: createdGames.value.length,
        joinedCount: joinedGames.value.length,
        completedCount: Math.floor((createdGames.value.length + joinedGames.value.length) / 2)
      };
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
      var _a;
      try {
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: { action: "getHonorList", data: { ownerUserId: userId.value, limit: 20 } }
        });
        if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
          userHonors.value = res.result.data.list || [];
        } else {
          userHonors.value = [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/profile.vue:423", "加载用户荣誉失败:", error);
        userHonors.value = [];
      }
    };
    const uploadAvatar = async (path) => {
      const ext = (path.split(".").pop() || "jpg").toLowerCase();
      const cloudPath = `admin-avatar/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const res = await common_vendor.wx$1.cloud.uploadFile({ cloudPath, filePath: path });
      return res.fileID;
    };
    const chooseAvatar = () => {
      if (!editable.value)
        return;
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        success: async (res) => {
          const filePath = (res.tempFilePaths || [])[0];
          const fileInfo = (res.tempFiles || [])[0];
          if (!filePath)
            return;
          try {
            common_vendor.index.showLoading({ title: "上传中...", mask: true });
            const fileID = await uploadAvatar(filePath);
            editAvatar.value = fileID;
            editAvatarSize.value = Number((fileInfo == null ? void 0 : fileInfo.size) || 0);
            editDisplayAvatar.value = await utils_cloudImage.resolveCloudFileUrl(fileID);
            common_vendor.index.showToast({ title: "上传成功", icon: "success" });
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/user/profile.vue:452", "upload avatar failed", error);
            common_vendor.index.showToast({ title: "上传失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    };
    const addTag = () => {
      editTags.value.push({ id: genId(), name: "" });
    };
    const removeTag = (index) => {
      editTags.value.splice(index, 1);
    };
    const addGame = () => {
      editGames.value.push({ id: genId(), type: "other", name: "" });
    };
    const removeGame = (index) => {
      editGames.value.splice(index, 1);
    };
    const saveAllAdminChanges = async () => {
      var _a, _b, _c, _d, _e, _f;
      if (!editable.value)
        return;
      const nickname = String(editNickname.value || "").trim();
      if (!nickname) {
        common_vendor.index.showToast({ title: "昵称不能为空", icon: "none" });
        return;
      }
      const tagsPayload = normalizeTags(editTags.value);
      const gamesPayload = normalizeGames(editGames.value);
      try {
        common_vendor.index.showLoading({ title: "保存中...", mask: true });
        const profilePayload = {
          userId: userId.value,
          nickname
        };
        if (editAvatar.value && editAvatar.value !== (userInfo.value.avatar || "")) {
          profilePayload.avatarUrl = editAvatar.value;
          profilePayload.avatarSize = editAvatarSize.value;
        }
        const profileRes = await common_vendor.wx$1.cloud.callFunction({
          name: "user-service",
          data: { action: "adminUpdateUserProfile", data: profilePayload }
        });
        if (((_a = profileRes == null ? void 0 : profileRes.result) == null ? void 0 : _a.code) !== 0) {
          common_vendor.index.showToast({ title: ((_b = profileRes == null ? void 0 : profileRes.result) == null ? void 0 : _b.message) || "保存昵称/头像失败", icon: "none" });
          return;
        }
        const tagRes = await common_vendor.wx$1.cloud.callFunction({
          name: "user-service",
          data: { action: "adminUpdateUserTags", data: { userId: userId.value, tags: tagsPayload } }
        });
        if (((_c = tagRes == null ? void 0 : tagRes.result) == null ? void 0 : _c.code) !== 0) {
          common_vendor.index.showToast({ title: ((_d = tagRes == null ? void 0 : tagRes.result) == null ? void 0 : _d.message) || "保存标签失败", icon: "none" });
          return;
        }
        const gameRes = await common_vendor.wx$1.cloud.callFunction({
          name: "user-service",
          data: { action: "adminUpdateUserGames", data: { userId: userId.value, games: gamesPayload } }
        });
        if (((_e = gameRes == null ? void 0 : gameRes.result) == null ? void 0 : _e.code) !== 0) {
          common_vendor.index.showToast({ title: ((_f = gameRes == null ? void 0 : gameRes.result) == null ? void 0 : _f.message) || "保存设备失败", icon: "none" });
          return;
        }
        common_vendor.index.showToast({ title: "保存成功", icon: "success" });
        await loadUserProfile();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/profile.vue:528", "saveAllAdminChanges failed", error);
        common_vendor.index.showToast({ title: "保存失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const toggleBlacklist = async () => {
      var _a, _b, _c, _d;
      if (!editable.value)
        return;
      if (String(((_a = userInfo.value) == null ? void 0 : _a.id) || ((_b = userInfo.value) == null ? void 0 : _b._id) || "") === "")
        return;
      const nextStatus = !userInfo.value.isBlacklisted;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "adminSetUserBlacklist",
          data: { userId: userId.value, isBlacklisted: nextStatus }
        }
      });
      if (((_c = res == null ? void 0 : res.result) == null ? void 0 : _c.code) !== 0) {
        common_vendor.index.showToast({ title: ((_d = res == null ? void 0 : res.result) == null ? void 0 : _d.message) || "操作失败", icon: "none" });
        return;
      }
      userInfo.value.isBlacklisted = nextStatus;
      common_vendor.index.showToast({ title: nextStatus ? "已加入黑名单" : "已移出黑名单", icon: "success" });
    };
    const toggleAdmin = async () => {
      var _a, _b;
      if (!editable.value)
        return;
      const nextStatus = !userInfo.value.isAdmin;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "adminSetUserAdmin",
          data: { userId: userId.value, isAdmin: nextStatus }
        }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) !== 0) {
        common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "操作失败", icon: "none" });
        return;
      }
      userInfo.value.isAdmin = nextStatus;
      common_vendor.index.showToast({ title: nextStatus ? "已加冕管理员" : "已取消管理员", icon: "success" });
    };
    const getTypeClass = (type) => {
      const classMap = {
        mahjong: "tag-mahjong",
        boardgame: "tag-boardgame",
        videogame: "tag-videogame"
      };
      return classMap[type] || "tag-mahjong";
    };
    const getTypeText = (type) => {
      const textMap = {
        mahjong: "立直麻将",
        boardgame: "桌游",
        videogame: "电玩",
        deck: "卡组",
        other: "其他"
      };
      return textMap[type] || "立直麻将";
    };
    const getTagDisplay = (tag) => {
      if (!tag)
        return "";
      if (typeof tag === "string")
        return tag;
      if (typeof tag === "object")
        return tag.name || tag.label || tag.text || "";
      return String(tag);
    };
    const getEquipmentTypeText = (type) => {
      const textMap = {
        mahjong: "立直麻将",
        boardgame: "桌游",
        videogame: "电玩",
        deck: "卡组",
        other: "其他"
      };
      return textMap[type] || "其他";
    };
    const getStatusClass = (status) => {
      const classMap = {
        pending: "status-pending",
        full: "status-full",
        ongoing: "status-ongoing",
        cancelled: "status-cancelled",
        finished: "status-finished"
      };
      return classMap[status] || "status-pending";
    };
    const getStatusText = (status) => {
      const textMap = {
        pending: "招募中",
        full: "已满员",
        ongoing: "进行中",
        cancelled: "已取消",
        finished: "已结束"
      };
      return textMap[status] || "招募中";
    };
    const formatDateTime = (datetime) => {
      if (!datetime)
        return "";
      const date = new Date(datetime);
      const now = /* @__PURE__ */ new Date();
      const diffDays = Math.floor((date - now) / (1e3 * 60 * 60 * 24));
      if (diffDays === 0)
        return "今天";
      if (diffDays === 1)
        return "明天";
      if (diffDays === 2)
        return "后天";
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    };
    const goToGameDetail = (gameId) => {
      common_vendor.index.navigateTo({
        url: `/pages/detail/detail?id=${gameId}`
      });
    };
    common_vendor.onLoad(async (options) => {
      const targetUserId = String((options == null ? void 0 : options.userId) || "").trim();
      if (!targetUserId) {
        common_vendor.index.showToast({ title: "参数错误", icon: "none" });
        setTimeout(() => common_vendor.index.navigateBack(), 1200);
        return;
      }
      userId.value = targetUserId;
      adminEditMode.value = String((options == null ? void 0 : options.adminEdit) || "") === "1";
      await checkViewerAdmin();
      editable.value = adminEditMode.value && isAdminViewer.value;
      if (adminEditMode.value && !isAdminViewer.value) {
        common_vendor.index.showToast({ title: "仅管理员可编辑", icon: "none" });
      }
      await loadUserProfile();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {} : common_vendor.e({
        b: displayAvatar.value || userInfo.value.avatar || common_vendor.unref(utils_constants.constants).DEFAULT_AVATAR,
        c: common_vendor.t(userInfo.value.nickname || "未知用户"),
        d: userInfo.value.gender
      }, userInfo.value.gender ? {
        e: common_vendor.t(userInfo.value.gender === 1 ? "男" : "女")
      } : {}, {
        f: userInfo.value.tags && userInfo.value.tags.length > 0
      }, userInfo.value.tags && userInfo.value.tags.length > 0 ? {
        g: common_vendor.f(userInfo.value.tags, (tag, index, i0) => {
          return {
            a: common_vendor.t(getTagDisplay(tag)),
            b: index
          };
        })
      } : {}, {
        h: userInfo.value.games && userInfo.value.games.length > 0
      }, userInfo.value.games && userInfo.value.games.length > 0 ? {
        i: common_vendor.f(userInfo.value.games, (game, index, i0) => {
          return {
            a: common_vendor.t(getEquipmentTypeText(game.type)),
            b: common_vendor.t(game.name || "未命名"),
            c: index
          };
        })
      } : {}, {
        j: editable.value
      }, editable.value ? common_vendor.e({
        k: editDisplayAvatar.value || displayAvatar.value || common_vendor.unref(utils_constants.constants).DEFAULT_AVATAR,
        l: common_vendor.o(chooseAvatar, "3f"),
        m: editNickname.value,
        n: common_vendor.o(($event) => editNickname.value = $event.detail.value, "31"),
        o: editTags.value.length === 0
      }, editTags.value.length === 0 ? {} : {}, {
        p: common_vendor.f(editTags.value, (tag, index, i0) => {
          return {
            a: editTags.value[index].name,
            b: common_vendor.o(($event) => editTags.value[index].name = $event.detail.value, `tag-${index}`),
            c: common_vendor.o(($event) => removeTag(index), `tag-${index}`),
            d: `tag-${index}`
          };
        }),
        q: common_vendor.o(addTag, "61"),
        r: editGames.value.length === 0
      }, editGames.value.length === 0 ? {} : {}, {
        s: common_vendor.f(editGames.value, (game, index, i0) => {
          return {
            a: common_vendor.t(getEquipmentTypeText(game.type)),
            b: getGameTypeIndex(game.type),
            c: common_vendor.o(($event) => onGameTypeChange($event, index), `game-${index}`),
            d: editGames.value[index].name,
            e: common_vendor.o(($event) => editGames.value[index].name = $event.detail.value, `game-${index}`),
            f: common_vendor.o(($event) => removeGame(index), `game-${index}`),
            g: `game-${index}`
          };
        }),
        t: gameTypeOptions,
        v: common_vendor.o(addGame, "9c"),
        w: common_vendor.o(saveAllAdminChanges, "73"),
        x: common_vendor.t(userInfo.value.isBlacklisted ? "移出黑名单" : "加入黑名单"),
        y: common_vendor.o(toggleBlacklist, "1f"),
        z: common_vendor.t(userInfo.value.isAdmin ? "取消管理员" : "加冕管理员"),
        A: common_vendor.o(toggleAdmin, "f7")
      }) : {}, {
        B: common_vendor.t(stats.value.createdCount || 0),
        C: common_vendor.t(stats.value.joinedCount || 0),
        D: common_vendor.t(stats.value.completedCount || 0),
        E: userHonors.value.length === 0
      }, userHonors.value.length === 0 ? {} : {
        F: common_vendor.f(userHonors.value, (honor, k0, i0) => {
          return {
            a: common_vendor.t(getHonorRarityText(honor.rarity)),
            b: common_vendor.n(`honor-${normalizeHonorRarity(honor.rarity)}`),
            c: common_vendor.t(formatHonorDate(honor.achievedAt)),
            d: common_vendor.t(honor.type === "tournament" ? `${honor.title || "店内比赛"} · 冠军:${honor.championNickname || "-"}` : `${honor.rankName || "-"} · ${honor.playerNickname || "-"}`),
            e: honor._id || honor.id
          };
        })
      }, {
        G: createdGames.value.length > 0
      }, createdGames.value.length > 0 ? {
        H: common_vendor.f(createdGames.value, (game, k0, i0) => {
          return {
            a: common_vendor.t(getTypeText(game.type)),
            b: common_vendor.n(getTypeClass(game.type)),
            c: common_vendor.t(getStatusText(game.status)),
            d: common_vendor.n(getStatusClass(game.status)),
            e: common_vendor.t(game.title || "未命名"),
            f: common_vendor.t(formatDateTime(game.time)),
            g: common_vendor.t(game.location || "未设置地点"),
            h: common_vendor.t(game.currentPlayers || 0),
            i: common_vendor.t(game.maxPlayers),
            j: game.id,
            k: common_vendor.o(($event) => goToGameDetail(game.id), game.id)
          };
        }),
        I: common_assets._imports_2,
        J: common_assets._imports_3
      } : {}, {
        K: joinedGames.value.length > 0
      }, joinedGames.value.length > 0 ? {
        L: common_vendor.f(joinedGames.value, (game, k0, i0) => {
          var _a, _b, _c;
          return {
            a: common_vendor.t(getTypeText(game.type)),
            b: common_vendor.n(getTypeClass(game.type)),
            c: ((_a = game.creatorInfo) == null ? void 0 : _a.displayAvatar) || ((_b = game.creatorInfo) == null ? void 0 : _b.avatar) || common_vendor.unref(utils_constants.constants).DEFAULT_AVATAR,
            d: common_vendor.t(((_c = game.creatorInfo) == null ? void 0 : _c.nickname) || "未知用户"),
            e: common_vendor.t(game.title || "未命名"),
            f: common_vendor.t(formatDateTime(game.time)),
            g: common_vendor.t(game.location || "未设置地点"),
            h: common_vendor.t(game.currentPlayers || 0),
            i: common_vendor.t(game.maxPlayers),
            j: game.id,
            k: common_vendor.o(($event) => goToGameDetail(game.id), game.id)
          };
        }),
        M: common_assets._imports_2,
        N: common_assets._imports_3
      } : {}));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-036958a5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/profile.js.map
