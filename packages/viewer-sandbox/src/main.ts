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

const sandbox = new Sandbox(viewer)
sandbox.makeGenericUI()

// Load demo object
sandbox.loadUrl(
  'https://latest.speckle.dev/streams/3ed8357f29/commits/b21fb0dcf7'
)

viewer.on<{ progress: number; id: string; url: string }>('load-progress', (a) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }
})


