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

viewer.on('load-complete', ()=> {
  Object.assign(Sandbox.sceneParams.worldSize, viewer.worldSize);
  Object.assign(Sandbox.sceneParams.worldOrigin, viewer.worldOrigin);
  sandbox.refresh();
})

sandbox.makeGenericUI()
sandbox.makeSceneUI()
// Load demo object
sandbox.loadUrl('https://latest.speckle.dev/streams/018a30bc2c/commits/c87747b13a?c=%5B222.89773,-58.80633,133.66034,394.47075,161.10635,15.35102,0,1%5D')
