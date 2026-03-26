"use strict";
const common_vendor = require("../../common/vendor.js");
const TEMPLATE_KEY = "boardgame_dice_templates_v1";
const MAX_TEMPLATE = 6;
const _sfc_main = {
  __name: "dice-workshop",
  setup(__props) {
    const sides = common_vendor.ref(6);
    const faces = common_vendor.ref([]);
    const name = common_vendor.ref("");
    const safeParse = (v) => {
      try {
        return JSON.parse(v);
      } catch (e) {
        return null;
      }
    };
    const loadTemplates = () => {
      const raw = common_vendor.index.getStorageSync(TEMPLATE_KEY);
      const parsed = typeof raw === "string" ? safeParse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    };
    const persistTemplates = (list) => {
      common_vendor.index.setStorageSync(TEMPLATE_KEY, JSON.stringify(list));
    };
    const rebuildFaces = () => {
      const n = Math.max(2, Math.min(20, Number(sides.value) || 2));
      const old = Array.isArray(faces.value) ? [...faces.value] : [];
      const next = [];
      for (let i = 0; i < n; i += 1) {
        next.push(old[i] !== void 0 ? String(old[i]) : String(i + 1));
      }
      faces.value = next;
    };
    const onSidesInput = (e) => {
      var _a;
      const v = Number(((_a = e == null ? void 0 : e.detail) == null ? void 0 : _a.value) || 0);
      sides.value = Math.max(2, Math.min(20, v || 2));
      rebuildFaces();
    };
    const onNameInput = (e) => {
      var _a;
      name.value = String(((_a = e == null ? void 0 : e.detail) == null ? void 0 : _a.value) || "");
    };
    const onFaceInput = (idx, e) => {
      var _a;
      const v = String(((_a = e == null ? void 0 : e.detail) == null ? void 0 : _a.value) || "");
      const arr = [...faces.value];
      arr[idx] = v;
      faces.value = arr;
    };
    const saveDice = () => {
      const list = loadTemplates();
      if (list.length >= MAX_TEMPLATE) {
        common_vendor.index.showToast({ title: "每位玩家最多保存6枚骰子", icon: "none" });
        return;
      }
      const cleanFaces = faces.value.map((v, idx) => {
        const txt = String(v || "").trim();
        if (txt)
          return txt;
        return String(idx + 1);
      });
      const n = Math.max(2, Math.min(20, Number(sides.value) || 2));
      const diceName = String(name.value || "").trim() || `D${n}`;
      list.unshift({
        id: `dice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: diceName,
        sides: n,
        faces: cleanFaces.slice(0, n),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      persistTemplates(list);
      common_vendor.index.showToast({ title: "保存成功", icon: "success" });
      setTimeout(() => {
        common_vendor.index.navigateBack();
      }, 250);
    };
    common_vendor.onLoad(() => {
      rebuildFaces();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(saveDice, "5a"),
        b: String(sides.value),
        c: common_vendor.o(onSidesInput, "d8"),
        d: name.value,
        e: common_vendor.o(onNameInput, "69"),
        f: common_vendor.f(faces.value, (face, idx, i0) => {
          return {
            a: common_vendor.t(idx + 1),
            b: face,
            c: common_vendor.o((e) => onFaceInput(idx, e), `face-${idx}`),
            d: `face-${idx}`
          };
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-51e2dec5"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/tools/dice-workshop.js.map
