import v8 from 'v8'

/**
 * This endpoint should be hidden/protected so that only allowed users can access it. It will generate a heap snapshot and stream it out.
 */
export default defineEventHandler((event) => {
  const snapshot = v8.getHeapSnapshot()

  setHeaders(event, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=heap-snapshot.heapsnapshot'
  })

  return snapshot
})
