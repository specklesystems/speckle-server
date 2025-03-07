import {
  Load,
  LoadArgs,
  PreviewGenerator,
  PreviewResult,
  TakeScreenshot
} from '@speckle/shared/dist/esm/previews/interface.js'
import {
  Viewer,
  DefaultViewerParams,
  SpeckleLoader,
  UrlHelper,
  UpdateFlags
} from '@speckle/viewer'
import { CameraController } from '@speckle/viewer'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window extends PreviewGenerator {}
}

let viewer: Viewer | undefined = undefined

const init = async (): Promise<Viewer> => {
  /** Get the HTML container */
  const container = document.getElementById('renderer') as HTMLElement

  /** Configure the viewer params */
  const params = DefaultViewerParams
  params.showStats = false
  params.verbose = false

  /** Create Viewer instance */
  const viewer = new Viewer(container, params)
  /** Initialise the viewer */
  await viewer.init()

  /** Add the stock camera controller extension */
  viewer.createExtension(CameraController)
  return viewer
}

const load: Load = async ({ url, token }: LoadArgs) => {
  if (!viewer) viewer = await init()
  /** Create a loader for the speckle stream */
  const resourceUrls = await UrlHelper.getResourceUrls(url, token)
  for (const resourceUrl of resourceUrls) {
    const loader = new SpeckleLoader(viewer.getWorldTree(), resourceUrl, token)
    /** Load the speckle data */
    await viewer.loadObject(loader, true)
  }
}

window.load = load

// TODO: replace with sleep from speckle/shared
const waitForAnimation = async (ms = 70) =>
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

const takeScreenshot: TakeScreenshot = async () => {
  if (!viewer) viewer = await init()
  const ret: PreviewResult = {
    durationSeconds: 0,
    screenshots: {}
  }

  const t0 = Date.now()

  viewer.resize()
  const cameraController = viewer.getExtension(CameraController)
  cameraController.setCameraView([], false, 0.95)
  await waitForAnimation(100)

  for (let i = 0; i < 24; i++) {
    cameraController.setCameraView({ azimuth: Math.PI / 12, polar: 0 }, false)
    viewer.requestRender(UpdateFlags.RENDER_RESET)
    await waitForAnimation(10)
    ret.screenshots[i + ''] = await viewer.screenshot()
  }
  ret.durationSeconds = (Date.now() - t0) / 1000
  return ret
}
window.takeScreenshot = takeScreenshot
