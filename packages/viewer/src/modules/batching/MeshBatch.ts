import {
  BufferGeometry,
  Float32BufferAttribute,
  Material,
  Mesh,
  Object3D,
  Uint16BufferAttribute,
  Uint32BufferAttribute
} from 'three'
import { Geometry } from '../converter/Geometry'
import { NodeRenderView } from '../tree/NodeRenderView'
import { World } from '../World'
import { Batch, BatchUpdateRange, HideAllBatchUpdateRange } from './Batch'

export default class MeshBatch implements Batch {
  public id: string
  public renderViews: NodeRenderView[]
  private geometry: BufferGeometry
  public batchMaterial: Material
  public mesh: Mesh

  public constructor(id: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.renderViews = renderViews
  }

  public get renderObject(): Object3D {
    return this.mesh
  }

  public getCount(): number {
    return this.geometry.index.count
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
  public setDrawRanges(autoFill: boolean, ...ranges: BatchUpdateRange[]) {
    const materials = ranges.map((val) => val.material)
    materials.splice(0, 0, this.batchMaterial)
    this.mesh.material = materials
    const sortedRanges = ranges.sort((a, b) => {
      return a.offset - b.offset
    })
    for (let k = 0; k < sortedRanges.length; k++) {
      if (autoFill) {
        if (k === 0) {
          if (sortedRanges[k].offset > 0) {
            this.geometry.addGroup(0, sortedRanges[k].offset, 0)
          }
        } else {
          if (
            sortedRanges[k].offset >
            sortedRanges[k - 1].offset + sortedRanges[k - 1].count
          ) {
            this.geometry.addGroup(
              sortedRanges[k - 1].offset + sortedRanges[k - 1].count,
              sortedRanges[k].offset -
                sortedRanges[k - 1].offset +
                sortedRanges[k - 1].count,
              0
            )
          }
        }
      }
      this.geometry.addGroup(
        ranges[k].offset,
        ranges[k].count,
        materials.indexOf(ranges[k].material)
      )
      if (autoFill) {
        if (k === sortedRanges.length - 1) {
          if (
            sortedRanges[k].offset + sortedRanges[k].count <
            this.geometry.index.count
          ) {
            this.geometry.addGroup(
              sortedRanges[k].offset + sortedRanges[k].count,
              this.geometry.index.count -
                sortedRanges[k].offset +
                sortedRanges[k].count,
              0
            )
          }
        } else {
          if (
            sortedRanges[k].offset + sortedRanges[k].count <
            sortedRanges[k + 1].offset
          ) {
            this.geometry.addGroup(
              sortedRanges[k].offset + sortedRanges[k].count,
              sortedRanges[k + 1].offset -
                sortedRanges[k].offset +
                sortedRanges[k].count,
              0
            )
          }
        }
      }
    }
  }

  public resetDrawRanges() {
    this.mesh.material = this.batchMaterial
    this.mesh.visible = true
    this.geometry.clearGroups()
    this.geometry.setDrawRange(0, Infinity)
  }

  public buildBatch() {
    const indicesCount = this.renderViews.flatMap(
      (val: NodeRenderView) => val.renderData.geometry.attributes.INDEX
    ).length
    const attributeCount = this.renderViews.flatMap(
      (val: NodeRenderView) => val.renderData.geometry.attributes.POSITION
    ).length
    const indices = new Uint32Array(indicesCount)
    const position = new Float32Array(attributeCount)
    let offset = 0
    let arrayOffset = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      indices.set(
        geometry.attributes.INDEX.map((val) => val + offset / 3),
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
    this.makeMeshGeometry(indices, position)
    this.mesh = new Mesh(this.geometry, this.batchMaterial)
    this.mesh.uuid = this.id
  }

  public getRenderView(index: number): NodeRenderView {
    for (let k = 0; k < this.renderViews.length; k++) {
      if (
        index * 3 >= this.renderViews[k].batchStart &&
        index * 3 < this.renderViews[k].batchEnd
      ) {
        return this.renderViews[k]
      }
    }
  }

  /**
   * DUPLICATE from Geometry. Will unify in the future
   */
  private makeMeshGeometry(
    indices: Uint32Array | Uint16Array,
    position: Float32Array
  ): BufferGeometry {
    this.geometry = new BufferGeometry()
    if (position.length >= 65535 || indices.length >= 65535) {
      this.geometry.setIndex(new Uint32BufferAttribute(indices, 1))
    } else {
      this.geometry.setIndex(new Uint16BufferAttribute(indices, 1))
    }

    if (position) {
      this.geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    }

    // if (geometryData.attributes.COLOR) {
    //   this.bufferGeometry.setAttribute(
    //     'color',
    //     new Float32BufferAttribute(geometryData.attributes.COLOR, 3)
    //   )
    // }

    this.geometry.computeVertexNormals()
    this.geometry.computeBoundingSphere()
    this.geometry.computeBoundingBox()

    World.expandWorld(this.geometry.boundingBox)

    if (Geometry.USE_RTE) {
      Geometry.updateRTEGeometry(this.geometry)
    }

    return this.geometry
  }
}
