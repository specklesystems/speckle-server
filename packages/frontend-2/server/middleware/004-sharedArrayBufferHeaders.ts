const viewerPathRgx = /^\/projects\/[\w\d]+\/models\/[\w\d]+$/i

export default defineEventHandler((event) => {
  // Only work on viewer page
  const url = getRequestURL(event)
  const path = url.pathname
  if (!viewerPathRgx.test(path)) {
    return
  }

  // Only set if query set `sharedArrayBufferHeaders=1`
  const query = getQuery(event)
  if (query.sharedArrayBufferHeaders !== '1') {
    return
  }

  setHeaders(event, {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp'
  })
})
