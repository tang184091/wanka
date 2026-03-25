"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "user-manage",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const keyword = common_vendor.ref("");
    const resultList = common_vendor.ref([]);
    const allUsers = common_vendor.ref([]);
    const allUsersPage = common_vendor.ref(1);
    const allUsersPageSize = common_vendor.ref(10);
    const hasMoreAllUsers = common_vendor.ref(true);
    const loadingAllUsers = common_vendor.ref(false);
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
    const loadAllUsers = async (append = false) => {
      var _a, _b, _c, _d, _e, _f;
      if (!isAdmin.value || loadingAllUsers.value)
        return;
      loadingAllUsers.value = true;
      try {
        const page = append ? allUsersPage.value + 1 : 1;
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "user-service",
          data: {
            action: "adminListUsers",
            data: { page, pageSize: allUsersPageSize.value }
          }
        });
        if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
          const list = ((_c = (_b = res.result) == null ? void 0 : _b.data) == null ? void 0 : _c.list) || [];
          allUsers.value = append ? [...allUsers.value, ...list] : list;
          allUsersPage.value = page;
          hasMoreAllUsers.value = !!((_e = (_d = res.result) == null ? void 0 : _d.data) == null ? void 0 : _e.hasMore);
        } else {
          common_vendor.index.showToast({ title: ((_f = res == null ? void 0 : res.result) == null ? void 0 : _f.message) || "加载用户失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/admin/user-manage.vue:119", "load all users failed", error);
        common_vendor.index.showToast({ title: "加载用户失败", icon: "none" });
      } finally {
        loadingAllUsers.value = false;
      }
    };
    const refreshAllUsers = async () => {
      allUsersPage.value = 1;
      hasMoreAllUsers.value = true;
      await loadAllUsers(false);
    };
    const loadMoreAllUsers = async () => {
      if (!hasMoreAllUsers.value)
        return;
      await loadAllUsers(true);
    };
    const searchUsers = async () => {
      var _a, _b;
      const key = keyword.value.trim();
      if (!key) {
        common_vendor.index.showToast({ title: "请输入关键词", icon: "none" });
        return;
      }
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: { action: "searchUsers", data: { keyword: key } }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
        resultList.value = res.result.data.list || [];
      } else {
        common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "搜索失败", icon: "none" });
      }
    };
    const goToEdit = (userId) => {
      if (!userId)
        return;
      common_vendor.index.navigateTo({ url: `/pages/admin/user-edit?userId=${userId}` });
    };
    common_vendor.onShow(async () => {
      await checkAdmin();
      if (isAdmin.value) {
        await refreshAllUsers();
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : common_vendor.e({
        b: common_vendor.o(searchUsers, "c8"),
        c: keyword.value,
        d: common_vendor.o(($event) => keyword.value = $event.detail.value, "e8"),
        e: common_vendor.o(searchUsers, "3e"),
        f: resultList.value.length === 0
      }, resultList.value.length === 0 ? {} : {}, {
        g: common_vendor.f(resultList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.nickname || "未命名用户"),
            b: common_vendor.t(item.id),
            c: item.isAdmin
          }, item.isAdmin ? {} : {}, {
            d: item.isBlacklisted
          }, item.isBlacklisted ? {} : {}, {
            e: `search-${item.id}`,
            f: common_vendor.o(($event) => goToEdit(item.id), `search-${item.id}`)
          });
        }),
        h: common_vendor.o(refreshAllUsers, "79"),
        i: allUsers.value.length === 0
      }, allUsers.value.length === 0 ? {
        j: common_vendor.t(loadingAllUsers.value ? "加载中..." : "暂无用户")
      } : {}, {
        k: common_vendor.f(allUsers.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.nickname || "未命名用户"),
            b: common_vendor.t(item.id),
            c: item.isAdmin
          }, item.isAdmin ? {} : {}, {
            d: item.isBlacklisted
          }, item.isBlacklisted ? {} : {}, {
            e: `all-${item.id}`,
            f: common_vendor.o(($event) => goToEdit(item.id), `all-${item.id}`)
          });
        }),
        l: hasMoreAllUsers.value
      }, hasMoreAllUsers.value ? {
        m: common_vendor.t(loadingAllUsers.value ? "加载中..." : "加载更多"),
        n: common_vendor.o(loadMoreAllUsers, "b5")
      } : {}));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-667c86e9"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/user-manage.js.map
