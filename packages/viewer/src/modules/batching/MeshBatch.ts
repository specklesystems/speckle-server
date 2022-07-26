import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Material,
  Mesh,
  Object3D,
  Uint16BufferAttribute,
  Uint32BufferAttribute
} from 'three'
import { Geometry } from '../converter/Geometry'
import SpeckleStandardColoredMaterial from '../materials/SpeckleStandardColoredMaterial'
import { NodeRenderView } from '../tree/NodeRenderView'
import { World } from '../World'
import { Batch, BatchUpdateRange, HideAllBatchUpdateRange } from './Batch'

export default class MeshBatch implements Batch {
  public id: string
  public renderViews: NodeRenderView[]
  private geometry: BufferGeometry
  public batchMaterial: Material
  public mesh: Mesh
  private gradientIndexBuffer: BufferAttribute

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
  public setDrawRanges(...ranges: BatchUpdateRange[]) {
    const materials = ranges.map((val) => val.material)
    const uniqueMaterials = [...Array.from(new Set(materials.map((value) => value)))]
    if (Array.isArray(this.mesh.material))
      this.mesh.material = this.mesh.material.concat(uniqueMaterials)
    else {
      this.mesh.material = [this.mesh.material, ...uniqueMaterials]
    }
    const sortedRanges = ranges.sort((a, b) => {
      return a.offset - b.offset
    })
    const newGroups = []
    let minGradientIndex = Infinity
    let maxGradientIndex = 0
    for (let k = 0; k < sortedRanges.length; k++) {
      if (sortedRanges[k].materialOptions) {
        if (sortedRanges[k].materialOptions.rampIndex) {
          const start = sortedRanges[k].offset
          const len = sortedRanges[k].offset + sortedRanges[k].count
          const minMaxIndices = this.updateGradientIndexBufferData(
            start,
            sortedRanges[k].count === Infinity
              ? this.geometry.attributes['gradientIndex'].array.length
              : len,
            sortedRanges[k].materialOptions.rampIndex
          )
          minGradientIndex = Math.min(minGradientIndex, minMaxIndices.minIndex)
          maxGradientIndex = Math.max(maxGradientIndex, minMaxIndices.maxIndex)
        }
        if (sortedRanges[k].materialOptions.rampTexture) {
          ;(
            sortedRanges[k].material as SpeckleStandardColoredMaterial
          ).setGradientTexture(sortedRanges[k].materialOptions.rampTexture)
        }
      }
      const collidingGroup = this.getDrawRangeCollision(sortedRanges[k])
      if (collidingGroup) {
        // console.warn(`Draw range collision @ ${this.id} overwritting...`)
        collidingGroup.materialIndex = this.mesh.material.indexOf(
          sortedRanges[k].material
        )
        continue
      }
      newGroups.push(sortedRanges[k])
    }
    /** Should properly compute min, max buffer range. Current minGradientIndex and maxGradientIndex are incorrect */
    this.updateGradientIndexBuffer()

    for (let i = 0; i < newGroups.length; i++) {
      this.geometry.addGroup(
        newGroups[i].offset,
        newGroups[i].count,
        this.mesh.material.indexOf(newGroups[i].material)
      )
    }
  }

  private getDrawRangeCollision(range: BatchUpdateRange): {
    start: number
    count: number
    materialIndex?: number
  } {
    if (this.geometry.groups.length > 0) {
      for (let i = 0; i < this.geometry.groups.length; i++) {
        if (range.offset === this.geometry.groups[i].start) {
          return this.geometry.groups[i]
        }
      }
      return null
    }
    return null
  }

