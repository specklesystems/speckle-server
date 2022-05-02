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

const sandbox = new Sandbox(viewer)
sandbox.makeGenericUI()

// Load demo object
sandbox.loadUrl(
  'https://latest.speckle.dev/streams/3ed8357f29/commits/b21fb0dcf7?c=%5B15.7702,-36.79588,44.54544,32.22419,3.03342,-6.79766,0,1%5D'
)

viewer.on<{ progress: number; id: string; url: string }>('load-progress', (a) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }
})


