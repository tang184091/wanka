"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
require("../../utils/store.js");
const utils_user = require("../../utils/user.js");
const utils_constants = require("../../utils/constants.js");
const _sfc_main = {
  __name: "create",
  setup(__props) {
    const gameTypes = common_vendor.ref([
      {
        id: "mahjong",
        name: "日麻",
        icon: "/static/icons/mahjong.png",
        minPlayers: utils_constants.constants.GAME_TYPES.mahjong.minPlayers,
        maxPlayers: utils_constants.constants.GAME_TYPES.mahjong.maxPlayers
      },
      {
        id: "boardgame",
        name: "桌游",
        icon: "/static/icons/boardgame.png",
        minPlayers: utils_constants.constants.GAME_TYPES.boardgame.minPlayers,
        maxPlayers: utils_constants.constants.GAME_TYPES.boardgame.maxPlayers
      },
      {
        id: "videogame",
        name: "电玩",
        icon: "/static/icons/videogame.png",
        minPlayers: utils_constants.constants.GAME_TYPES.videogame.minPlayers,
        maxPlayers: utils_constants.constants.GAME_TYPES.videogame.maxPlayers
      }
    ]);
    const formData = common_vendor.ref({
      type: "mahjong",
      // 默认日麻
      title: "",
      project: "",
      time: "",
      location: "",
      maxPlayers: 4,
      // 默认人数
      description: ""
    });
    const isEditMode = common_vendor.ref(false);
    const gameId = common_vendor.ref("");
    const originalData = common_vendor.ref({});
    const dateValue = common_vendor.ref("");
    const timeValue = common_vendor.ref("");
    const dateDisplay = common_vendor.ref("");
    const timeDisplay = common_vendor.ref("");
    const timeError = common_vendor.ref(false);
    const locationOptions = common_vendor.ref(utils_constants.constants.GAME_LOCATIONS || []);
    const currentDate = common_vendor.ref("");
    const endDate = common_vendor.ref("");
    const minPlayers = common_vendor.computed(() => {
      const type = gameTypes.value.find((t) => t.id === formData.value.type);
      return (type == null ? void 0 : type.minPlayers) || 2;
    });
    const maxPlayers = common_vendor.computed(() => {
      const type = gameTypes.value.find((t) => t.id === formData.value.type);
      return (type == null ? void 0 : type.maxPlayers) || 4;
    });
    const canSubmit = common_vendor.computed(() => {
      return formData.value.title && formData.value.project && formData.value.time && formData.value.location && formData.value.maxPlayers >= minPlayers.value && formData.value.maxPlayers <= maxPlayers.value && !timeError.value;
    });
    const selectedLocationName = common_vendor.computed(() => formData.value.location || "");
    const locationPickerValue = common_vendor.computed(() => {
      const index = locationOptions.value.findIndex((item) => item.name === formData.value.location);
      return index >= 0 ? index : 0;
    });
    const applyPrefill = (options = {}) => {
      if (options.type) {
        const allowedType = gameTypes.value.find((t) => t.id === options.type);
        if (allowedType) {
          formData.value.type = allowedType.id;
          formData.value.maxPlayers = allowedType.minPlayers;
        }
      }
      if (options.project) {
        formData.value.project = decodeURIComponent(options.project);
      }
      if (options.location) {
        formData.value.location = decodeURIComponent(options.location);
      }
    };
    common_vendor.onLoad((options) => {
      common_vendor.index.__f__("log", "at pages/create/create.vue:285", "页面参数:", options);
      if (options.edit && options.id) {
        isEditMode.value = true;
        gameId.value = options.id;
        loadGameDetail(options.id);
      } else {
        initDates();
        applyPrefill(options);
      }
    });
    const loadGameDetail = async (id) => {
      try {
        common_vendor.index.showLoading({
          title: "加载中...",
          mask: true
        });
        const result = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: {
            action: "getGameDetail",
            data: { gameId: id }
          }
        });
        common_vendor.index.__f__("log", "at pages/create/create.vue:315", "加载对局详情结果:", result);
        if (result.result && result.result.code === 0 && result.result.data) {
          const game = result.result.data;
          originalData.value = { ...game };
          formData.value = {
            type: game.type || "mahjong",
            title: game.title || "",
            project: game.project || "",
            time: game.time || "",
            location: game.location || "",
            maxPlayers: game.maxPlayers || 4,
            description: game.description || ""
          };
          if (game.time) {
            const date = new Date(game.time);
            dateValue.value = date.toISOString().split("T")[0];
            timeValue.value = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
            updateTimeDisplay(date);
          }
          common_vendor.index.setNavigationBarTitle({
            title: "编辑组局"
          });
        } else {
          throw new Error("加载对局详情失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/create/create.vue:350", "加载对局详情失败:", error);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none",
          duration: 2e3
        });
        isEditMode.value = false;
        initDates();
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const initDates = () => {
      const now = /* @__PURE__ */ new Date();
      const max = /* @__PURE__ */ new Date();
      max.setMonth(now.getMonth() + 3);
      currentDate.value = now.toISOString().split("T")[0];
      endDate.value = max.toISOString().split("T")[0];
      const defaultTime = /* @__PURE__ */ new Date();
      defaultTime.setDate(defaultTime.getDate() + 1);
      defaultTime.setHours(19, 0, 0, 0);
      dateValue.value = defaultTime.toISOString().split("T")[0];
      timeValue.value = "19:00";
      updateTimeDisplay(defaultTime);
      formData.value.time = defaultTime.toISOString();
    };
    const updateTimeDisplay = (date) => {
      if (!date)
        return;
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      dateDisplay.value = `${year}-${month}-${day}`;
      timeDisplay.value = `${hours}:${minutes}`;
    };
    const selectType = (type) => {
      formData.value.type = type;
      const typeConfig = gameTypes.value.find((t) => t.id === type);
      if (typeConfig) {
        formData.value.maxPlayers = typeConfig.minPlayers;
      }
      if (!formData.value.project) {
        formData.value.project = "";
      }
    };
    const getProjectPlaceholder = () => {
      const placeholders = {
        mahjong: "请输入规则，如：三麻，抽血局",
        boardgame: "请输入具体桌游，如：《历史巨轮》",
        videogame: "请输入具体游戏/设备，如：Switch《马里奥赛车》"
      };
      return placeholders[formData.value.type] || "请输入具体项目";
    };
    const bindDateChange = (e) => {
      dateValue.value = e.detail.value;
      updateFormDateTime();
    };
    const bindTimeChange = (e) => {
      timeValue.value = e.detail.value;
      updateFormDateTime();
    };
    const updateFormDateTime = () => {
      if (dateValue.value && timeValue.value) {
        const dateStr = dateValue.value;
        const timeStr = timeValue.value;
        const fullDateTime = `${dateStr}T${timeStr}:00`;
        formData.value.time = fullDateTime;
        const date = new Date(fullDateTime);
        updateTimeDisplay(date);
        const now = /* @__PURE__ */ new Date();
        timeError.value = date <= now;
      } else {
        formData.value.time = "";
      }
    };
    const bindLocationChange = (e) => {
      const index = Number(e.detail.value);
      const selected = locationOptions.value[index];
      if (selected && selected.name) {
        formData.value.location = selected.name;
      }
    };
    const getPlayerRangeText = () => {
      if (minPlayers.value === maxPlayers.value) {
        return `仅限${minPlayers.value}人`;
      } else {
        return `${minPlayers.value}-${maxPlayers.value}人`;
      }
    };
    const decreaseNumber = () => {
      if (formData.value.maxPlayers > minPlayers.value) {
        formData.value.maxPlayers--;
      }
    };
    const increaseNumber = () => {
      if (formData.value.maxPlayers < maxPlayers.value) {
        formData.value.maxPlayers++;
      }
    };
    const handleSubmit = async () => {
      var _a, _b;
      if (!canSubmit.value) {
        common_vendor.index.showToast({
          title: "请填写完整信息",
          icon: "none"
        });
        return;
      }
      if (timeError.value) {
        common_vendor.index.showToast({
          title: "活动时间不能早于当前时间",
          icon: "none"
        });
        return;
      }
      const selectedTime = new Date(formData.value.time);
      const now = /* @__PURE__ */ new Date();
      if (selectedTime <= now) {
        common_vendor.index.showToast({
          title: "活动时间必须是未来时间",
          icon: "none"
        });
        return;
      }
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
      common_vendor.index.showLoading({
        title: isEditMode.value ? "更新中..." : "创建中...",
        mask: true
      });
      try {
        const gameData = {
          type: formData.value.type,
          title: formData.value.title,
          project: formData.value.project,
          time: formData.value.time,
          location: formData.value.location,
          maxPlayers: formData.value.maxPlayers,
          description: formData.value.description || ""
        };
        common_vendor.index.__f__("log", "at pages/create/create.vue:589", "✅ 准备提交的 gameData:", gameData);
        common_vendor.index.__f__("log", "at pages/create/create.vue:590", "📝 当前模式:", isEditMode.value ? "编辑模式" : "创建模式");
        if (isEditMode.value) {
          common_vendor.index.__f__("log", "at pages/create/create.vue:594", "🔄 调用 updateGame，gameId:", gameId.value);
          const result = await common_vendor.wx$1.cloud.callFunction({
            name: "game-service",
            data: {
              action: "updateGame",
              data: {
                gameId: gameId.value,
                updates: gameData
              }
            }
          });
          common_vendor.index.__f__("log", "at pages/create/create.vue:607", "✅ updateGame 返回结果:", result);
          if (result.result && result.result.code === 0) {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "更新成功",
              icon: "success",
              duration: 2e3
            });
            setTimeout(() => {
              const pages = getCurrentPages();
              if (pages.length > 1) {
                const prevPage = pages[pages.length - 2];
                if (prevPage.route === "pages/list/list" || prevPage.__route__ === "pages/list/list") {
                  if (prevPage.refreshList) {
                    prevPage.refreshList();
                  }
                }
              }
              common_vendor.index.navigateBack({
                success: () => {
                  common_vendor.index.$emit("refreshGameList");
                }
              });
            }, 1500);
          } else {
            throw new Error(((_a = result.result) == null ? void 0 : _a.message) || "更新失败，返回数据异常");
          }
        } else {
          const userInfo = {
            id: currentUser._id || currentUser.id,
            nickname: currentUser.nickname || "未知用户",
            avatar: currentUser.avatar || utils_constants.constants.DEFAULT_AVATAR,
            tags: currentUser.tags || [],
            gender: currentUser.gender || 0
          };
          common_vendor.index.__f__("log", "at pages/create/create.vue:656", "✅ 当前用户信息:", userInfo);
          const result = await common_vendor.wx$1.cloud.callFunction({
            name: "game-service",
            data: {
              action: "createGame",
              data: {
                gameData,
                userInfo
              }
            }
          });
          common_vendor.index.__f__("log", "at pages/create/create.vue:669", "✅ createGame 返回结果:", result);
          if (result.result && result.result.code === 0) {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "创建成功",
              icon: "success",
              duration: 2e3
            });
            setTimeout(() => {
              common_vendor.index.redirectTo({
                url: `/pages/detail/detail?id=${result.result.data.id}&from=create`
              });
            }, 1500);
          } else {
            throw new Error(((_b = result.result) == null ? void 0 : _b.message) || "创建失败，返回数据异常");
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/create/create.vue:692", "❌ 操作失败:", error);
        let errorMessage = error.message || (isEditMode.value ? "更新失败，请重试" : "创建失败，请重试");
        if (errorMessage.includes("Cannot destructure")) {
          errorMessage = "参数格式错误，请检查调用方式";
        } else if (errorMessage.includes("network") || errorMessage.includes("Network")) {
          errorMessage = "网络连接失败，请检查网络后重试";
        } else if (errorMessage.includes("permission") || errorMessage.includes("权限")) {
          errorMessage = "权限不足，请重新登录后重试";
        } else if (errorMessage.includes("服务器内部错误")) {
          errorMessage = "服务器异常，请稍后重试";
        } else if (errorMessage.includes("缺少必要字段")) {
          errorMessage = errorMessage;
        }
        common_vendor.index.showModal({
          title: isEditMode.value ? "更新失败" : "创建失败",
          content: errorMessage,
          showCancel: false
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    common_vendor.watch(() => formData.value.time, (newTime) => {
      if (newTime) {
        const selectedTime = new Date(newTime);
        const now = /* @__PURE__ */ new Date();
        timeError.value = selectedTime <= now;
      } else {
        timeError.value = false;
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(gameTypes.value, (type, k0, i0) => {
          return {
            a: type.icon,
            b: common_vendor.t(type.name),
            c: type.id,
            d: formData.value.type === type.id ? 1 : "",
            e: common_vendor.o(($event) => selectType(type.id), type.id)
          };
        }),
        b: formData.value.title,
        c: common_vendor.o(($event) => formData.value.title = $event.detail.value, "b2"),
        d: common_vendor.t(formData.value.title.length),
        e: getProjectPlaceholder(),
        f: formData.value.project,
        g: common_vendor.o(($event) => formData.value.project = $event.detail.value, "5a"),
        h: common_vendor.t(formData.value.project.length),
        i: common_vendor.t(dateDisplay.value || "选择日期"),
        j: common_assets._imports_2$1,
        k: dateValue.value,
        l: currentDate.value,
        m: endDate.value,
        n: common_vendor.o(bindDateChange, "90"),
        o: common_vendor.t(timeDisplay.value || "选择时间"),
        p: common_assets._imports_2$1,
        q: timeValue.value,
        r: common_vendor.o(bindTimeChange, "22"),
        s: timeError.value
      }, timeError.value ? {} : {}, {
        t: common_vendor.t(selectedLocationName.value || "请选择活动地点"),
        v: !selectedLocationName.value ? 1 : "",
        w: common_assets._imports_2$1,
        x: locationOptions.value,
        y: locationPickerValue.value,
        z: common_vendor.o(bindLocationChange, "b0"),
        A: formData.value.maxPlayers <= minPlayers.value ? 1 : "",
        B: common_vendor.o(decreaseNumber, "eb"),
        C: common_vendor.t(formData.value.maxPlayers),
        D: formData.value.maxPlayers >= maxPlayers.value ? 1 : "",
        E: common_vendor.o(increaseNumber, "cc"),
        F: common_vendor.t(getPlayerRangeText()),
        G: formData.value.description,
        H: common_vendor.o(($event) => formData.value.description = $event.detail.value, "3a"),
        I: common_vendor.t(formData.value.description.length),
        J: !canSubmit.value ? 1 : "",
        K: common_vendor.o(handleSubmit, "0f")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-98f0e4ec"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/create/create.js.map
