import { Viewer } from '@speckle/viewer'
import './style.css'
import Sandbox from './Sandbox'

const container = document.querySelector<HTMLDivElement>('#renderer')

if (!container) {
  throw new Error("Couldn't find #app container!")
}

// Viewer setup
const viewer = new Viewer({
  container,
  showStats: true
})

window.addEventListener('load', () => {
  viewer.onWindowResize()
})

// Load demo object
viewer.loadObject(
  'https://speckle.xyz/streams/99abc74dd4/commits/ccc0baaadb'
)

viewer.on<{ progress: number; id: string; url: string }>('load-progress', (a) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }
})

const sandbox = new Sandbox(viewer)
sandbox.makeGenericUI()
