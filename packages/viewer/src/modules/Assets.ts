import {
  Texture,
  WebGLRenderer,
  TextureLoader,
  Color,
  DataTexture,
  DataTextureLoader,
  Matrix4,
  Euler,
  ClampToEdgeWrapping,
  LinearFilter,
  FloatType
} from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { type Asset, AssetType } from '../IViewer'
import Logger from 'js-logger'
import { RotatablePMREMGenerator } from './objects/RotatablePMREMGenerator'
import { Image as CanvasImage, createCanvas } from 'canvas'

export class Assets {
  public static _cache: { [name: string]: Texture | Font } = {}

  private static getLoader(
    assetType: AssetType
  ): TextureLoader | DataTextureLoader | null {
    if (!Object.values(AssetType).includes(assetType)) {
      Logger.warn(`Asset ${assetType} could not be loaded. Unknown type`)
      return null
    }
    switch (assetType) {
      case AssetType.TEXTURE_EXR:
        return new EXRLoader()
      case AssetType.TEXTURE_8BPP:
        return new TextureLoader()
      default:
        return null
    }
  }

  private static hdriToPMREM(renderer: WebGLRenderer, hdriTex: Texture): Texture {
    const generator = new RotatablePMREMGenerator(renderer)
    const mat = new Matrix4().makeRotationFromEuler(
      new Euler(-Math.PI * 0.5, 0, -Math.PI * 0.5)
    )
    generator.compileProperEquirectShader(mat)
    const pmremRT = generator.fromEquirectangular(hdriTex)
    generator.dispose()
    return pmremRT.texture
  }

  public static getEnvironment(
    asset: Asset,
    renderer: WebGLRenderer
  ): Promise<Texture> {
    if (this._cache[asset.id]) {
      return Promise.resolve(
        Assets.hdriToPMREM(renderer, this._cache[asset.id] as Texture)
      )
    }

    return new Promise<Texture>((resolve, reject) => {
      const loader = Assets.getLoader(asset.type)
      if (loader) {
        if (asset.src) {
          loader.load(
            asset.src,
            (texture) => {
              this._cache[asset.id] = texture
              resolve(Assets.hdriToPMREM(renderer, texture))
            },
            undefined,
            (error: ErrorEvent) => {
              reject(`Loading asset ${asset.id} failed ${error.message}`)
            }
          )
        } else if (asset.contentsBuffer) {
          const texData = (loader as EXRLoader).parse(asset.contentsBuffer)
          if (!texData) reject(`Loading asset ${asset.id} failed`)
          const texture = new DataTexture(
            texData.data,
            texData.width,
            texData.height,
            texData.format,
            FloatType,
            undefined,
            ClampToEdgeWrapping,
            ClampToEdgeWrapping,
            LinearFilter,
            LinearFilter,
            1
          )
          texture.needsUpdate = true
          this._cache[asset.id] = texture
          resolve(Assets.hdriToPMREM(renderer, texture))
        }
      } else {
        reject(`Loading asset ${asset.id} failed`)
      }
    })
  }

  public static getTexture(asset: Asset): Promise<Texture> {
    if (this._cache[asset.id]) {
      return Promise.resolve(this._cache[asset.id] as Texture)
    }
    return new Promise<Texture>((resolve, reject) => {
      if (asset.src) {
        if (asset.src.includes('data:image')) {
          const image = new CanvasImage()
          image.src = asset.src
          image.onload = () => {
            const canvas = createCanvas(image.width, image.height)
            const ctx = canvas.getContext('2d')
            ctx.drawImage(image, 0, 0)
            const texture = new Texture(new Image())
            texture.needsUpdate = true
            this._cache[asset.id] = texture
            resolve(texture)
          }
          image.onerror = (ev) => {
            reject(`Loading asset ${asset.id} failed with ${ev.toString()}`)
          }
        } else {
          const loader = Assets.getLoader(asset.type)
          if (loader) {
            if (asset.src) {
              loader.load(
                asset.src,
                (texture) => {
                  this._cache[asset.id] = texture
                  resolve(this._cache[asset.id] as Texture)
                },
                undefined,
                (error: ErrorEvent) => {
                  reject(`Loading asset ${asset.id} failed ${error.message}`)
                }
              )
            }
          } else {
            reject(`Loading asset ${asset.id} failed`)
          }
        }
      }
      if (asset.contentsBuffer) {
        const image = new CanvasImage()
        image.onload = () => {
          const canvas = createCanvas(image.width, image.height)
          const ctx = canvas.getContext('2d')
          ctx.drawImage(image, 0, 0)
          const texture = new Texture(new Image())
          texture.needsUpdate = true
          this._cache[asset.id] = texture
          resolve(texture)
        }
        image.onerror = (err) => {
          throw err
        }
        image.src = Buffer.from(asset.contentsBuffer)
      }
    })
  }

  public static getFont(asset: Asset): Promise<Font> {
    if (this._cache[asset.id]) {
      return Promise.resolve(this._cache[asset.id] as Font)
    }

    return new Promise<Font>((resolve, reject) => {
      if (asset.src) {
        new FontLoader().load(
          asset.src,
          (font: Font) => {
            resolve(font)
          },
          undefined,
          (error: ErrorEvent) => {
            reject(`Loading asset ${asset.id} failed ${error.message}`)
          }
        )
      }
    })
  }

  /** To be used wisely */
  public static async getTextureData(asset: Asset): Promise<ImageData> {
    const texture = await Assets.getTexture(asset)
    const canvas = document.createElement('canvas')
    canvas.width = texture.image.width
    canvas.height = texture.image.height

    const context = canvas.getContext('2d')
    /** As you can see here https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext#return_value
     *  The only valid cases where `getContext` returns null are:
     *  - "contextType doesn't match a possible drawing context" Definetely not the case as we're providing '2d'!
     *  - "differs from the first contextType requested". It can't since **we're only requesting a context once**!
     *  - If it returns null outside of these two casese, you have bigger problems than us throwing an exception here
     */
    if (!context) throw new Error('Fatal! 2d context could not be retrieved.')

    context.drawImage(texture.image, 0, 0)

    const data = context.getImageData(0, 0, canvas.width, canvas.height)
    return Promise.resolve(data)
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
    // const canvas = document.createElement('canvas')
    // canvas.width = width
    // canvas.height = height
    // const context = canvas.getContext('2d')
    // const imageData = new ImageData(width, height)
    // imageData.data.set(data)
    // context.putImageData(imageData, 0, 0)
    // console.log('SRC:', canvas.toDataURL())

    return texture
  }
}
