"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_user = require("../../utils/user.js");
const _sfc_main = {
  __name: "tags",
  setup(__props) {
    const systemTags = common_vendor.ref([
      { id: 1, name: "玩咖萌新" },
      { id: 2, name: "功利玩家" },
      { id: 4, name: "狙击七段" },
      { id: 5, name: "周末有空" },
      { id: 6, name: "工作日晚" },
      { id: 7, name: "阿瓦隆" },
      { id: 8, name: "美式桌游玩家" },
      { id: 9, name: "德策桌游玩家" },
      { id: 10, name: "毛线桌游玩家" },
      { id: 11, name: "血染钟楼" },
      { id: 12, name: "Switch玩家" },
      { id: 13, name: "PS5玩家" },
      { id: 14, name: "轻策玩家" },
      { id: 15, name: "中策玩家" },
      { id: 16, name: "重策玩家" }
    ]);
    const selectedTagIds = common_vendor.ref([]);
    const customTags = common_vendor.ref([]);
    const isTagSelected = (tagId) => selectedTagIds.value.includes(tagId);
    const toggleTag = (tagId) => {
      const index = selectedTagIds.value.indexOf(tagId);
      if (index > -1) {
        selectedTagIds.value.splice(index, 1);
        return;
      }
      if (selectedTagIds.value.length >= 8) {
        common_vendor.index.showToast({ title: "最多选择8个标签", icon: "none" });
        return;
      }
      selectedTagIds.value.push(tagId);
    };
    const addCustomTag = () => {
      if (customTags.value.length >= 3) {
        common_vendor.index.showToast({ title: "最多添加3个自定义标签", icon: "none" });
        return;
      }
      customTags.value.push("");
    };
    const removeCustomTag = (index) => {
      customTags.value.splice(index, 1);
    };
    const saveTags = async () => {
      const selectedSystemTags = systemTags.value.filter((tag) => selectedTagIds.value.includes(tag.id));
      const selectedCustomTags = customTags.value.filter((name) => String(name || "").trim()).map((name, index) => ({
        id: 1e4 + index,
        name: String(name).trim()
      }));
      const allTagsToSave = [...selectedSystemTags, ...selectedCustomTags];
      if (allTagsToSave.length > 8) {
        common_vendor.index.showToast({ title: "最多选择8个标签", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "保存中...", mask: true });
      try {
        await utils_user.UserService.updateUserTags(allTagsToSave);
        common_vendor.index.showToast({ title: "保存成功", icon: "success" });
        setTimeout(() => common_vendor.index.navigateBack(), 600);
      } catch (error) {
        common_vendor.index.showToast({ title: (error == null ? void 0 : error.message) || "保存失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const goBack = () => common_vendor.index.navigateBack();
    common_vendor.onMounted(() => {
      const userInfo = utils_user.UserService.getCurrentUser();
      const tags = (userInfo == null ? void 0 : userInfo.tags) || [];
      const systemTagIds = [];
      const customList = [];
      tags.forEach((tag) => {
        if (systemTags.value.some((item) => item.id === Number(tag.id))) {
          systemTagIds.push(Number(tag.id));
        } else if (tag == null ? void 0 : tag.name) {
          customList.push(String(tag.name));
        }
      });
      selectedTagIds.value = systemTagIds;
      customTags.value = customList.slice(0, 3);
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(goBack, "b2"),
        b: common_vendor.o(saveTags, "b6"),
        c: common_vendor.f(systemTags.value, (tag, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(tag.name),
            b: isTagSelected(tag.id)
          }, isTagSelected(tag.id) ? {} : {}, {
            c: tag.id,
            d: isTagSelected(tag.id) ? 1 : "",
            e: common_vendor.o(($event) => toggleTag(tag.id), tag.id)
          });
        }),
        d: common_vendor.f(customTags.value, (tag, index, i0) => {
          return {
            a: customTags.value[index],
            b: common_vendor.o(($event) => customTags.value[index] = $event.detail.value, index),
            c: common_vendor.o(($event) => removeCustomTag(index), index),
            d: index
          };
        }),
        e: common_vendor.o(addCustomTag, "cc")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-febbdecc"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/tags.js.map
