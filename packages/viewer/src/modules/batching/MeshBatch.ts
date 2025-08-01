import {
  Material,
  BufferAttribute,
  Box3,
  BufferGeometry,
  Uint32BufferAttribute,
  Uint16BufferAttribute,
  Float32BufferAttribute,
  DynamicDrawUsage,
  Sphere
} from 'three'
import { PrimitiveBatch } from './PrimitiveBatch.js'
import SpeckleMesh, { TransformStorage } from '../objects/SpeckleMesh.js'
import { DrawRanges } from './DrawRanges.js'
import { NodeRenderView } from '../tree/NodeRenderView.js'
import { type BatchUpdateRange, type DrawGroup, GeometryType } from './Batch.js'
import { BatchObject } from './BatchObject.js'
import { Geometry } from '../converter/Geometry.js'
import { ObjectLayers } from '../../IViewer.js'
import Logger from '../utils/Logger.js'

export class MeshBatch extends PrimitiveBatch {
  protected primitive: SpeckleMesh
  protected transformStorage: TransformStorage

  private indexBuffer0: BufferAttribute
  private indexBuffer1: BufferAttribute
  private indexBufferIndex = 0

  protected drawRanges: DrawRanges = new DrawRanges()

  get bounds(): Box3 {
    return this.primitive.TAS.getBoundingBox(new Box3())
  }

  get minDrawCalls(): number {
    return [...Array.from(new Set(this.groups.map((value) => value.materialIndex)))]
      .length
  }

  get triCount(): number {
    return this.getCount() / 3
  }

  get pointCount(): number {
    return 0
  }

  get lineCount(): number {
    return 0
  }

  public get geometryType(): GeometryType {
    return GeometryType.MESH
  }

  public get mesh(): SpeckleMesh {
    return this.primitive
  }

  public constructor(
    id: string,
    subtreeId: string,
    renderViews: NodeRenderView[],
    transformStorage: TransformStorage
  ) {
    super()
    this.id = id
    this.subtreeId = subtreeId
    this.renderViews = renderViews
    this.transformStorage = transformStorage
  }

  protected getCurrentIndexBuffer(): BufferAttribute {
    return this.indexBufferIndex % 2 === 0 ? this.indexBuffer0 : this.indexBuffer1
  }

  protected getNextIndexBuffer(): BufferAttribute {
    return ++this.indexBufferIndex % 2 === 0 ? this.indexBuffer0 : this.indexBuffer1
  }

  protected shuffleMaterialOrder(a: DrawGroup, b: DrawGroup): number {
    const materialA: Material = this.materials[a.materialIndex]
    const materialB: Material = this.materials[b.materialIndex]
    const visibleOrder = +materialB.visible - +materialA.visible
    const colorWriteOrder = +materialB.colorWrite - +materialA.colorWrite
    const transparentOrder = +materialA.transparent - +materialB.transparent
    if (visibleOrder !== 0) return visibleOrder
    if (colorWriteOrder !== 0) return colorWriteOrder
    return transparentOrder
  }

  protected updateGradientIndexBufferData(
    start: number,
    end: number,
    value: number
  ): { minIndex: number; maxIndex: number } {
    if (!this.primitive.geometry.index) {
      throw new Error(`Invalid geometry on batch ${this.id}`)
    }
    const index = this.primitive.geometry.index.array as number[]
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
    this.primitive.geometry.attributes['gradientIndex'].needsUpdate = true
    return {
      minIndex: minVertexIndex,
      maxIndex: maxVertexIndex
    }
  }

