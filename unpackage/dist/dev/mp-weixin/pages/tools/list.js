"use strict";
const common_vendor = require("../../common/vendor.js");
const defaultCover = "/static/empty.png";
const _sfc_main = {
  __name: "list",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const toolCovers = common_vendor.ref({});
    const toolCoverUrls = common_vendor.ref({});
    const resolveCoverUrls = async () => {
      const map = toolCovers.value || {};
      const keys = Object.keys(map);
      const cloudIds = keys.map((k) => {
        var _a;
        return String(((_a = map[k]) == null ? void 0 : _a.fileId) || "");
      }).filter((v) => v.startsWith("cloud://"));
      if (!cloudIds.length) {
        toolCoverUrls.value = {};
        return;
      }
      const unique = [...new Set(cloudIds)];
      const idToUrl = {};
      for (let i = 0; i < unique.length; i += 50) {
        const chunk = unique.slice(i, i + 50);
        const res = await common_vendor.wx$1.cloud.getTempFileURL({ fileList: chunk });
        (res.fileList || []).forEach((it) => {
          if ((it == null ? void 0 : it.fileID) && (it == null ? void 0 : it.tempFileURL))
            idToUrl[it.fileID] = it.tempFileURL;
        });
      }
      const next = {};
      keys.forEach((k) => {
        var _a;
        const fid = String(((_a = map[k]) == null ? void 0 : _a.fileId) || "");
        next[k] = idToUrl[fid] || "";
      });
      toolCoverUrls.value = next;
    };
    const loadData = async () => {
      var _a, _b, _c, _d, _e;
      const meRes = await common_vendor.wx$1.cloud.callFunction({ name: "user-service", data: { action: "getMe", data: {} } });
      isAdmin.value = !!(((_a = meRes == null ? void 0 : meRes.result) == null ? void 0 : _a.code) === 0 && ((_c = (_b = meRes == null ? void 0 : meRes.result) == null ? void 0 : _b.data) == null ? void 0 : _c.isAdmin));
      const coverRes = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "getBoardgameToolCovers", data: {} }
      });
      if (((_d = coverRes == null ? void 0 : coverRes.result) == null ? void 0 : _d.code) === 0) {
        toolCovers.value = ((_e = coverRes.result.data) == null ? void 0 : _e.covers) || {};
        await resolveCoverUrls();
      } else {
        toolCovers.value = {};
        toolCoverUrls.value = {};
      }
    };
    const uploadCover = (toolKey) => {
      if (!isAdmin.value)
        return;
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        success: async (res) => {
          var _a, _b;
          const path = (res.tempFilePaths || [])[0];
          if (!path)
            return;
          try {
            common_vendor.index.showLoading({ title: "上传中...", mask: true });
            const ext = (path.split(".").pop() || "jpg").toLowerCase();
            const cloudPath = `tool-covers/${toolKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const uploadRes = await common_vendor.wx$1.cloud.uploadFile({ cloudPath, filePath: path });
            const fileId = String((uploadRes == null ? void 0 : uploadRes.fileID) || "");
            if (!fileId)
              throw new Error("上传失败");
            const saveRes = await common_vendor.wx$1.cloud.callFunction({
              name: "game-service",
              data: { action: "setBoardgameToolCover", data: { toolKey, coverFileId: fileId } }
            });
            if (((_a = saveRes == null ? void 0 : saveRes.result) == null ? void 0 : _a.code) === 0) {
              common_vendor.index.showToast({ title: "封面已更新", icon: "success" });
              await loadData();
            } else {
              common_vendor.index.showToast({ title: ((_b = saveRes == null ? void 0 : saveRes.result) == null ? void 0 : _b.message) || "保存失败", icon: "none" });
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/tools/list.vue:129", "uploadCover failed:", error);
            common_vendor.index.showToast({ title: "上传失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    };
    const goWarRoom = () => {
      common_vendor.index.navigateTo({ url: "/pages/tools/warroom" });
    };
    const goTurnScore = () => {
      common_vendor.index.navigateTo({ url: "/pages/tools/turnscore" });
    };
    const goDice = () => {
      common_vendor.index.navigateTo({ url: "/pages/tools/dice" });
    };
    common_vendor.onShow(loadData);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: toolCoverUrls.value.warroom || defaultCover,
        b: isAdmin.value
      }, isAdmin.value ? {
        c: common_vendor.o(($event) => uploadCover("warroom"), "f3")
      } : {}, {
        d: common_vendor.o(goWarRoom, "2b"),
        e: toolCoverUrls.value.turnscore || defaultCover,
        f: isAdmin.value
      }, isAdmin.value ? {
        g: common_vendor.o(($event) => uploadCover("turnscore"), "a8")
      } : {}, {
        h: common_vendor.o(goTurnScore, "38"),
        i: toolCoverUrls.value.dice || defaultCover,
        j: isAdmin.value
      }, isAdmin.value ? {
        k: common_vendor.o(($event) => uploadCover("dice"), "aa")
      } : {}, {
        l: common_vendor.o(goDice, "f2")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c40673f7"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/tools/list.js.map
