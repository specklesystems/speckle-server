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
import { GeometryType, BatchUpdateRange } from './Batch'
import { DrawGroup } from './InstancedMeshBatch'
import { PrimitiveBatch } from './PrimitiveBatch'
import SpeckleMesh, { TransformStorage } from '../objects/SpeckleMesh'
import Logger from 'js-logger'
import { DrawRanges } from './DrawRanges'
import { NodeRenderView } from '../tree/NodeRenderView'
import { BatchObject } from './BatchObject'
import { Geometry } from '../converter/Geometry'
import { ObjectLayers } from '../../IViewer'

export class MeshBatch extends PrimitiveBatch {
  protected primitive: SpeckleMesh
  protected transformStorage: TransformStorage

  private indexBuffer0: BufferAttribute
  private indexBuffer1: BufferAttribute
  private indexBufferIndex = 0

  private drawRanges: DrawRanges = new DrawRanges()

  get bounds(): Box3 {
    return this.primitive.TAS.getBoundingBox(new Box3())
  }

  get minDrawCalls(): number {
    return [
      ...Array.from(
        new Set(this.primitive.geometry.groups.map((value) => value.materialIndex))
      )
    ].length
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
    return this.renderViews[0].geometryType
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
    const visibleOrder =
      +materialB.visible +
      +materialB.colorWrite -
      (+materialA.visible + +materialA.colorWrite)
    const transparentOrder = +materialA.transparent - +materialB.transparent
    if (visibleOrder !== 0) return visibleOrder
    return transparentOrder
  }

  protected updateGradientIndexBufferData(
    start: number,
    end: number,
    value: number
  ): { minIndex: number; maxIndex: number } {
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

  public setDrawRanges(...ranges: BatchUpdateRange[]) {
    // const current = this.groups.slice()
    // const incoming = ranges.slice()
    ranges.forEach((value: BatchUpdateRange) => {
      if (value.material) {
        value.material = this.primitive.getCachedMaterial(value.material)
      }
    })
    const materials = ranges.map((val) => {
      return val.material
    })
    const uniqueMaterials = [...Array.from(new Set(materials.map((value) => value)))]

    for (let k = 0; k < uniqueMaterials.length; k++) {
      if (!this.materials.includes(uniqueMaterials[k]))
        this.materials.push(uniqueMaterials[k])
    }

    this.primitive.geometry.groups = this.drawRanges.integrateRanges(
      this.groups,
      this.materials,
      ranges
    )

    let count = 0
    this.primitive.geometry.groups.forEach((value) => (count += value.count))
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
    this.setBatchBuffers(...ranges)
    this.cleanMaterials()

    if (this.drawCalls > this.minDrawCalls + 2) {
      this.needsShuffle = true
    } else {
      const transparentOrHiddenGroup = this.groups.find(
        (value) =>
          this.materials[value.materialIndex].transparent === true ||
          this.materials[value.materialIndex].visible === false ||
          this.materials[value.materialIndex].colorWrite === false
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

  public resetDrawRanges(): void {
    super.resetDrawRanges()
    this.primitive.setBatchMaterial(this.batchMaterial)
  }

  public buildBatch(): void {
    let indicesCount = 0
    let attributeCount = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      indicesCount += this.renderViews[k].renderData.geometry.attributes.INDEX.length
      attributeCount +=
        this.renderViews[k].renderData.geometry.attributes.POSITION.length
    }

    const hasVertexColors =
      this.renderViews[0].renderData.geometry.attributes.COLOR !== undefined
    const indices = new Uint32Array(indicesCount)
    const position = new Float64Array(attributeCount)
    const color = new Float32Array(hasVertexColors ? attributeCount : 0)
    color.fill(1)
    const batchIndices = new Float32Array(attributeCount / 3)

    let offset = 0
    let arrayOffset = 0
    const batchObjects = []

    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      indices.set(
        geometry.attributes.INDEX.map((val) => val + offset / 3),
        arrayOffset
      )
      position.set(geometry.attributes.POSITION, offset)
      if (geometry.attributes.COLOR) color.set(geometry.attributes.COLOR, offset)
      batchIndices.fill(
        k,
        offset / 3,
        offset / 3 + geometry.attributes.POSITION.length / 3
      )
      this.renderViews[k].setBatchData(
        this.id,
        arrayOffset,
        geometry.attributes.INDEX.length,
        offset / 3,
        offset / 3 + geometry.attributes.POSITION.length / 3
      )

      const batchObject = new BatchObject(this.renderViews[k], k)
      batchObject.buildAccelerationStructure()
      batchObjects.push(batchObject)

      offset += geometry.attributes.POSITION.length
      arrayOffset += geometry.attributes.INDEX.length
    }

    const geometry = this.makeMeshGeometry(
      indices,
      position,
      batchIndices,
      hasVertexColors ? color : null
    )

    this.primitive = new SpeckleMesh(geometry)
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

    batchObjects.forEach((element: BatchObject) => {
      element.renderView.disposeGeometry()
    })
  }

  protected makeMeshGeometry(
    indices: Uint32Array | Uint16Array,
    position: Float64Array,
    batchIndices: Float32Array,
    color?: Float32Array
  ): BufferGeometry {
    const geometry = new BufferGeometry()
    if (position.length >= 65535 || indices.length >= 65535) {
      this.indexBuffer0 = new Uint32BufferAttribute(indices, 1)
      this.indexBuffer1 = new Uint32BufferAttribute(new Uint32Array(indices.length), 1)
    } else {
      this.indexBuffer0 = new Uint16BufferAttribute(indices, 1)
      this.indexBuffer1 = new Uint16BufferAttribute(new Uint16Array(indices.length), 1)
    }
    geometry.setIndex(this.indexBuffer0)

    if (position) {
      /** When RTE enabled, we'll be storing the high component of the encoding here,
       * which considering our current encoding method is actually the original casted
       * down float32 position!
       */
      geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
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

    Geometry.computeVertexNormals(geometry, position)
    Geometry.updateRTEGeometry(geometry, position)

    return geometry
  }

  public getRenderView(index: number): NodeRenderView {
    index
    Logger.warn('Deprecated! Use BatchObject')
    return null
  }
  public getMaterialAtIndex(index: number): Material {
    index
    Logger.warn('Deprecated! Use BatchObject')
    return null
  }
}
