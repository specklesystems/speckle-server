import v8 from 'v8'

/**
 * This endpoint should be hidden/protected so that only allowed users can access it. It will generate a heap snapshot and stream it out.
 */
export default defineEventHandler((event) => {
  const snapshot = v8.getHeapSnapshot()
  const snapshotStream = snapshot.pipe(event.node.res)

  event.node.res.setHeader('Content-Type', 'application/octet-stream')
  event.node.res.setHeader(
    'Content-Disposition',
    'attachment; filename=heap-snapshot.heapsnapshot'
  )

  return snapshotStream
})
