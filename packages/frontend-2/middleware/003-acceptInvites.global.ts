import { type Optional } from '@speckle/shared'
import { omit } from 'lodash-es'
import { activeUserQuery } from '~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~/lib/common/composables/graphql'
import { useProjectInviteManager } from '~/lib/projects/composables/invites'

export default defineNuxtRouteMiddleware(async (to) => {
  const { useInvite } = useProjectInviteManager()
  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Ignore if not logged in
  if (!data?.activeUser?.id) return

  const token = to.query.token as Optional<string>
  const accept = to.query.accept === 'true'

  if (!token || !accept) {
    return
  }
  if (!to.path.startsWith('/projects/')) return

  const projectId = to.params.id as Optional<string>
  if (!projectId) return

  const success = await useInvite({ token, accept, projectId })

  if (success) {
    return navigateTo(
      {
        query: omit(to.query, ['token', 'accept'])
      },
      { replace: true }
    )
  }
})
