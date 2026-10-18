import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'

// True inside the installed Android app (Capacitor), false in the browser version.
export const isNative = Capacitor.isNativePlatform()

// Status bar icons follow the app's own theme: dark icons on the light theme, light icons on the dark one.
export function matchSystemBars(theme) {
  if (!isNative) return
  const style = theme === 'dark' ? SystemBarsStyle.Dark : theme === 'light' ? SystemBarsStyle.Light : SystemBarsStyle.Default
  SystemBars.setStyle({ style }).catch(() => {})
}

// Android back button: close the open form first (forms live in the browser history), then leave the app.
export async function handleBackButton() {
  if (!isNative) return
  const { App } = await import('@capacitor/app')
  App.addListener('backButton', ({ canGoBack }) => (canGoBack ? window.history.back() : App.exitApp()))
}

// The app has no browser downloads, so files (backup, spreadsheet) go through the share sheet:
// the farmer picks Files, Drive or Messenger to keep them.
export async function shareFile(filename, text) {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  const { uri } = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 })
  await Share.share({ title: filename, files: [uri], dialogTitle: 'Save or send the file' })
}
