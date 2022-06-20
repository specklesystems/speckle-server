import { Viewer, DefaultViewerParams } from '@speckle/viewer'

import './style.css'
import Sandbox from './Sandbox'

const container = document.querySelector<HTMLElement>('#renderer')
if (!container) {
  throw new Error("Couldn't find #app container!")
}

// Viewer setup
const params = DefaultViewerParams
// params.environmentSrc =
// 'https://speckle-xyz-assets.ams3.digitaloceanspaces.com/studio010.hdr'
// 'http://localhost:3033/sample-hdri.exr'

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
sandbox.loadUrl(
  'https://latest.speckle.dev/streams/3ed8357f29/commits/d10f2af1ce?c=%5B33.05147,79.11588,111.54311,90.85614,-8.557,-5.97019,0,1%5D'
)
