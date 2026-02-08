/**
 * Create a low-quality thumbnail from base64 image for storage
 * @param {string} dataUrl - Base64 data URL (e.g. from FileReader.readAsDataURL)
 * @param {number} maxSize - Max width/height in pixels (default 80)
 * @param {number} quality - JPEG quality 0-1 (default 0.5 for low file size)
 * @returns {Promise<string|null>} - Thumbnail as base64 data URL, or null on error
 */
export function createThumbnail(dataUrl, maxSize = 80, quality = 0.5) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(null)
      return
    }

    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }

        let { width, height } = img
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = Math.round(width)
        canvas.height = Math.round(height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const thumbnail = canvas.toDataURL('image/jpeg', quality)
        resolve(thumbnail)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}
