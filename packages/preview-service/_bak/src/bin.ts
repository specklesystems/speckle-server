import '@/bootstrap.js' // This has side-effects and has to be imported first

import { startServer } from '@/server/server.js'
import { startPreviewService } from '@/server/background.js'

const start = async () => {
  await startServer()
  await startPreviewService()
}

start()
  .then()
  .catch((err) => {
    throw err
  })
