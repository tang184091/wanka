"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "wiki",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const list = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const page = common_vendor.ref(1);
    const pageSize = common_vendor.ref(10);
    const hasMore = common_vendor.ref(true);
    const statusFilterOptions = ["全部", "待审核", "已发布", "已驳回"];
    const statusFilterValueMap = ["", "pending", "published", "rejected"];
    const statusFilterIndex = common_vendor.ref(0);
    const statusText = (value) => {
      if (value === "published")
        return "已发布";
      if (value === "rejected")
        return "已驳回";
      return "待审核";
    };
    const statusClass = (value) => {
      if (value === "published")
        return "status-published";
      if (value === "rejected")
        return "status-rejected";
      return "status-pending";
    };
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
    const loadList = async (append = false) => {
      var _a, _b, _c, _d, _e, _f;
      if (loading.value)
        return;
      loading.value = true;
      try {
        const nextPage = append ? page.value + 1 : 1;
        const statusFilter = statusFilterValueMap[statusFilterIndex.value];
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: {
            action: "getWikiList",
            data: {
              page: nextPage,
              pageSize: pageSize.value,
              includeAll: true,
              status: statusFilter
            }
          }
        });
        if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
          const rows = ((_c = (_b = res.result) == null ? void 0 : _b.data) == null ? void 0 : _c.list) || [];
          list.value = append ? [...list.value, ...rows] : rows;
          page.value = nextPage;
          hasMore.value = !!((_e = (_d = res.result) == null ? void 0 : _d.data) == null ? void 0 : _e.hasMore);
        } else {
          common_vendor.index.showToast({ title: ((_f = res == null ? void 0 : res.result) == null ? void 0 : _f.message) || "加载失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/admin/wiki.vue:110", "load wiki list failed", error);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const refreshList = async () => {
      page.value = 1;
      hasMore.value = true;
      await loadList(false);
    };
    const loadMore = async () => {
      if (!hasMore.value)
        return;
      await loadList(true);
    };
    const onFilterChange = async (e) => {
      statusFilterIndex.value = Number(e.detail.value || 0);
      await refreshList();
    };
    const goToEdit = (entryId) => {
      if (!entryId)
        return;
      common_vendor.index.navigateTo({ url: `/pages/admin/wiki-edit?entryId=${entryId}` });
    };
    const removeItem = (item) => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确认删除词条「${item.title || ""}」吗？`,
        success: async (result) => {
          var _a, _b;
          if (!result.confirm)
            return;
          const res = await common_vendor.wx$1.cloud.callFunction({
            name: "game-service",
            data: { action: "adminDeleteWiki", data: { entryId: item.id } }
          });
          if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            await refreshList();
          } else {
            common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "删除失败", icon: "none" });
          }
        }
      });
    };
    common_vendor.onShow(async () => {
      await checkAdmin();
      if (!isAdmin.value)
        return;
      await refreshList();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : common_vendor.e({
        b: common_vendor.t(statusFilterOptions[statusFilterIndex.value]),
        c: statusFilterOptions,
        d: statusFilterIndex.value,
        e: common_vendor.o(onFilterChange, "8c"),
        f: common_vendor.o(refreshList, "e9"),
        g: list.value.length === 0
      }, list.value.length === 0 ? {
        h: common_vendor.t(loading.value ? "加载中..." : "暂无词条")
      } : {}, {
        i: common_vendor.f(list.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(statusText(item.status)),
            b: common_vendor.n(statusClass(item.status)),
            c: common_vendor.t(item.title),
            d: common_vendor.t(item.summary || "无摘要"),
            e: common_vendor.t(item.creatorNickname || "未命名用户"),
            f: common_vendor.o(($event) => goToEdit(item.id), item.id),
            g: common_vendor.o(($event) => removeItem(item), item.id),
            h: item.id
          };
        }),
        j: hasMore.value
      }, hasMore.value ? {
        k: common_vendor.t(loading.value ? "加载中..." : "加载更多"),
        l: common_vendor.o(loadMore, "c5")
      } : {}));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9538286d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/wiki.js.map