  public setDrawRanges(ranges: BatchUpdateRange[]) {
    // const current = this.groups.slice()
    // const incoming = ranges.slice()
    ranges.forEach((value: BatchUpdateRange) => {
      if (value.material) {
        value.material = this.primitive.getCachedMaterial(value.material)
      }
    })
    const materials: Array<Material> = ranges.map((val: BatchUpdateRange) => {
      return val.material as Material
    })
    const uniqueMaterials: Array<Material> = [
      ...Array.from(new Set(materials.map((value: Material) => value)))
    ]

    for (let k = 0; k < uniqueMaterials.length; k++) {
      if (!this.materials.includes(uniqueMaterials[k]))
        this.materials.push(uniqueMaterials[k])
    }

    this.groups = this.drawRanges.integrateRanges(this.groups, this.materials, ranges)

    let count = 0
    this.groups.forEach((value) => (count += value.count))
    if (count !== this.getCount()) {
      // Logger.error('Current -> ', current)
      // Logger.error('Incoming -> ', incoming)
      // Logger.error('Current -> ', this.geometry.groups)
      Logger.error(
        `Draw groups invalid on ${this.id}, ${
          this.renderViews[0].renderData.id
        }, ${this.getCount()}, ${this.getCount() - count}`
      )
    }
    this.setBatchBuffers(ranges)
    this.cleanMaterials()

    if (this.drawCalls > this.minDrawCalls + 2) {
      this.needsShuffle = true
    } else {
      const transparentDepthHiddenGroup = this.groups.find(
        (value) =>
          this.materials[value.materialIndex].transparent === true ||
          this.materials[value.materialIndex].visible === false ||
          this.materials[value.materialIndex].colorWrite === false
      )

      if (transparentDepthHiddenGroup) {
        for (
          let k = this.groups.indexOf(transparentDepthHiddenGroup);
          k < this.groups.length;
          k++
        ) {
          const material = this.materials[this.groups[k].materialIndex]
          if (material.visible) {
            if (!material.transparent || material.colorWrite) {
              this.needsShuffle = true
              break
            }
          }
        }
      }
    }
  }

  public resetDrawRanges(): void {
    super.resetDrawRanges()
    this.primitive.setBatchMaterial(this.batchMaterial)
  }

  public buildBatch(): Promise<void> {
    let indicesCount = 0
    let attributeCount = 0
    const rvAABB: Box3 = new Box3()
    const bounds: Box3 = new Box3()
    for (let k = 0; k < this.renderViews.length; k++) {
      const ervee = this.renderViews[k]
      /** Catering to typescript
       *  There is no unniverse where indices or positions are undefined at this point
       */
      if (
        !ervee.renderData.geometry.attributes ||
        !ervee.renderData.geometry.attributes.INDEX
      ) {
        throw new Error(`Cannot build batch ${this.id}. Invalid geometry, or indices`)
      }
      indicesCount += ervee.renderData.geometry.attributes.INDEX.length
      attributeCount += ervee.renderData.geometry.attributes.POSITION.length
      bounds.union(ervee.aabb)
    }
    const needsRTE = Geometry.needsRTE(bounds)

    const hasVertexColors =
      this.renderViews[0].renderData.geometry.attributes?.COLOR !== undefined
    const indices =
      attributeCount >= 65535 || indicesCount >= 65535
        ? new Uint32Array(indicesCount)
        : new Uint16Array(indicesCount)
    const position = needsRTE
      ? new Float64Array(attributeCount)
      : new Float32Array(attributeCount)
    const color = new Float32Array(hasVertexColors ? attributeCount : 0)
    color.fill(1)
    const batchIndices = new Float32Array(attributeCount / 3)
    const normals = new Float32Array(attributeCount)

    let offset = 0
    let arrayOffset = 0
    const batchObjects = []

    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      /** Catering to typescript
       *  There is no unniverse where indices or positions are undefined at this point
       */
      if (!geometry.attributes || !geometry.attributes?.INDEX) {
        throw new Error(`Cannot build batch ${this.id}. Invalid geometry, or indices`)
      }

      geometry.attributes?.INDEX.copyToBuffer(indices, arrayOffset)
      const indicesSubArray = indices.subarray(
        arrayOffset,
        arrayOffset + geometry.attributes?.INDEX.length
      )

      geometry.attributes?.POSITION.copyToBuffer(position, offset)
      const positionSubarray = position.subarray(
        offset,
        offset +
          (this.renderViews[k].renderData.geometry.attributes?.POSITION.length ?? 0)
      )
      /** We transform the copied geometry so that we do not alter original chunk data which might be shared */
      Geometry.transformArray(
        positionSubarray,
        geometry.transform,
        0,
        geometry.attributes?.POSITION.length
      )

      if (geometry.attributes.COLOR) {
        geometry.attributes?.COLOR.copyToBuffer(color, offset)
      }

      /** We either copy over the provided vertex normals */
      if (geometry.attributes.NORMAL) {
        geometry.attributes?.NORMAL.copyToBuffer(normals, offset)
        if (geometry.flipNormals) {
          Geometry.flipNormalsBuffer(
            normals.subarray(offset, offset + geometry.attributes?.NORMAL.length)
          )
        }
      } else {
        /** Either we compute them ourselves */
        Geometry.computeVertexNormalsBufferVirtual(
          normals.subarray(
            offset,
            offset +
              (this.renderViews[k].renderData.geometry.attributes?.POSITION.length ?? 0)
          ) as unknown as number[],
          geometry.attributes.POSITION,
          geometry.attributes.INDEX,
          geometry.flipNormals
        )
      }
      batchIndices.fill(k, offset / 3, offset / 3 + geometry.attributes.POSITION.length)
      this.renderViews[k].setBatchData(
        this.id,
        arrayOffset,
        geometry.attributes.INDEX.length,
        offset / 3,
        offset / 3 + geometry.attributes.POSITION.length
      )

      /** We re-compute the render view aabb based on transformed geometry
       *  We do this because some transforms like non-uniform scaling can produce incorrect results
       *  if we compute an aabb from original geometry then apply the transform. That's why we compute
       *  an aabb from the transformed geometry here and set it in the rv
       */
      rvAABB.setFromArray(positionSubarray)
      this.renderViews[k].aabb = rvAABB

      const batchObject = new BatchObject(this.renderViews[k], k)
      batchObject.buildAccelerationStructure(positionSubarray, indicesSubArray)
      batchObjects.push(batchObject)

      indices.set(
        batchObject.accelerationStructure.bvh.geometry.index?.array as number[],
        arrayOffset
      )

      /** Re-index the indices inside the batch */
      for (let i = 0; i < indicesSubArray.length; i++) {
        indicesSubArray[i] = indicesSubArray[i] + offset / 3
      }

      offset += geometry.attributes.POSITION.length
      arrayOffset += geometry.attributes.INDEX.length

      this.renderViews[k].disposeGeometry()
    }

