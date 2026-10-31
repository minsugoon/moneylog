export const MAX_EDGE = 1568

export type ResizedImage = { mediaType: 'image/jpeg'; data: string }

export function fitWithin(width: number, height: number, maxEdge = MAX_EDGE): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 1, height: 1 }
  const edge = Math.max(width, height)
  if (edge <= maxEdge) return { width, height }
  const ratio = maxEdge / edge
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

export async function resizeImageToBase64(file: File): Promise<ResizedImage> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('이미지를 읽을 수 없어요')
  }

  try {
    const size = fitWithin(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('이미지를 읽을 수 없어요')
    context.drawImage(bitmap, 0, 0, size.width, size.height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result)
        else reject(new Error('이미지를 읽을 수 없어요'))
      }, 'image/jpeg', 0.85)
    })
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('이미지를 읽을 수 없어요'))
          return
        }
        resolve(reader.result.slice(reader.result.indexOf(',') + 1))
      }
      reader.onerror = () => reject(new Error('이미지를 읽을 수 없어요'))
      reader.readAsDataURL(blob)
    })
    return { mediaType: 'image/jpeg', data }
  } catch {
    throw new Error('이미지를 읽을 수 없어요')
  } finally {
    bitmap.close()
  }
}
