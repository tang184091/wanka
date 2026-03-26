"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "yakuman",
  setup(__props) {
    const list = common_vendor.ref([]);
    const isAdmin = common_vendor.ref(false);
    const formatTime = (t) => {
      if (!t)
        return "-";
      const d = new Date(t);
      const pad = (n) => `${n}`.padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const toSafeValue = (value) => String(value || "").trim();
    const resolveImageUrls = async (records = []) => {
      const normalized = records.map((item) => ({
        ...item,
        imageFileId: toSafeValue(item.imageFileId),
        imageUrl: toSafeValue(item.imageUrl || item.imageFileId)
      }));
      const cloudIds = normalized.map((item) => toSafeValue(item.imageUrl || item.imageFileId)).filter((id) => id.startsWith("cloud://"));
      if (!cloudIds.length)
        return normalized;
      const uniqueIds = [...new Set(cloudIds)];
      const idToTempUrl = {};
      for (let i = 0; i < uniqueIds.length; i += 50) {
        const chunk = uniqueIds.slice(i, i + 50);
        const tempRes = await common_vendor.wx$1.cloud.getTempFileURL({ fileList: chunk });
        const fileList = (tempRes == null ? void 0 : tempRes.fileList) || [];
        fileList.forEach((item) => {
          if ((item == null ? void 0 : item.fileID) && (item == null ? void 0 : item.tempFileURL)) {
            idToTempUrl[item.fileID] = item.tempFileURL;
          }
        });
      }
      return normalized.map((item) => ({
        ...item,
        imageUrl: idToTempUrl[toSafeValue(item.imageUrl || item.imageFileId)] || toSafeValue(item.imageUrl || item.imageFileId)
      }));
    };
    const loadData = async () => {
      var _a, _b, _c, _d;
      const me = await common_vendor.wx$1.cloud.callFunction({ name: "user-service", data: { action: "getMe", data: {} } });
      isAdmin.value = !!((_b = (_a = me == null ? void 0 : me.result) == null ? void 0 : _a.data) == null ? void 0 : _b.isAdmin);
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "getYakumanList", data: {} }
      });
      if (((_c = res.result) == null ? void 0 : _c.code) === 0) {
        const records = res.result.data.list || [];
        list.value = await resolveImageUrls(records);
      } else {
        common_vendor.index.showToast({ title: ((_d = res.result) == null ? void 0 : _d.message) || "加载失败", icon: "none" });
      }
    };
    const goEdit = (item) => {
      const id = (item == null ? void 0 : item.id) || (item == null ? void 0 : item._id);
      if (!id)
        return;
      common_vendor.index.navigateTo({ url: `/pages/admin/yakuman-edit?recordId=${id}` });
    };
    const removeItem = (item) => {
      const id = (item == null ? void 0 : item.id) || (item == null ? void 0 : item._id);
      if (!id)
        return;
      common_vendor.index.showModal({
        title: "确认删除",
        content: "删除后不可恢复，确认继续？",
        success: async (res) => {
          var _a, _b;
          if (!res.confirm)
            return;
          const r = await common_vendor.wx$1.cloud.callFunction({
            name: "game-service",
            data: { action: "adminDeleteYakumanRecord", data: { recordId: id } }
          });
          if (((_a = r == null ? void 0 : r.result) == null ? void 0 : _a.code) === 0) {
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            await loadData();
          } else {
            common_vendor.index.showToast({ title: ((_b = r == null ? void 0 : r.result) == null ? void 0 : _b.message) || "删除失败", icon: "none" });
          }
        }
      });
    };
    const openUpload = () => {
      common_vendor.index.navigateTo({ url: "/pages/record/yakuman-upload" });
    };
    const preview = (src) => {
      if (!src)
        return;
      common_vendor.index.previewImage({ urls: [src], current: src });
    };
    common_vendor.onShow(loadData);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(openUpload, "94"),
        b: !list.value.length
      }, !list.value.length ? {} : {}, {
        c: common_vendor.f(list.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.imageUrl,
            b: common_vendor.o(($event) => preview(item.imageUrl), item._id),
            c: common_vendor.t(item.playerNickname),
            d: common_vendor.t(item.yakumanType),
            e: common_vendor.t(formatTime(item.achievedAt))
          }, isAdmin.value ? {
            f: common_vendor.o(($event) => goEdit(item), item._id),
            g: common_vendor.o(($event) => removeItem(item), item._id)
          } : {}, {
            h: item._id
          });
        }),
        d: isAdmin.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d683e9c2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/yakuman.js.map
