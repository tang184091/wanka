"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "honor",
  setup(__props) {
    const isAdmin = common_vendor.ref(false);
    const list = common_vendor.ref([]);
    const editingId = common_vendor.ref("");
    const ownerKeyword = common_vendor.ref("");
    const ownerResults = common_vendor.ref([]);
    const selectedOwner = common_vendor.ref({ id: "", nickname: "" });
    const typeOptions = ["比赛荣誉", "段位荣誉"];
    const typeIndex = common_vendor.ref(0);
    const rarityOptions = [
      { label: "金色（传说）", value: "legend" },
      { label: "紫色（史诗）", value: "epic" },
      { label: "蓝色（稀有）", value: "rare" },
      { label: "白色黑框（普通）", value: "common" }
    ];
    const rarityLabels = rarityOptions.map((item) => item.label);
    const rarityIndex = common_vendor.ref(1);
    const dateValue = common_vendor.ref((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
    const form = common_vendor.ref({
      type: "tournament",
      rarity: "epic",
      title: "",
      championNickname: "",
      participantCount: "",
      playerNickname: "",
      rankName: "",
      note: ""
    });
    const redirectNonAdmin = () => {
      common_vendor.index.showToast({ title: "仅管理员可访问", icon: "none" });
      setTimeout(() => {
        common_vendor.index.switchTab({ url: "/pages/user/user" });
      }, 300);
    };
    const formatTime = (t) => {
      if (!t)
        return "-";
      const d = new Date(t);
      const pad = (n) => `${n}`.padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    const getBadgeClass = (item) => {
      const rarity = normalizeRarity(item.rarity);
      return `badge-${rarity}`;
    };
    const normalizeRarity = (rarity) => {
      if (rarity === "legend" || rarity === "gold")
        return "legend";
      if (rarity === "epic" || rarity === "purple")
        return "epic";
      if (rarity === "rare" || rarity === "blue" || rarity === "silver")
        return "rare";
      if (rarity === "common" || rarity === "normal")
        return "common";
      return "epic";
    };
    const resetForm = () => {
      editingId.value = "";
      typeIndex.value = 0;
      rarityIndex.value = 1;
      dateValue.value = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      form.value = {
        type: "tournament",
        rarity: "epic",
        title: "",
        championNickname: "",
        participantCount: "",
        playerNickname: "",
        rankName: "",
        note: ""
      };
      ownerKeyword.value = "";
      ownerResults.value = [];
      selectedOwner.value = { id: "", nickname: "" };
    };
    const loadData = async () => {
      var _a, _b, _c;
      const me = await common_vendor.wx$1.cloud.callFunction({ name: "user-service", data: { action: "getMe", data: {} } });
      isAdmin.value = !!((_b = (_a = me == null ? void 0 : me.result) == null ? void 0 : _a.data) == null ? void 0 : _b.isAdmin);
      if (!isAdmin.value)
        return redirectNonAdmin();
      const res = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action: "getAdminManageData", data: {} } });
      if (((_c = res.result) == null ? void 0 : _c.code) === 0) {
        list.value = (res.result.data.honorRecords || []).map((item) => ({
          ...item,
          id: item.id || item._id,
          rarity: normalizeRarity(item.rarity)
        }));
      }
    };
    const onTypeChange = (e) => {
      typeIndex.value = Number(e.detail.value);
      form.value.type = typeIndex.value === 0 ? "tournament" : "rank";
    };
    const onRarityChange = (e) => {
      rarityIndex.value = Number(e.detail.value);
      form.value.rarity = rarityOptions[rarityIndex.value].value;
    };
    const onDateChange = (e) => {
      dateValue.value = e.detail.value;
    };
    const editItem = (item) => {
      editingId.value = item.id || item._id || "";
      typeIndex.value = item.type === "rank" ? 1 : 0;
      form.value.type = typeIndex.value === 0 ? "tournament" : "rank";
      const rarityValue = normalizeRarity(item.rarity);
      rarityIndex.value = Math.max(0, rarityOptions.findIndex((it) => it.value === rarityValue));
      form.value.rarity = rarityOptions[rarityIndex.value].value;
      dateValue.value = formatTime(item.achievedAt);
      form.value.title = item.title || "";
      form.value.championNickname = item.championNickname || "";
      form.value.participantCount = item.participantCount ? String(item.participantCount) : "";
      form.value.playerNickname = item.playerNickname || "";
      form.value.rankName = item.rankName || "";
      form.value.note = item.note || "";
      selectedOwner.value = {
        id: String(item.ownerUserId || "").trim(),
        nickname: String(item.ownerNickname || "").trim()
      };
      ownerKeyword.value = selectedOwner.value.nickname || "";
      ownerResults.value = [];
    };
    const cancelEdit = () => {
      resetForm();
    };
    const submit = async () => {
      var _a, _b;
      const payload = {
        ...form.value,
        achievedAt: dateValue.value,
        rarity: rarityOptions[rarityIndex.value].value,
        ownerUserId: selectedOwner.value.id || "",
        ownerNickname: selectedOwner.value.nickname || ""
      };
      const action = editingId.value ? "updateHonorRecord" : "createHonorRecord";
      if (editingId.value)
        payload.recordId = editingId.value;
      const res = await common_vendor.wx$1.cloud.callFunction({ name: "game-service", data: { action, data: payload } });
      if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
        common_vendor.index.showToast({ title: editingId.value ? "修改成功" : "上传成功", icon: "success" });
        await loadData();
        resetForm();
      } else {
        common_vendor.index.showToast({ title: ((_b = res.result) == null ? void 0 : _b.message) || (editingId.value ? "修改失败" : "上传失败"), icon: "none" });
      }
    };
    const searchOwners = async () => {
      var _a, _b;
      const keyword = String(ownerKeyword.value || "").trim();
      if (!keyword) {
        common_vendor.index.showToast({ title: "请输入昵称关键词", icon: "none" });
        return;
      }
      const res = await common_vendor.wx$1.cloud.callFunction({
        name: "user-service",
        data: { action: "searchUsers", data: { keyword } }
      });
      if (((_a = res == null ? void 0 : res.result) == null ? void 0 : _a.code) === 0) {
        ownerResults.value = (res.result.data.list || []).slice(0, 10);
      } else {
        common_vendor.index.showToast({ title: ((_b = res == null ? void 0 : res.result) == null ? void 0 : _b.message) || "搜索失败", icon: "none" });
      }
    };
    const selectOwner = (u) => {
      selectedOwner.value = {
        id: String((u == null ? void 0 : u.id) || "").trim(),
        nickname: String((u == null ? void 0 : u.nickname) || "").trim()
      };
      ownerKeyword.value = selectedOwner.value.nickname;
      ownerResults.value = [];
    };
    const clearSelectedOwner = () => {
      selectedOwner.value = { id: "", nickname: "" };
      ownerKeyword.value = "";
      ownerResults.value = [];
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
            data: { action: "adminDeleteHonorRecord", data: { recordId: item.id || item._id } }
          });
          if (((_a = res.result) == null ? void 0 : _a.code) === 0) {
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
            if (editingId.value && editingId.value === (item.id || item._id)) {
              resetForm();
            }
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
        e: common_vendor.o(onTypeChange, "02"),
        f: common_vendor.t(common_vendor.unref(rarityLabels)[rarityIndex.value]),
        g: common_vendor.unref(rarityLabels),
        h: rarityIndex.value,
        i: common_vendor.o(onRarityChange, "a2"),
        j: form.value.type === "tournament"
      }, form.value.type === "tournament" ? {
        k: form.value.title,
        l: common_vendor.o(($event) => form.value.title = $event.detail.value, "b9"),
        m: form.value.championNickname,
        n: common_vendor.o(($event) => form.value.championNickname = $event.detail.value, "36"),
        o: form.value.participantCount,
        p: common_vendor.o(($event) => form.value.participantCount = $event.detail.value, "c3")
      } : {
        q: form.value.playerNickname,
        r: common_vendor.o(($event) => form.value.playerNickname = $event.detail.value, "de"),
        s: form.value.rankName,
        t: common_vendor.o(($event) => form.value.rankName = $event.detail.value, "1e")
      }, {
        v: common_vendor.t(dateValue.value),
        w: dateValue.value,
        x: common_vendor.o(onDateChange, "53"),
        y: ownerKeyword.value,
        z: common_vendor.o(($event) => ownerKeyword.value = $event.detail.value, "96"),
        A: common_vendor.o(searchOwners, "5d"),
        B: selectedOwner.value.id
      }, selectedOwner.value.id ? {
        C: common_vendor.t(selectedOwner.value.nickname),
        D: common_vendor.t(selectedOwner.value.id),
        E: common_vendor.o(clearSelectedOwner, "15")
      } : {}, {
        F: ownerResults.value.length
      }, ownerResults.value.length ? {
        G: common_vendor.f(ownerResults.value, (u, k0, i0) => {
          return {
            a: common_vendor.t(u.nickname || "未命名用户"),
            b: common_vendor.t(u.id),
            c: u.id,
            d: common_vendor.o(($event) => selectOwner(u), u.id)
          };
        })
      } : {}, {
        H: form.value.note,
        I: common_vendor.o(($event) => form.value.note = $event.detail.value, "f2"),
        J: common_vendor.t(editingId.value ? "保存修改" : "上传荣誉"),
        K: common_vendor.o(submit, "9d"),
        L: editingId.value
      }, editingId.value ? {
        M: common_vendor.o(cancelEdit, "11")
      } : {}, {
        N: !list.value.length
      }, !list.value.length ? {} : {}, {
        O: common_vendor.f(list.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.type === "tournament" ? "比赛" : "段位"),
            b: common_vendor.n(getBadgeClass(item)),
            c: common_vendor.t(formatTime(item.achievedAt)),
            d: common_vendor.t(item.type === "tournament" ? `比赛冠军：${item.championNickname || "-"}` : `段位：${item.playerNickname || "-"} · ${item.rankName || "-"}`),
            e: common_vendor.t(item.ownerNickname || "未绑定"),
            f: common_vendor.o(($event) => editItem(item), item.id || item._id),
            g: common_vendor.o(($event) => removeItem(item), item.id || item._id),
            h: item.id || item._id
          };
        })
      }));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-ba19e650"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/admin/honor.js.map
