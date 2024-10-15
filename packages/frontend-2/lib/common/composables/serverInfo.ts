import { useQuery } from '@vue/apollo-composable'
import { cloneDeep } from 'lodash-es'
import {
  serverInfoAllScopesQuery,
  serverInfoBlobSizeLimitQuery
} from '~~/lib/common/graphql/queries'
import { prettyFileSize } from '~~/lib/core/helpers/file'
import type { AllScopes } from '@speckle/shared'

export function useServerFileUploadLimit() {
  const { result } = useQuery(serverInfoBlobSizeLimitQuery)

  const maxSizeInBytes = computed(
    () => result.value?.serverInfo.configuration.blobSizeLimitBytes || 0
  )
  const maxSizeDisplayString = computed(() => prettyFileSize(maxSizeInBytes.value))

  return {
    maxSizeInBytes,
    maxSizeDisplayString
  }
}

export const useServerInfoScopes = () => {
  const { result } = useQuery(serverInfoAllScopesQuery)

  const scopes = computed(() => {
    const base = result.value?.serverInfo.scopes || []
    const cloned = cloneDeep(base) // cause it might get directly plopped back into the cache by a dev
    return cloned.map((scope) => ({
      ...scope,
      name: scope.name as unknown as (typeof AllScopes)[number]
    }))
  })

  return {
    scopes
  }
}
