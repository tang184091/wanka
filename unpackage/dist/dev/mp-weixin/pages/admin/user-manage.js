"use strict";
const common_vendor = require("../../common/vendor.js");
const defaultAvatar = "cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png";
const _sfc_main = {
  __name: "user-manage",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const keyword = common_vendor.ref("");
    const resultList = common_vendor.ref([]);
    const selectedUser = common_vendor.ref(null);
    const editNickname = common_vendor.ref("");
    const editAvatar = common_vendor.ref("");
    const editAvatarSize = common_vendor.ref(0);
    const allTags = common_vendor.ref([]);
    const customTags = common_vendor.ref([]);
    const systemTagIds = /* @__PURE__ */ new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
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
    const pickUser = async (item) => {
      var _a, _b;
      selectedUser.value = item;
      editAvatarSize.value = 0;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: { action: "getUserInfo", data: { userId: item.id } }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) !== 0) {
        common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "加载用户失败", icon: "none" });
        return;
      }
      const detail = res.result.data || {};
      selectedUser.value = {
        id: detail.id || item.id,
        nickname: detail.nickname || item.nickname || "",
        avatar: detail.avatar || item.avatar || ""
      };
      editNickname.value = detail.nickname || "";
      editAvatar.value = detail.avatar || "";
      allTags.value = detail.tags || [];
      customTags.value = allTags.value.filter((tag) => !systemTagIds.has(Number(tag.id))).map((tag, idx) => ({
        id: tag.id || 1e4 + idx,
        name: String(tag.name || "").trim()
      }));
    };
    const resetEdit = () => {
      if (!selectedUser.value)
        return;
      editNickname.value = selectedUser.value.nickname || "";
      editAvatar.value = selectedUser.value.avatar || "";
      editAvatarSize.value = 0;
      customTags.value = allTags.value.filter((tag) => !systemTagIds.has(Number(tag.id))).map((tag, idx) => ({
        id: tag.id || 1e4 + idx,
        name: String(tag.name || "").trim()
      }));
    };
    const addCustomTag = () => {
      if (customTags.value.length >= 8) {
        common_vendor.index.showToast({ title: "最多 8 个自定义标签", icon: "none" });
        return;
      }
      customTags.value.push({ id: 1e4 + Date.now() + customTags.value.length, name: "" });
    };
    const removeCustomTag = (index) => {
      customTags.value.splice(index, 1);
    };
    const uploadAvatar = async (path) => {
      const ext = (path.split(".").pop() || "jpg").toLowerCase();
      const cloudPath = `admin-avatar/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const res = await common_vendor.wx$1.cloud.uploadFile({ cloudPath, filePath: path });
      return res.fileID;
    };
    const chooseAvatar = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        success: async (res) => {
          const filePath = (res.tempFilePaths || [])[0];
          const fileInfo = (res.tempFiles || [])[0];
          if (!filePath)
            return;
          try {
            common_vendor.index.showLoading({ title: "上传中...", mask: true });
            const fileID = await uploadAvatar(filePath);
            editAvatar.value = fileID;
            editAvatarSize.value = Number((fileInfo == null ? void 0 : fileInfo.size) || 0);
            common_vendor.index.showToast({ title: "头像上传成功", icon: "success" });
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/admin/user-manage.vue:177", "upload avatar failed", error);
            common_vendor.index.showToast({ title: "头像上传失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    };
    const submit = async () => {
      var _a, _b, _c, _d, _e;
      if (!((_a = selectedUser.value) == null ? void 0 : _a.id))
        return;
      const payload = { userId: selectedUser.value.id };
      const nickname = editNickname.value.trim();
      if (nickname && nickname !== (selectedUser.value.nickname || ""))
        payload.nickname = nickname;
      if (editAvatar.value && editAvatar.value !== (selectedUser.value.avatar || "")) {
        payload.avatarUrl = editAvatar.value;
        payload.avatarSize = editAvatarSize.value;
      }
      if (Object.keys(payload).length === 1) {
        payload._noProfileChange = true;
      }
      const normalizedCustomTags = customTags.value.map((tag, idx) => ({
        id: tag.id || 1e4 + idx,
        name: String(tag.name || "").trim().slice(0, 12)
      })).filter((tag) => !!tag.name);
      const systemTags = allTags.value.filter((tag) => systemTagIds.has(Number(tag.id)));
      const mergedTags = [...systemTags, ...normalizedCustomTags];
      const hasTagChange = JSON.stringify(mergedTags) !== JSON.stringify(allTags.value || []);
      const hasProfileChange = !payload._noProfileChange;
      if (!hasTagChange && !hasProfileChange) {
        common_vendor.index.showToast({ title: "没有改动", icon: "none" });
        return;
      }
      try {
        if (hasProfileChange) {
          const resProfile = await common_vendor.wx$1.cloud.callFunction({
            name: "user-service",
            data: { action: "adminUpdateUserProfile", data: payload }
          });
          if (((_b = resProfile == null ? void 0 : resProfile.result) == null ? void 0 : _b.code) !== 0) {
            common_vendor.index.showToast({ title: ((_c = resProfile == null ? void 0 : resProfile.result) == null ? void 0 : _c.message) || "资料修改失败", icon: "none" });
            return;
          }
          const updated = resProfile.result.data;
          selectedUser.value = {
            id: updated.id,
            nickname: updated.nickname,
            avatar: updated.avatar
          };
          editNickname.value = updated.nickname || "";
          editAvatar.value = updated.avatar || "";
          resultList.value = resultList.value.map((item) => item.id === updated.id ? { ...item, nickname: updated.nickname, avatar: updated.avatar } : item);
        }
        if (hasTagChange) {
          const resTags = await common_vendor.wx$1.cloud.callFunction({
            name: "user-service",
            data: {
              action: "adminUpdateUserTags",
              data: { userId: selectedUser.value.id, tags: mergedTags }
            }
          });
          if (((_d = resTags == null ? void 0 : resTags.result) == null ? void 0 : _d.code) !== 0) {
            common_vendor.index.showToast({ title: ((_e = resTags == null ? void 0 : resTags.result) == null ? void 0 : _e.message) || "标签修改失败", icon: "none" });
            return;
          }
          allTags.value = mergedTags;
          customTags.value = normalizedCustomTags;
        }
        common_vendor.index.showToast({ title: "修改成功", icon: "success" });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/admin/user-manage.vue:260", "admin update user failed", error);
        common_vendor.index.showToast({ title: "修改失败", icon: "none" });
      }
    };
    common_vendor.onShow(async () => {
      await checkAdmin();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : common_vendor.e({
        b: common_vendor.o(searchUsers, "f4"),
        c: keyword.value,
        d: common_vendor.o(($event) => keyword.value = $event.detail.value, "c0"),
        e: common_vendor.o(searchUsers, "84"),
        f: resultList.value.length === 0
      }, resultList.value.length === 0 ? {} : {}, {
        g: common_vendor.f(resultList.value, (item, k0, i0) => {
          return {
            a: item.avatar || defaultAvatar,
            b: common_vendor.t(item.nickname || "未命名用户"),
            c: common_vendor.t(item.id),
            d: common_vendor.t(selectedUser.value && selectedUser.value.id === item.id ? "已选中" : "选择"),
            e: item.id,
            f: common_vendor.o(($event) => pickUser(item), item.id)
          };
        }),
        h: selectedUser.value
      }, selectedUser.value ? {
        i: editAvatar.value || selectedUser.value.avatar || defaultAvatar,
        j: common_vendor.o(chooseAvatar, "01"),
        k: editNickname.value,
        l: common_vendor.o(($event) => editNickname.value = $event.detail.value, "05"),
        m: common_vendor.f(customTags.value, (tag, index, i0) => {
          return {
            a: customTags.value[index].name,
            b: common_vendor.o(($event) => customTags.value[index].name = $event.detail.value, `${tag.id}-${index}`),
            c: common_vendor.o(($event) => removeCustomTag(index), `${tag.id}-${index}`),
            d: `${tag.id}-${index}`
          };
        }),
        n: common_vendor.o(addCustomTag, "be"),
        o: common_vendor.o(submit, "cf"),
        p: common_vendor.o(resetEdit, "a0")
      } : {}));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-667c86e9"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/user-manage.js.map
