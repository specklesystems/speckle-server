import type { ToastNotification } from '@speckle/ui-components'
import { ToastNotificationType } from '@speckle/ui-components'
import { useHostAppStore } from '~/store/hostApp'

type Versions = {
  Versions: Version[]
}

export type Version = {
  Number: string
  Url: string
  Os: number
  Architecture: number
  Date: string
  Prerelease: boolean
}

export function useUpdateConnector() {
  const hostApp = useHostAppStore()
  const { $openUrl } = useNuxtApp()

  const versions = ref<Version[]>([])
  const latestAvailableVersion = ref<Version | null>(null)

  const isUpToDate = computed(
    () => hostApp.connectorVersion === latestAvailableVersion.value?.Number
  )

  async function checkUpdate() {
    await getVersions()
    if (!isUpToDate.value) {
      const notification: ToastNotification = {
        type: ToastNotificationType.Success,
        title: `Update available`,
        description: latestAvailableVersion.value?.Number.replace('+0', ''), // TODO: currently versions end with "+0" Alan will have a look
        cta: {
          title: `Download`,
          onClick: () => downloadLatestVersion()
        }
      }
      hostApp.setNotification(notification)
    }
  }

  async function getVersions() {
    const response = await fetch(
      `https://releases.speckle.dev/manager2/feeds/${hostApp.hostAppName?.toLowerCase()}-v3.json`,
      {
        method: 'GET'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch versions')
    }

    const data = (await response.json()) as unknown as Versions
    const sortedVersions = data.Versions.sort(function (a: Version, b: Version) {
      return new Date(b.Date).getTime() - new Date(a.Date).getTime()
    })
    versions.value = sortedVersions
    latestAvailableVersion.value = sortedVersions[0]
    hostApp.setLatestAvailableVersion(sortedVersions[0])
  }

  function downloadLatestVersion() {
    $openUrl(latestAvailableVersion.value?.Url as string)
  }

  return {
    checkUpdate
  }
}
