const notFoundMessageRegexes = [/Cannot find static asset/i, /Page not found/i]

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (err, { event }) => {
    if (!event) return

    if (notFoundMessageRegexes.some((r) => r.test(err.message))) {
      setHeader(event, 'Cache-Control', 'no-store')
    }
  })
})
