/**
 * Unified file saving helper.
 * If running inside Tauri (Windows desktop), uses native Windows File Dialog to reliably save files.
 * If running in a web browser, falls back to standard anchor blob download.
 */
export async function saveFileWithDialog(
  filename: string,
  contentOrBase64: string,
  options?: { isBase64?: boolean; mimeType?: string }
): Promise<{ success: boolean; path?: string; cancelled?: boolean }> {
  const isTauri =
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)

  let base64Data = contentOrBase64
  if (!options?.isBase64) {
    try {
      base64Data = btoa(unescape(encodeURIComponent(contentOrBase64)))
    } catch {
      base64Data = btoa(contentOrBase64)
    }
  }

  if (isTauri) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const result = await invoke<string>('save_file_to_disk', {
        filename,
        base64Data,
      })

      if (result === 'cancelled') {
        return { success: false, cancelled: true }
      }
      return { success: true, path: result }
    } catch (err) {
      console.warn('Native Tauri save dialog failed, falling back to browser download:', err)
    }
  }

  // Web Browser Fallback
  try {
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
    const binary = atob(cleanBase64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([bytes], {
      type: options?.mimeType || 'application/octet-stream',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    return { success: true }
  } catch (webErr) {
    console.error('Download fallback failed:', webErr)
    return { success: false }
  }
}
