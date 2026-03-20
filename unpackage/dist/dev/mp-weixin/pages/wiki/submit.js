"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "submit",
  setup(__props) {
    const tagsText = common_vendor.ref("");
    const form = common_vendor.ref({
      title: "",
      summary: "",
      content: "",
      images: []
    });
    const parseTags = () => {
      return tagsText.value.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 10);
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
            common_vendor.index.showToast({ title: "上传成功", icon: "success" });
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/wiki/submit.vue:78", "upload wiki images failed", error);
            common_vendor.index.showToast({ title: "上传失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    };
    const removeImage = (index) => {
      form.value.images.splice(index, 1);
    };
    const submit = async () => {
      var _a, _b;
      if (!form.value.title.trim()) {
        common_vendor.index.showToast({ title: "请填写标题", icon: "none" });
        return;
      }
      if (!form.value.content.trim()) {
        common_vendor.index.showToast({ title: "请填写正文", icon: "none" });
        return;
      }
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: {
          action: "submitWiki",
          data: {
            title: form.value.title,
            summary: form.value.summary,
            content: form.value.content,
            images: form.value.images,
            tags: parseTags()
          }
        }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
        common_vendor.index.showToast({ title: "提交成功，待审核", icon: "success" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 600);
      } else {
        common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "提交失败", icon: "none" });
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: form.value.title,
        b: common_vendor.o(($event) => form.value.title = $event.detail.value, "0b"),
        c: form.value.summary,
        d: common_vendor.o(($event) => form.value.summary = $event.detail.value, "de"),
        e: form.value.content,
        f: common_vendor.o(($event) => form.value.content = $event.detail.value, "76"),
        g: common_vendor.t(form.value.content.length),
        h: tagsText.value,
        i: common_vendor.o(($event) => tagsText.value = $event.detail.value, "ae"),
        j: common_vendor.o(chooseImages, "2e"),
        k: form.value.images.length
      }, form.value.images.length ? {
        l: common_vendor.f(form.value.images, (img, index, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => removeImage(index), img + index),
            c: img + index
          };
        })
      } : {}, {
        m: common_vendor.o(submit, "2e")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-615a5575"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/wiki/submit.js.map
