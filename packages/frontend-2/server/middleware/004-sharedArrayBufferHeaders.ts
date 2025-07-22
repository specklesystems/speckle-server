const viewerPathRgx = /^\/projects\/[\w\d]+\/models\/[\w\d]+$/i

export default defineEventHandler((event) => {
  // Only work on viewer page
  const url = getRequestURL(event)
  const path = url.pathname
  if (!viewerPathRgx.test(path)) {
    return
  }

  // Only set if query set `sharedArrayBufferHeaders=true`
  const query = getQuery(event)
  if (!query.sharedArrayBufferHeaders) {
    return
  }

  // SharedArrayBuffer headers are required for performance optimizations in some browsers
  setHeaders(event, {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp'
  })
})
