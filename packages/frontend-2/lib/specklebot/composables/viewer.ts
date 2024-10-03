import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import ObjectLoader from '@speckle/objectloader'
import { useAuthCookie } from '~/lib/auth/composables/auth'
import type { Optional } from '@speckle/shared'
import { omit } from 'lodash-es'

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

    const firstModel = modelsAndVersionIds.value.find(
      (m) => m.model.versions.items.length > 0
    )
    if (!firstModel) return {}

    const versions = firstModel.model.versions.items

    const loadVersionData = async (objectId: string) => {
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
      return await objectLoader.getAndConstructObject((e) =>
        log(`Progress ${e.stage}: ${e.current}`)
      )
    }

    const versionsData = await Promise.all(
      versions.map((v) => async () => {
        const versionData = await loadVersionData(v.id)
        return { versionInfo: v, versionData }
      })
    )

    const ret = {
      versionsData,
      mainModelMetadata: omit(firstModel.model, ['loadedVersion', 'versions'])
    }
    cachedData = ret
    return ret
  }

  return {
    getLoadedData
  }
}
