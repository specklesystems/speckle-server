import { useActiveUser } from '~/lib/auth/composables/activeUser'

export default defineNuxtRouteMiddleware(async (to) => {
  const { needsEmailVerification, activeUser } = useActiveUser()

  if (activeUser.value) {
    const bypassPaths = ['/verify-email', '/logout']
    if (bypassPaths.includes(to.path)) return

    if (needsEmailVerification.value) {
      return navigateTo('/verify-email')
    }
  }
})
