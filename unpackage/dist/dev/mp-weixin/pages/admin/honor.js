"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "honor",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const list = common_vendor.ref([]);
    const redirectNonAdmin = () => {
      common_vendor.index.showToast({ title: "仅管理员可访问", icon: "none" });
      setTimeout(() => {
        common_vendor.index.switchTab({ url: "/pages/user/user" });
      }, 300);
    };
    const typeOptions = ["比赛荣誉", "段位荣誉"];
    const typeIndex = common_vendor.ref(0);
    const dateValue = common_vendor.ref((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
    const form = common_vendor.ref({
      type: "tournament",
      title: "",
      championNickname: "",
      participantCount: "",
      playerNickname: "",
      rankName: "",
      note: ""
    });
    const formatTime = (t) => {
      if (!t)
        return "-";
      const d = new Date(t);
      return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
    };
    const loadData = async () => {
      var _a, _b, _c;
      const me = await common_vendor.wx$1.cloud.callFunction({ name: "user-service", data: { action: "getMe", data: {} } });
      isAdmin.value = !!((_b = (_a = me == null ? void 0 : me.result) == null ? void 0 : _a.data) == null ? void 0 : _b.isAdmin);
      if (!isAdmin.value)
        return redirectNonAdmin();
      const res = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "getAdminManageData", data: {} } });
      if (((_c = res.result) == null ? void 0 : _c.code) === 0)
        list.value = res.result.data.honorRecords || [];
    };
    const onTypeChange = (e) => {
      typeIndex.value = Number(e.detail.value);
      form.value.type = typeIndex.value === 0 ? "tournament" : "rank";
    };
    const onDateChange = (e) => {
      dateValue.value = e.detail.value;
    };
    const submit = async () => {
      var _a, _b;
      const payload = { ...form.value, achievedAt: dateValue.value };
      const res = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "createHonorRecord", data: payload } });
      if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
        common_vendor.index.showToast({ title: "上传成功", icon: "success" });
        await loadData();
      } else {
        common_vendor.index.showToast({ title: ((_b = res.result) == null ? void 0 : _b.message) || "上传失败", icon: "none" });
      }
    };
    const removeItem = (item) => {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "删除后不可恢复，确定继续？",
        success: async (r) => {
          var _a, _b;
          if (!r.confirm)
            return;
          const res = await common_vendor.wx$1.cloud.callFunction({
            name: "game-service",
            data: { action: "adminDeleteHonorRecord", data: { recordId: item.id } }
          });
          if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            await loadData();
          } else {
            common_vendor.index.showToast({ title: ((_b = res.result) == null ? void 0 : _b.message) || "删除失败", icon: "none" });
          }
        }
      });
    };
    common_vendor.onShow(loadData);
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !isAdmin.value
      }, !isAdmin.value ? {} : common_vendor.e({
        b: common_vendor.t(typeOptions[typeIndex.value]),
        c: typeOptions,
        d: typeIndex.value,
        e: common_vendor.o(onTypeChange, "21"),
        f: form.value.type === "tournament"
      }, form.value.type === "tournament" ? {
        g: form.value.title,
        h: common_vendor.o(($event) => form.value.title = $event.detail.value, "9b"),
        i: form.value.championNickname,
        j: common_vendor.o(($event) => form.value.championNickname = $event.detail.value, "38"),
        k: form.value.participantCount,
        l: common_vendor.o(($event) => form.value.participantCount = $event.detail.value, "10")
      } : {
        m: form.value.playerNickname,
        n: common_vendor.o(($event) => form.value.playerNickname = $event.detail.value, "76"),
        o: form.value.rankName,
        p: common_vendor.o(($event) => form.value.rankName = $event.detail.value, "2f")
      }, {
        q: common_vendor.t(dateValue.value),
        r: dateValue.value,
        s: common_vendor.o(onDateChange, "06"),
        t: form.value.note,
        v: common_vendor.o(($event) => form.value.note = $event.detail.value, "d2"),
        w: common_vendor.o(submit, "eb"),
        x: !list.value.length
      }, !list.value.length ? {} : {}, {
        y: common_vendor.f(list.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.type === "tournament" ? `比赛冠军：${item.championNickname || "-"}` : `段位：${item.playerNickname || "-"} · ${item.rankName || "-"}`),
            b: common_vendor.t(formatTime(item.achievedAt)),
            c: common_vendor.o(($event) => removeItem(item), item.id),
            d: item.id
          };
        })
      }));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ba19e650"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/honor.js.map
