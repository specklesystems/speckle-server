import {
  Material,
  Box3,
  BufferAttribute,
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  Uint32BufferAttribute,
  Uint16BufferAttribute,
  DynamicDrawUsage
} from 'three'
import { Geometry } from '../converter/Geometry.js'
import { NodeRenderView } from '../tree/NodeRenderView.js'
import { type BatchUpdateRange, type DrawGroup, GeometryType } from './Batch.js'
import { PrimitiveBatch } from './PrimitiveBatch.js'
import { DrawRanges } from './DrawRanges.js'
import { ObjectLayers } from '../../IViewer.js'
import Logger from '../utils/Logger.js'

export class PointBatch extends PrimitiveBatch {
  protected primitive!: Points
  protected drawRanges: DrawRanges = new DrawRanges()

  public get geometryType(): GeometryType {
    return this.renderViews[0].geometryType
  }
  public get bounds(): Box3 {
    if (!this.primitive.geometry.boundingBox)
      this.primitive.geometry.computeBoundingBox()
    return this.primitive.geometry.boundingBox
      ? this.primitive.geometry.boundingBox
      : new Box3()
  }

  public get minDrawCalls(): number {
    return this.materials.length
  }

  public get triCount(): number {
    return 0
  }

  public get pointCount(): number {
    return this.getCount()
  }

  public get lineCount(): number {
    return 0
  }

  public constructor(id: string, subtreeId: string, renderViews: NodeRenderView[]) {
    super()
    this.id = id
    this.subtreeId = subtreeId
    this.renderViews = renderViews
  }

  public setDrawRanges(ranges: BatchUpdateRange[]) {
    const materials: Array<Material> = ranges.map((val: BatchUpdateRange) => {
      return val.material as Material
    })
    const uniqueMaterials = [...Array.from(new Set(materials.map((value) => value)))]

    for (let k = 0; k < uniqueMaterials.length; k++) {
      if (!this.materials.includes(uniqueMaterials[k]))
        this.materials.push(uniqueMaterials[k])
    }

    this.groups = this.drawRanges.integrateRanges(this.groups, this.materials, ranges)

    let count = 0
    this.groups.forEach((value) => (count += value.count))
    if (count !== this.getCount()) {
      Logger.error(`Draw groups invalid on ${this.id}`)
    }
    this.setBatchBuffers(ranges)
    this.cleanMaterials()

    if (this.drawCalls > this.minDrawCalls + 2) {
      this.needsShuffle = true
    } else {
      const transparentOrHiddenGroup = this.groups.find(
        (value) =>
          this.materials[value.materialIndex].transparent === true ||
          this.materials[value.materialIndex].visible === false
      )
      if (transparentOrHiddenGroup) {
        for (
          let k = this.groups.indexOf(transparentOrHiddenGroup);
          k < this.groups.length;
          k++
        ) {
          const material = this.materials[this.groups[k].materialIndex]
          if (material.transparent !== true && material.visible !== false) {
            this.needsShuffle = true
            break
          }
        }
      }
    }
  }

  public resetDrawRanges() {
    super.resetDrawRanges()
    this.primitive.material = [this.batchMaterial]
  }

  protected getCurrentIndexBuffer(): BufferAttribute {
    /** Catering to typescript
     * There is no unniverse where the geometry is non-indexed. We're **explicitly** setting the index at creation time
     */
    if (!this.primitive.geometry.index) {
      throw new Error(`Invalid index buffer for batch ${this.id}`)
    }
    return this.primitive.geometry.index
  }

  protected getNextIndexBuffer(): BufferAttribute {
    /** Catering to typescript
     * There is no unniverse where the geometry is non-indexed. We're **explicitly** setting the index at creation time
     */
    if (!this.primitive.geometry.index) {
      throw new Error(`Invalid index buffer for batch ${this.id}`)
    }
    return new BufferAttribute(
      (this.primitive.geometry.index.array as Uint16Array | Uint32Array).slice(),
      this.primitive.geometry.index.itemSize
    )
  }

  protected shuffleMaterialOrder(a: DrawGroup, b: DrawGroup): number {
    const materialA: Material = this.materials[a.materialIndex]
    const materialB: Material = this.materials[b.materialIndex]
    const visibleOrder = +materialB.visible - +materialA.visible
    const transparentOrder = +materialA.transparent - +materialB.transparent
    if (visibleOrder !== 0) return visibleOrder
    return transparentOrder
  }

