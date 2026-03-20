"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "wiki",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const list = common_vendor.ref([]);
    const editingId = common_vendor.ref("");
    const tagsText = common_vendor.ref("");
    const statusOptions = ["待审核", "已发布", "已驳回"];
    const statusValueMap = ["pending", "published", "rejected"];
    const statusIndex = common_vendor.ref(0);
    const statusFilterOptions = ["全部", "待审核", "已发布", "已驳回"];
    const statusFilterValueMap = ["", "pending", "published", "rejected"];
    const statusFilterIndex = common_vendor.ref(0);
    const form = common_vendor.ref({
      title: "",
      summary: "",
      content: "",
      images: [],
      creatorId: "",
      creatorNickname: "",
      status: "pending"
    });
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
    const resetForm = () => {
      editingId.value = "";
      tagsText.value = "";
      statusIndex.value = 0;
      form.value = {
        title: "",
        summary: "",
        content: "",
        images: [],
        creatorId: "",
        creatorNickname: "",
        status: "pending"
      };
    };
    const onStatusChange = (e) => {
      const idx = Number(e.detail.value || 0);
      statusIndex.value = idx;
      form.value.status = statusValueMap[idx] || "pending";
    };
    const onFilterChange = async (e) => {
      statusFilterIndex.value = Number(e.detail.value || 0);
      await loadList();
    };
    const parseTags = () => {
      return tagsText.value.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 10);
    };
    const loadList = async () => {
      var _a, _b;
      const statusFilter = statusFilterValueMap[statusFilterIndex.value];
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: {
          action: "getWikiList",
          data: {
            page: 1,
            pageSize: 100,
            includeAll: true,
            status: statusFilter
          }
        }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
        list.value = res.result.data.list || [];
      } else {
        common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "加载失败", icon: "none" });
      }
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
            common_vendor.index.__f__("error", "at pages/admin/wiki.vue:201", "upload wiki images failed", error);
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
      const payload = {
        title: form.value.title,
        summary: form.value.summary,
        content: form.value.content,
        images: form.value.images,
        tags: parseTags(),
        status: form.value.status,
        creatorId: form.value.creatorId,
        creatorNickname: form.value.creatorNickname
      };
      if (editingId.value)
        payload.entryId = editingId.value;
      const action = editingId.value ? "adminUpdateWiki" : "adminCreateWiki";
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action, data: payload }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
        common_vendor.index.showToast({ title: editingId.value ? "修改成功" : "创建成功", icon: "success" });
        resetForm();
        await loadList();
      } else {
        common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "操作失败", icon: "none" });
      }
    };
    const editItem = async (item) => {
      var _a, _b;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: { action: "getWikiDetail", data: { entryId: item.id } }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) !== 0) {
        common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "加载失败", icon: "none" });
        return;
      }
      const doc = res.result.data || {};
      editingId.value = doc.id || item.id;
      form.value.title = doc.title || "";
      form.value.summary = doc.summary || "";
      form.value.content = doc.content || "";
      form.value.images = [...doc.images || []];
      form.value.creatorId = doc.creatorId || "";
      form.value.creatorNickname = doc.creatorNickname || "";
      form.value.status = doc.status || "pending";
      statusIndex.value = Math.max(0, statusValueMap.indexOf(form.value.status));
      tagsText.value = (doc.tags || []).join(", ");
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
            if (editingId.value === item.id)
              resetForm();
            await loadList();
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
      await loadList();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : common_vendor.e({
        b: form.value.title,
        c: common_vendor.o(($event) => form.value.title = $event.detail.value, "b5"),
        d: form.value.summary,
        e: common_vendor.o(($event) => form.value.summary = $event.detail.value, "0d"),
        f: form.value.content,
        g: common_vendor.o(($event) => form.value.content = $event.detail.value, "2b"),
        h: common_vendor.t(form.value.content.length),
        i: tagsText.value,
        j: common_vendor.o(($event) => tagsText.value = $event.detail.value, "3f"),
        k: form.value.creatorNickname,
        l: common_vendor.o(($event) => form.value.creatorNickname = $event.detail.value, "bd"),
        m: form.value.creatorId,
        n: common_vendor.o(($event) => form.value.creatorId = $event.detail.value, "7b"),
        o: common_vendor.t(statusOptions[statusIndex.value]),
        p: statusOptions,
        q: statusIndex.value,
        r: common_vendor.o(onStatusChange, "89"),
        s: common_vendor.o(chooseImages, "1b"),
        t: form.value.images.length
      }, form.value.images.length ? {
        v: common_vendor.f(form.value.images, (img, index, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => removeImage(index), img + index),
            c: img + index
          };
        })
      } : {}, {
        w: common_vendor.t(editingId.value ? "保存修改" : "新增词条"),
        x: common_vendor.o(submit, "e9"),
        y: editingId.value
      }, editingId.value ? {
        z: common_vendor.o(resetForm, "17")
      } : {}, {
        A: common_vendor.t(statusFilterOptions[statusFilterIndex.value]),
        B: statusFilterOptions,
        C: statusFilterIndex.value,
        D: common_vendor.o(onFilterChange, "f0"),
        E: common_vendor.o(loadList, "c3"),
        F: !list.value.length
      }, !list.value.length ? {} : {}, {
        G: common_vendor.f(list.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(statusText(item.status)),
            b: common_vendor.n(statusClass(item.status)),
            c: common_vendor.t(item.title),
            d: common_vendor.t(item.summary || "无摘要"),
            e: common_vendor.t(item.creatorNickname || "未命名用户"),
            f: common_vendor.o(($event) => editItem(item), item.id),
            g: common_vendor.o(($event) => removeItem(item), item.id),
            h: item.id
          };
        })
      }));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-9538286d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/wiki.js.map
