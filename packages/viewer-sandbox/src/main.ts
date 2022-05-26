import { Viewer, DefaultViewerParams } from '@speckle/viewer'

// TODO: Just examples, delete!
import Image from '@speckle/viewer/assets/random.png'
// import ImageHdr from '@speckle/viewer/dist/image.hdr';

import './style.css'
import Sandbox from './Sandbox'

const container = document.querySelector<HTMLElement>('#renderer')
if (!container) {
  throw new Error("Couldn't find #app container!")
}

// Viewer setup
const params = DefaultViewerParams
// params.environmentSrc =
//   // 'https://speckle-xyz-assets.ams3.digitaloceanspaces.com/studio010.hdr'
//   'http://localhost:3033/sample-hdri.exr'

// TODO: Remove this, just a test of image bundling capabilities!
const testImg = document.createElement('img')

// TODO: TEST, REMOVE
testImg.src = Image // Image manually imported from speckle/viewer
// testImg.src = DefaultViewerParams.environmentSrc // Image that always gets bundled due to the import in speckle/viewer (remove it)

document.getElementsByTagName('body')[0].appendChild(testImg)

const viewer = new Viewer(container, params)
await viewer.init()

const sandbox = new Sandbox(viewer)

window.addEventListener('load', () => {
  viewer.onWindowResize()
})

viewer.on('load-progress', (a: { progress: number; id: string; url: string }) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }
})

viewer.on('load-complete', () => {
  Object.assign(Sandbox.sceneParams.worldSize, viewer.worldSize)
  Object.assign(Sandbox.sceneParams.worldOrigin, viewer.worldOrigin)
  sandbox.refresh()
})

sandbox.makeGenericUI()
sandbox.makeSceneUI()
// Load demo object
sandbox.loadUrl('https://latest.speckle.dev/streams/0c6ad366c4/commits/c4450f8ebe')
