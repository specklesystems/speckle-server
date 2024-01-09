import { useQuery } from '@vue/apollo-composable'
import { nanoid } from 'nanoid'
import { graphql } from '~~/lib/common/generated/gql'
import type { H3Event } from 'h3'

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

/**
 * Get the value that should be used as the request correlation ID
 *
 * Note: In SSR, this can only be used after the 001-logging middleware, cause that's when the ID is set, otherwise
 * we fallback to a new nanoid
 */
export function useRequestId(params?: {
  /**
   * Specify, if invoking composable from within server-side event handler, cause we don't have access to useNuxtApp()
   * or anything of the like there
   */
  event?: H3Event
}) {
  let id = nanoid()
  if (process.server) {
    id = (params?.event || useNuxtApp().ssrContext?.event)?.node.req.id as string
    if (!id) {
      throw new Error("Couldn't determine request ID")
    }

    return id
  } else {
    // We retain it in the state so that all reqs going out from the same client-side app session
    // have the same id
    const state = useState('app_request_correlation_id', () => id)
    return state.value
  }
}
