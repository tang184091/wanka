const tempUrlCache = new Map()

export const isCloudFileId = (value) => typeof value === 'string' && value.startsWith('cloud://')

const normalizeTempResult = (item) => {
  if (!item) return ''
  if (typeof item === 'string') return item
  return item.tempFileURL || item.tempFileUrl || item.fileID || ''
}

export const resolveCloudFileUrl = async (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl || ''
  if (!isCloudFileId(rawUrl)) return rawUrl
  if (!wx?.cloud?.getTempFileURL) return rawUrl

  if (tempUrlCache.has(rawUrl)) {
    return tempUrlCache.get(rawUrl)
  }

  try {
    const res = await wx.cloud.getTempFileURL({ fileList: [rawUrl] })
    const first = Array.isArray(res?.fileList) ? res.fileList[0] : null
    const tempUrl = normalizeTempResult(first) || rawUrl
    tempUrlCache.set(rawUrl, tempUrl)
    return tempUrl
  } catch (error) {
    console.warn('resolveCloudFileUrl failed:', rawUrl, error)
    return rawUrl
  }
}

export const resolveCloudFileUrls = async (list = []) => {
  if (!Array.isArray(list) || list.length === 0) return []
  if (!wx?.cloud?.getTempFileURL) return [...list]

  const output = [...list]
  const pending = []
  const pendingIndexMap = []

  list.forEach((item, index) => {
    if (!isCloudFileId(item)) return
    if (tempUrlCache.has(item)) {
      output[index] = tempUrlCache.get(item)
      return
    }
    pending.push(item)
    pendingIndexMap.push(index)
  })

  if (!pending.length) return output

  const chunkSize = 50
  for (let i = 0; i < pending.length; i += chunkSize) {
    const chunk = pending.slice(i, i + chunkSize)
    try {
      const res = await wx.cloud.getTempFileURL({ fileList: chunk })
      const fileList = Array.isArray(res?.fileList) ? res.fileList : []
      fileList.forEach((item, itemIndex) => {
        const source = chunk[itemIndex]
        const resolved = normalizeTempResult(item) || source
        tempUrlCache.set(source, resolved)
      })
    } catch (error) {
      console.warn('resolveCloudFileUrls failed chunk:', error)
    }
  }

  pending.forEach((source, idx) => {
    const targetIndex = pendingIndexMap[idx]
    output[targetIndex] = tempUrlCache.get(source) || source
  })

  return output
}

