import {
  Texture,
  PMREMGenerator,
  WebGLRenderer,
  TextureLoader,
  Color,
  DataTexture
} from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { Asset, AssetType } from '../IViewer'

export class Assets {
  private static _cache: { [name: string]: Texture } = {}
  private static pmremGenerator: PMREMGenerator

  public constructor(renderer: WebGLRenderer) {
    Assets.pmremGenerator = new PMREMGenerator(renderer)
    Assets.pmremGenerator.compileEquirectangularShader()
  }

  private static getLoader(src: string, assetType: AssetType): TextureLoader {
    if (assetType === undefined) assetType = src.split('.').pop() as AssetType
    if (!Object.values(AssetType).includes(assetType)) {
      console.warn(`Asset ${src} could not be loaded. Unknown type`)
      return null
    }
    switch (assetType) {
      case AssetType.TEXTURE_EXR:
        return new EXRLoader()
      case AssetType.TEXTURE_HDR:
        return new RGBELoader()
      case AssetType.TEXTURE_8BPP:
        return new TextureLoader()
    }
  }

  public static getEnvironment(asset: Asset | string): Promise<Texture> {
    let srcUrl: string = null
    let assetType: AssetType = undefined
    if ((<Asset>asset).src) {
      srcUrl = (asset as Asset).src
      assetType = (asset as Asset).type
    } else {
      srcUrl = asset as string
    }
    if (this._cache[srcUrl]) {
      return Promise.resolve(this._cache[srcUrl])
    }

    return new Promise<Texture>((resolve, reject) => {
      const loader = Assets.getLoader(srcUrl, assetType)
      if (loader) {
        loader.load(
          srcUrl,
          (texture) => {
            const pmremRT = this.pmremGenerator.fromEquirectangular(texture)
            this._cache[srcUrl] = pmremRT.texture
            texture.dispose()
            resolve(this._cache[srcUrl])
          },
          undefined,
          (error: ErrorEvent) => {
            reject(`Loading asset ${srcUrl} failed ${error.message}`)
          }
        )
      } else {
        reject(`Loading asset ${srcUrl} failed`)
      }
    })
  }

  /** Will unify with environment fetching soon */
  public static getTexture(asset: Asset | string): Promise<Texture> {
    let srcUrl: string = null
    let assetType: AssetType = undefined
    if ((<Asset>asset).src) {
      srcUrl = (asset as Asset).src
      assetType = (asset as Asset).type
    } else {
      srcUrl = asset as string
    }

    if (this._cache[srcUrl]) {
      return Promise.resolve(this._cache[srcUrl])
    }

    // Hack to load 'data:image's - for some reason, the frontend receives the default
    // gradient map as a data image url, rather than a file (?).
    if (srcUrl.includes('data:image')) {
      const texture = new Texture(srcUrl as unknown as HTMLImageElement)
      texture.needsUpdate = true
      this._cache[srcUrl] = texture
      return Promise.resolve(texture)
    }

    return new Promise<Texture>((resolve, reject) => {
      const loader = Assets.getLoader(srcUrl, assetType)
      if (loader) {
        loader.load(
          srcUrl,
          (texture) => {
            this._cache[srcUrl] = texture
            resolve(this._cache[srcUrl])
          },
          undefined,
          (error: ErrorEvent) => {
            reject(`Loading asset ${srcUrl} failed ${error.message}`)
          }
        )
      } else {
        reject(`Loading asset ${srcUrl} failed`)
      }
    })
  }

  public static generateGradientRampTexture(
    fromColor: string,
    toColor: string,
    steps: number
  ) {
    fromColor
    toColor
    steps
    // NOT NECESSARY AT THE MOMENT. USING STATIC GRADIENT RAMP
  }

  public static generateDiscreetRampTexture(hexColors: number[]): Texture {
    const width = hexColors.length
    const height = 1

    const size = width * height
    const data = new Uint8Array(4 * size)

    for (let k = 0; k < hexColors.length; k++) {
      const stride = k * 4
      const color = new Color(hexColors[k])
      color.convertSRGBToLinear()
      data[stride] = Math.floor(color.r * 255)
      data[stride + 1] = Math.floor(color.g * 255)
      data[stride + 2] = Math.floor(color.b * 255)
      data[stride + 3] = 255
    }

    const texture = new DataTexture(data, width, height)
    texture.needsUpdate = true

    /** In case we want to see what gets generated */
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    const imageData = new ImageData(width, height)
    imageData.data.set(data)
    context.putImageData(imageData, 0, 0)
    console.log('SRC:', canvas.toDataURL())

    return texture
  }
}
