"use strict";
const common_vendor = require("../../common/vendor.js");
require("../../utils/store.js");
const utils_user = require("../../utils/user.js");
const utils_constants = require("../../utils/constants.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  __name: "create",
  setup(__props) {
    const gameTypes = common_vendor.ref([
      {
        id: "mahjong",
        name: "立直麻将",
        icon: common_assets.mahjong,
        minPlayers: utils_constants.constants.GAME_TYPES.mahjong.minPlayers,
        maxPlayers: utils_constants.constants.GAME_TYPES.mahjong.maxPlayers
      },
      {
        id: "boardgame",
        name: "桌游",
        icon: common_assets.boardgame,
        minPlayers: utils_constants.constants.GAME_TYPES.boardgame.minPlayers,
        maxPlayers: utils_constants.constants.GAME_TYPES.boardgame.maxPlayers
      },
      {
        id: "videogame",
        name: "电玩",
        icon: common_assets.videogame,
        minPlayers: utils_constants.constants.GAME_TYPES.videogame.minPlayers,
        maxPlayers: utils_constants.constants.GAME_TYPES.videogame.maxPlayers
      },
      {
        id: "cardgame",
        name: "打牌",
        icon: common_assets.tcggame,
        minPlayers: utils_constants.constants.GAME_TYPES.cardgame.minPlayers,
        maxPlayers: utils_constants.constants.GAME_TYPES.cardgame.maxPlayers
      },
      {
        id: "competition",
        name: "比赛",
        icon: common_assets.champion,
        minPlayers: utils_constants.constants.GAME_TYPES.competition.minPlayers,
        maxPlayers: utils_constants.constants.GAME_TYPES.competition.maxPlayers
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
    const currentJoinedPlayers = common_vendor.ref(1);
    const pickedLocationDate = common_vendor.ref("");
    const dateValue = common_vendor.ref("");
    const timeValue = common_vendor.ref("");
    const timeMultiIndex = common_vendor.ref([0, 0]);
    const timeHourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
    const timeMinuteOptions = ["00", "10", "20", "30", "40", "50"];
    const timeMultiRange = [timeHourOptions, timeMinuteOptions];
    const dateDisplay = common_vendor.ref("");
    const timeDisplay = common_vendor.ref("");
    const timeError = common_vendor.ref(false);
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
    const firstRowTypes = common_vendor.computed(() => gameTypes.value.slice(0, 3));
    const secondRowTypes = common_vendor.computed(() => gameTypes.value.slice(3));
    const requiresLocation = common_vendor.computed(() => !["cardgame", "competition"].includes(formData.value.type));
    const canSubmit = common_vendor.computed(() => {
      return formData.value.title && formData.value.project && formData.value.time && (!requiresLocation.value || formData.value.location) && formData.value.maxPlayers >= minPlayers.value && formData.value.maxPlayers <= maxPlayers.value && !timeError.value;
    });
    const selectedLocationName = common_vendor.computed(() => formData.value.location || "");
    const normalizeToTenMinute = (input = "") => {
      const text = String(input || "");
      const parts = text.split(":");
      const hour = Number(parts[0] || 0);
      const minute = Number(parts[1] || 0);
      const safeHour = Math.min(23, Math.max(0, Number.isFinite(hour) ? hour : 0));
      const safeMinute = Math.min(59, Math.max(0, Number.isFinite(minute) ? minute : 0));
      const snappedMinute = Math.floor(safeMinute / 10) * 10;
      return `${String(safeHour).padStart(2, "0")}:${String(snappedMinute).padStart(2, "0")}`;
    };
    const syncTimeMultiIndex = () => {
      const [h = "00", m = "00"] = String(timeValue.value || "00:00").split(":");
      const hourIdx = Math.max(0, timeHourOptions.indexOf(h));
      const minuteIdx = Math.max(0, timeMinuteOptions.indexOf(m));
      timeMultiIndex.value = [hourIdx, minuteIdx];
    };
    const applyPrefill = (options = {}) => {
      if (options.type) {
        const allowedType = gameTypes.value.find((t) => t.id === options.type);
        if (allowedType) {
          selectType(allowedType.id);
        }
      }
      if (options.project) {
        formData.value.project = decodeURIComponent(options.project);
      }
      if (options.location) {
        if (requiresLocation.value) {
          formData.value.location = decodeURIComponent(options.location);
          pickedLocationDate.value = dateValue.value || "";
        }
      }
      if (options.date) {
        const presetDate = decodeURIComponent(options.date);
        if (/^\d{4}-\d{2}-\d{2}$/.test(presetDate)) {
          dateValue.value = presetDate;
          updateFormDateTime();
        }
      }
    };
    common_vendor.onLoad((options) => {
      common_vendor.index.__f__("log", "at pages/create/create.vue:353", "页面参数:", options);
      if (options.edit && options.id) {
        isEditMode.value = true;
        gameId.value = options.id;
        loadGameDetail(options.id);
      } else {
        currentJoinedPlayers.value = 1;
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
        common_vendor.index.__f__("log", "at pages/create/create.vue:384", "加载对局详情结果:", result);
        if (result.result && result.result.code === 0 && result.result.data) {
          const game = result.result.data;
          originalData.value = { ...game };
          currentJoinedPlayers.value = Number(game.currentPlayers || (game.participants || []).length + 1 || 1);
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
            timeValue.value = normalizeToTenMinute(`${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`);
            syncTimeMultiIndex();
            updateTimeDisplay(date);
            pickedLocationDate.value = dateValue.value;
          }
          common_vendor.index.setNavigationBarTitle({
            title: "编辑组局"
          });
        } else {
          throw new Error("加载对局详情失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/create/create.vue:422", "加载对局详情失败:", error);
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
      dateValue.value = "";
      timeValue.value = "";
      syncTimeMultiIndex();
      dateDisplay.value = "";
      timeDisplay.value = "";
      formData.value.time = "";
      formData.value.location = "";
      pickedLocationDate.value = "";
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
      if (!["cardgame", "competition"].includes(type))
        return;
      formData.value.location = "";
      pickedLocationDate.value = "";
    };
    const getProjectPlaceholder = () => {
      const placeholders = {
        mahjong: "请输入规则，如：三麻，东风场",
        boardgame: "请输入具体桌游，如：《历史巨轮》",
        videogame: "请输入具体游戏/设备，如：Switch《马里奥赛车》",
        cardgame: "请输入TCG项目，如：游戏王、符文战场",
        competition: "请输入比赛名称，如：年赛"
      };
      return placeholders[formData.value.type] || "请输入具体项目";
    };
    const bindDateChange = (e) => {
      const prevDate = dateValue.value;
      dateValue.value = e.detail.value;
      updateFormDateTime();
      if (requiresLocation.value && formData.value.location && prevDate && prevDate !== dateValue.value) {
        formData.value.location = "";
        pickedLocationDate.value = "";
        common_vendor.index.showToast({
          title: "日期已变更，请重新选择地点",
          icon: "none"
        });
      }
    };
    const bindTimeMultiChange = (e) => {
      const indexes = e.detail.value || [0, 0];
      const hour = timeHourOptions[indexes[0]] || "00";
      const minute = timeMinuteOptions[indexes[1]] || "00";
      timeMultiIndex.value = [indexes[0] || 0, indexes[1] || 0];
      timeValue.value = `${hour}:${minute}`;
      updateFormDateTime();
    };
    const updateFormDateTime = () => {
      if (dateValue.value && timeValue.value) {
        const dateStr = dateValue.value;
        const timeStr = normalizeToTenMinute(timeValue.value);
        timeValue.value = timeStr;
        syncTimeMultiIndex();
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
    const openSeatPicker = () => {
      if (!requiresLocation.value) {
        common_vendor.index.showToast({
          title: "当前类型无需选择地点",
          icon: "none"
        });
        return;
      }
      if (!dateValue.value || !timeValue.value || !formData.value.time || timeError.value) {
        common_vendor.index.showToast({
          title: "请先选择有效的活动时间",
          icon: "none"
        });
        return;
      }
      const targetDate = dateValue.value;
      const currentType = formData.value.type || "mahjong";
      common_vendor.index.navigateTo({
        url: `/pages/seat/select?date=${encodeURIComponent(targetDate)}&type=${encodeURIComponent(currentType)}`,
        success: (res) => {
          if (!res || !res.eventChannel)
            return;
          res.eventChannel.on("seatPicked", (payload = {}) => {
            if (!payload.location)
              return;
            if (payload.date && payload.date !== dateValue.value) {
              common_vendor.index.showToast({
                title: "所选座位日期与活动日期不一致",
                icon: "none"
              });
              return;
            }
            formData.value.location = payload.location;
            pickedLocationDate.value = payload.date || targetDate;
            if (payload.type && payload.type !== formData.value.type) {
              selectType(payload.type);
            }
          });
        }
      });
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
      if (requiresLocation.value && formData.value.location && pickedLocationDate.value && dateValue.value !== pickedLocationDate.value) {
        common_vendor.index.showToast({
          title: "活动日期已变化，请重新选择地点",
          icon: "none"
        });
        return;
      }
      if (isEditMode.value && Number(formData.value.maxPlayers) < Number(currentJoinedPlayers.value)) {
        common_vendor.index.showToast({
          title: `人数不能低于已加入人数(${currentJoinedPlayers.value})`,
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
          location: requiresLocation.value ? formData.value.location : "",
          maxPlayers: formData.value.maxPlayers,
          description: formData.value.description || ""
        };
        common_vendor.index.__f__("log", "at pages/create/create.vue:725", "✅ 准备提交的 gameData:", gameData);
        common_vendor.index.__f__("log", "at pages/create/create.vue:726", "📝 当前模式:", isEditMode.value ? "编辑模式" : "创建模式");
        if (isEditMode.value) {
          common_vendor.index.__f__("log", "at pages/create/create.vue:730", "🔄 调用 updateGame，gameId:", gameId.value);
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
          common_vendor.index.__f__("log", "at pages/create/create.vue:743", "✅ updateGame 返回结果:", result);
          if (result.result && result.result.code === 0) {
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
          common_vendor.index.__f__("log", "at pages/create/create.vue:790", "✅ 当前用户信息:", userInfo);
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
          common_vendor.index.__f__("log", "at pages/create/create.vue:803", "✅ createGame 返回结果:", result);
          if (result.result && result.result.code === 0) {
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
        common_vendor.index.__f__("error", "at pages/create/create.vue:824", "❌ 操作失败:", error);
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
        a: common_vendor.f(firstRowTypes.value, (type, k0, i0) => {
          return {
            a: type.icon,
            b: common_vendor.n(`type-icon-${type.id}`),
            c: common_vendor.t(type.name),
            d: type.id,
            e: formData.value.type === type.id ? 1 : "",
            f: common_vendor.o(($event) => selectType(type.id), type.id)
          };
        }),
        b: common_vendor.f(secondRowTypes.value, (type, k0, i0) => {
          return {
            a: type.icon,
            b: common_vendor.n(`type-icon-${type.id}`),
            c: common_vendor.t(type.name),
            d: type.id,
            e: formData.value.type === type.id ? 1 : "",
            f: common_vendor.o(($event) => selectType(type.id), type.id)
          };
        })
      }, {}, {
        c: formData.value.title,
        d: common_vendor.o(($event) => formData.value.title = $event.detail.value, "6b"),
        e: common_vendor.t(formData.value.title.length)
      }, {}, {
        f: getProjectPlaceholder(),
        g: formData.value.project,
        h: common_vendor.o(($event) => formData.value.project = $event.detail.value, "97"),
        i: common_vendor.t(formData.value.project.length),
        j: common_vendor.t(dateDisplay.value || "选择日期"),
        k: dateValue.value,
        l: currentDate.value,
        m: endDate.value,
        n: common_vendor.o(bindDateChange, "d1"),
        o: common_vendor.t(timeDisplay.value || "选择时间"),
        p: timeMultiRange,
        q: timeMultiIndex.value,
        r: common_vendor.o(bindTimeMultiChange, "c5"),
        s: timeError.value
      }, timeError.value ? {} : {}, {
        t: common_vendor.t(selectedLocationName.value || "从座位详情中选择可预约地点"),
        v: !selectedLocationName.value ? 1 : "",
        w: common_vendor.o(openSeatPicker, "27"),
        x: formData.value.maxPlayers <= minPlayers.value ? 1 : "",
        y: common_vendor.o(decreaseNumber, "cc"),
        z: common_vendor.t(formData.value.maxPlayers),
        A: formData.value.maxPlayers >= maxPlayers.value ? 1 : "",
        B: common_vendor.o(increaseNumber, "35"),
        C: common_vendor.t(getPlayerRangeText()),
        D: formData.value.description,
        E: common_vendor.o(($event) => formData.value.description = $event.detail.value, "10"),
        F: common_vendor.t(formData.value.description.length),
        G: !canSubmit.value ? 1 : "",
        H: common_vendor.o(handleSubmit, "4e")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-98f0e4ec"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/create/create.js.map
