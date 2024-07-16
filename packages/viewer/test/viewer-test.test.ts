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

test('Viewer', { timeout: 20000 }, async () => {
  const width = 64
  const height = 64
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
  viewer.createExtension(CameraController)

  viewer.on(ViewerEvent.LoadComplete, () => {
    viewer.getRenderer().render()
    setTimeout(() => {
      const pixels = new Uint8Array(width * height * 4)
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      process.stdout.write(['P3\n# gl.ppm\n', width, ' ', height, '\n255\n'].join(''))
      for (let i = 0; i < pixels.length; i += 4) {
        for (let j = 0; j < 3; ++j) {
          process.stdout.write(pixels[i + j] + ' ')
        }
      }
    }, 1000)
  })

  const url = 'https://speckle.xyz/streams/da9e320dad/commits/5388ef24b8'
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
    await viewer.loadObject(loader, false)
  }
  // console.warn(viewer.getRenderer().renderingStats)
})
