"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "list",
  setup(__props) {
    const list = common_vendor.ref([]);
    const page = common_vendor.ref(1);
    const hasMore = common_vendor.ref(true);
    const loading = common_vendor.ref(false);
    const keyword = common_vendor.ref("");
    const filteredList = common_vendor.computed(() => {
      const key = keyword.value.trim().toLowerCase();
      if (!key)
        return list.value;
      return list.value.filter((item) => {
        const title = String(item.title || "").toLowerCase();
        const summary = String(item.summary || "").toLowerCase();
        return title.includes(key) || summary.includes(key);
      });
    });
    const fetchList = async (reset = false) => {
      var _a, _b;
      if (loading.value)
        return;
      if (!hasMore.value && !reset)
        return;
      loading.value = true;
      try {
        const nextPage = reset ? 1 : page.value;
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: { action: "getWikiList", data: { page: nextPage, pageSize: 20 } }
        });
        if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
          const incoming = res.result.data.list || [];
          list.value = reset ? incoming : [...list.value, ...incoming];
          hasMore.value = !!res.result.data.hasMore;
          page.value = nextPage + 1;
        } else {
          common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "加载失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/wiki/list.vue:76", "load wiki list failed", error);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const onSearch = () => {
    };
    const loadMore = () => {
      fetchList(false);
    };
    const openDetail = (id) => {
      if (!id)
        return;
      common_vendor.index.navigateTo({ url: `/pages/wiki/detail?id=${id}` });
    };
    const goSubmit = () => {
      common_vendor.index.navigateTo({ url: "/pages/wiki/submit" });
    };
    common_vendor.onShow(() => {
      page.value = 1;
      hasMore.value = true;
      fetchList(true);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(onSearch, "d1"),
        b: keyword.value,
        c: common_vendor.o(($event) => keyword.value = $event.detail.value, "8a"),
        d: common_vendor.o(onSearch, "eb"),
        e: common_vendor.o(goSubmit, "d8"),
        f: filteredList.value.length === 0
      }, filteredList.value.length === 0 ? {} : {}, {
        g: common_vendor.f(filteredList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.title),
            b: common_vendor.t(item.summary || "暂无摘要"),
            c: item.tags && item.tags.length
          }, item.tags && item.tags.length ? {
            d: common_vendor.t(item.tags.slice(0, 2).join(" / "))
          } : {}, {
            e: item.id,
            f: common_vendor.o(($event) => openDetail(item.id), item.id)
          });
        }),
        h: loading.value
      }, loading.value ? {} : !hasMore.value && list.value.length > 0 ? {} : {}, {
        i: !hasMore.value && list.value.length > 0,
        j: common_vendor.o(loadMore, "c6")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3cba6c3f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/wiki/list.js.map
