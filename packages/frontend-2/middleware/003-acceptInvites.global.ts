import { waitForever, type Optional } from '@speckle/shared'
import { omit } from 'lodash-es'
import { activeUserQuery } from '~/lib/auth/composables/activeUser'
import { useApolloClientFromNuxt } from '~/lib/common/composables/graphql'
import { useProjectInviteManager } from '~/lib/projects/composables/invites'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return // Invites can only be processed on the client side

  const { triggerNotification } = useGlobalToast()
  const { useInvite } = useProjectInviteManager()
  const client = useApolloClientFromNuxt()
  const { data } = await client
    .query({
      query: activeUserQuery
    })
    .catch(convertThrowIntoFetchResult)

  // Ignore if not logged in
  if (!data?.activeUser?.id) return

  // Show toast if projectInvite=accepted
  if (to.query.projectInvite === 'accepted') {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: "You've joined the project!"
    })
    return navigateTo(
      {
        query: omit(to.query, ['projectInvite'])
      },
      { replace: true }
    )
  }

  const token = to.query.token as Optional<string>
  const accept = to.query.accept === 'true'

  if (!token || !accept) return
  if (!to.path.startsWith('/projects/')) return

  const projectId = to.params.id as Optional<string>
  if (!projectId) return

  const success = await useInvite({ token, accept, projectId })

  if (success) {
    // To avoid race conditions & weird cache behaviour, triggering a full page redirect
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('token')
    newUrl.searchParams.delete('accept')
    newUrl.searchParams.append('projectInvite', 'accepted')

    window.location.href = newUrl.toString()
    await waitForever() // to prevent any further code execution while reload is happening

    // return navigateTo(
    //   {
    //     query: omit(to.query, ['token', 'accept'])
    //   },
    //   { external: true }
    // )
  }
})
