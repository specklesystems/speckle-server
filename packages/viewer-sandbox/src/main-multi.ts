import {
  DefaultViewerParams,
  SelectionEvent,
  ViewerEvent,
  Viewer,
  CameraController,
  SelectionExtension,
  SectionTool,
  SectionOutlines,
  MeasurementsExtension
} from '@speckle/viewer'

import './style.css'
import Sandbox from './Sandbox'

const createViewer = async (containerName: string, stream: string) => {
  const container = document.querySelector<HTMLElement>(containerName)
  const controlsContainer = document.querySelector<HTMLElement>(
    `${containerName}-controls`
  )
  if (!container) {
    throw new Error("Couldn't find #app container!")
  }
  if (!controlsContainer) {
    throw new Error("Couldn't find #app controls container!")
  }

  // Viewer setup
  const params = DefaultViewerParams
  params.showStats = true
  params.verbose = true

  const multiSelectList: SelectionEvent[] = []
  const viewer: Viewer = new Viewer(container, params)
  await viewer.init()

  const cameraController = viewer.createExtension(CameraController)
  const selection = viewer.createExtension(SelectionExtension)
  const sections = viewer.createExtension(SectionTool)
  const sectionOutlines = viewer.createExtension(SectionOutlines)
  const measurements = viewer.createExtension(MeasurementsExtension)
  cameraController // use it
  selection // use it
  sections // use it
  sectionOutlines // use it
  measurements // use it

  const sandbox = new Sandbox(controlsContainer, viewer, multiSelectList)

  window.addEventListener('load', () => {
    viewer.resize()
  })

  viewer.on(ViewerEvent.LoadComplete, () => {
    Object.assign(sandbox.sceneParams.worldSize, viewer.World.worldSize)
    Object.assign(sandbox.sceneParams.worldOrigin, viewer.World.worldOrigin)
    sandbox.refresh()
  })

  viewer.on(ViewerEvent.UnloadComplete, () => {
    Object.assign(sandbox.sceneParams.worldSize, viewer.World.worldSize)
    Object.assign(sandbox.sceneParams.worldOrigin, viewer.World.worldOrigin)
    sandbox.refresh()
  })
  viewer.on(ViewerEvent.UnloadAllComplete, () => {
    Object.assign(sandbox.sceneParams.worldSize, viewer.World.worldSize)
    Object.assign(sandbox.sceneParams.worldOrigin, viewer.World.worldOrigin)
    sandbox.refresh()
  })

  sandbox.makeGenericUI()
  sandbox.makeSceneUI()
  sandbox.makeFilteringUI()
  sandbox.makeBatchesUI()
  sandbox.makeDiffUI()
  sandbox.makeMeasurementsUI()

  await sandbox.loadUrl(stream)
}