  protected updateGradientIndexBufferData(
    start: number,
    end: number,
    value: number
  ): { minIndex: number; maxIndex: number } {
    const data = this.gradientIndexBuffer
    ;(data.array as Float32Array).fill(value, start, end)
    this.gradientIndexBuffer.updateRange = {
      offset: start,
      count: end - start
    }
    this.gradientIndexBuffer.needsUpdate = true
    this.primitive.geometry.attributes['gradientIndex'].needsUpdate = true
    return {
      minIndex: start,
      maxIndex: end
    }
  }

  public buildBatch(): Promise<void> {
    let attributeCount = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const ervee = this.renderViews[k]
      /** Catering to typescript
       *  There is no unniverse where indices or positions are undefined at this point
       */
      if (!ervee.renderData.geometry.attributes) {
        throw new Error(`Cannot build batch ${this.id}. Invalid geometry, or indices`)
      }
      attributeCount += ervee.renderData.geometry.attributes.POSITION.length
    }
    const position = new Float64Array(attributeCount)
    const color = new Float32Array(attributeCount).fill(1)
    const index = new Int32Array(attributeCount / 3)
    let offset = 0
    let indexOffset = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      if (!geometry.attributes) {
        throw new Error(`Cannot build batch ${this.id}. Invalid geometry, or indices`)
      }
      position.set(geometry.attributes.POSITION, offset)
      if (geometry.attributes.COLOR) color.set(geometry.attributes.COLOR, offset)
      index.set(
        new Int32Array(geometry.attributes.POSITION.length / 3).map(
          (_value, index) => index + indexOffset
        ),
        indexOffset
      )
      this.renderViews[k].setBatchData(
        this.id,
        offset / 3,
        geometry.attributes.POSITION.length / 3
      )

      offset += geometry.attributes.POSITION.length
      indexOffset += geometry.attributes.POSITION.length / 3

      this.renderViews[k].disposeGeometry()
    }
    const geometry = this.makePointGeometry(index, position, color)
    this.primitive = new Points(geometry, this.batchMaterial)
    this.primitive.material = [this.batchMaterial]
    this.primitive.geometry.addGroup(0, this.getCount(), 0)
    this.primitive.uuid = this.id
    this.primitive.layers.set(
      this.renderViews[0].geometryType === GeometryType.POINT
        ? ObjectLayers.STREAM_CONTENT_POINT
        : ObjectLayers.STREAM_CONTENT_POINT_CLOUD
    )

    return Promise.resolve()
  }

  protected makePointGeometry(
    index: Int32Array,
    position: Float64Array,
    color: Float32Array
  ): BufferGeometry {
    const geometry = new BufferGeometry()

    geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    geometry.setAttribute('color', new Float32BufferAttribute(color, 3))
    if (position.length >= 65535 || index.length >= 65535) {
      geometry.setIndex(new Uint32BufferAttribute(index, 1))
    } else {
      geometry.setIndex(new Uint16BufferAttribute(index, 1))
    }

    const buffer = new Float32Array(position.length / 3)
    this.gradientIndexBuffer = new Float32BufferAttribute(buffer, 1)
    this.gradientIndexBuffer.setUsage(DynamicDrawUsage)
    geometry.setAttribute('gradientIndex', this.gradientIndexBuffer)

    geometry.computeBoundingSphere()
    geometry.computeBoundingBox()

    Geometry.updateRTEGeometry(geometry, position)

    return geometry
  }

  public getRenderView(index: number): NodeRenderView | null {
    for (let k = 0; k < this.renderViews.length; k++) {
      if (
        index >= this.renderViews[k].batchStart &&
        index < this.renderViews[k].batchEnd
      ) {
        return this.renderViews[k]
      }
    }
    return null
  }
  public getMaterialAtIndex(index: number): Material | null {
    for (let k = 0; k < this.renderViews.length; k++) {
      if (
        index >= this.renderViews[k].batchStart &&
        index < this.renderViews[k].batchEnd
      ) {
        const rv = this.renderViews[k]
        const group = this.groups.find((value) => {
          return (
            rv.batchStart >= value.start &&
            rv.batchStart + rv.batchCount <= value.count + value.start
          )
        })
        if (!group) {
          Logger.warn(`Malformed material index!`)
          return null
        }
        return this.materials[group.materialIndex]
      }
    }
    return null
  }
}
