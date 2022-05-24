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
sandbox.loadUrl('https://speckle.xyz/streams/9217731fc1/commits/751ae5dac7')
