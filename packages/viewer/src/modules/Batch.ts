import {
  BufferGeometry,
  Float32BufferAttribute,
  Material,
  Mesh,
  Uint32BufferAttribute
} from 'three'
import { NodeRenderView } from './NodeRenderView'

export default class Batch {
  private id: string
  private renderViews: NodeRenderView[]
  private bufferGeometry: BufferGeometry
  private material: Material
  public mesh: Mesh

  public constructor(id: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.renderViews = renderViews
    this.bufferGeometry = new BufferGeometry()
  }

  public setMaterial(material: Material) {
    this.material = material

    this.mesh
    this.material
    this.renderViews
    this.bufferGeometry
  }

  public buildBatch() {
    const indicesCount = this.renderViews.flatMap(
      (val: NodeRenderView) => val.renderData.geometry.attributes.INDEX
    ).length
    const attributeCount = this.renderViews.flatMap(
      (val: NodeRenderView) => val.renderData.geometry.attributes.POSITION
    ).length
    const indices = new Int32Array(indicesCount)
    const position = new Float32Array(attributeCount)
    let offset = 0
    let arrayOffset = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      indices.set(
        geometry.attributes.INDEX.map((val) => val + offset),
        arrayOffset
      )
      position.set(geometry.attributes.POSITION, offset)
      this.renderViews[k].setBatchData(
        this.id,
        arrayOffset,
        geometry.attributes.INDEX.length
      )

      offset += geometry.attributes.POSITION.length
      arrayOffset += geometry.attributes.INDEX.length
    }

    this.bufferGeometry.setIndex(new Uint32BufferAttribute(indices, 1))

    this.bufferGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(position, 3)
    )

    this.bufferGeometry.computeVertexNormals()
    this.bufferGeometry.computeBoundingSphere()
    this.bufferGeometry.computeBoundingBox()

    // Geometry.updateRTEGeometry(this.bufferGeometry)

    this.mesh = new Mesh(this.bufferGeometry, this.material)
  }
}
