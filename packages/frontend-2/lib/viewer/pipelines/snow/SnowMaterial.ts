import { SpeckleStandardMaterial, type SpeckleWebGLRenderer } from '@speckle/viewer'
import {
  type MeshStandardMaterialParameters,
  type Scene,
  type Camera,
  type BufferGeometry,
  type Object3D,
  Box3,
  Vector3
} from 'three'
import { objectSnowVert } from './objectSnowVert'
import { objectSnowFrag } from './objectSnowFrag'

class SnowMaterial extends SpeckleStandardMaterial {
  private minSnowValue = 0
  private maxSnowValue = 0
  private lastFrameTime = 0
  private increaseFactor = 500000

  protected get vertexProgram(): string {
    return objectSnowVert
  }

  protected get fragmentProgram(): string {
    return objectSnowFrag
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected get uniformsDef(): Record<string, any> {
    return {
      ...super.uniformsDef,
      height: 1,
      minSnow: this.minSnowValue,
      maxSnow: this.maxSnowValue
    }
  }

  constructor(parameters: MeshStandardMaterialParameters, defines = ['USE_RTE']) {
    super(parameters, defines)
  }

  /** Called by three.js render loop */
  public onBeforeRender(
    _this: SpeckleWebGLRenderer,
    _scene: Scene,
    _camera: Camera,
    _geometry: BufferGeometry,
    object: Object3D
  ) {
    super.onBeforeRender(_this, _scene, _camera, _geometry, object)

    const sceneHeight = new Box3().setFromObject(_scene).getSize(new Vector3())
    this.userData.height.value = sceneHeight.y

    const now = performance.now()
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = now
      return
    }
    const delta = now - this.lastFrameTime
    this.lastFrameTime = now

    this.minSnowValue += 1 / (this.increaseFactor + delta) + 1 / this.increaseFactor
    this.maxSnowValue +=
      1 / (this.increaseFactor * 0.5 + delta) + 1 / (this.increaseFactor * 0.5)

    this.userData.minSnow.value = Math.min(this.minSnowValue, 0.8)
    this.userData.maxSnow.value = Math.min(this.maxSnowValue, 0.9)

    this.increaseFactor -= 1000 - this.increaseFactor / 1000
    this.increaseFactor = Math.max(this.increaseFactor, 5000)
  }
}

export default SnowMaterial
