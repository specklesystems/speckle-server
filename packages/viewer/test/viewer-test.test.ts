import { test } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  Assets,
  AssetType,
  CameraController,
  SpeckleLoader,
  UrlHelper,
  Viewer,
  ViewerEvent
} from '../src'
import { readFile } from 'fs/promises'

test('Viewer', { timeout: 50000 }, async () => {
  const width = 128
  const height = 128
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gl = require('gl')(width, height, { preserveDrawingBuffer: true })
  gl
  const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`)
  const viewer = new Viewer(dom.window.document.createElement('div'), undefined, gl)
  // console.log(viewer.getRenderer().renderer.extensions)
  const hdriContents = await readFile('src/assets/hdri/Mild-dwab.png')
  const gradientContents = await readFile('src/assets/gradient.png')
  await Assets.getEnvironment(
    {
      id: 'defaultHDRI',
      type: AssetType.TEXTURE_EXR,
      contentsBuffer: hdriContents.buffer
    },
    viewer.getRenderer().renderer
  )
  await Assets.getTexture({
    id: 'defaultGradient',
    type: AssetType.TEXTURE_8BPP,
    contentsBuffer: gradientContents.buffer
  })
  // Assets._cache['defaultHDRI'] = new EXRLoader().parse(buffer)
  // Assets._cache['defaultGradient'] = new DataTexture(null, 512, 1)
  try {
    await viewer.init()
  } catch (e) {}
  const options = viewer.getRenderer().pipelineOptions
  options.pipelineOutput = 2
  viewer.getRenderer().setSunLightConfiguration({ shadowcatcher: false })
  viewer.getRenderer().pipelineOptions = options
  viewer.resize()
  const camera = viewer.createExtension(CameraController)

  viewer.on(ViewerEvent.LoadComplete, () => {
    camera.setCameraView(undefined, false)
    setInterval(() => {
      viewer.frame()
    }, 3000)
  })

  const url = 'https://latest.speckle.dev/streams/4658eb53b9/commits/d8ec9cccf7'
  const authToken = localStorage.getItem(
    url.includes('latest') ? 'AuthTokenLatest' : 'AuthToken'
  ) as string
  const objUrls = await UrlHelper.getResourceUrls(url, authToken)
  for (const objURL of objUrls) {
    // console.log(`Loading ${url}`)
    const loader = new SpeckleLoader(
      viewer.getWorldTree(),
      objURL,
      authToken,
      true,
      undefined
    )
    await viewer.loadObject(loader, true)
  }
  await new Promise((resolve) => {
    setTimeout(resolve, 20000)
  })
  // console.warn(viewer.getRenderer().renderingStats)
})
