import { useQuery } from '@vue/apollo-composable'
import { serverInfoBlobSizeLimitQuery } from '~~/lib/common/graphql/queries'
import { prettyFileSize } from '~~/lib/core/helpers/file'

export function useServerFileUploadLimit() {
  const { result } = useQuery(serverInfoBlobSizeLimitQuery)

  const maxSizeInBytes = computed(
    () => result.value?.serverInfo.blobSizeLimitBytes || 0
  )
  const maxSizeDisplayString = computed(() => prettyFileSize(maxSizeInBytes.value))

  return {
    maxSizeInBytes,
    maxSizeDisplayString
  }
}