void createViewer(
  '#renderer0',
  'https://latest.speckle.systems/streams/0c6ad366c4/commits/aa1c393aec'
)
void createViewer(
  '#renderer1',
  'https://app.speckle.systems/streams/da9e320dad/commits/5388ef24b8'
)

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const getStream = () => {
  return (
    // prettier-ignore
    // 'https://app.speckle.systems/streams/da9e320dad/commits/5388ef24b8?c=%5B-7.66134,10.82932,6.41935,-0.07739,-13.88552,1.8697,0,1%5D'
    // Revit sample house (good for bim-like stuff with many display meshes)

    'https://app.speckle.systems/streams/da9e320dad/commits/5388ef24b8'
    // 'Super' heavy revit shit
    // 'https://app.speckle.systems/streams/e6f9156405/commits/0694d53bb5'
    // IFC building (good for a tree based structure)
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/2ebd336223'
    // IFC story, a subtree of the above
    // 'https://latest.speckle.systems/streams/92b620fb17/objects/8247bbc53865b0e0cb5ee4e252e66216'
    // Small scale lines
    // 'https://app.speckle.systems/streams/638d3b1f83/commits/6025e2b546?c=%5B2.18058,-0.20814,9.67642,3.85491,5.05364,0,0,1%5D'
    // 'https://latest.speckle.systems/streams/3ed8357f29/commits/d10f2af1ce'
    // 'https://latest.speckle.systems/streams/444bfbd6e4/commits/e22f696b08'
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/af6098915b?c=%5B0.02144,-0.0377,0.05554,0.00566,0.00236,0,0,1%5D'
    // AutoCAD
    // 'https://latest.speckle.systems/streams/3ed8357f29/commits/d10f2af1ce'
    //Blizzard world
    // 'https://latest.speckle.systems/streams/0c6ad366c4/commits/aa1c393aec'
    //Car
    // 'https://latest.speckle.systems/streams/17d2e25a97/commits/6b6cf3d43e'
    // Jonathon's
    // 'https://latest.speckle.systems/streams/501258ee5f/commits/f885570011'
    // Alex's cube
    // 'https://latest.speckle.systems/streams/46e3e0e1ec/commits/a6392c19d6?c=%5B6.85874,2.9754,0.79022,0,0,0,0,1%5D'
    // Groups of groups
    // 'https://app.speckle.systems/streams/1ce562e99a/commits/6fa28a5a0f'
    // Arc flowers
    // 'https://latest.speckle.systems/streams/9e6c4343ba/commits/037e382aa2'
    // Car lines
    // 'https://app.speckle.systems/streams/638d3b1f83/commits/6025e2b546?c=%5B2.18058,-0.20814,9.67642,3.85491,5.05364,0,0,1%5D'
    // Arc and lines
    // ' https://app.speckle.systems/streams/99abc74dd4/commits/b32fdcf171?c=%5B198440.6051,6522070.21462,19199.49584,176653.24219,6523663.5,0,0,1%5D'
    // AUTOCAD test stream
    // 'https://latest.speckle.systems/streams/3ed8357f29/commits/b49bfc73ea'
    // REVIT test stream
    // 'https://latest.speckle.systems/streams/c544db35f5/commits/7c29374369'
    // Arcs
    // 'https://latest.speckle.systems/streams/0c6ad366c4/commits/912d83412e'
    // Freezers
    // 'https://app.speckle.systems/streams/f0532359ac/commits/98678e2a3d?c=%5B2455.15367,2689.87156,4366.68444,205.422,-149.41199,148.749,0,1%5D'
    //Gergo's house
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/78bdd8eb76'
    // Point cloud
    // 'https://latest.speckle.systems/streams/2d19273d31/commits/9ceb423feb'
    // 'https://latest.speckle.systems/streams/7707df6cae/commits/02bdf09092'
    // 'https://latest.speckle.systems/streams/ca0378725b/commits/fbae00db5a'
    // Luis sphere
    // 'https://app.speckle.systems/streams/b85d53c3b4/commits/b47f21b707'
    // Crankshaft
    // 'https://app.speckle.systems/streams/c239718aff/commits/b3a8cfb97d'
    // Building AO params
    // 'https://latest.speckle.systems/streams/0dd74866d0/commits/317e210afa'
    // Murder Cube
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/7f0c4d2fc1/'
    // Classroom
    // 'https://app.speckle.systems/streams/0208ffb67b/commits/a980292728'
    // 'https://latest.speckle.systems/streams/4658eb53b9/commits/328bd99997'
    // 'https://latest.speckle.systems/streams/83e18d886f/commits/532bd6be3e'
    // 'https://latest.speckle.systems/streams/1c2b3db9fb/commits/f12861736e'
    // 'https://latest.speckle.systems/streams/1c2b3db9fb/commits/1015d417ea'
    // Jedd's views
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/e6632fe057'
    // 'https://latest.speckle.systems/streams/7d051a6449/commits/7632757a33'
    // 'https://latest.speckle.systems/streams/4658eb53b9/commits/d8ec9cccf7'
    // MEPs (whatever they are)
    // 'https://latest.speckle.systems/streams/85bc4f61c6/commits/8575fe2978'
    // Alex cubes
    // 'https://latest.speckle.systems/streams/4658eb53b9/commits/d8ec9cccf7'
    // Tekla
    // 'https://latest.speckle.systems/streams/caec6d6676/commits/588c731104'
    // Purple market square
    // 'https://latest.speckle.systems/streams/4ed51ed832/commits/5a313ac116'
    // Sum building
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/4ea2759162'
    // Boat
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/ba5df427db'
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/c9ebe49824'
    // Dim's dome
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/158d4e8bec'
    // Engines 'n Shit
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/80b25e6e6c'
    // Dim's tower
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/7fd3ec04c0'
    //COD
    // 'https://latest.speckle.systems/streams/d3c83b47bf/commits/5f76b7ef3d?overlay=34577a1a92,571d460754,4c39b56c32,a62dd3a5da&c=%5B2046.38919,1074.97765,125.18054,2088.91862,1025.71927,94.66317,0,1%5D'
    // 'https://latest.speckle.systems/streams/4658eb53b9/commits/0feb23d263'
    // Jonathon's not loading
    // 'https://app.speckle.systems/streams/ca99defd4b/commits/589b265c99'
    // Jonathon's 3070
    // 'https://app.speckle.systems/streams/7ce9010d71/commits/d29e56fe75'
    // Filter issue
    // 'https://app.speckle.systems/streams/f95d8deb90/commits/30f31becb6'
    // Transparent
    // 'https://latest.speckle.systems/streams/b5cc4e967c/objects/20343e0e8d469613a9d407499a6c38b1'
    // dark
    // 'https://latest.speckle.systems/streams/b5cc4e967c/commits/efdf3e2728?c=%5B-59.16128,-41.76491,-4.77376,-4.08052,-12.63558,-4.77376,0,1%5D'
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/b4366a7086?filter=%7B%7D&c=%5B-31.02357,37.60008,96.58899,11.01564,7.40652,66.0411,0,1%5D)'
    // double
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/b4366a7086?overlay=c009dbe144&filter=%7B%7D&c=%5B-104.70053,-98.80617,67.44669,6.53096,1.8739,38.584,0,1%5D'
    // 'https://latest.speckle.systems/streams/c43ac05d04/commits/ec724cfbeb',
    // 'https://latest.speckle.systems/streams/efd2c6a31d/commits/4b495e1901'
    // 'https://latest.speckle.systems/streams/efd2c6a31d/commits/4b495e1901'
    // tekla 2
    // 'https://app.speckle.systems/streams/be4813ccd2/commits/da85000921?c=%5B-1.12295,-2.60901,6.12402,4.77979,0.555,3.63346,0,1%5D'
    // 'https://latest.speckle.systems/streams/85bc4f61c6/commits/bb7b718a1a'

    // large meshes
    // 'https://app.speckle.systems/streams/48e6e33aa6/commits/2cf892f1b0'
    // large lines
    // 'https://latest.speckle.systems/streams/444bfbd6e4/commits/8f297ad0cd'
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/6b1b1195c4'
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/cef1e7527b'
    // large lines
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/49dad07ae2'
    // Instances Rhino
    // 'https://latest.speckle.systems/streams/f92e060177/commits/1fff853107'
    // Instances Revit
    // 'https://latest.speckle.systems/streams/f92e060177/commits/92858681b7'
    // 'https://latest.speckle.systems/streams/f92e060177/commits/655771674e'
    // 'https://latest.speckle.systems/streams/f92e060177/commits/00dbbf4509'
    // 'https://latest.speckle.systems/streams/f92e060177/commits/46fd255010'
    // 'https://latest.speckle.systems/streams/f92e060177/commits/038a587267'
    // 'https://latest.speckle.systems/streams/3f895e614f/commits/8a3e424997'
    // Big curves
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/49dad07ae2'
    // 'https://app.speckle.systems/streams/7ce9010d71/commits/afda4ffdf8'
    // Jonathon's lines
    // 'https://app.speckle.systems/streams/7ce9010d71/commits/8cd9e7e4fc'
    // 'https://app.speckle.systems/streams/7ce9010d71/objects/f46f95746975591c18b0b854dab5b570 '
    // 'https://app.speckle.systems/streams/813b728084/commits/e2f5ac9775'
    // Overlayhs
    // 'https://latest.speckle.systems/streams/85b9f0b9f5/commits/cdfbf3e036?overlay=71f61af444,00fe449457,53a6692b79'
    //'Rafinery'
    // 'https://app.speckle.systems/streams/b7cac6a6df/commits/2e42381302'
    // 'https://app.speckle.systems/streams/7ce9010d71/commits/b8bbfd0c05?c=%5B-4.50925,11.1348,5.38124,-0.23829,0.68512,-0.09006,0,1%5D'
  )
}
