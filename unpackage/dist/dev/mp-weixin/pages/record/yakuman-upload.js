"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "yakuman-upload",
  setup(__props) {
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
    const previewUrl = common_vendor.ref("");
    const imageFileId = common_vendor.ref("");
    const imageSize = common_vendor.ref(0);
    const searchResults = common_vendor.ref([]);
    let timer = null;
    const today = (() => {
      const d = /* @__PURE__ */ new Date();
      const pad = (n) => `${n}`.padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    })();
    const form = common_vendor.ref({
      achievedDate: today,
      playerKeyword: "",
      playerNickname: ""
    });
    const onDateChange = (e) => {
      form.value.achievedDate = e.detail.value;
    };
    const onYakumanChange = (e) => {
      yakumanIndex.value = Number(e.detail.value || 0);
    };
    const onSearchNickname = () => {
      const keyword = String(form.value.playerKeyword || "").trim();
      form.value.playerNickname = "";
      clearTimeout(timer);
      timer = setTimeout(async () => {
        var _a;
        if (keyword.length < 2) {
          searchResults.value = [];
          return;
        }
        const res = await common_vendor.wx$1.cloud.callFunction({
          name: "user-service",
          data: { action: "searchUsers", data: { keyword } }
        });
        if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
          searchResults.value = (res.result.data.list || []).slice(0, 5);
        }
      }, 220);
    };
    const pickNickname = (u) => {
      form.value.playerNickname = u.nickname;
      form.value.playerKeyword = u.nickname;
      searchResults.value = [];
    };
    const chooseImage = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        success: async (res) => {
          const filePath = res.tempFilePaths[0];
          const file = res.tempFiles && res.tempFiles[0] || {};
          const size = Number(file.size || 0);
          if (size > 2 * 1024 * 1024) {
            common_vendor.index.showToast({ title: "图片大小不能超过2MB", icon: "none" });
            return;
          }
          common_vendor.index.showLoading({ title: "上传中...", mask: true });
          try {
            const ext = filePath.split(".").pop() || "jpg";
            const cloudPath = `yakuman/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
            const uploadRes = await common_vendor.wx$1.cloud.uploadFile({ cloudPath, filePath });
            imageFileId.value = uploadRes.fileID;
            previewUrl.value = uploadRes.fileID;
            imageSize.value = size;
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
      const nickname = String(form.value.playerNickname || form.value.playerKeyword || "").trim();
      if (!form.value.achievedDate || !nickname || !imageFileId.value) {
        common_vendor.index.showToast({ title: "请完整填写信息", icon: "none" });
        return;
      }
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "game-service",
        data: {
          action: "createYakumanRecord",
          data: {
            achievedAt: `${form.value.achievedDate}T12:00:00`,
            playerNickname: nickname,
            yakumanType: yakumanTypes.value[yakumanIndex.value],
            imageFileId: imageFileId.value,
            imageSize: imageSize.value
          }
        }
      });
      if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
        common_vendor.index.showToast({ title: "上传成功", icon: "success" });
        setTimeout(() => common_vendor.index.navigateBack(), 500);
      } else {
        common_vendor.index.showToast({ title: ((_b = res.result) == null ? void 0 : _b.message) || "上传失败", icon: "none" });
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(form.value.achievedDate || "请选择日期"),
        b: form.value.achievedDate,
        c: common_vendor.o(onDateChange, "43"),
        d: common_vendor.o([($event) => form.value.playerKeyword = $event.detail.value, onSearchNickname], "e3"),
        e: form.value.playerKeyword,
        f: searchResults.value.length
      }, searchResults.value.length ? {
        g: common_vendor.f(searchResults.value, (u, k0, i0) => {
          return {
            a: common_vendor.t(u.nickname),
            b: u.id,
            c: common_vendor.o(($event) => pickNickname(u), u.id)
          };
        })
      } : {}, {
        h: common_vendor.t(yakumanTypes.value[yakumanIndex.value] || "请选择役满"),
        i: yakumanTypes.value,
        j: yakumanIndex.value,
        k: common_vendor.o(onYakumanChange, "ed"),
        l: previewUrl.value
      }, previewUrl.value ? {
        m: previewUrl.value
      } : {}, {
        n: common_vendor.o(chooseImage, "93"),
        o: common_vendor.o(submit, "2d")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a420e471"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/record/yakuman-upload.js.map
