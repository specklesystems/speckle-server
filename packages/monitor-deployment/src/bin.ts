import '@/bootstrap.js' // This has side-effects and has to be imported first

import { startServer } from '@/server/server.js'

const start = () => {
  startServer()
}

start()
