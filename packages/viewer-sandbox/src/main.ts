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
  'https://speckle.xyz/streams/0d3cb7cb52/objects/f833afec2e17457f17e7f6429a106187'
)


viewer.applyFilter({filterBy: {'level.name': ['3FL', '4FL', '7FL']}, 
colorBy: { property: 'level.name', 
type: 'category', values: {'3FL': '#F0FFFF', '4FL': '#6495ED', '7FL': '#7B68EE'} }, 
ghostOthers: true } )

viewer.on<{ progress: number; id: string; url: string }>('load-progress', (a) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }})

