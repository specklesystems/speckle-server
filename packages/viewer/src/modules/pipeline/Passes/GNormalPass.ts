import {
  DoubleSide,
  Material,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Scene,
  WebGLRenderer
} from 'three'
import SpeckleNormalMaterial from '../../materials/SpeckleNormalMaterial.js'
import { BaseGPass } from './GPass.js'
import { GPipeline } from '../Pipelines/GPipeline.js'

export class GNormalsPass extends BaseGPass {
  private normalsMaterial: SpeckleNormalMaterial

  get displayName(): string {
    return 'GEOMETRY-NORMALS'
  }

  get overrideMaterial(): Material {
    return this.normalsMaterial
  }

  constructor() {
    super()

    this._outputTarget = GPipeline.createRenderTarget({
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })

    this.normalsMaterial = new SpeckleNormalMaterial({}, ['USE_RTE'])
    this.normalsMaterial.blending = NoBlending
    this.normalsMaterial.side = DoubleSide
  }

  public setClippingPlanes(planes: Plane[]) {
    this.normalsMaterial.clippingPlanes = planes
  }

  public render(
    renderer: WebGLRenderer,
    camera: PerspectiveCamera | OrthographicCamera | null,
    scene?: Scene
  ): boolean {
    if (!camera || !scene) return false

    if (this.onBeforeRender) this.onBeforeRender()

    renderer.setRenderTarget(this.outputTarget)

    this.clear(renderer)

    this.applyLayers(camera)

    renderer.render(scene, camera)

    if (this.onAfterRender) this.onAfterRender()
    return false
  }
}
