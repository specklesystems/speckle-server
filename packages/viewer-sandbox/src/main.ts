import { Pane } from 'tweakpane'
import { Viewer } from '@speckle/viewer'
import './style.css'

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

// Tweakpane setup
const PARAMS = {
  factor: 123,
  title: 'hello',
  color: '#ff0055'
}

const pane = new Pane()

pane.addInput(PARAMS, 'factor')
pane.addInput(PARAMS, 'title')
pane.addInput(PARAMS, 'color')

// Load demo object
viewer.loadObject(
  'https://latest.speckle.dev/streams/010b3af4c3/objects/a401baf38fe5809d0eb9d3c902a36e8f'
)

viewer.on<{ progress: number; id: string; url: string }>('load-progress', (a) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }
})
