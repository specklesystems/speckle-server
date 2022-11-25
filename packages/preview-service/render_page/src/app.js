import { DebugViewer, DefaultViewerParams } from '@speckle/viewer'
// import { logger } from '../../observability/logging'

const v = new DebugViewer(document.getElementById('renderer'), DefaultViewerParams)
window.v = v

// v.on( ViewerEvent.LoadProgress, args => logger.debug( args ) )

window.LoadData = async function LoadData(url) {
  // token is not used in this context, since the preview service talks directly to the DB
  await v.loadObject(url, undefined)
}

window.onload = () => {
  const testUrl = window.location.hash.substr(1)
  if (testUrl) {
    window.LoadData(testUrl)
  }
}
