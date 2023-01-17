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
// params.verbose = true

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
    viewer.setSectionBox()
    return
  }
  if (!selectionInfo.multiple) multiSelectList.length = 0

  const guids = multiSelectList.map((val) => val.hits[0].guid)
  if (
    (selectionInfo.multiple && !guids.includes(selectionInfo.hits[0].guid)) ||
    multiSelectList.length === 0
  ) {
    multiSelectList.push(selectionInfo)
  }

  const ids = multiSelectList.map((val) => val.hits[0].object.id)
  // console.log(ids[0])
  await viewer.selectObjects(ids as string[])
})

viewer.on(ViewerEvent.ObjectDoubleClicked, async (selectionInfo: SelectionEvent) => {
  if (!selectionInfo) {
    viewer.zoom()
    return
  }

  viewer.zoom([selectionInfo.hits[0].object.id as string])
})

sandbox.makeGenericUI()
sandbox.makeSceneUI()
sandbox.makeFilteringUI()
sandbox.makeBatchesUI()
// Load demo object

await sandbox.loadUrl(
  // 'https://speckle.xyz/streams/da9e320dad/commits/5388ef24b8?c=%5B-7.66134,10.82932,6.41935,-0.07739,-13.88552,1.8697,0,1%5D'
  // Revit sample house (good for bim-like stuff with many display meshes)
  // 'https://speckle.xyz/streams/da9e320dad/commits/5388ef24b8'
  // 'Super' heavy revit shit
  // 'https://speckle.xyz/streams/e6f9156405/commits/0694d53bb5'
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
  //Blizzard world
  // 'https://latest.speckle.dev/streams/0c6ad366c4/commits/aa1c393aec'
  //Car
  // 'https://latest.speckle.dev/streams/17d2e25a97/commits/6b6cf3d43e'
  // Jonathon's
  // 'https://latest.speckle.dev/streams/501258ee5f/commits/f885570011'
  // Alex's cube
  // 'https://latest.speckle.dev/streams/46e3e0e1ec/commits/a6392c19d6?c=%5B6.85874,2.9754,0.79022,0,0,0,0,1%5D'
  // Groups of groups
  // 'https://speckle.xyz/streams/1ce562e99a/commits/6fa28a5a0f'
  // Arc flowers
  // 'https://latest.speckle.dev/streams/9e6c4343ba/commits/037e382aa2'
  // Car lines
  // 'https://speckle.xyz/streams/638d3b1f83/commits/6025e2b546?c=%5B2.18058,-0.20814,9.67642,3.85491,5.05364,0,0,1%5D'
  // Arc and lines
  // ' https://speckle.xyz/streams/99abc74dd4/commits/b32fdcf171?c=%5B198440.6051,6522070.21462,19199.49584,176653.24219,6523663.5,0,0,1%5D'
  // AUTOCAD test stream
  // 'https://latest.speckle.dev/streams/3ed8357f29/commits/b49bfc73ea'
  // REVIT test stream
  // 'https://latest.speckle.dev/streams/c544db35f5/commits/7c29374369'
  // Arcs
  // 'https://latest.speckle.dev/streams/0c6ad366c4/commits/912d83412e'
  // Freezers
  // 'https://speckle.xyz/streams/f0532359ac/commits/98678e2a3d?c=%5B2455.15367,2689.87156,4366.68444,205.422,-149.41199,148.749,0,1%5D'
  //Gergo's house
  // 'https://latest.speckle.dev/streams/c1faab5c62/commits/78bdd8eb76'
  // Point cloud
  // 'https://latest.speckle.dev/streams/2d19273d31/commits/9ceb423feb'
  // Luis sphere
  // 'https://speckle.xyz/streams/b85d53c3b4/commits/b47f21b707'
  // Crankshaft
  // 'https://speckle.xyz/streams/c239718aff/commits/b3a8cfb97d'
  // Building AO params
  // 'https://latest.speckle.dev/streams/0dd74866d0/commits/317e210afa'
  // Murder Cube
  // 'https://latest.speckle.dev/streams/c1faab5c62/commits/7f0c4d2fc1/'
  // Classroom
  // 'https://speckle.xyz/streams/0208ffb67b/commits/a980292728'
  // 'https://latest.speckle.dev/streams/4658eb53b9/commits/328bd99997'
  // 'https://latest.speckle.dev/streams/83e18d886f/commits/532bd6be3e'
  // 'https://latest.speckle.dev/streams/1c2b3db9fb/commits/f12861736e'
  // 'https://latest.speckle.dev/streams/1c2b3db9fb/commits/1015d417ea'
  // Jedd's views
  // 'https://latest.speckle.dev/streams/c1faab5c62/commits/e6632fe057'
  // 'https://latest.speckle.dev/streams/7d051a6449/commits/7632757a33'
  // 'https://latest.speckle.dev/streams/4658eb53b9/commits/d8ec9cccf7'
  // MEPs (whatever they are)
  // 'https://latest.speckle.dev/streams/85bc4f61c6/commits/8575fe2978'
  // Alex cubes
  // 'https://latest.speckle.dev/streams/4658eb53b9/commits/d8ec9cccf7'
  // Tekla
  // 'https://latest.speckle.dev/streams/caec6d6676/commits/588c731104'
  // Purple market square
  // 'https://latest.speckle.dev/streams/4ed51ed832/commits/5a313ac116'
  // Sum building
  // 'https://latest.speckle.dev/streams/92b620fb17/commits/4ea2759162'
  // Boat
  // 'https://latest.speckle.dev/streams/92b620fb17/commits/ba5df427db'
  // 'https://latest.speckle.dev/streams/92b620fb17/commits/c9ebe49824'
  // Dim's dome
  // 'https://latest.speckle.dev/streams/92b620fb17/commits/158d4e8bec'
  // Engines 'n Shit
  // 'https://latest.speckle.dev/streams/92b620fb17/commits/80b25e6e6c'
  // Dim's tower
  // 'https://latest.speckle.dev/streams/92b620fb17/commits/7fd3ec04c0'
  //COD
  // 'https://latest.speckle.dev/streams/d3c83b47bf/commits/5f76b7ef3d?overlay=34577a1a92,571d460754,4c39b56c32,a62dd3a5da&c=%5B2046.38919,1074.97765,125.18054,2088.91862,1025.71927,94.66317,0,1%5D'
  // 'https://latest.speckle.dev/streams/4658eb53b9/commits/0feb23d263'
  // Jonathon's not loading
  // 'https://speckle.xyz/streams/ca99defd4b/commits/589b265c99'
  // Jonathon's 3070
  // 'https://speckle.xyz/streams/7ce9010d71/commits/d29e56fe75'
  // Filter issue
  // 'https://speckle.xyz/streams/f95d8deb90/commits/30f31becb6'
  // Transparent
  // 'https://latest.speckle.dev/streams/b5cc4e967c/objects/20343e0e8d469613a9d407499a6c38b1'
  // dark
  // 'https://latest.speckle.dev/streams/b5cc4e967c/commits/efdf3e2728?c=%5B-59.16128,-41.76491,-4.77376,-4.08052,-12.63558,-4.77376,0,1%5D'
  // 'https://latest.speckle.dev/streams/92b620fb17/commits/b4366a7086?filter=%7B%7D&c=%5B-31.02357,37.60008,96.58899,11.01564,7.40652,66.0411,0,1%5D)'
  // double
  'https://latest.speckle.dev/streams/92b620fb17/commits/b4366a7086?overlay=c009dbe144&filter=%7B%7D&c=%5B-104.70053,-98.80617,67.44669,6.53096,1.8739,38.584,0,1%5D'
)
