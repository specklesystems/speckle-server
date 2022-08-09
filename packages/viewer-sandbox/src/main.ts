import { Viewer, DefaultViewerParams } from '@speckle/viewer'

import './style.css'
import Sandbox from './Sandbox'

const container = document.querySelector<HTMLElement>('#renderer')
if (!container) {
  throw new Error("Couldn't find #app container!")
}

// Viewer setup
const params = DefaultViewerParams
params.showStats = true
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
sandbox.makeFilteringUI()
// Load demo object
sandbox.loadUrl(
  // 'https://speckle.xyz/streams/17b0b76d13/commits/1ba20ba64b?c=%5B700048.95339,5709850.71008,148.503,699898.46699,5710107.01323,-147.5969,0,1%5D'
  'https://latest.speckle.dev/streams/444bfbd6e4/commits/ee4fcfba43'
)
