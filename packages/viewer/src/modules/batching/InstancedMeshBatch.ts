import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  Material,
  Matrix4,
  Object3D,
  Sphere,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  WebGLRenderer
} from 'three'
import { Geometry } from '../converter/Geometry'
import { NodeRenderView } from '../tree/NodeRenderView'
import {
  AllBatchUpdateRange,
  Batch,
  BatchUpdateRange,
  GeometryType,
  INSTANCE_TRANSFORM_BUFFER_STRIDE,
  NoneBatchUpdateRange
} from './Batch'
import SpeckleInstancedMesh from '../objects/SpeckleInstancedMesh'
import { ObjectLayers } from '../../IViewer'
import {
  AccelerationStructure,
  DefaultBVHOptions
} from '../objects/AccelerationStructure'
import { InstancedBatchObject } from './InstancedBatchObject'
import Logger from 'js-logger'
import Materials from '../materials/Materials'
import { DrawRanges } from './DrawRanges'
import SpeckleStandardColoredMaterial from '../materials/SpeckleStandardColoredMaterial'
import { DrawGroup } from './Batch'

export class InstancedMeshBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  private geometry: BufferGeometry
  public batchMaterial: Material
  public mesh: SpeckleInstancedMesh
  private drawRanges: DrawRanges = new DrawRanges()

  private instanceTransformBuffer0: Float32Array = null
  private instanceTransformBuffer1: Float32Array = null
  private transformBufferIndex: number = 0
  private instanceGradientBuffer: Float32Array = null

  private needsShuffle = false

  public get bounds(): Box3 {
    return this.mesh.TAS.getBoundingBox(new Box3())
  }

  public get drawCalls(): number {
    return this.groups.length
  }

  public get minDrawCalls(): number {
    return [...Array.from(new Set(this.groups.map((value) => value.materialIndex)))]
      .length
  }

  public get maxDrawCalls(): number {
    return 1
  }

  public get triCount(): number {
    return (this.geometry.index.count / 3) * this.renderViews.length
  }

  public get vertCount(): number {
    return this.geometry.attributes.position.count * this.renderViews.length
  }

  public get pointCount(): number {
    return 0
  }

  public get lineCount(): number {
    return 0
  }

  public get geometryType(): GeometryType {
    return GeometryType.MESH
  }

  public get renderObject(): Object3D {
    return this.mesh
  }

  public getCount(): number {
    return this.renderViews.length * 16
  }

  public get materials(): Material[] {
    return this.mesh.materials
  }

  public get groups(): Array<DrawGroup> {
    return this.mesh.groups
  }

  public constructor(id: string, subtreeId: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.subtreeId = subtreeId
    this.renderViews = renderViews
  }

  public setBatchMaterial(material: Material) {
    this.batchMaterial = material
  }

  public onUpdate(deltaTime: number) {
    deltaTime
    if (this.needsShuffle) {
      this.shuffleDrawGroups()
      this.needsShuffle = false
    }
  }

  public onRender(renderer: WebGLRenderer) {
    renderer
  }

  /** Note: You can only set visibility on ranges that exist as draw groups! */
  public setVisibleRange(...ranges: BatchUpdateRange[]) {
    /** Entire batch needs to NOT be drawn */
    if (ranges.length === 1 && ranges[0] === NoneBatchUpdateRange) {
      this.mesh.children.forEach((instance) => (instance.visible = false))
      return
    }
    /** Entire batch needs to BE drawn */
    if (ranges.length === 1 && ranges[0] === AllBatchUpdateRange) {
      this.mesh.children.forEach((instance) => (instance.visible = true))
      return
    }

    this.mesh.children.forEach((instance) => (instance.visible = false))
    ranges.forEach((range) => {
      const instanceIndex = this.groups.indexOf(
        this.groups.find(
          (group: DrawGroup) =>
            range.offset === group.start &&
            range.offset + range.count === group.start + group.count
        )
      )
      if (instanceIndex !== -1) this.mesh.children[instanceIndex].visible = true
    })
  }

  public getVisibleRange(): BatchUpdateRange {
    if (!this.mesh.children[0].visible) return NoneBatchUpdateRange
    for (let k = 0; k < this.mesh.children.length; k++) {
      if (!this.mesh.children[k].visible) {
        return {
          offset: 0,
          count: k * 16
        }
      }
    }
    return AllBatchUpdateRange
  }

  public getOpaque(): BatchUpdateRange {
    /** If there is any transparent or hidden group return the update range up to it's offset */
    const transparentOrHiddenGroup = this.groups.find((value) => {
      return (
        Materials.isTransparent(this.materials[value.materialIndex]) ||
        this.materials[value.materialIndex].visible === false
      )
    })

    if (transparentOrHiddenGroup) {
      return {
        offset: 0,
        count: transparentOrHiddenGroup.start
      }
    }
    /** Entire batch is opaque */
    return AllBatchUpdateRange
  }

  public getDepth(): BatchUpdateRange {
    /** If there is any transparent or hidden group return the update range up to it's offset */
    const transparentOrHiddenGroup = this.groups.find((value) => {
      return (
        Materials.isTransparent(this.materials[value.materialIndex]) ||
        this.materials[value.materialIndex].visible === false ||
        this.materials[value.materialIndex].colorWrite === false
      )
    })

    if (transparentOrHiddenGroup) {
      return {
        offset: 0,
        count: transparentOrHiddenGroup.start
      }
    }
    /** Entire batch is opaque */
    return AllBatchUpdateRange
  }

  public getTransparent(): BatchUpdateRange {
    /** Look for a transparent group */
    const transparentGroup = this.groups.find((value) => {
      return Materials.isTransparent(this.materials[value.materialIndex])
    })
    /** Look for a hidden group */
    const hiddenGroup = this.groups.find((value) => {
      return this.materials[value.materialIndex].visible === false
    })
    /** If there is a transparent group return it's range */
    if (transparentGroup) {
      const offset = transparentGroup.start
      const count =
        hiddenGroup !== undefined
          ? hiddenGroup.start
          : this.getCount() - transparentGroup.start
      if (offset === 0 && count === this.getCount()) return AllBatchUpdateRange
      return {
        offset,
        count
      }
    }
    /** Entire batch is not transparent */
    return NoneBatchUpdateRange
  }

  public getStencil(): BatchUpdateRange {
    /** If there is a single group and it's material writes to stencil, return all */
    if (this.groups.length === 1) {
      if (this.materials[0].stencilWrite === true) return AllBatchUpdateRange
    }
    const stencilGroup = this.groups.find((value) => {
      return this.materials[value.materialIndex].stencilWrite === true
    })
    if (stencilGroup) {
      return {
        offset: stencilGroup.start,
        count: stencilGroup.count
      }
    }
    /** No stencil group */
    return NoneBatchUpdateRange
  }

  public setBatchBuffers(...range: BatchUpdateRange[]): void {
    for (let k = 0; k < range.length; k++) {
      if (range[k].materialOptions) {
        if (range[k].materialOptions.rampIndex !== undefined) {
          const start = range[k].offset
          /** The ramp indices specify the *begining* of each ramp color. When sampling with Nearest filter (since we don't want filtering)
           *  we'll always be sampling right at the edge between texels. Most GPUs will sample consistently, but some won't and we end up with
           *  a ton of artifacts. To avoid this, we are shifting the sampling indices so they're right on the center of each texel, so no inconsistent
           *  sampling can occur.
           */
          const shiftedIndex =
            range[k].materialOptions.rampIndex +
            0.5 / range[k].materialOptions.rampWidth
          this.updateGradientIndexBufferData(start / 16, shiftedIndex)
        }
        /** We need to update the texture here, because each batch uses it's own clone for any material we use on it
         *  because otherwise three.js won't properly update our custom uniforms
         */
        if (range[k].materialOptions.rampTexture !== undefined) {
          if (range[k].material instanceof SpeckleStandardColoredMaterial) {
            ;(range[k].material as SpeckleStandardColoredMaterial).setGradientTexture(
              range[k].materialOptions.rampTexture
            )
          }
        }
      }
    }
  }

  public setDrawRanges(...ranges: BatchUpdateRange[]) {
    ranges.forEach((value: BatchUpdateRange) => {
      if (value.material) {
        value.material = this.mesh.getCachedMaterial(value.material)
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

    this.mesh.groups = this.drawRanges.integrateRanges(
      this.groups,
      this.materials,
      ranges
    )

    let count = 0
    this.groups.forEach((value) => (count += value.count))
    if (count !== this.renderViews.length * 16) {
      Logger.error(`Draw groups invalid on ${this.id}`)
    }
    this.setBatchBuffers(...ranges)
    this.cleanMaterials()
    /** We shuffle only when above a certain fragmentation threshold. We don't want to be shuffling every single time */
    if (this.drawCalls > this.maxDrawCalls) {
      this.needsShuffle = true
    } else
      this.mesh.updateDrawGroups(
        this.getCurrentTransformBuffer(),
        this.getCurrentGradientBuffer()
      )
  }

  private cleanMaterials() {
    const materialsInUse = [
      ...Array.from(
        new Set(this.groups.map((value) => this.materials[value.materialIndex]))
      )
    ]
    let k = 0
    while (this.materials.length > materialsInUse.length) {
      if (!materialsInUse.includes(this.materials[k])) {
        this.materials.splice(k, 1)
        this.groups.forEach((value: DrawGroup) => {
          if (value.materialIndex > k) value.materialIndex--
        })
        k = 0
        continue
      }
      k++
    }
  }

  private shuffleDrawGroups() {
    const groups = this.groups
      .sort((a, b) => {
        return a.start - b.start
      })
      .slice()

    this.groups.sort((a, b) => {
      const materialA: Material = this.materials[a.materialIndex]
      const materialB: Material = this.materials[b.materialIndex]
      const visibleOrder =
        +materialB.visible +
        +materialB.colorWrite -
        (+materialA.visible + +materialA.colorWrite)
      const transparentOrder = +materialA.transparent - +materialB.transparent
      if (visibleOrder !== 0) return visibleOrder
      return transparentOrder
    })

    const materialOrder = []
    groups.reduce((previousValue, currentValue) => {
      if (previousValue.indexOf(currentValue.materialIndex) === -1) {
        previousValue.push(currentValue.materialIndex)
      }
      return previousValue
    }, materialOrder)

    const grouped = []
    for (let k = 0; k < materialOrder.length; k++) {
      grouped.push(
        groups.filter((val) => {
          return val.materialIndex === materialOrder[k]
        })
      )
    }

    const sourceTransformBuffer: Float32Array = this.getCurrentTransformBuffer()
    const targetTransformBuffer: Float32Array = this.getNextTransformBuffer()
    const sourceGradientBuffer: Float32Array = this.getCurrentGradientBuffer()
    const targetGradientBuffer: Float32Array = new Float32Array(
      sourceGradientBuffer.length
    )
    const newGroups = []
    const scratchRvs = this.renderViews.slice()
    scratchRvs.sort((a, b) => {
      return a.batchStart - b.batchStart
    })
    let targetBufferOffset = 0
    for (let k = 0; k < grouped.length; k++) {
      const materialGroup = grouped[k]
      const materialGroupStart = targetBufferOffset
      let materialGroupCount = 0
      for (let i = 0; i < (materialGroup as []).length; i++) {
        const start = materialGroup[i].start
        const count = materialGroup[i].count
        let subArray = sourceTransformBuffer.subarray(start, start + count)
        targetTransformBuffer.set(subArray, targetBufferOffset)
        subArray = sourceGradientBuffer.subarray(
          start / INSTANCE_TRANSFORM_BUFFER_STRIDE,
          (start + count) / INSTANCE_TRANSFORM_BUFFER_STRIDE
        )
        targetGradientBuffer.set(
          subArray,
          targetBufferOffset / INSTANCE_TRANSFORM_BUFFER_STRIDE
        )
        let rvElemCount = 0
        for (let m = 0; m < scratchRvs.length; m++) {
          if (
            scratchRvs[m].batchStart >= start &&
            scratchRvs[m].batchEnd <= start + count
          ) {
            scratchRvs[m].setBatchData(
              this.id,
              targetBufferOffset + rvElemCount,
              scratchRvs[m].batchCount
            )
            rvElemCount += scratchRvs[m].batchCount
            scratchRvs.splice(m, 1)
            m--
          }
        }
        targetBufferOffset += count
        materialGroupCount += count
      }
      newGroups.push({
        offset: materialGroupStart,
        count: materialGroupCount,
        materialIndex: materialGroup[0].materialIndex
      })
    }
    this.groups.length = 0
    for (let i = 0; i < newGroups.length; i++) {
      this.groups.push({
        start: newGroups[i].offset,
        count: newGroups[i].count,
        materialIndex: newGroups[i].materialIndex
      })
    }
    sourceGradientBuffer.set(targetGradientBuffer, 0)
    this.mesh.updateDrawGroups(targetTransformBuffer, sourceGradientBuffer)

    /** Solve hidden groups */
    const hiddenGroup = this.groups.find((value) => {
      return this.materials[value.materialIndex].visible === false
    })
    if (hiddenGroup) {
      this.setVisibleRange({
        offset: 0,
        count: hiddenGroup.start
      })
    }
  }

  public resetDrawRanges() {
    this.groups.length = 0
    this.materials.length = 0
    this.groups.push({
      start: 0,
      count: this.renderViews.length * INSTANCE_TRANSFORM_BUFFER_STRIDE,
      materialIndex: 0
    })
    this.materials.push(this.batchMaterial)
    this.setVisibleRange(AllBatchUpdateRange)
    this.mesh.updateDrawGroups(
      this.getCurrentTransformBuffer(),
      this.getCurrentGradientBuffer()
    )
  }

  private getCurrentTransformBuffer(): Float32Array {
    return this.transformBufferIndex % 2 === 0
      ? this.instanceTransformBuffer0
      : this.instanceTransformBuffer1
  }

  private getNextTransformBuffer(): Float32Array {
    return ++this.transformBufferIndex % 2 === 0
      ? this.instanceTransformBuffer0
      : this.instanceTransformBuffer1
  }

  private getCurrentGradientBuffer(): Float32Array {
    return this.instanceGradientBuffer
  }

  public buildBatch() {
    const batchObjects = []
    let instanceBVH = null
    this.instanceTransformBuffer0 = new Float32Array(
      this.renderViews.length * INSTANCE_TRANSFORM_BUFFER_STRIDE
    )
    this.instanceTransformBuffer1 = new Float32Array(
      this.renderViews.length * INSTANCE_TRANSFORM_BUFFER_STRIDE
    )
    const targetInstanceTransformBuffer = this.getCurrentTransformBuffer()

    for (let k = 0; k < this.renderViews.length; k++) {
      this.renderViews[k].renderData.geometry.transform.toArray(
        targetInstanceTransformBuffer,
        k * INSTANCE_TRANSFORM_BUFFER_STRIDE
      )
      this.renderViews[k].setBatchData(
        this.id,
        k * INSTANCE_TRANSFORM_BUFFER_STRIDE,
        INSTANCE_TRANSFORM_BUFFER_STRIDE
      )
      const batchObject = new InstancedBatchObject(this.renderViews[k], k)
      if (!instanceBVH) {
        const transform = new Matrix4().makeTranslation(
          batchObject.localOrigin.x,
          batchObject.localOrigin.y,
          batchObject.localOrigin.z
        )
        transform.invert()
        const indices = this.renderViews[k].renderData.geometry.attributes.INDEX
        const position = this.renderViews[k].renderData.geometry.attributes.POSITION
        instanceBVH = AccelerationStructure.buildBVH(
          indices,
          new Float32Array(position),
          DefaultBVHOptions,
          transform
        )
        /** There's a bug in the library where it reports incorrect bounds until a refit */
        instanceBVH.refit()
      }
      batchObject.buildAccelerationStructure(instanceBVH)
      batchObjects.push(batchObject)
    }

    const indices = new Uint32Array(
      this.renderViews[0].renderData.geometry.attributes.INDEX
    )
    const positions = new Float64Array(
      this.renderViews[0].renderData.geometry.attributes.POSITION
    )
    const colors = new Float32Array(
      this.renderViews[0].renderData.geometry.attributes.COLOR
    )

    this.makeInstancedMeshGeometry(indices, positions, colors)
    this.mesh = new SpeckleInstancedMesh(this.geometry)
    this.mesh.setBatchObjects(batchObjects)
    this.mesh.setBatchMaterial(this.batchMaterial)
    this.mesh.buildTAS()
    const bounds = new Box3()
    for (let k = 0; k < this.renderViews.length; k++) {
      bounds.union(this.renderViews[k].aabb)
    }

    this.geometry.boundingBox = this.mesh.TAS.getBoundingBox(new Box3())
    this.geometry.boundingSphere = this.geometry.boundingBox.getBoundingSphere(
      new Sphere()
    )

    this.mesh.uuid = this.id
    this.mesh.layers.set(ObjectLayers.STREAM_CONTENT_MESH)
    this.mesh.frustumCulled = false

    this.groups.push({
      start: 0,
      count: this.renderViews.length * INSTANCE_TRANSFORM_BUFFER_STRIDE,
      materialIndex: 0
    })
    this.mesh.updateDrawGroups(
      this.getCurrentTransformBuffer(),
      this.getCurrentGradientBuffer()
    )
  }

  public getRenderView(index: number): NodeRenderView {
    index
    Logger.warn('Deprecated! Use InstancedBatchObject')
    return null
  }

  public getMaterialAtIndex(index: number): Material {
    index
    Logger.warn('Deprecated! Use InstancedBatchObject')
    return null
  }

  public getMaterial(rv: NodeRenderView): Material {
    const group = this.groups.find((value) => {
      return (
        rv.batchStart >= value.start &&
        rv.batchStart + rv.batchCount <= value.count + value.start
      )
    })
    if (!group) {
      Logger.warn(`Could not get material for ${rv.renderData.id}`)
      return null
    }
    return this.materials[group.materialIndex]
  }

  private makeInstancedMeshGeometry(
    indices: Uint32Array | Uint16Array,
    position: Float64Array,
    color?: Float32Array
  ): BufferGeometry {
    this.geometry = new BufferGeometry()
    if (position) {
      /** When RTE enabled, we'll be storing the high component of the encoding here,
       * which considering our current encoding method is actually the original casted
       * down float32 position!
       */
      this.geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    }

    if (color) {
      this.geometry.setAttribute('color', new Float32BufferAttribute(color, 3))
    }
    let indexBuffer = null
    if (position.length >= 65535 || indices.length >= 65535) {
      indexBuffer = new Uint32BufferAttribute(indices, 1)
    } else {
      indexBuffer = new Uint16BufferAttribute(indices, 1)
    }
    this.geometry.setIndex(indexBuffer)

    this.instanceGradientBuffer = new Float32Array(this.renderViews.length)

    Geometry.computeVertexNormals(this.geometry, position)

    Geometry.updateRTEGeometry(this.geometry, position)

    return this.geometry
  }

  private updateGradientIndexBufferData(index: number, value: number): void {
    const data = this.getCurrentGradientBuffer()
    data[index] = value
  }

  public purge() {
    this.renderViews.length = 0
    this.geometry.dispose()
    this.batchMaterial.dispose()
    this.mesh = null
  }
}
