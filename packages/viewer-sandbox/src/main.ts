/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  DefaultViewerParams,
  SelectionEvent,
  ViewerEvent,
  Viewer,
  CameraController,
  ViewModes
} from '@speckle/viewer'

import './style.css'
import Sandbox from './Sandbox'
import {
  SelectionExtension,
  MeasurementsExtension,
  ExplodeExtension,
  DiffExtension,
  FilteringExtension
} from '@speckle/viewer'
import { SectionTool } from '@speckle/viewer'
import { SectionOutlines } from '@speckle/viewer'
import { ViewModesKeys } from './Extensions/ViewModesKeys'

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
  viewer.createExtension(SectionOutlines)
  const measurements = viewer.createExtension(MeasurementsExtension)
  const filtering = viewer.createExtension(FilteringExtension)
  const explode = viewer.createExtension(ExplodeExtension)
  const diff = viewer.createExtension(DiffExtension)
  viewer.createExtension(ViewModes)
  viewer.createExtension(ViewModesKeys)
  // const boxSelect = viewer.createExtension(BoxSelection)
  // const rotateCamera = viewer.createExtension(RotateCamera)
  cameraController // use it
  selection // use it
  sections // use it
  measurements // use it
  filtering // use it
  explode // use it
  diff // use it
  // rotateCamera // use it
  // boxSelect // use it

  const sandbox = new Sandbox(controlsContainer, viewer, multiSelectList)

  window.addEventListener('load', () => {
    viewer.resize()
  })

  viewer.on(ViewerEvent.ObjectClicked, (event: SelectionEvent | null) => {
    if (event) console.log(event.hits[0].node.model.id)
  })

  viewer.on(ViewerEvent.LoadComplete, async () => {
    console.warn(viewer.getRenderer().renderingStats)
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

const getStream = () => {
  return (
    // prettier-ignore
    // 'https://app.speckle.systems/streams/da9e320dad/commits/5388ef24b8?c=%5B-7.66134,10.82932,6.41935,-0.07739,-13.88552,1.8697,0,1%5D'
    // Revit sample house (good for bim-like stuff with many display meshes)
    'https://app.speckle.systems/streams/da9e320dad/commits/5388ef24b8'
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/ab1a1ab2b6'
    // 'https://app.speckle.systems/streams/da9e320dad/commits/5388ef24b8'
    // 'https://latest.speckle.systems/streams/58b5648c4d/commits/60371ecb2d'
    // 'Super' heavy revit shit
    // 'https://app.speckle.systems/streams/e6f9156405/commits/0694d53bb5'
    // IFC building (good for a tree based structure)
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/2ebd336223'
    // IFC story, a subtree of the above
    // 'https://latest.speckle.systems/streams/92b620fb17/objects/8247bbc53865b0e0cb5ee4e252e66216'
    // Izzy's garden
    // 'https://latest.speckle.systems/streams/c43ac05d04/commits/ec724cfbeb'
    // Small scale lines
    // 'https://app.speckle.systems/streams/638d3b1f83/commits/6025e2b546?c=%5B2.18058,-0.20814,9.67642,3.85491,5.05364,0,0,1%5D'
    // 'https://latest.speckle.systems/streams/3ed8357f29/commits/d10f2af1ce'
    // 'https://latest.speckle.systems/streams/444bfbd6e4/commits/e22f696b08'
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/af6098915b?c=%5B0.02144,-0.0377,0.05554,0.00566,0.00236,0,0,1%5D'
    // AutoCAD OLD
    // 'https://latest.speckle.systems/streams/3ed8357f29/commits/d10f2af1ce'
    // AutoCAD NEW
    // 'https://latest.speckle.systems/streams/3ed8357f29/commits/46905429f6'
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
    // Alex more cubes
    // 'https://latest.speckle.systems/streams/4658eb53b9/commits/31a8d5ff2b'
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
    // 'https://latest.speckle.systems/streams/f92e060177/commits/f51ee777d5'
    // 'https://latest.speckle.systems/streams/f92e060177/commits/bbd821e3a1'
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

    // Lines with numeric filter
    // 'https://app.speckle.systems/streams/16a7ca997a/commits/91d82f4ea1'

    // Type inheritence
    // 'https://app.speckle.systems/streams/4063469c0b/objects/ce831723f2a3a56a30dfbca54a53c90f'
    // Sum groups
    // 'https://latest.speckle.systems/streams/58b5648c4d/commits/7e2afe5535'
    // 'https://latest.speckle.systems/streams/58b5648c4d/objects/608bc2d53de17e3fd3a6ca9ef525ca79'

    // 'https://latest.speckle.systems/streams/92b620fb17/commits/4da17d07da'
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/e2db7d277b'
    // Bunch a points
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/0dee6dbd98'
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/f9063fe647'
    // 'https://app.speckle.systems/streams/be0f962efb/objects/37639741c363a123100eda8044f2fe3f'
    // 'https://latest.speckle.systems/streams/92b620fb17/objects/a4e2fad01e69cd886ecbfedf221f5301'
    // 'https://latest.speckle.systems/streams/3f895e614f/commits/7e16d2ab71'
    // 'https://latest.speckle.systems/streams/55cc1cbf0a/commits/aa72674507'
    // 'https://latest.speckle.systems/streams/55cc1cbf0a/objects/44aa4bad23591f90484a9a63814b9dc9'
    // 'https://latest.speckle.systems/streams/55cc1cbf0a/objects/3a21694b533826cf551d4e2ff9963397'
    // 'https://latest.speckle.systems/streams/55cc1cbf0a/commits/a7f74b6524'
    // 'https://latest.speckle.systems/streams/c1faab5c62/objects/d3466547df9df86397eb4dff7ac9713f'
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/140c443886'
    // 'https://latest.speckle.systems/streams/e258b0e8db/commits/108971810d'
    // 'https://latest.speckle.systems/streams/e258b0e8db/objects/3fcd63d80cf791c3f554a795846e62f6'
    // 'https://latest.speckle.systems/streams/55cc1cbf0a/objects/d7ae178fb6a7b1f599a177486e14f9a6'
    // 'https://latest.speckle.systems/streams/e258b0e8db/objects/3fcd63d80cf791c3f554a795846e62f6'
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/6adbcfa8dc'
    // 'https://latest.speckle.systems/streams/b68abcbf2e/commits/4e94ecad62'
    // Big ass mafa'
    // 'https://app.speckle.systems/streams/88307505eb/objects/a232d760059046b81ff97e6c4530c985'
    // Airport
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/dfb9ca025d'
    // 'https://latest.speckle.systems/streams/92b620fb17/objects/cf8838025d9963b342b09da8de0f8b6b'
    // 'Blocks with elements
    // 'https://latest.speckle.systems/streams/e258b0e8db/commits/00e165cc1c'
    // 'https://latest.speckle.systems/streams/e258b0e8db/commits/e48cf53add'
    // 'https://latest.speckle.systems/streams/e258b0e8db/commits/c19577c7d6?c=%5B15.88776,-8.2182,12.17095,18.64059,1.48552,0.6025,0,1%5D'
    // 'https://app.speckle.systems/streams/46caea9b53/commits/71938adcd1'
    // 'https://app.speckle.systems/streams/2f9f2f3021/commits/75bd13f513'
    // 'https://app.speckle.systems/streams/0a2f096caf/commits/eee0e4436f?overlay=72828bce0d&c=%5B14.04465,-332.88372,258.40392,53.09575,31.13694,126.39999,0,1%5D&filter=%7B%22propertyInfoKey%22%3A%22level.name%22%7D'
    // 'Bilal's tests
    // 'https://latest.speckle.systems/streams/97750296c2/commits/5386a0af02' // 700k+ objects 30kk tris
    // 'https://latest.speckle.systems/streams/97750296c2/commits/2a6fd781f2' // NEW

    // 'https://latest.speckle.systems/streams/97750296c2/commits/48f0567a88' // 1015849 objects
    // 'https://latest.speckle.systems/streams/97750296c2/commits/aec0841f7e' // 11k objects
    // 'https://latest.speckle.systems/streams/97750296c2/commits/96ffc3c786' // 92209 objects
    // 'https://latest.speckle.systems/streams/97750296c2/commits/92115d3789' // 390974 objects 19kk tris
    // 'https://latest.speckle.systems/streams/97750296c2/commits/a3c8388d89' // 145593 objects 100kk tris o_0
    // 'https://latest.speckle.systems/streams/97750296c2/commits/2584ad524d' // 22888 objects
    // 'https://latest.speckle.systems/streams/97750296c2/commits/2bb21d31d6' // 619129 objects
    // 'https://latest.speckle.systems/streams/97750296c2/commits/7cfb96a6b0' // 84452 objects
    // 'https://latest.speckle.systems/streams/97750296c2/commits/92a7c35b8b' // 121395 objects
    // 'https://latest.speckle.systems/streams/97750296c2/commits/2f5803a19e' // 47696 objects

    // Alex facade
    // 'https://latest.speckle.systems/streams/0cf9e393c4/commits/f4e11a8b01'
    // 'https://latest.speckle.systems/streams/0cf9e393c4/commits/3c5cb3f539'
    // 'https://latest.speckle.systems/streams/0cf9e393c4/commits/13729601f3'

    // Weird IFC
    // 'https://app.speckle.systems/streams/25d8a162af/commits/6c842a713c'
    // 'https://app.speckle.systems/streams/25d8a162af/commits/6c842a713c'
    // 'https://app.speckle.systems/streams/76e3acde68/commits/0ea3d47e6c'
    // Point cloud
    // 'https://app.speckle.systems/streams/b920636274/commits/8df6496749'
    // 'https://multiconsult.speckle.xyz/streams/9721fe797c/objects/ff5d939a8c26bde092152d5b4a0c945d'
    // 'https://app.speckle.systems/streams/87a2be92c7/objects/803c3c413b133ee9a6631160ccb194c9'
    // 'https://latest.speckle.systems/streams/1422d91a81/commits/480d88ba68'
    // 'https://latest.speckle.systems/streams/92b620fb17/commits/14085847b0'
    // 'https://latest.speckle.systems/streams/e258b0e8db/commits/eb6ad592f1'
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/8c9d3eefa2'
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/7589880b8e'
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/d721ab8df4'
    // Big ass tower
    // 'https://latest.speckle.systems/streams/0cf9e393c4/commits/cef3f40be2'
    // 'https://latest.speckle.systems/streams/0cf9e393c4/commits/f4e11a8b01'

    // Far away instances
    // 'https://latest.speckle.systems/streams/ee5346d3e1/commits/576310a6d5'
    // 'https://latest.speckle.systems/streams/ee5346d3e1/commits/489d42ca8c'
    // 'https://latest.speckle.systems/streams/97750296c2/objects/11a7752e40b4ef0620affc55ce9fdf5a'
    // 'https://app.speckle.systems/streams/0ed2cdc8eb/commits/350c4e1a4d'

    // 'https://latest.speckle.systems/streams/92b620fb17/objects/7118603b197c00944f53be650ce721ec'

    // Blender Mega Test Stream
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/2ecb757577'
    // 'https://latest.speckle.systems/streams/c1faab5c62/commits/3deaea94af'
    // Text and Dimensions
    // 'https://latest.speckle.systems/streams/3f895e614f/commits/fbc78286c9'
    // 'https://latest.speckle.systems/streams/55cc1cbf0a/commits/aa72674507'

    // 'https://latest.speckle.systems/streams/55cc1cbf0a/commits/a7f74b6524'
    // 'https://latest.speckle.systems/streams/85e05b8c72/commits/53f4328211'
    // 'https://latest.speckle.systems/streams/aea12cab71/commits/787ade768e'

    // 'https://latest.speckle.systems/streams/e9285828d7/commits/9b80b7a70c'
    // 'https://app.speckle.systems/streams/b85d53c3b4/commits/be26146460'
    // Germany
    // 'https://latest.speckle.systems/streams/7117052f4e/commits/a646bf659e'
    // 'https://latest.speckle.systems/streams/aea12cab71/commits/787ade768e'
    // 'https://app.speckle.systems/streams/a29e5c7772/commits/a8cfae2645'
    // 'https://latest.speckle.systems/streams/9d71f041b2/commits/01279333e5'
    // 'https://latest.speckle.systems/streams/65c512f4ea/commits/cc2490830a'
    // 'https://latest.speckle.systems/streams/65c512f4ea/objects/882497528d1fa06660c28c1fd6aa15e0'
    // 'https://app.speckle.systems/streams/b4086833f8/commits/94df4c6d16'

    // Rebar
    // 'https://app.speckle.systems/streams/b4086833f8/commits/94df4c6d16?overlay=c5b9c260ea,e3dc287d61,eaedd7d0a5,7f126ce0dd,02fee34ce3,9bda31611f,110282c4db,533c311e29,bf6814d779,1ba52affcf,cc4e75125e,3fd628e4e3'
    // Nice towers
    // 'https://latest.speckle.systems/streams/f4efe4bd7f/objects/5083dffc2ce54ce64c1fc4fab48ca877'
    //
    // 'https://app.speckle.systems/streams/7b253e5c4c/commits/025fcbb9cf'
    // BIG railway
    // 'https://latest.speckle.systems/streams/a64b432b34/commits/cf7725e404'
    // 'https://latest.speckle.systems/streams/a64b432b34/objects/1806cb8082a4202b01d97601b6e19af8'
    // 'https://latest.speckle.systems/streams/a64b432b34/objects/a7ab2388948594e89f838f3026b89839'
    // 'https://latest.speckle.systems/streams/a64b432b34/commits/99d809460a'
    // Bunch a doors
    // 'https://latest.speckle.systems/streams/a64b432b34/commits/c184ba7d88'
    // 'https://app.speckle.systems/streams/8f73d360e7/commits/2cb768cecd'
    // Tiny cube
    // 'https://app.speckle.systems/streams/8f73d360e7/commits/2cb768cecd'
    // Shiny
    // 'https://latest.speckle.systems/projects/e8b81c24f5/models/759186b9ec'
    // 'https://latest.speckle.systems/projects/c1faab5c62/models/c8ca2dcbe2@f79f9fe600'
    // 'https://app.speckle.systems/projects/7591c56179/models/0185a7c62e'
    // 'https://app.speckle.systems/projects/24c98619ac/models/38639656b8'
    // 'https://app.speckle.systems/projects/96c43c61a6/models/fd12973e73'
    // 'https://latest.speckle.systems/projects/2099ac4b5f/models/5d6eb30c16'
    // Points with display style
    // 'https://latest.speckle.systems/projects/7117052f4e/models/95c27a604d@1fa0e17f84'
    // Sum fucking pipes
    // 'https://app.speckle.systems/projects/122448a81e/models/f21aff1f4a'
    // Thin plane
    // 'https://app.speckle.systems/projects/20f72acc58/models/2cf8a736f8'
    // Rhino sRGB vertex colors
    // 'https://app.speckle.systems/projects/47bbaf594f/models/ef78e94f72'
    // 'https://app.speckle.systems/projects/47bbaf594f/models/de52414725f8937b1f0e2f550ef9ca52'
    // qGIS sRGB vertex colors
    // 'https://latest.speckle.systems/projects/5a6609a4b9/models/10f4931e8c'
    // DUI3 blocks
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/c6f3f309a2'
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/6b62c61a22'
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/4dc5265453'

    // DUI3 Render materials
    // 'https://app.speckle.systems/projects/93200a735d/models/cbacd3eaeb'
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/7a5e738c76'
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/0a4181c73b'
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/bcf086cdc4'
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/6221c985c0'

    // DUI3 Color Proxies
    // 'https://app.speckle.systems/projects/93200a735d/models/d1fbf678f1'
    // ' https://app.speckle.systems/projects/93200a735d/models/d1fbf678f1'
    // 'https://app.speckle.systems/projects/b53a53697a/models/93fa215ba9'
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/5ec85fc2a2'
    // 'https://latest.speckle.systems/projects/2af60ce1b6/models/09dbceb25f@5af6d6a3f4'
    // 'https://latest.speckle.systems/projects/2af60ce1b6/models/09dbceb25f@ebb895355d'

    // Backfaces
    // 'https://app.speckle.systems/projects/69bf87aa61/models/c8f443a03e'

    // 'https://app.speckle.systems/projects/cdaeb201d9/models/1ad10b0a5b'
    // 'https://app.speckle.systems/projects/93200a735d/models/d1fbf678f1@088537140b'
    // 'https://app.speckle.systems/projects/93200a735d/models/e3c3849167'
    // 'https://app.speckle.systems/projects/93200a735d/models/d1fbf678f1@088537140b'
    // 'https://app.speckle.systems/projects/93200a735d/models/e3c3849167'

    // Text with no material
    // 'https://latest.speckle.systems/projects/731c6e2fd1/models/bcd3a4a706'
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/44a3cddb93'
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/afec5fcb04@0c2ad0b86b'
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/44a3cddb93'
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/44a3cddb93@31654f1e2c'
    // Homepage
    // 'https://app.speckle.systems/projects/0c1ea0ca62/models/729a6f557d@9bff3c6f1f'

    // BREPs as display values
    // 'https://latest.speckle.systems/projects/126cd4b7bb/models/b613d77690@046b56bf12'

    // 'https://app.speckle.systems/projects/00a5c443d6/models/de56edf901'

    // 'https://app.speckle.systems/projects/6cf358a40e/models/e01ffbc891@f1ddc19011'
    // 'https://latest.speckle.systems/projects/2c5c4cd493/models/cb20c2e87b02003d4b2ddf4df96912b9,8a2c9a45093fecb42273607d0c936d66'

    // 'https://app.speckle.systems/projects/71b33ae013/models/3263c25505'
    // 'https://app.speckle.systems/projects/817c4e8daa/models/f0601ef5f9'

    // Far away house section tool
    // 'https://app.speckle.systems/projects/817c4e8daa/models/f0601ef5f9@80db5ff26a'

    // Perfectly flat
    // 'https://app.speckle.systems/projects/344f803f81/models/5582ab673e'
  )
}

const container0 = document.querySelector<HTMLElement>('#renderer')
if (!container0) {
  throw new Error("Couldn't find app container!")
}

void createViewer('#renderer', getStream())
