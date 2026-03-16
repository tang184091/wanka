"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const utils_user = require("../../utils/user.js");
const _sfc_main = {
  __name: "games",
  setup(__props) {
    const gameTypes = common_vendor.ref([
      { id: "mahjong", name: "日麻" },
      { id: "boardgame", name: "桌游" },
      { id: "videogame", name: "电玩" }
    ]);
    const myGames = common_vendor.ref([]);
    const newGame = common_vendor.ref({
      typeIndex: 0,
      name: ""
    });
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
    const getTypeIndex = (type) => {
      return gameTypes.value.findIndex((t) => t.id === type);
    };
    const onNewGameTypeChange = (e) => {
      newGame.value.typeIndex = e.detail.value;
    };
    const changeGameType = (index, typeIndex) => {
      myGames.value[index].type = gameTypes.value[typeIndex].id;
    };
    const addNewGame = () => {
      if (myGames.value.length >= 10) {
        common_vendor.index.showToast({
          title: "最多只能添加10个游戏/设备",
          icon: "none"
        });
        return;
      }
      if (!newGame.value.name.trim()) {
        common_vendor.index.showToast({
          title: "请输入游戏/设备名称",
          icon: "none"
        });
        return;
      }
      const selectedType = gameTypes.value[newGame.value.typeIndex];
      myGames.value.push({
        id: Date.now() + myGames.value.length,
        type: selectedType.id,
        name: newGame.value.name.trim()
      });
      newGame.value.name = "";
      common_vendor.index.showToast({
        title: "添加成功",
        icon: "success"
      });
    };
    const removeGame = (index) => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这个游戏/设备吗？",
        success: (res) => {
          if (res.confirm) {
            myGames.value.splice(index, 1);
            common_vendor.index.showToast({
              title: "已删除",
              icon: "success"
            });
          }
        }
      });
    };
    const saveGames = async () => {
      if (myGames.value.length === 0) {
        common_vendor.index.showToast({
          title: "请至少添加一个游戏/设备",
          icon: "none"
        });
        return;
      }
      if (myGames.value.length > 10) {
        common_vendor.index.showToast({
          title: "游戏/设备数量不能超过10个",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showLoading({
        title: "保存中...",
        mask: true
      });
      try {
        await utils_user.UserService.updateUserGames(myGames.value);
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success",
          duration: 1500
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/games.vue:262", "保存游戏列表失败:", error);
        common_vendor.index.showToast({
          title: "保存失败: " + (error.message || "请重试"),
          icon: "none",
          duration: 3e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    common_vendor.onMounted(() => {
      const userInfo = utils_user.UserService.getCurrentUser();
      if (userInfo == null ? void 0 : userInfo.games) {
        myGames.value = [...userInfo.games];
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0$3,
        b: common_vendor.o(goBack, "50"),
        c: common_vendor.o(saveGames, "82"),
        d: common_vendor.t(myGames.value.length),
        e: myGames.value.length === 0
      }, myGames.value.length === 0 ? {
        f: common_assets._imports_1$1
      } : {
        g: common_vendor.f(myGames.value, (game, index, i0) => {
          return {
            a: common_vendor.t(getGameTypeText(game.type)),
            b: common_vendor.n(getGameTypeClass(game.type)),
            c: game.name,
            d: common_vendor.o(($event) => game.name = $event.detail.value, index),
            e: getTypeIndex(game.type),
            f: common_vendor.o((e) => changeGameType(index, e.detail.value), index),
            g: common_vendor.o(($event) => removeGame(index), index),
            h: index
          };
        }),
        h: gameTypes.value
      }, {
        i: common_vendor.t(gameTypes.value[newGame.value.typeIndex].name),
        j: common_assets._imports_2$1,
        k: gameTypes.value,
        l: newGame.value.typeIndex,
        m: common_vendor.o(onNewGameTypeChange, "55"),
        n: common_vendor.o(addNewGame, "7d"),
        o: newGame.value.name,
        p: common_vendor.o(($event) => newGame.value.name = $event.detail.value, "31"),
        q: common_vendor.t(myGames.value.length >= 10 ? "已达上限" : "添加到我的列表"),
        r: myGames.value.length >= 10 ? 1 : "",
        s: common_vendor.o(addNewGame, "86")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-69e18c5c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/games.js.map
