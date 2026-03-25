"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "announcement",
  setup(__props) {
    const content = common_vendor.ref("");
    const saving = common_vendor.ref(false);
    const updatedAt = common_vendor.ref("");
    const updatedByNickname = common_vendor.ref("");
    const updatedAtText = common_vendor.computed(() => {
      if (!updatedAt.value)
        return "";
      const d = new Date(updatedAt.value);
      if (Number.isNaN(d.getTime()))
        return "";
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    });
    const loadNotice = async () => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "getSeatAnnouncement", data: {} }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
        content.value = String(((_c = (_b = res.result) == null ? void 0 : _b.data) == null ? void 0 : _c.content) || "");
        updatedAt.value = ((_e = (_d = res.result) == null ? void 0 : _d.data) == null ? void 0 : _e.updatedAt) || "";
        updatedByNickname.value = String(((_g = (_f = res.result) == null ? void 0 : _f.data) == null ? void 0 : _g.updatedByNickname) || "");
      } else {
        common_vendor.index.showToast({ title: ((_h = res == null ? void 0 : res.result) == null ? void 0 : _h.message) || "加载失败", icon: "none" });
      }
    };
    const saveNotice = async () => {
      var _a, _b, _c, _d, _e, _f;
      if (saving.value)
        return;
      if (content.value.length > 1e3) {
        common_vendor.index.showToast({ title: "公告最多1000字", icon: "none" });
        return;
      }
      saving.value = true;
      try {
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: { action: "setSeatAnnouncement", data: { content: content.value } }
        });
        if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
          common_vendor.index.showToast({ title: "保存成功", icon: "success" });
          updatedAt.value = ((_c = (_b = res.result) == null ? void 0 : _b.data) == null ? void 0 : _c.updatedAt) || (/* @__PURE__ */ new Date()).toISOString();
          updatedByNickname.value = String(((_e = (_d = res.result) == null ? void 0 : _d.data) == null ? void 0 : _e.updatedByNickname) || "");
        } else {
          common_vendor.index.showToast({ title: ((_f = res == null ? void 0 : res.result) == null ? void 0 : _f.message) || "保存失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/admin/announcement.vue:77", "saveNotice failed:", error);
        common_vendor.index.showToast({ title: "保存失败", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    common_vendor.onShow(() => {
      loadNotice();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: content.value,
        b: common_vendor.o(($event) => content.value = $event.detail.value, "cf"),
        c: common_vendor.t(content.value.length),
        d: updatedAtText.value
      }, updatedAtText.value ? {
        e: common_vendor.t(updatedAtText.value),
        f: common_vendor.t(updatedByNickname.value ? `· ${updatedByNickname.value}` : "")
      } : {}, {
        g: common_vendor.t(saving.value ? "保存中..." : "保存公告"),
        h: common_vendor.o(saveNotice, "14"),
        i: saving.value ? 1 : ""
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5f8ffcc8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/announcement.js.map
