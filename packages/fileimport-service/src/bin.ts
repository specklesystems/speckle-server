import '@/bootstrap.js' // This has side-effects and has to be imported first

import { main } from '@/src/daemon.js'

const start = () => {
  void main()
}

start()
