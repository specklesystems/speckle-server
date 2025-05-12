import '@/bootstrap.js' // This has side-effects and has to be imported first
import Environment from '@speckle/shared/dist/commonjs/environment/index.js'

const { FF_NEXT_GEN_FILE_IMPORTER_ENABLED } = Environment.getFeatureFlags()
import { main as oldMain } from '@/controller/daemon.js'

const start = () => {
  if (FF_NEXT_GEN_FILE_IMPORTER_ENABLED) {
    throw new Error('Not yet implemented')
  } else {
    void oldMain()
  }
}

start()
