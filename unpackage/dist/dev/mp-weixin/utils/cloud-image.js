"use strict";
const common_vendor = require("../common/vendor.js");
const tempUrlCache = /* @__PURE__ */ new Map();
const isCloudFileId = (value) => typeof value === "string" && value.startsWith("cloud://");
const normalizeTempResult = (item) => {
  if (!item)
    return "";
  if (typeof item === "string")
    return item;
  return item.tempFileURL || item.tempFileUrl || item.fileID || "";
};
const resolveCloudFileUrl = async (rawUrl) => {
  var _a, _b;
  if (!rawUrl || typeof rawUrl !== "string")
    return rawUrl || "";
  if (!isCloudFileId(rawUrl))
    return rawUrl;
  if (!((_b = (_a = common_vendor.wx$1) == null ? void 0 : _a.cloud) == null ? void 0 : _b.getTempFileURL))
    return rawUrl;
  if (tempUrlCache.has(rawUrl)) {
    return tempUrlCache.get(rawUrl);
  }
  try {
    const res = await common_vendor.wx$1.cloud.getTempFileURL({ fileList: [rawUrl] });
    const first = Array.isArray(res == null ? void 0 : res.fileList) ? res.fileList[0] : null;
    const tempUrl = normalizeTempResult(first) || rawUrl;
    tempUrlCache.set(rawUrl, tempUrl);
    return tempUrl;
  } catch (error) {
    common_vendor.index.__f__("warn", "at utils/cloud-image.js:27", "resolveCloudFileUrl failed:", rawUrl, error);
    return rawUrl;
  }
};
const resolveCloudFileUrls = async (list = []) => {
  var _a, _b;
  if (!Array.isArray(list) || list.length === 0)
    return [];
  if (!((_b = (_a = common_vendor.wx$1) == null ? void 0 : _a.cloud) == null ? void 0 : _b.getTempFileURL))
    return [...list];
  const output = [...list];
  const pending = [];
  const pendingIndexMap = [];
  list.forEach((item, index) => {
    if (!isCloudFileId(item))
      return;
    if (tempUrlCache.has(item)) {
      output[index] = tempUrlCache.get(item);
      return;
    }
    pending.push(item);
    pendingIndexMap.push(index);
  });
  if (!pending.length)
    return output;
  const chunkSize = 50;
  for (let i = 0; i < pending.length; i += chunkSize) {
    const chunk = pending.slice(i, i + chunkSize);
    try {
      const res = await common_vendor.wx$1.cloud.getTempFileURL({ fileList: chunk });
      const fileList = Array.isArray(res == null ? void 0 : res.fileList) ? res.fileList : [];
      fileList.forEach((item, itemIndex) => {
        const source = chunk[itemIndex];
        const resolved = normalizeTempResult(item) || source;
        tempUrlCache.set(source, resolved);
      });
    } catch (error) {
      common_vendor.index.__f__("warn", "at utils/cloud-image.js:64", "resolveCloudFileUrls failed chunk:", error);
    }
  }
  pending.forEach((source, idx) => {
    const targetIndex = pendingIndexMap[idx];
    output[targetIndex] = tempUrlCache.get(source) || source;
  });
  return output;
};
exports.resolveCloudFileUrl = resolveCloudFileUrl;
exports.resolveCloudFileUrls = resolveCloudFileUrls;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/cloud-image.js.map
