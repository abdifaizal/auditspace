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

/**
 * Opens an external URL in the system's default web browser (Chrome, Edge, Firefox, etc.).
 * In Tauri desktop, invokes native OS browser launcher.
 * In a web browser, uses window.open.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return

  let formattedUrl = url.trim()
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl
  }

  const isTauri =
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)

  if (isTauri) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('open_in_browser', { url: formattedUrl })
      return
    } catch (err) {
      console.warn('Tauri open_in_browser failed, trying window.open:', err)
    }
  }

  window.open(formattedUrl, '_blank', 'noopener,noreferrer')
}

/**
 * In-App update installer:
 * Downloads the update binary directly in the background and launches it without opening an external browser.
 */
export async function downloadAndInstallUpdate(url: string, filename: string): Promise<void> {
  const isTauri =
    typeof window !== 'undefined' &&
    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)

  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('download_and_install_update', { url, filename })
    return
  }

  // Fallback in web browser mode
  window.open(url, '_blank')
}
