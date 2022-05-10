import { Texture, PMREMGenerator, WebGLRenderer } from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

export class Assets {
  private _cache: { [name: string]: Texture } = {}
  private pmremGenerator: PMREMGenerator

  public constructor(renderer: WebGLRenderer) {
    this.pmremGenerator = new PMREMGenerator(renderer)
    this.pmremGenerator.compileEquirectangularShader()
  }

  public getEnvironment(srcUrl: string): Promise<Texture> {
    if (this._cache[srcUrl]) {
      return Promise.resolve(this._cache[srcUrl])
    }

    return new Promise<Texture>((resolve) => {
      new EXRLoader().load(srcUrl, (texture) => {
        const pmremRT = this.pmremGenerator.fromEquirectangular(texture)
        this._cache[srcUrl] = pmremRT.texture
        texture.dispose()
        resolve(this._cache[srcUrl])
      })
    })
  }
}
