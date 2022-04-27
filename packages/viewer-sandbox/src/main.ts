import { Pane } from 'tweakpane'
import { Viewer } from '@speckle/viewer'
import './style.css'
import Sandbox from './Sandbox';

const container = document.querySelector<HTMLDivElement>('#renderer')
const urlInput = document.querySelector<HTMLInputElement>("#objectUrlInput");

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
});

// TEMPORARY
(window as any).loadData = ()=> {
  viewer.loadObject(
    urlInput?.value as string
    // 'https://latest.speckle.dev/streams/010b3af4c3/objects/a401baf38fe5809d0eb9d3c902a36e8f'
  )
}



// Load demo object
viewer.loadObject(
  'https://latest.speckle.dev/streams/010b3af4c3/objects/a401baf38fe5809d0eb9d3c902a36e8f'
)

viewer.on<{ progress: number; id: string; url: string }>('load-progress', (a) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }
})

const sandbox = new Sandbox(viewer);
sandbox.makeGenericUI();


