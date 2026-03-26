"use strict";
const common_vendor = require("../../common/vendor.js");
const TEMPLATE_KEY = "boardgame_dice_templates_v1";
const TRAY_KEY = "boardgame_dice_tray_v1";
const MAX_TEMPLATE = 6;
const MAX_TRAY = 15;
const _sfc_main = {
  __name: "dice",
  setup(__props) {
    const templates = common_vendor.ref([]);
    const trayDice = common_vendor.ref([]);
    const manageMode = common_vendor.ref(false);
    const safeParse = (v) => {
      try {
        return JSON.parse(v);
      } catch (e) {
        return null;
      }
    };
    const loadState = () => {
      const tRaw = common_vendor.index.getStorageSync(TEMPLATE_KEY);
      const tParsed = typeof tRaw === "string" ? safeParse(tRaw) : tRaw;
      templates.value = Array.isArray(tParsed) ? tParsed : [];
      const dRaw = common_vendor.index.getStorageSync(TRAY_KEY);
      const dParsed = typeof dRaw === "string" ? safeParse(dRaw) : dRaw;
      trayDice.value = Array.isArray(dParsed) ? dParsed : [];
    };
    const persistTemplates = () => {
      common_vendor.index.setStorageSync(TEMPLATE_KEY, JSON.stringify(templates.value));
    };
    const persistTray = () => {
      common_vendor.index.setStorageSync(TRAY_KEY, JSON.stringify(trayDice.value));
    };
    const toggleManage = () => {
      manageMode.value = !manageMode.value;
    };
    const goWorkshop = () => {
      if (templates.value.length >= MAX_TEMPLATE) {
        common_vendor.index.showToast({ title: "每位玩家最多保存6枚骰子", icon: "none" });
        return;
      }
      common_vendor.index.navigateTo({ url: "/pages/tools/dice-workshop" });
    };
    const onTapTemplate = (item) => {
      if (manageMode.value)
        return;
      if (trayDice.value.length >= MAX_TRAY) {
        common_vendor.index.showToast({ title: "骰子区最多15枚", icon: "none" });
        return;
      }
      const face = String((item.faces || [])[0] ?? "-");
      trayDice.value.push({
        id: `tray_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        templateId: item.id,
        name: item.name,
        faces: Array.isArray(item.faces) ? [...item.faces] : [],
        currentFace: face
      });
      persistTray();
    };
    const removeTemplate = (id) => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "删除后不可恢复，是否继续？",
        success: (res) => {
          if (!res.confirm)
            return;
          templates.value = templates.value.filter((t) => t.id !== id);
          trayDice.value = trayDice.value.filter((d) => d.templateId !== id);
          persistTemplates();
          persistTray();
          common_vendor.index.showToast({ title: "已删除", icon: "success" });
        }
      });
    };
    const removeFromTray = (id) => {
      trayDice.value = trayDice.value.filter((d) => d.id !== id);
      persistTray();
    };
    const rollAll = () => {
      if (!trayDice.value.length)
        return;
      trayDice.value = trayDice.value.map((d) => {
        const faces = Array.isArray(d.faces) ? d.faces : [];
        if (!faces.length)
          return { ...d, currentFace: "-" };
        const idx = Math.floor(Math.random() * faces.length);
        return { ...d, currentFace: String(faces[idx]) };
      });
      persistTray();
    };
    common_vendor.onShow(() => {
      manageMode.value = false;
      loadState();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goWorkshop, "31"),
        b: common_vendor.t(manageMode.value ? "完成管理" : "管理骰子"),
        c: common_vendor.o(toggleManage, "71"),
        d: !templates.value.length
      }, !templates.value.length ? {} : {
        e: common_vendor.f(templates.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.name),
            b: common_vendor.t(item.sides),
            c: common_vendor.o(($event) => onTapTemplate(item), item.id)
          }, manageMode.value ? {
            d: common_vendor.o(($event) => removeTemplate(item.id), item.id)
          } : {}, {
            e: item.id
          });
        }),
        f: manageMode.value
      }, {
        g: !trayDice.value.length ? 1 : "",
        h: common_vendor.o(rollAll, "cc"),
        i: !trayDice.value.length
      }, !trayDice.value.length ? {} : {
        j: common_vendor.f(trayDice.value, (die, k0, i0) => {
          return {
            a: common_vendor.t(die.currentFace),
            b: common_vendor.t(die.name),
            c: die.id,
            d: common_vendor.o(($event) => removeFromTray(die.id), die.id)
          };
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5fc6971b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/tools/dice.js.map
