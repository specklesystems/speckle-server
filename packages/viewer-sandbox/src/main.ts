import { Viewer } from '@speckle/viewer'
import './style.css'
import Sandbox from './Sandbox'

const container = document.querySelector<HTMLDivElement>('#renderer') as HTMLElement
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
sandbox.loadUrl('https://latest.speckle.dev/streams/2158263a8f/commits/3a629fc558')

viewer.on('load-progress', (a: { progress: number; id: string; url: string }) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }
})
