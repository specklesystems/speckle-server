import {
  BufferGeometry,
  Float32BufferAttribute,
  Material,
  Object3D,
  Points
} from 'three'
import { NodeRenderView } from '../tree/NodeRenderView'
import { World } from '../World'
import { Batch, BatchUpdateRange, HideAllBatchUpdateRange } from './Batch'

export default class PointBatch implements Batch {
  public id: string
  public renderViews: NodeRenderView[]
  private geometry: BufferGeometry
  public batchMaterial: Material
  public mesh: Points

  public constructor(id: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.renderViews = renderViews
  }

  public get renderObject(): Object3D {
    return this.mesh
  }

  public getCount() {
    return this.geometry.attributes.position.array.length / 3
  }

  public setBatchMaterial(material: Material) {
    this.batchMaterial = material
  }

  public setVisibleRange(...ranges: BatchUpdateRange[]) {
    if (ranges.length === 1 && ranges[0] === HideAllBatchUpdateRange) {
      this.geometry.setDrawRange(0, 0)
      this.mesh.visible = false
      return
    }
    let minOffset = Infinity
    let maxOffset = 0
    ranges.forEach((range) => {
      minOffset = Math.min(minOffset, range.offset)
      maxOffset = Math.max(maxOffset, range.offset)
    })

    this.geometry.setDrawRange(
      minOffset,
      maxOffset - minOffset + ranges.find((val) => val.offset === maxOffset).count
    )
  }
  /**
   * This is the first version for multi draw ranges with automatic fill support
   * In the near future, we'll re-sort the index buffer so we minimize draw calls to
   * a minimmum. For now it's ok
   */
  public setDrawRanges(...ranges: BatchUpdateRange[]) {
    const materials = ranges.map((val) => val.material)
    this.mesh.material = materials
    const sortedRanges = ranges.sort((a, b) => {
      return a.offset - b.offset
    })
    for (let k = 0; k < sortedRanges.length; k++) {
      this.geometry.addGroup(
        ranges[k].offset,
        ranges[k].count,
        materials.indexOf(ranges[k].material)
      )
    }
  }

  public autoFillDrawRanges(material?: Material) {
    const materials = Array.isArray(this.mesh.material)
      ? this.mesh.material
      : [this.mesh.material]
    materials.splice(0, 0, material ? material : this.batchMaterial)
    this.mesh.material = materials
    const sortedRanges = this.geometry.groups
      .sort((a, b) => {
        return a.start - b.start
      })
      .slice()
    for (let k = 0; k < sortedRanges.length; k++) {
      if (k === 0) {
        if (sortedRanges[k].start > 0) {
          this.geometry.addGroup(0, sortedRanges[k].start, 0)
        }
      } else {
        if (
          sortedRanges[k].start >
          sortedRanges[k - 1].start + sortedRanges[k - 1].count
        ) {
          this.geometry.addGroup(
            sortedRanges[k - 1].start + sortedRanges[k - 1].count,
            sortedRanges[k].start -
              sortedRanges[k - 1].start +
              sortedRanges[k - 1].count,
            0
          )
        }
      }
      if (k === sortedRanges.length - 1) {
        if (sortedRanges[k].start + sortedRanges[k].count < this.getCount()) {
          this.geometry.addGroup(
            sortedRanges[k].start + sortedRanges[k].count,
            this.getCount() - sortedRanges[k].start + sortedRanges[k].count,
            0
          )
        }
      } else {
        if (sortedRanges[k].start + sortedRanges[k].count < sortedRanges[k + 1].start) {
          this.geometry.addGroup(
            sortedRanges[k].start + sortedRanges[k].count,
            sortedRanges[k + 1].start - sortedRanges[k].start + sortedRanges[k].count,
            0
          )
        }
      }
      sortedRanges[k].materialIndex++
    }
  }

  public resetDrawRanges() {
    this.mesh.material = this.batchMaterial
    this.mesh.visible = true
    this.geometry.clearGroups()
    this.geometry.setDrawRange(0, Infinity)
  }

  public buildBatch() {
    const attributeCount = this.renderViews.flatMap(
      (val: NodeRenderView) => val.renderData.geometry.attributes.POSITION
    ).length
    const position = new Float32Array(attributeCount)
    const color = new Float32Array(attributeCount).fill(1)
    let offset = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      position.set(geometry.attributes.POSITION, offset)
      if (geometry.attributes.COLOR) color.set(geometry.attributes.COLOR, offset)
      this.renderViews[k].setBatchData(
        this.id,
        offset / 3,
        geometry.attributes.POSITION.length / 3
      )

      offset += geometry.attributes.POSITION.length
    }
    this.makePointGeometry(position, color)
    this.mesh = new Points(this.geometry, this.batchMaterial)
    this.mesh.uuid = this.id
  }

  public getRenderView(index: number): NodeRenderView {
    for (let k = 0; k < this.renderViews.length; k++) {
      if (
        index >= this.renderViews[k].batchStart &&
        index < this.renderViews[k].batchEnd
      ) {
        return this.renderViews[k]
      }
    }
  }

  /**
   * DUPLICATE from Geometry. Will unify in the future
   */
  private makePointGeometry(
    position: Float32Array,
    color: Float32Array
  ): BufferGeometry {
    this.geometry = new BufferGeometry()

    this.geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    this.geometry.setAttribute('color', new Float32BufferAttribute(color, 3))

    this.geometry.computeVertexNormals()
    this.geometry.computeBoundingSphere()
    this.geometry.computeBoundingBox()

    World.expandWorld(this.geometry.boundingBox)

    // if (Geometry.USE_RTE) {
    //   Geometry.updateRTEGeometry(this.geometry)
    // }

    return this.geometry
  }

  public purge() {
    this.renderViews.length = 0
    this.geometry.dispose()
    this.batchMaterial.dispose()
    this.mesh = null
  }
}
