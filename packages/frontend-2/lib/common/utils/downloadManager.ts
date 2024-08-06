export type ManagerExtension = 'exe' | 'dmg'

// Util to download the Manager file
export const downloadManager = (extension: ManagerExtension) => {
  return new Promise((resolve, reject) => {
    const fileName = `manager.${extension}`
    const downloadLink = `https://releases.speckle.dev/manager2/installer/${fileName}`

    try {
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = downloadLink
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      resolve('Download successfull')
    } catch {
      // In case browser doesn't allow file downloads this way
      reject('Failed download')
    }
  })
}
