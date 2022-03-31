import { Viewer } from '@speckle/viewer'

let v = new Viewer({ container: document.getElementById('renderer'), showStats: false })
// v.on( 'load-progress', args => console.log( args ) )

window.v = v

window.LoadData = async function LoadData(url) {
  // token is not used in this context, since the preview service talks directly to the DB
  await v.loadObject(url, undefined)
}

window.onload = () => {
  let testUrl = window.location.hash.substr(1)
  if (testUrl) {
    window.LoadData(testUrl)
  }
}