    const geometry = this.makeMeshGeometry(
      indices,
      position,
      normals,
      batchIndices,
      hasVertexColors ? color : undefined
    )

    if (needsRTE) Geometry.updateRTEGeometry(geometry, position)

    this.primitive = new SpeckleMesh(geometry, needsRTE)
    this.primitive.setBatchObjects(batchObjects, this.transformStorage)
    this.primitive.setBatchMaterial(this.batchMaterial)
    this.primitive.buildTAS()
    this.primitive.geometry.boundingBox = this.primitive.TAS.getBoundingBox(new Box3())
    this.primitive.geometry.boundingSphere =
      this.primitive.geometry.boundingBox.getBoundingSphere(new Sphere())

    this.primitive.uuid = this.id
    this.primitive.layers.set(ObjectLayers.STREAM_CONTENT_MESH)
    this.primitive.frustumCulled = false
    this.primitive.geometry.addGroup(0, this.getCount(), 0)

    // batchObjects.forEach((element: BatchObject) => {
    //   element.renderView.disposeGeometry()
    // })

    return Promise.resolve()
  }

  protected makeMeshGeometry(
    indices: Uint32Array | Uint16Array,
    position: Float64Array | Float32Array,
    normals: Float32Array,
    batchIndices: Float32Array,
    color?: Float32Array
  ): BufferGeometry {
    const geometry = new BufferGeometry()
    if (position.length >= 65535 || indices.length >= 65535) {
      this.indexBuffer0 = new Uint32BufferAttribute(indices, 1)
      this.indexBuffer1 = new Uint32BufferAttribute(indices, 1)
    } else {
      this.indexBuffer0 = new Uint16BufferAttribute(indices, 1)
      this.indexBuffer1 = new Uint16BufferAttribute(indices, 1)
    }
    geometry.setIndex(this.indexBuffer0)

    if (position) {
      /** When RTE enabled, we'll be storing the high component of the encoding here,
       * which considering our current encoding method is actually the original casted
       * down float32 position!
       */
      geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    }

    if (normals) {
      geometry
        .setAttribute('normal', new Float32BufferAttribute(normals, 3))
        .normalizeNormals()
    }

    if (batchIndices) {
      geometry.setAttribute('objIndex', new Float32BufferAttribute(batchIndices, 1))
    }

    if (color) {
      geometry.setAttribute('color', new Float32BufferAttribute(color, 3))
    }

    const buffer = new Float32Array(position.length / 3)
    this.gradientIndexBuffer = new Float32BufferAttribute(buffer, 1)
    this.gradientIndexBuffer.setUsage(DynamicDrawUsage)
    geometry.setAttribute('gradientIndex', this.gradientIndexBuffer)

    return geometry
  }

  public getRenderView(index: number): NodeRenderView | null {
    index
    Logger.warn('Deprecated! Use BatchObject')
    return null
  }
  public getMaterialAtIndex(index: number): Material | null {
    index
    Logger.warn('Deprecated! Use BatchObject')
    return null
  }
}
