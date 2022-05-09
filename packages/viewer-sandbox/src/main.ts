import { Viewer } from '@speckle/viewer'
import './style.css'
import Sandbox from './Sandbox'

const container = document.querySelector<HTMLDivElement>('#renderer') as HTMLElement
if (!container) {
  throw new Error("Couldn't find #app container!")
}

// Viewer setup
const viewer = new Viewer(container)

window.addEventListener('load', () => {
  viewer.onWindowResize()
})

// Load demo object
viewer.loadObject(
  'https://speckle.xyz/streams/99abc74dd4/objects/ab503a2025e706717bff467ef8f96488'
)

viewer.on<{ progress: number; id: string; url: string }>('load-progress', (a) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }
})

const sandbox = new Sandbox(viewer)
sandbox.makeGenericUI()
