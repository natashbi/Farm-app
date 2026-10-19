import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()

export function matchSystemBars(theme) {
  if (!isNative) return
  const style = theme === 'dark' ? SystemBarsStyle.Dark : theme === 'light' ? SystemBarsStyle.Light : SystemBarsStyle.Default
  SystemBars.setStyle({ style }).catch(() => {})
}

export async function handleBackButton() {
  if (!isNative) return
  const { App } = await import('@capacitor/app')
  App.addListener('backButton', ({ canGoBack }) => (canGoBack ? window.history.back() : App.exitApp()))
}

export async function shareFile(filename, text) {
  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  const { uri } = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 })
  await Share.share({ title: filename, files: [uri], dialogTitle: 'Save or send the file' })
}