  public autoFillDrawRanges() {
    const sortedRanges = this.geometry.groups
      .sort((a, b) => {
        return a.start - b.start
      })
      .slice()
    // console.warn(`Batch ID ${this.id} Group count ${sortedRanges.length}`)
    for (let k = 0; k < sortedRanges.length; k++) {
      if (k === 0) {
        if (sortedRanges[k].start > 0) {
          this.geometry.addGroup(0, sortedRanges[k].start, 0)
        }
        if (
          sortedRanges.length === 1 &&
          sortedRanges[k].start + sortedRanges[k].count < this.getCount()
        ) {
          this.geometry.addGroup(
            sortedRanges[k].start + sortedRanges[k].count,
            this.getCount() - sortedRanges[k].start + sortedRanges[k].count,
            0
          )
        }
      } else if (k === sortedRanges.length - 1) {
        if (sortedRanges[k].start + sortedRanges[k].count < this.getCount()) {
          this.geometry.addGroup(
            sortedRanges[k].start + sortedRanges[k].count,
            this.getCount() - sortedRanges[k].start + sortedRanges[k].count,
            0
          )
        }
        if (
          sortedRanges[k - 1].start + sortedRanges[k - 1].count <
          sortedRanges[k].start
        ) {
          this.geometry.addGroup(
            sortedRanges[k - 1].start + sortedRanges[k - 1].count,
            sortedRanges[k].start -
              (sortedRanges[k - 1].start + sortedRanges[k - 1].count),
            0
          )
        }
        continue
      } else {
        if (
          sortedRanges[k - 1].start + sortedRanges[k - 1].count <
          sortedRanges[k].start
        ) {
          this.geometry.addGroup(
            sortedRanges[k - 1].start + sortedRanges[k - 1].count,
            sortedRanges[k].start -
              (sortedRanges[k - 1].start + sortedRanges[k - 1].count),
            0
          )
        }
      }
    }
    this.geometry.groups.sort((a, b) => {
      return a.start - b.start
    })

    let count = 0
    this.geometry.groups.forEach((val) => {
      count += val.count
    })
    if (count < this.getCount()) {
      // Shouldn't happen
      console.error(`DrawRange MESH autocomplete failed! ${count}vs${this.getCount()}`)
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
    const position = new Float64Array(attributeCount)
    const color = new Float32Array(this.batchMaterial.vertexColors ? attributeCount : 0)
    color.fill(1)
    let offset = 0
    let arrayOffset = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      indices.set(
        geometry.attributes.INDEX.map((val) => val + offset / 3),
        arrayOffset
      )
      position.set(geometry.attributes.POSITION, offset)
      if (geometry.attributes.COLOR) color.set(geometry.attributes.COLOR, offset)
      this.renderViews[k].setBatchData(
        this.id,
        arrayOffset,
        geometry.attributes.INDEX.length
      )

      offset += geometry.attributes.POSITION.length
      arrayOffset += geometry.attributes.INDEX.length
    }
    this.makeMeshGeometry(
      indices,
      position,
      this.batchMaterial.vertexColors ? color : null
    )
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

  private makeMeshGeometry(
    indices: Uint32Array | Uint16Array,
    position: Float64Array,
    color?: Float32Array
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

    if (color) {
      this.geometry.setAttribute('color', new Float32BufferAttribute(color, 3))
    }

    const buffer = new Float32Array(position.length / 3)
    this.gradientIndexBuffer = new Float32BufferAttribute(buffer, 1)
    this.gradientIndexBuffer.setUsage(DynamicDrawUsage)
    this.geometry.setAttribute('gradientIndex', this.gradientIndexBuffer)
    this.updateGradientIndexBufferData(0, buffer.length, 0)
    this.updateGradientIndexBuffer()

    this.geometry.computeVertexNormals()
    this.geometry.computeBoundingSphere()
    this.geometry.computeBoundingBox()

    World.expandWorld(this.geometry.boundingBox)

    Geometry.updateRTEGeometry(this.geometry, position)

    return this.geometry
  }

  private updateGradientIndexBufferData(
    start: number,
    end: number,
    value: number
  ): { minIndex: number; maxIndex: number } {
    const index = this.geometry.index.array as number[]
    const data = this.gradientIndexBuffer.array as number[]
    let minVertexIndex = Infinity
    let maxVertexIndex = 0
    for (let k = start; k < end; k++) {
      const vIndex = index[k]
      minVertexIndex = Math.min(minVertexIndex, vIndex)
      maxVertexIndex = Math.max(maxVertexIndex, vIndex)
      data[vIndex] = value
    }
    this.gradientIndexBuffer.updateRange = {
      offset: minVertexIndex,
      count: maxVertexIndex - minVertexIndex + 1
    }
    this.gradientIndexBuffer.needsUpdate = true
    this.geometry.attributes['gradientIndex'].needsUpdate = true
    return {
      minIndex: minVertexIndex,
      maxIndex: maxVertexIndex
    }
  }

  private updateGradientIndexBuffer(rangeMin?: number, rangeMax?: number) {
    this.gradientIndexBuffer.updateRange = {
      offset: rangeMin !== undefined ? rangeMin : 0,
      count:
        rangeMin !== undefined && rangeMax !== undefined ? rangeMax - rangeMin + 1 : -1
    }
    this.gradientIndexBuffer.needsUpdate = true
    this.geometry.attributes['gradientIndex'].needsUpdate = true
  }

  public purge() {
    this.renderViews.length = 0
    this.geometry.dispose()
    this.batchMaterial.dispose()
    this.mesh = null
  }
}
