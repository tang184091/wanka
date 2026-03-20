"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const detail = common_vendor.ref({
      id: "",
      title: "",
      summary: "",
      content: "",
      images: [],
      creatorNickname: "",
      createdAt: ""
    });
    const formatDateTime = (value) => {
      if (!value)
        return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime()))
        return "-";
      const pad = (n) => `${n}`.padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    const loadDetail = async (id) => {
      var _a, _b;
      if (!id)
        return;
      try {
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: { action: "getWikiDetail", data: { entryId: id } }
        });
        if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
          detail.value = res.result.data || detail.value;
        } else {
          common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "加载失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/wiki/detail.vue:66", "load wiki detail failed", error);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      }
    };
    const preview = (index) => {
      const images = detail.value.images || [];
      if (!images.length)
        return;
      common_vendor.index.previewImage({ current: images[index], urls: images });
    };
    common_vendor.onLoad((query) => {
      loadDetail(query == null ? void 0 : query.id);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(detail.value.title || "词条详情"),
        b: detail.value.summary
      }, detail.value.summary ? {
        c: common_vendor.t(detail.value.summary)
      } : {}, {
        d: common_vendor.t(formatDateTime(detail.value.createdAt)),
        e: common_vendor.t(detail.value.creatorNickname || "未命名用户"),
        f: detail.value.images && detail.value.images.length
      }, detail.value.images && detail.value.images.length ? {
        g: common_vendor.f(detail.value.images, (url, index, i0) => {
          return {
            a: index,
            b: url,
            c: common_vendor.o(($event) => preview(index), index)
          };
        })
      } : {}, {
        h: common_vendor.t(detail.value.content || "暂无内容")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-89ee8409"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/wiki/detail.js.map
