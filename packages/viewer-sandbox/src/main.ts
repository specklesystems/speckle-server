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
// async function loaddata() {
//   viewer.loadObject(
//   'https://speckle.xyz/streams/7395e94d5c/objects/5c7cec6958a88e671c4b2812bcbb5a7d'
// )
// }

// async function filter() {
//   await loaddata();
//   const stages = Object.keys(viewer.getObjectsProperties().Stage.uniqueValues)
//   let timer = 2000;

//   for (let i=0; i<stages.length; i++){
//   setTimeout(() => { 
//   viewer.applyFilter({filterBy:{'Stage': stages[i]}, ghostOthers: true });
//   }, 3000);
//   timer += 2000;
// }
// }
viewer.loadObject(
'https://speckle.xyz/streams/7395e94d5c/objects/5c7cec6958a88e671c4b2812bcbb5a7d')


viewer.on<{ progress: number; id: string; url: string }>('load-progress', (a) => {
  if (a.progress >= 1) {
    viewer.onWindowResize()
  }})
  
Window.viewer = viewer


function animate_stages() {
  const stages = Object.keys(viewer.getObjectsProperties().Stage.uniqueValues)
  range.max = stages.length -1
  let timer = 1000; 

  for (let i=0; i<stages.length; i++){
  setTimeout(() => { 
    range.value = i
    viewer.applyFilter({filterBy:{'Stage': stages[i]}, ghostOthers: true });
  }, timer);
  timer += 800; //step between stages in millisecond
  }
}

const button = document.getElementById('animate_button');
button.addEventListener('click', () => {
  animate_stages();
});

const range = document.getElementById('myRange');
range.addEventListener('mouseup', () => {
  const stages = Object.keys(viewer.getObjectsProperties().Stage.uniqueValues)
  if (range.value < stages.length){
  viewer.applyFilter({filterBy:{'Stage': stages[range.value]}, ghostOthers: true });
  }
});