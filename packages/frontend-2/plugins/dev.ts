import { useAuthCookie } from '~~/lib/auth/composables/auth'

export default defineNuxtPlugin(() => {
  if (!process.dev) return
  if (!process.client) return

  console.debug('🚧 Running FE2 in dev mode, extra debugging tools may be available...')

  const authToken = useAuthCookie()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  window.AUTH_TOKEN = {
    set: (newVal?: string) => (authToken.value = newVal || undefined),
    get: () => authToken.value
  }
})
