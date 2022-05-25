import { Texture, PMREMGenerator, WebGLRenderer, TextureLoader } from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

enum AssetType {
  TEXTURE_8BPP = 'png', // For now
  TEXTURE_HDR = 'hdr',
  TEXTURE_EXR = 'exr'
}

export class Assets {
  private _cache: { [name: string]: Texture } = {}
  private pmremGenerator: PMREMGenerator

  public constructor(renderer: WebGLRenderer) {
    this.pmremGenerator = new PMREMGenerator(renderer)
    this.pmremGenerator.compileEquirectangularShader()
  }

  private getLoader(src: string): TextureLoader {
    const bySrc = src.split('.').pop()
    switch (bySrc) {
      case AssetType.TEXTURE_EXR:
        return new EXRLoader()
      case AssetType.TEXTURE_HDR:
        return new RGBELoader()
      case AssetType.TEXTURE_8BPP:
        return new TextureLoader()
    }
  }

  public getEnvironment(srcUrl: string): Promise<Texture> {
    if (this._cache[srcUrl]) {
      return Promise.resolve(this._cache[srcUrl])
    }

    return new Promise<Texture>((resolve) => {
      this.getLoader(srcUrl).load(srcUrl, (texture) => {
        const pmremRT = this.pmremGenerator.fromEquirectangular(texture)
        this._cache[srcUrl] = pmremRT.texture
        texture.dispose()
        resolve(this._cache[srcUrl])
      })
    })
  }
}
