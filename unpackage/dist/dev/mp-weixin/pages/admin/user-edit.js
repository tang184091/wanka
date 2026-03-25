"use strict";
const common_vendor = require("../../common/vendor.js");
const defaultAvatar = "cloud://cloud1-6glnv3cs9b44417a.636c-cloud1-6glnv3cs9b44417a-1407540580/default-avatar.png";
const localFallbackAvatar = "/static/empty.png";
const _sfc_main = {
  __name: "user-edit",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const selectedUser = common_vendor.ref(null);
    const editNickname = common_vendor.ref("");
    const editAvatar = common_vendor.ref("");
    const editAvatarSize = common_vendor.ref(0);
    const allTags = common_vendor.ref([]);
    const customTags = common_vendor.ref([]);
    const displayAvatar = common_vendor.ref(localFallbackAvatar);
    const systemTagIds = /* @__PURE__ */ new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const isCloudFileId = (value) => typeof value === "string" && value.startsWith("cloud://");
    const isHttpUrl = (value) => typeof value === "string" && /^https?:\/\//.test(value);
    const resolveCloudImageUrl = async (rawUrl) => {
      const url = String(rawUrl || "").trim();
      if (!url)
        return localFallbackAvatar;
      if (isHttpUrl(url) || url.startsWith("/"))
        return url;
      if (!isCloudFileId(url))
        return localFallbackAvatar;
      try {
        const res = await common_vendor.wx$1.cloud.getTempFileURL({ fileList: [url] });
        const first = ((res == null ? void 0 : res.fileList) || [])[0];
        if ((first == null ? void 0 : first.status) === 0 && (first == null ? void 0 : first.tempFileURL))
          return first.tempFileURL;
        return localFallbackAvatar;
      } catch (error) {
        common_vendor.index.__f__("warn", "at pages/admin/user-edit.vue:74", "resolveCloudImageUrl failed:", error);
        return localFallbackAvatar;
      }
    };
    const refreshDisplayAvatar = async () => {
      var _a;
      const source = editAvatar.value || ((_a = selectedUser.value) == null ? void 0 : _a.avatar) || defaultAvatar;
      displayAvatar.value = await resolveCloudImageUrl(source);
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
    const loadUser = async (userId) => {
      var _a, _b;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: { action: "getUserInfo", data: { userId } }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) !== 0) {
        common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "加载用户失败", icon: "none" });
        return;
      }
      const detail = res.result.data || {};
      selectedUser.value = {
        id: detail.id || userId,
        nickname: detail.nickname || "",
        avatar: detail.avatar || "",
        isAdmin: !!detail.isAdmin,
        isBlacklisted: !!detail.isBlacklisted
      };
      editNickname.value = detail.nickname || "";
      editAvatar.value = detail.avatar || "";
      allTags.value = detail.tags || [];
      customTags.value = allTags.value.filter((tag) => !systemTagIds.has(Number(tag.id))).map((tag, idx) => ({
        id: tag.id || 1e4 + idx,
        name: String(tag.name || "").trim()
      }));
      await refreshDisplayAvatar();
    };
    const resetEdit = async () => {
      if (!selectedUser.value)
        return;
      editNickname.value = selectedUser.value.nickname || "";
      editAvatar.value = selectedUser.value.avatar || "";
      editAvatarSize.value = 0;
      customTags.value = allTags.value.filter((tag) => !systemTagIds.has(Number(tag.id))).map((tag, idx) => ({
        id: tag.id || 1e4 + idx,
        name: String(tag.name || "").trim()
      }));
      await refreshDisplayAvatar();
    };
    const addCustomTag = () => {
      if (customTags.value.length >= 8) {
        common_vendor.index.showToast({ title: "最多8个自定义标签", icon: "none" });
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
            await refreshDisplayAvatar();
            common_vendor.index.showToast({ title: "上传成功", icon: "success" });
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/admin/user-edit.vue:174", "upload avatar failed", error);
            common_vendor.index.showToast({ title: "上传失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    };
    const toggleBlacklist = async () => {
      var _a, _b, _c;
      if (!((_a = selectedUser.value) == null ? void 0 : _a.id))
        return;
      const nextStatus = !selectedUser.value.isBlacklisted;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "adminSetUserBlacklist",
          data: { userId: selectedUser.value.id, isBlacklisted: nextStatus }
        }
      });
      if (((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.code) !== 0) {
        common_vendor.index.showToast({ title: ((_c = res == null ? void 0 : res.result) == null ? void 0 : _c.message) || "操作失败", icon: "none" });
        return;
      }
      selectedUser.value.isBlacklisted = nextStatus;
      common_vendor.index.showToast({ title: nextStatus ? "已加入黑名单" : "已移出黑名单", icon: "success" });
    };
    const toggleAdmin = async () => {
      var _a, _b, _c;
      if (!((_a = selectedUser.value) == null ? void 0 : _a.id))
        return;
      const nextStatus = !selectedUser.value.isAdmin;
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: {
          action: "adminSetUserAdmin",
          data: { userId: selectedUser.value.id, isAdmin: nextStatus }
        }
      });
      if (((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.code) !== 0) {
        common_vendor.index.showToast({ title: ((_c = res == null ? void 0 : res.result) == null ? void 0 : _c.message) || "操作失败", icon: "none" });
        return;
      }
      selectedUser.value.isAdmin = nextStatus;
      common_vendor.index.showToast({ title: nextStatus ? "已加冕管理员" : "已取消管理员", icon: "success" });
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
      if (Object.keys(payload).length === 1)
        payload._noProfileChange = true;
      const normalizedCustomTags = customTags.value.map((tag, idx) => ({
        id: tag.id || 1e4 + idx,
        name: String(tag.name || "").trim().slice(0, 12)
      })).filter((tag) => !!tag.name);
      const systemTags = allTags.value.filter((tag) => systemTagIds.has(Number(tag.id)));
      const mergedTags = [...systemTags, ...normalizedCustomTags];
      const hasTagChange = JSON.stringify(mergedTags) !== JSON.stringify(allTags.value || []);
      const hasProfileChange = !payload._noProfileChange;
      if (!hasTagChange && !hasProfileChange) {
        common_vendor.index.showToast({ title: "没有可保存的改动", icon: "none" });
        return;
      }
      try {
        if (hasProfileChange) {
          const resProfile = await common_vendor.wx$1.cloud.callFunction({
            name: "user-service",
            data: { action: "adminUpdateUserProfile", data: payload }
          });
          if (((_b = resProfile == null ? void 0 : resProfile.result) == null ? void 0 : _b.code) !== 0) {
            common_vendor.index.showToast({ title: ((_c = resProfile == null ? void 0 : resProfile.result) == null ? void 0 : _c.message) || "用户信息保存失败", icon: "none" });
            return;
          }
          const updated = resProfile.result.data;
          selectedUser.value = {
            ...selectedUser.value,
            id: updated.id,
            nickname: updated.nickname,
            avatar: updated.avatar,
            isAdmin: !!updated.isAdmin,
            isBlacklisted: !!updated.isBlacklisted
          };
          editNickname.value = updated.nickname || "";
          editAvatar.value = updated.avatar || "";
          await refreshDisplayAvatar();
        }
        if (hasTagChange) {
          const resTags = await common_vendor.wx$1.cloud.callFunction({
            name: "user-service",
            data: { action: "adminUpdateUserTags", data: { userId: selectedUser.value.id, tags: mergedTags } }
          });
          if (((_d = resTags == null ? void 0 : resTags.result) == null ? void 0 : _d.code) !== 0) {
            common_vendor.index.showToast({ title: ((_e = resTags == null ? void 0 : resTags.result) == null ? void 0 : _e.message) || "标签保存失败", icon: "none" });
            return;
          }
          allTags.value = mergedTags;
          customTags.value = normalizedCustomTags;
        }
        common_vendor.index.showToast({ title: "保存成功", icon: "success" });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/admin/user-edit.vue:285", "admin update user failed", error);
        common_vendor.index.showToast({ title: "保存失败", icon: "none" });
      }
    };
    common_vendor.onLoad(async (query) => {
      await checkAdmin();
      if (!isAdmin.value)
        return;
      const userId = String((query == null ? void 0 : query.userId) || "").trim();
      if (!userId) {
        common_vendor.index.showToast({ title: "缺少用户ID", icon: "none" });
        return;
      }
      await loadUser(userId);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : !selectedUser.value ? {} : {
        c: common_vendor.t(selectedUser.value.isAdmin ? "是" : "否"),
        d: selectedUser.value.isAdmin ? 1 : "",
        e: common_vendor.t(selectedUser.value.isBlacklisted ? "是" : "否"),
        f: selectedUser.value.isBlacklisted ? 1 : "",
        g: displayAvatar.value,
        h: common_vendor.o(chooseAvatar, "c4"),
        i: editNickname.value,
        j: common_vendor.o(($event) => editNickname.value = $event.detail.value, "4b"),
        k: common_vendor.f(customTags.value, (tag, index, i0) => {
          return {
            a: customTags.value[index].name,
            b: common_vendor.o(($event) => customTags.value[index].name = $event.detail.value, `${tag.id}-${index}`),
            c: common_vendor.o(($event) => removeCustomTag(index), `${tag.id}-${index}`),
            d: `${tag.id}-${index}`
          };
        }),
        l: common_vendor.o(addCustomTag, "2a"),
        m: common_vendor.t(selectedUser.value.isBlacklisted ? "移出黑名单" : "加入黑名单"),
        n: common_vendor.o(toggleBlacklist, "cd"),
        o: common_vendor.t(selectedUser.value.isAdmin ? "取消管理员" : "加冕管理员"),
        p: common_vendor.o(toggleAdmin, "7a"),
        q: common_vendor.o(submit, "84"),
        r: common_vendor.o(resetEdit, "fa")
      }, {
        b: !selectedUser.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e715d9e0"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/user-edit.js.map
