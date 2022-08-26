import {
  DefaultViewerParams,
  SelectionEvent,
  ViewerEvent,
  DebugViewer,
  Viewer
} from '@speckle/viewer'

import './style.css'
import Sandbox from './Sandbox'

const container = document.querySelector<HTMLElement>('#renderer')
if (!container) {
  throw new Error("Couldn't find #app container!")
}

// Viewer setup
const params = DefaultViewerParams
params.showStats = true

const multiSelectList: SelectionEvent[] = []
const viewer: Viewer = new DebugViewer(container, params)
await viewer.init()

const sandbox = new Sandbox(viewer as DebugViewer, multiSelectList)

window.addEventListener('load', () => {
  viewer.resize()
})

viewer.on(
  ViewerEvent.LoadProgress,
  (a: { progress: number; id: string; url: string }) => {
    if (a.progress >= 1) {
      viewer.resize()
    }
  }
)

viewer.on(ViewerEvent.LoadComplete, () => {
  Object.assign(Sandbox.sceneParams.worldSize, Viewer.World.worldSize)
  Object.assign(Sandbox.sceneParams.worldOrigin, Viewer.World.worldOrigin)
  sandbox.refresh()
})

viewer.on(ViewerEvent.ObjectClicked, async (selectionInfo: SelectionEvent) => {
  if (!selectionInfo) {
    multiSelectList.length = 0
    await viewer.resetSelection()
    return
  }
  if (!selectionInfo.multiple) multiSelectList.length = 0

  const guids = multiSelectList.map((val) => val.guid)
  if (
    (selectionInfo.multiple && !guids.includes(selectionInfo.guid)) ||
    multiSelectList.length === 0
  ) {
    multiSelectList.push(selectionInfo)
  }

  const ids = multiSelectList.map((val) => val.userData.id)

  await viewer.selectObjects(ids as string[])
})

sandbox.makeGenericUI()
sandbox.makeSceneUI()
sandbox.makeFilteringUI()
// Load demo object

await sandbox.loadUrl(
  // 'https://speckle.xyz/streams/da9e320dad/commits/5388ef24b8?c=%5B-7.66134,10.82932,6.41935,-0.07739,-13.88552,1.8697,0,1%5D'
  // Revit sample house (good for bim-like stuff with many display meshes)
  'https://speckle.xyz/streams/da9e320dad/commits/5388ef24b8'
  // 'Super' heavy revit shit
  // 'https://speckle.xyz/streams/e6f9156405/commits/0694d53bb5'
  // Same sample revit house, local to dim's computer
  // 'http://localhost:3000/streams/6960695d7b/commits/da0a2343fa'
  // 'http://100.66.180.109:3000/streams/6960695d7b/commits/417526751d'
  // IFC building (good for a tree based structure)
  // 'https://latest.speckle.dev/streams/92b620fb17/commits/2ebd336223'
  // IFC story, a subtree of the above
  // 'https://latest.speckle.dev/streams/92b620fb17/objects/8247bbc53865b0e0cb5ee4e252e66216'
  // Small scale lines
  // 'https://speckle.xyz/streams/638d3b1f83/commits/6025e2b546?c=%5B2.18058,-0.20814,9.67642,3.85491,5.05364,0,0,1%5D'
  // 'https://latest.speckle.dev/streams/3ed8357f29/commits/d10f2af1ce'
  // 'https://latest.speckle.dev/streams/444bfbd6e4/commits/e22f696b08'
  // 'https://latest.speckle.dev/streams/92b620fb17/commits/af6098915b?c=%5B0.02144,-0.0377,0.05554,0.00566,0.00236,0,0,1%5D'
  // AutoCAD
  // 'https://latest.speckle.dev/streams/3ed8357f29/commits/d10f2af1ce'
)
