import { useQuery } from '@vue/apollo-composable'
import { nanoid } from 'nanoid'
import { graphql } from '~~/lib/common/generated/gql'
import type { H3Event } from 'h3'
import type { Optional } from '@speckle/shared'

export const mainServerInfoDataQuery = graphql(`
  query MainServerInfoData {
    serverInfo {
      adminContact
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
  const { result } = useQuery(mainServerInfoDataQuery)

  const serverInfo = computed(() => result.value?.serverInfo)

  const isGuestMode = computed(() => !!serverInfo.value?.guestModeEnabled)

  return { serverInfo, isGuestMode }
}

/**
 * Get the req.id that is/was used in the initial SSR request
 *
 * Note: In SSR, this can only be used after the 001-logging middleware, cause that's when the ID is set
 */
export function useServerRequestId() {
  const nuxt = useNuxtApp()
  const state = useState('server_request_id', () => {
    // The client side should not need to resolve this info, as it should come from the serialized SSR state
    if (import.meta.client || !nuxt.ssrContext) return undefined
    return nuxt.ssrContext.event.node.req.id as string
  })

  return computed(() => state.value)
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
  /**
   * If you want to already pre-resolve the frontend reqId from SSR (e.g. if you're rendering it on a page)
   */
  forceFrontendValue?: boolean
}) {
  let id = nanoid()
  if (import.meta.server && !params?.forceFrontendValue) {
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

/**
 * Resolve the user's geolocation, if possible (only supported wherever we host behind Cloudflare)
 */
export function useUserCountry() {
  const nuxt = useNuxtApp()
  const state = useState('active_user_country', () => {
    // The client side should not need to resolve this info, as it should come from the serialized SSR state
    if (import.meta.client || !nuxt.ssrContext) return undefined
    return nuxt.ssrContext.event.node.req.headers['cf-ipcountry'] as Optional<string>
  })

  return computed(() => state.value)
}
