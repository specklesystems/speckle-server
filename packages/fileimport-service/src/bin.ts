import '@/bootstrap.js' // This has side-effects and has to be imported first
import Environment from '@speckle/shared/dist/commonjs/environment/index.js'

const { FF_NEXT_GEN_FILE_IMPORTER_ENABLED } = Environment.getFeatureFlags()
import { main as oldMain } from '@/controller/daemon.js'
import { main } from '@/nextGen/main.js'

const start = () => {
  if (FF_NEXT_GEN_FILE_IMPORTER_ENABLED) {
    void main()
  } else {
    void oldMain()
  }
}

start()
