const noStaticAssetFoundRgx = /Cannot find static asset/i

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (err, { event }) => {
    if (!event) return

    if (noStaticAssetFoundRgx.test(err.message)) {
      setHeader(event, 'Cache-Control', 'no-cache')
    }
  })
})
