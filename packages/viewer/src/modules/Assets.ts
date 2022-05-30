import { Texture, PMREMGenerator, WebGLRenderer, TextureLoader } from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { Asset, AssetType } from '../IViewer'

export class Assets {
  private _cache: { [name: string]: Texture } = {}
  private pmremGenerator: PMREMGenerator

  public constructor(renderer: WebGLRenderer) {
    this.pmremGenerator = new PMREMGenerator(renderer)
    this.pmremGenerator.compileEquirectangularShader()
  }

  private getLoader(src: string, assetType: AssetType): TextureLoader {
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

  public getEnvironment(asset: Asset | string): Promise<Texture> {
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
      const loader = this.getLoader(srcUrl, assetType)
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
}
