export default defineNuxtPlugin(() => {
  if (!process.dev) return
  if (!process.client) return

  console.debug('🚧 Running FE2 in dev mode, extra debugging tools may be available...')
})
