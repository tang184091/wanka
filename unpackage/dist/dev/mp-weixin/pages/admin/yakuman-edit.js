"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "yakuman-edit",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const loading = common_vendor.ref(false);
    const yakumanTypes = common_vendor.ref([
      "国士无双",
      "四暗刻",
      "大三元",
      "字一色",
      "绿一色",
      "清老头",
      "小四喜",
      "大四喜",
      "四杠子",
      "九莲宝灯",
      "天和",
      "地和",
      "累计役满"
    ]);
    const yakumanIndex = common_vendor.ref(0);
    const displayImage = common_vendor.ref("");
    const imageFileId = common_vendor.ref("");
    const imageSize = common_vendor.ref(0);
    const form = common_vendor.ref({
      recordId: "",
      achievedDate: "",
      playerNickname: ""
    });
    const isCloudFileId = (value) => typeof value === "string" && value.startsWith("cloud://");
    const isHttpUrl = (value) => typeof value === "string" && /^https?:\/\//.test(value);
    const formatDate = (value) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime()))
        return "";
      const pad = (n) => `${n}`.padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const ensureDisplayImage = async (rawUrl) => {
      const value = String(rawUrl || "").trim();
      if (!value) {
        displayImage.value = "";
        return;
      }
      if (isHttpUrl(value) || value.startsWith("/")) {
        displayImage.value = value;
        return;
      }
      if (!isCloudFileId(value)) {
        displayImage.value = "";
        return;
      }
      try {
        const tempRes = await common_vendor.wx$1.cloud.getTempFileURL({ fileList: [value] });
        const first = ((tempRes == null ? void 0 : tempRes.fileList) || [])[0];
        displayImage.value = (first == null ? void 0 : first.status) === 0 ? first.tempFileURL : "";
      } catch (error) {
        common_vendor.index.__f__("warn", "at pages/admin/yakuman-edit.vue:99", "ensureDisplayImage failed:", error);
        displayImage.value = "";
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
    const loadDetail = async (recordId) => {
      var _a, _b;
      loading.value = true;
      try {
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "game-service",
          data: { action: "adminGetYakumanRecord", data: { recordId } }
        });
        if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) !== 0) {
          common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "加载失败", icon: "none" });
          return;
        }
        const doc = res.result.data || {};
        form.value.recordId = doc.id || recordId;
        form.value.playerNickname = doc.playerNickname || "";
        form.value.achievedDate = formatDate(doc.achievedAt);
        yakumanIndex.value = Math.max(0, yakumanTypes.value.indexOf(doc.yakumanType));
        imageFileId.value = String(doc.imageFileId || "").trim();
        await ensureDisplayImage(imageFileId.value);
      } finally {
        loading.value = false;
      }
    };
    const onDateChange = (e) => {
      form.value.achievedDate = e.detail.value;
    };
    const onYakumanChange = (e) => {
      yakumanIndex.value = Number(e.detail.value || 0);
    };
    const uploadSingleImage = async (filePath) => {
      const ext = (filePath.split(".").pop() || "jpg").toLowerCase();
      const cloudPath = `yakuman/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const res = await common_vendor.wx$1.cloud.uploadFile({ cloudPath, filePath });
      return res.fileID;
    };
    const chooseImage = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        success: async (res) => {
          const filePath = (res.tempFilePaths || [])[0];
          const file = (res.tempFiles || [])[0] || {};
          if (!filePath)
            return;
          if (Number(file.size || 0) > 2 * 1024 * 1024) {
            common_vendor.index.showToast({ title: "图片大小不能超过2MB", icon: "none" });
            return;
          }
          common_vendor.index.showLoading({ title: "上传中...", mask: true });
          try {
            const fileID = await uploadSingleImage(filePath);
            imageFileId.value = fileID;
            imageSize.value = Number(file.size || 0);
            await ensureDisplayImage(fileID);
          } catch (error) {
            common_vendor.index.showToast({ title: "上传失败", icon: "none" });
          } finally {
            common_vendor.index.hideLoading();
          }
        }
      });
    };
    const submit = async () => {
      var _a, _b;
      if (!form.value.recordId)
        return;
      if (!form.value.playerNickname.trim()) {
        common_vendor.index.showToast({ title: "请输入玩家昵称", icon: "none" });
        return;
      }
      if (!form.value.achievedDate) {
        common_vendor.index.showToast({ title: "请选择达成日期", icon: "none" });
        return;
      }
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: {
          action: "adminUpdateYakumanRecord",
          data: {
            recordId: form.value.recordId,
            playerNickname: form.value.playerNickname.trim(),
            yakumanType: yakumanTypes.value[yakumanIndex.value],
            achievedAt: `${form.value.achievedDate}T12:00:00`,
            imageFileId: imageFileId.value,
            imageSize: imageSize.value
          }
        }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
        common_vendor.index.showToast({ title: "已保存", icon: "success" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 500);
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
      const recordId = String((query == null ? void 0 : query.recordId) || "").trim();
      if (!recordId) {
        common_vendor.index.showToast({ title: "缺少记录ID", icon: "none" });
        return;
      }
      await loadDetail(recordId);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : !form.value.recordId ? {
        c: common_vendor.t(loading.value ? "加载中..." : "记录不存在")
      } : common_vendor.e({
        d: common_vendor.t(form.value.achievedDate || "请选择日期"),
        e: form.value.achievedDate,
        f: common_vendor.o(onDateChange, "da"),
        g: form.value.playerNickname,
        h: common_vendor.o(($event) => form.value.playerNickname = $event.detail.value, "b0"),
        i: common_vendor.t(yakumanTypes.value[yakumanIndex.value] || "请选择番种"),
        j: yakumanTypes.value,
        k: yakumanIndex.value,
        l: common_vendor.o(onYakumanChange, "ed"),
        m: displayImage.value
      }, displayImage.value ? {
        n: displayImage.value
      } : {}, {
        o: common_vendor.o(chooseImage, "da"),
        p: common_vendor.o(submit, "76"),
        q: common_vendor.o(goBack, "ac")
      }), {
        b: !form.value.recordId
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-84ab294c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/yakuman-edit.js.map
