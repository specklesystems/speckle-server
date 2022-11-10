import { activeUserQuery } from '~~/lib/auth/composables/activeUser'
import { convertThrowIntoFetchResult } from '~~/lib/common/helpers/graphql'
import { HomeRoute } from '~~/lib/common/helpers/route'

/**
 * Apply this to a page to prevent unauthenticated access
 */
export default defineNuxtRouteMiddleware(async () => {
  const { $apollo } = useNuxtApp()
  const client = $apollo.default

  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // const dataPromise = new Promise<{ activeUser: { id: number } }>((resolve) => {
  //   setTimeout(() => {
  //     resolve({ activeUser: { id: 1 } })
  //   }, 500)
  // })
  // const data = await dataPromise

  // Redirect home, if not logged in
  if (!data?.activeUser?.id) {
    return navigateTo(HomeRoute)
  }

  return undefined
})
