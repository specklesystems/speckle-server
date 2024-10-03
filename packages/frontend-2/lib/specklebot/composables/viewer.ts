import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import ObjectLoader from '@speckle/objectloader'
import { useAuthCookie } from '~/lib/auth/composables/auth'
import type { Optional } from '@speckle/shared'

export const useGetLoadedData = () => {
  const {
    resources: {
      response: { modelsAndVersionIds }
    },
    projectId
  } = useInjectedViewerState()
  const apiOrigin = useApiOrigin()
  const token = useAuthCookie()
  const log = useDevLogger()

  let cachedData: Optional<Record<string, unknown>> = undefined

  const getLoadedData = async (): Promise<Record<string, unknown>> => {
    if (cachedData) return cachedData

    const firstVersion = modelsAndVersionIds.value[0]?.model.loadedVersion.items[0]
    if (!firstVersion) return {}

    const objectId = firstVersion.referencedObject
    const objectLoader = new ObjectLoader({
      serverUrl: apiOrigin,
      streamId: projectId.value,
      objectId,
      token: token.value,
      options: {
        excludeProps: [
          '__closure',
          'totalChildrenCount',
          'displayValue',
          '@displayValue'
        ]
      }
    })
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const versionData = await objectLoader.getAndConstructObject((e) =>
      log(`Progress ${e.stage}: ${e.current}`)
    )

    const ret = { versionInfo: firstVersion, versionData }
    cachedData = ret
    return ret
  }

  return {
    getLoadedData
  }
}
