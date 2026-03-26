"use strict";
const common_vendor = require("../../common/vendor.js");
const localFallbackImage = "/static/empty.png";
const _sfc_main = {
  __name: "wiki-edit",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const editingId = common_vendor.ref("");
    const statusOptions = ["待审核", "已发布", "已驳回"];
    const statusValueMap = ["pending", "published", "rejected"];
    const statusIndex = common_vendor.ref(0);
    const preservedTags = common_vendor.ref([]);
    const displayImages = common_vendor.ref([]);
    const form = common_vendor.ref({
      title: "",
      summary: "",
      content: "",
      images: [],
      creatorId: "",
      creatorNickname: "",
      status: "pending"
    });
    const isCloudFileId = (value) => typeof value === "string" && value.startsWith("cloud://");
    const isHttpUrl = (value) => typeof value === "string" && /^https?:\/\//.test(value);
    const checkAdmin = async () => {
      var _a, _b;
      const me = await common_vendor.wx$1.cloud.callFunction({ name: "user-service", data: { action: "getMe", data: {} } });
      isAdmin.value = !!((_b = (_a = me == null ? void 0 : me.result) == null ? void 0 : _a.data) == null ? void 0 : _b.isAdmin);
      if (!isAdmin.value) {
        common_vendor.index.showToast({ title: "仅管理员可访问", icon: "none" });
        setTimeout(() => {
          common_vendor.index.switchTab({ url: "/pages/user/user" });
        }, 300);
      }
    };
    const refreshDisplayImages = async () => {
      const images = form.value.images || [];
      if (!images.length) {
        displayImages.value = [];
        return;
      }
      const cloudIds = images.filter((img) => isCloudFileId(img));
      const tempMap = {};
      if (cloudIds.length) {
        try {
          const res = await common_vendor.wx$1.cloud.getTempFileURL({ fileList: cloudIds });
          ((res == null ? void 0 : res.fileList) || []).forEach((item) => {
            if ((item == null ? void 0 : item.status) === 0 && (item == null ? void 0 : item.fileID) && (item == null ? void 0 : item.tempFileURL)) {
              tempMap[item.fileID] = item.tempFileURL;
            }
          });
        } catch (error) {
          common_vendor.index.__f__("warn", "at pages/admin/wiki-edit.vue:100", "refreshDisplayImages getTempFileURL failed:", error);
        }
      }
      displayImages.value = images.map((img) => {
        if (isHttpUrl(img) || String(img || "").startsWith("/"))
          return img;
        if (isCloudFileId(img))
          return tempMap[img] || localFallbackImage;
        return localFallbackImage;
      });
    };
    const onStatusChange = (e) => {
      const idx = Number(e.detail.value || 0);
      statusIndex.value = idx;
      form.value.status = statusValueMap[idx] || "pending";
    };
    const uploadSingleImage = async (filePath) => {
      const ext = (filePath.split(".").pop() || "jpg").toLowerCase();
      const cloudPath = `wiki/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const res = await common_vendor.wx$1.cloud.uploadFile({ cloudPath, filePath });
      return res.fileID;
    };
    const chooseImages = () => {
      const remain = Math.max(0, 9 - form.value.images.length);
      if (!remain) {
        common_vendor.index.showToast({ title: "最多 9 张图片", icon: "none" });
        return;
      }
      common_vendor.index.chooseImage({
        count: remain,
        sizeType: ["compressed"],
        success: async (res) => {
          try {
            common_vendor.index.showLoading({ title: "上传中...", mask: true });
            const files = res.tempFilePaths || [];
            for (const path of files) {
              const fileID = await uploadSingleImage(path);
              form.value.images.push(fileID);
            }
            await refreshDisplayImages();
            common_vendor.index.showToast({ title: "上传成功", icon: "success" });
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/admin/wiki-edit.vue:144", "upload wiki images failed", error);
            common_vendor.index.showToast({ title: "上传失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    };
    const removeImage = async (index) => {
      form.value.images.splice(index, 1);
      await refreshDisplayImages();
    };
    const loadDetail = async (entryId) => {
      var _a, _b;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "getWikiDetail", data: { entryId } }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) !== 0) {
        common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "加载失败", icon: "none" });
        return;
      }
      const doc = res.result.data || {};
      editingId.value = doc.id || entryId;
      form.value.title = doc.title || "";
      form.value.summary = doc.summary || "";
      form.value.content = doc.content || "";
      form.value.images = [...doc.images || []];
      form.value.creatorId = doc.creatorId || "";
      form.value.creatorNickname = doc.creatorNickname || "";
      form.value.status = doc.status || "pending";
      statusIndex.value = Math.max(0, statusValueMap.indexOf(form.value.status));
      preservedTags.value = Array.isArray(doc.tags) ? doc.tags : [];
      await refreshDisplayImages();
    };
    const submit = async () => {
      var _a, _b;
      if (!editingId.value)
        return;
      if (!form.value.title.trim()) {
        common_vendor.index.showToast({ title: "请填写标题", icon: "none" });
        return;
      }
      if (!form.value.content.trim()) {
        common_vendor.index.showToast({ title: "请填写正文", icon: "none" });
        return;
      }
      const payload = {
        entryId: editingId.value,
        title: form.value.title,
        summary: form.value.summary,
        content: form.value.content,
        images: form.value.images,
        tags: preservedTags.value,
        status: form.value.status,
        creatorId: form.value.creatorId,
        creatorNickname: form.value.creatorNickname
      };
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "adminUpdateWiki", data: payload }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
        common_vendor.index.showToast({ title: "已保存", icon: "success" });
      } else {
        common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "保存失败", icon: "none" });
      }
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    common_vendor.onLoad(async (query) => {
      await checkAdmin();
      if (!isAdmin.value)
        return;
      const entryId = String((query == null ? void 0 : query.entryId) || "").trim();
      if (!entryId) {
        common_vendor.index.showToast({ title: "缺少词条ID", icon: "none" });
        return;
      }
      await loadDetail(entryId);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : !editingId.value ? {} : common_vendor.e({
        c: form.value.title,
        d: common_vendor.o(($event) => form.value.title = $event.detail.value, "ad"),
        e: form.value.summary,
        f: common_vendor.o(($event) => form.value.summary = $event.detail.value, "20"),
        g: form.value.content,
        h: common_vendor.o(($event) => form.value.content = $event.detail.value, "6f"),
        i: common_vendor.t(form.value.content.length),
        j: form.value.creatorNickname,
        k: common_vendor.o(($event) => form.value.creatorNickname = $event.detail.value, "b1"),
        l: form.value.creatorId,
        m: common_vendor.o(($event) => form.value.creatorId = $event.detail.value, "de"),
        n: common_vendor.t(statusOptions[statusIndex.value]),
        o: statusOptions,
        p: statusIndex.value,
        q: common_vendor.o(onStatusChange, "b5"),
        r: common_vendor.o(chooseImages, "c3"),
        s: form.value.images.length
      }, form.value.images.length ? {
        t: common_vendor.f(form.value.images, (img, index, i0) => {
          return {
            a: displayImages.value[index] || localFallbackImage,
            b: common_vendor.o(($event) => removeImage(index), img + index),
            c: img + index
          };
        })
      } : {}, {
        v: common_vendor.o(submit, "c1"),
        w: common_vendor.o(goBack, "bd")
      }), {
        b: !editingId.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-cdfab612"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/wiki-edit.js.map
