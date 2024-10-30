import { DoubleSide, Material, NearestFilter, NoBlending } from 'three'
import SpeckleNormalMaterial from '../../materials/SpeckleNormalMaterial.js'
import { Pipeline } from '../Pipelines/Pipeline.js'
import { GeometryPass } from './GeometryPass.js'

export class NormalsPass extends GeometryPass {
  private normalsMaterial: SpeckleNormalMaterial

  get displayName(): string {
    return 'GEOMETRY-NORMALS'
  }

  get overrideMaterial(): Material {
    return this.normalsMaterial
  }

  constructor() {
    super()

    this._outputTarget = Pipeline.createRenderTarget({
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })

    this.normalsMaterial = new SpeckleNormalMaterial({}, ['USE_RTE'])
    this.normalsMaterial.blending = NoBlending
    this.normalsMaterial.side = DoubleSide
  }
}
