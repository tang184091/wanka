"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "yakuman",
  setup(__props) {
    const list = common_vendor.ref([]);
    const formatTime = (t) => {
      if (!t)
        return "-";
      const d = new Date(t);
      const pad = (n) => `${n}`.padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const loadData = async () => {
      var _a, _b;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "getYakumanList", data: {} }
      });
      if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
        list.value = res.result.data.list || [];
      } else {
        common_vendor.index.showToast({ title: ((_b = res.result) == null ? void 0 : _b.message) || "加载失败", icon: "none" });
      }
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
          return {
            a: item.imageFileId,
            b: common_vendor.o(($event) => preview(item.imageFileId), item._id),
            c: common_vendor.t(item.playerNickname),
            d: common_vendor.t(item.yakumanType),
            e: common_vendor.t(formatTime(item.achievedAt)),
            f: item._id
          };
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d683e9c2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/yakuman.js.map
