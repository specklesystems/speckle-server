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
sandbox.loadUrl('https://latest.speckle.dev/streams/3ed8357f29/commits/b21fb0dcf7?c=%5B76.08416,-35.25872,38.49991,56.56326,-4.19138,5.61052,0,1%5D')

viewer.on('load-progress', (a: { progress: number; id: string; url: string }) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }
})
