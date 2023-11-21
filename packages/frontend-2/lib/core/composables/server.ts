import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'

const serverInfoQuery = graphql(`
  query MainServerInfoData {
    serverInfo {
      adminContact
      blobSizeLimitBytes
      canonicalUrl
      company
      description
      guestModeEnabled
      inviteOnly
      name
      termsOfService
      version
      automateUrl
    }
  }
`)

export function useServerInfo() {
  const { result } = useQuery(serverInfoQuery)

  const serverInfo = computed(() => result.value?.serverInfo)

  const isGuestMode = computed(() => !!serverInfo.value?.guestModeEnabled)

  return { serverInfo, isGuestMode }
}
