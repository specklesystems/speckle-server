import { Viewer } from '@speckle/viewer'
import './style.css'
import Sandbox from './Sandbox'

const container = document.querySelector<HTMLElement>('#renderer')
if (!container) {
  throw new Error("Couldn't find #app container!")
}

// Viewer setup
const viewer = new Viewer(container)
await viewer.init()

window.addEventListener('load', () => {
  viewer.onWindowResize()
})

const sandbox = new Sandbox(viewer)
sandbox.makeGenericUI()
sandbox.makeSceneUI()
// Load demo object
sandbox.loadUrl('https://latest.speckle.dev/streams/921741b30b/commits/c5acd4ff91?c=%5B147162.48107,6396783.94314,18.1266,147140.22466,6396758.05514,9.41576,0,1%5D')

viewer.on('load-progress', (a: { progress: number; id: string; url: string }) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }
})
