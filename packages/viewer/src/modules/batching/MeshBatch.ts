import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Material,
  Object3D,
  Sphere,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  WebGLRenderer
} from 'three'
import { Geometry } from '../converter/Geometry'
import SpeckleMesh, { TransformStorage } from '../objects/SpeckleMesh'
import { NodeRenderView } from '../tree/NodeRenderView'
import {
  AllBatchUpdateRange,
  Batch,
  BatchUpdateRange,
  GeometryType,
  HideAllBatchUpdateRange
} from './Batch'
import { BatchObject } from './BatchObject'
import Logger from 'js-logger'
import { ObjectLayers } from '../../IViewer'
import { DrawGroup } from './InstancedMeshBatch'

export default class MeshBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  private transformStorage: TransformStorage
  private geometry: BufferGeometry
  public batchMaterial: Material
  public mesh: SpeckleMesh

  private gradientIndexBuffer: BufferAttribute

  private indexBuffer0: BufferAttribute
  private indexBuffer1: BufferAttribute
  private indexBufferIndex = 0
  private needsShuffle = false
  private needsFlatten = false

  public get bounds(): Box3 {
    return this.mesh.TAS.getBoundingBox(new Box3())
  }

  public get drawCalls(): number {
    return this.geometry.groups.length
  }

  public get minDrawCalls(): number {
    return [
      ...Array.from(new Set(this.geometry.groups.map((value) => value.materialIndex)))
    ].length
  }

  public constructor(
    id: string,
    subtreeId: string,
    renderViews: NodeRenderView[],
    transformStorage: TransformStorage
  ) {
    this.id = id
    this.subtreeId = subtreeId
    this.renderViews = renderViews
    this.transformStorage = transformStorage
  }

  public get geometryType(): GeometryType {
    return this.renderViews[0].geometryType
  }

  public get renderObject(): Object3D {
    return this.mesh
  }

  public getCount(): number {
    return this.geometry.index.count
  }

  public get materials(): Material[] {
    return this.mesh.material as Material[]
  }

  public get groups(): DrawGroup[] {
    return this.geometry.groups
  }

  public setBatchMaterial(material: Material) {
    this.batchMaterial = material
  }

  public onUpdate(deltaTime: number) {
    deltaTime
    if (this.needsFlatten) {
      this.flattenDrawGroups()
      this.needsFlatten = false
    }
    if (this.needsShuffle) {
      this.shuffleDrawGroups()
      this.needsShuffle = false
    }
  }

  public onRender(renderer: WebGLRenderer) {
    renderer
  }

  public setVisibleRange(...ranges: BatchUpdateRange[]) {
    if (ranges.length === 1 && ranges[0] === HideAllBatchUpdateRange) {
      this.geometry.setDrawRange(0, 0)
      this.mesh.visible = false
      return
    }
    if (
      ranges.length === 1 &&
      ranges[0].offset === AllBatchUpdateRange.offset &&
      ranges[0].count === AllBatchUpdateRange.count
    ) {
      this.geometry.setDrawRange(0, this.getCount())
      this.mesh.visible = true
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
    this.mesh.visible = true
  }

  public getVisibleRange(): BatchUpdateRange {
    if (this.geometry.groups.length === 0) return AllBatchUpdateRange
    return {
      offset: this.geometry.drawRange.start,
      count: this.geometry.drawRange.count
    }
  }

  public setBatchBuffers(...range: BatchUpdateRange[]): void {
    let minGradientIndex = Infinity
    let maxGradientIndex = 0
    for (let k = 0; k < range.length; k++) {
      if (range[k].materialOptions) {
        if (range[k].materialOptions.rampIndex !== undefined) {
          const start = range[k].offset
          const len = range[k].offset + range[k].count
          /** The ramp indices specify the *begining* of each ramp color. When sampling with Nearest filter (since we don't want filtering)
           *  we'll always be sampling right at the edge between texels. Most GPUs will sample consistently, but some won't and we end up with
           *  a ton of artifacts. To avoid this, we are shifting the sampling indices so they're right on the center of each texel, so no inconsistent
           *  sampling can occur.
           */
          const shiftedIndex =
            range[k].materialOptions.rampIndex +
            0.5 / range[k].materialOptions.rampWidth
          const minMaxIndices = this.updateGradientIndexBufferData(
            start,
            range[k].count === Infinity
              ? this.geometry.attributes['gradientIndex'].array.length
              : len,
            shiftedIndex
          )
          minGradientIndex = Math.min(minGradientIndex, minMaxIndices.minIndex)
          maxGradientIndex = Math.max(maxGradientIndex, minMaxIndices.maxIndex)
        }
      }
    }
    if (minGradientIndex < Infinity && maxGradientIndex > 0)
      this.updateGradientIndexBuffer()
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

    const sortedRanges = ranges.sort((a, b) => {
      return a.offset - b.offset
    })

    for (let i = 0; i < sortedRanges.length; i++) {
      const materialIndex = this.materials.indexOf(sortedRanges[i].material)
      const collidingGroup = this.getDrawRangeCollision(sortedRanges[i])
      if (collidingGroup) {
        collidingGroup.materialIndex = this.materials.indexOf(sortedRanges[i].material)
      } else {
        const includingGroup = this.geDrawRangeInclusion(sortedRanges[i])
        if (includingGroup && includingGroup.materialIndex !== materialIndex) {
          this.geometry.groups.splice(this.geometry.groups.indexOf(includingGroup), 1)
          if (includingGroup.start === sortedRanges[i].offset) {
            this.geometry.addGroup(
              sortedRanges[i].offset,
              sortedRanges[i].count,
              materialIndex
            )
            this.geometry.addGroup(
              sortedRanges[i].offset + sortedRanges[i].count,
              includingGroup.count - sortedRanges[i].count,
              includingGroup.materialIndex
            )
          } else if (
            sortedRanges[i].offset + sortedRanges[i].count ===
            includingGroup.start + includingGroup.count
          ) {
            this.geometry.addGroup(
              includingGroup.start,
              includingGroup.count - sortedRanges[i].count,
              includingGroup.materialIndex
            )
            this.geometry.addGroup(
              sortedRanges[i].offset,
              sortedRanges[i].count,
              materialIndex
            )
          } else {
            this.geometry.addGroup(
              includingGroup.start,
              sortedRanges[i].offset - includingGroup.start,
              includingGroup.materialIndex
            )
            this.geometry.addGroup(
              sortedRanges[i].offset,
              sortedRanges[i].count,
              materialIndex
            )
            this.geometry.addGroup(
              sortedRanges[i].offset + sortedRanges[i].count,
              includingGroup.count -
                (sortedRanges[i].count + sortedRanges[i].offset - includingGroup.start),
              includingGroup.materialIndex
            )
          }
        }
      }
    }
    let count = 0
    this.geometry.groups.forEach((value) => (count += value.count))
    if (count !== this.getCount()) {
      Logger.error(`Draw groups invalid on ${this.id}`)
    }
    this.setBatchBuffers(...ranges)
    this.needsFlatten = true
  }

  private getDrawRangeCollision(range: BatchUpdateRange): {
    start: number
    count: number
    materialIndex?: number
  } {
    if (this.geometry.groups.length > 0) {
      for (let i = 0; i < this.geometry.groups.length; i++) {
        if (
          range.offset === this.geometry.groups[i].start &&
          range.count === this.geometry.groups[i].count
        ) {
          return this.geometry.groups[i]
        }
      }
      return null
    }
    return null
  }

  private geDrawRangeInclusion(range: BatchUpdateRange): {
    start: number
    count: number
    materialIndex?: number
  } {
    if (this.geometry.groups.length > 0) {
      for (let i = 0; i < this.geometry.groups.length; i++) {
        if (
          range.offset >= this.geometry.groups[i].start &&
          range.offset + range.count <=
            this.geometry.groups[i].start + this.geometry.groups[i].count
        ) {
          return this.geometry.groups[i]
        }
      }
      return null
    }
    return null
  }

  private sortGroups() {
    this.geometry.groups.sort((a, b) => {
      const materialA: Material = (this.mesh.material as Array<Material>)[
        a.materialIndex
      ]
      const materialB: Material = (this.mesh.material as Array<Material>)[
        b.materialIndex
      ]
      const visibleOrder = +materialB.visible - +materialA.visible
      const transparentOrder = +materialA.transparent - +materialB.transparent
      if (visibleOrder !== 0) return visibleOrder
      return transparentOrder
    })
  }

  private flattenDrawGroups() {
    const materialOrder = []
    this.geometry.groups.reduce((previousValue, currentValue) => {
      if (previousValue.indexOf(currentValue.materialIndex) === -1) {
        previousValue.push(currentValue.materialIndex)
      }
      return previousValue
    }, materialOrder)
    const grouped = []
    for (let k = 0; k < materialOrder.length; k++) {
      grouped.push(
        this.geometry.groups.filter((val) => {
          return val.materialIndex === materialOrder[k]
        })
      )
    }
    this.geometry.groups = []
    for (let matIndex = 0; matIndex < grouped.length; matIndex++) {
      const matGroup = grouped[matIndex].sort((a, b) => {
        return a.start - b.start
      })
      for (let k = 0; k < matGroup.length; ) {
        let offset = matGroup[k].start
        let count = matGroup[k].count
        let runningCount = matGroup[k].count
        let n = k + 1
        for (; n < matGroup.length; n++) {
          if (offset + count === matGroup[n].start) {
            offset = matGroup[n].start
            count = matGroup[n].count
            runningCount += matGroup[n].count
          } else {
            const group = {
              start: matGroup[k].start,
              count: runningCount,
              materialIndex: matGroup[k].materialIndex,
              id: matGroup[k].id
            }
            this.geometry.groups.push(group)
            break
          }
        }
        if (n === matGroup.length) {
          const group = {
            start: matGroup[k].start,
            count: runningCount,
            materialIndex: matGroup[k].materialIndex,
            id: matGroup[k].id
          }
          this.geometry.groups.push(group)
        }
        k = n
      }
    }
    if (this.drawCalls > this.minDrawCalls + 2) {
      this.needsShuffle = true
    } else {
      this.geometry.groups.sort((a, b) => {
        return a.start - b.start
      })
      const transparentOrHiddenGroup = this.geometry.groups.find(
        (value) =>
          this.materials[value.materialIndex].transparent === true ||
          this.materials[value.materialIndex].visible === false
      )
      if (transparentOrHiddenGroup) {
        for (
          let k = this.geometry.groups.indexOf(transparentOrHiddenGroup);
          k < this.geometry.groups.length;
          k++
        ) {
          const material = this.materials[this.geometry.groups[k].materialIndex]
          if (material.transparent !== true && material.visible !== false) {
            this.needsShuffle = true
            break
          }
        }
      }
    }
  }

  private getCurrentIndexBuffer(): BufferAttribute {
    return this.indexBufferIndex % 2 === 0 ? this.indexBuffer0 : this.indexBuffer1
  }

  private getNextIndexBuffer(): BufferAttribute {
    return ++this.indexBufferIndex % 2 === 0 ? this.indexBuffer0 : this.indexBuffer1
  }

  private shuffleDrawGroups() {
    const groups = this.geometry.groups
      .sort((a, b) => {
        return a.start - b.start
      })
      .slice()

    this.geometry.groups.sort((a, b) => {
      const materialA: Material = (this.mesh.material as Array<Material>)[
        a.materialIndex
      ]
      const materialB: Material = (this.mesh.material as Array<Material>)[
        b.materialIndex
      ]
      const visibleOrder = +materialB.visible - +materialA.visible
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

    const sourceIBO: BufferAttribute = this.getCurrentIndexBuffer()
    const targetIBO: BufferAttribute = this.getNextIndexBuffer()
    const newGroups = []
    const scratchRvs = this.renderViews.slice()
    scratchRvs.sort((a, b) => {
      return a.batchStart - b.batchStart
    })
    let targetIBOOffset = 0
    for (let k = 0; k < grouped.length; k++) {
      const materialGroup = grouped[k]
      const materialGroupStart = targetIBOOffset
      let materialGroupCount = 0
      for (let i = 0; i < (materialGroup as []).length; i++) {
        const start = materialGroup[i].start
        const count = materialGroup[i].count
        const subArray = (sourceIBO.array as Uint16Array).subarray(start, start + count)
        ;(targetIBO.array as Uint16Array).set(subArray, targetIBOOffset)
        let rvTrisCount = 0
        for (let m = 0; m < scratchRvs.length; m++) {
          if (
            scratchRvs[m].batchStart >= start &&
            scratchRvs[m].batchEnd <= start + count
          ) {
            scratchRvs[m].setBatchData(
              this.id,
              targetIBOOffset + rvTrisCount,
              scratchRvs[m].batchCount
            )
            rvTrisCount += scratchRvs[m].batchCount
            scratchRvs.splice(m, 1)
            m--
          }
        }
        targetIBOOffset += count
        materialGroupCount += count
      }
      newGroups.push({
        offset: materialGroupStart,
        count: materialGroupCount,
        materialIndex: materialGroup[0].materialIndex
      })
    }
    this.geometry.groups = []
    for (let i = 0; i < newGroups.length; i++) {
      this.geometry.addGroup(
        newGroups[i].offset,
        newGroups[i].count,
        newGroups[i].materialIndex
      )
    }

    this.geometry.setIndex(targetIBO)
    this.geometry.index.needsUpdate = true

    const hiddenGroup = this.geometry.groups.find((value) => {
      return this.mesh.material[value.materialIndex].visible === false
    })
    if (hiddenGroup) {
      this.setVisibleRange({
        offset: 0,
        count: hiddenGroup.start
      })
    }
  }

  public resetDrawRanges() {
    this.mesh.setBatchMaterial(this.batchMaterial)
    this.mesh.visible = true
    this.geometry.clearGroups()
    this.geometry.addGroup(0, this.getCount(), 0)
    this.geometry.setDrawRange(0, Infinity)
  }

  public static bufferSetup = 0
  public static arrayWork = 0
  public static objectBvh = 0
  public static computeNormals = 0
  public static computeBoxAndSphere = 0
  public static computeRTE = 0
  public static batchBVH = 0

  public buildBatch() {
    const start = performance.now()
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

    MeshBatch.bufferSetup += performance.now() - start
    let offset = 0
    let arrayOffset = 0
    const batchObjects = []

    for (let k = 0; k < this.renderViews.length; k++) {
      const start2 = performance.now()
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
      MeshBatch.arrayWork += performance.now() - start2
      this.renderViews[k].setBatchData(
        this.id,
        arrayOffset,
        geometry.attributes.INDEX.length,
        offset / 3,
        offset / 3 + geometry.attributes.POSITION.length / 3
      )

      const batchObject = new BatchObject(this.renderViews[k], k)
      const start3 = performance.now()
      batchObject.buildAccelerationStructure()
      MeshBatch.objectBvh += performance.now() - start3
      batchObjects.push(batchObject)

      offset += geometry.attributes.POSITION.length
      arrayOffset += geometry.attributes.INDEX.length
    }

    this.makeMeshGeometry(
      indices,
      position,
      batchIndices,
      hasVertexColors ? color : null
    )

    this.mesh = new SpeckleMesh(this.geometry)
    this.mesh.setBatchObjects(batchObjects, this.transformStorage)
    this.mesh.setBatchMaterial(this.batchMaterial)
    const start6 = performance.now()
    this.mesh.buildTAS()
    MeshBatch.batchBVH += performance.now() - start6
    this.geometry.boundingBox = this.mesh.TAS.getBoundingBox(new Box3())
    this.geometry.boundingSphere = this.geometry.boundingBox.getBoundingSphere(
      new Sphere()
    )

    this.mesh.uuid = this.id
    this.mesh.layers.set(ObjectLayers.STREAM_CONTENT_MESH)
    this.mesh.frustumCulled = false
    this.mesh.geometry.addGroup(0, this.getCount(), 0)

    batchObjects.forEach((element: BatchObject) => {
      element.renderView.disposeGeometry()
    })
  }

  public getRenderView(index: number): NodeRenderView {
    index
    console.warn('Deprecated! Do not call this anymore')
    return null
  }

  public getMaterialAtIndex(index: number): Material {
    index
    console.warn('Deprecated! Do not call this anymore')
    return null
  }

  public getMaterial(rv: NodeRenderView): Material {
    for (let k = 0; k < this.geometry.groups.length; k++) {
      try {
        if (
          rv.batchStart >= this.geometry.groups[k].start &&
          rv.batchEnd <= this.geometry.groups[k].start + this.geometry.groups[k].count
        ) {
          return this.materials[this.geometry.groups[k].materialIndex]
        }
      } catch (e) {
        Logger.error('Failed to get material')
      }
    }
  }

  private makeMeshGeometry(
    indices: Uint32Array | Uint16Array,
    position: Float64Array,
    batchIndices: Float32Array,
    color?: Float32Array
  ): BufferGeometry {
    // const start5 = performance.now()
    this.geometry = new BufferGeometry()
    if (position.length >= 65535 || indices.length >= 65535) {
      this.indexBuffer0 = new Uint32BufferAttribute(indices, 1)
      this.indexBuffer1 = new Uint32BufferAttribute(new Uint32Array(indices.length), 1)
    } else {
      this.indexBuffer0 = new Uint16BufferAttribute(indices, 1)
      this.indexBuffer1 = new Uint16BufferAttribute(new Uint16Array(indices.length), 1)
    }
    this.geometry.setIndex(this.indexBuffer0)

    if (position) {
      /** When RTE enabled, we'll be storing the high component of the encoding here,
       * which considering our current encoding method is actually the original casted
       * down float32 position!
       */
      this.geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    }

    if (batchIndices) {
      this.geometry.setAttribute(
        'objIndex',
        new Float32BufferAttribute(batchIndices, 1)
      )
    }

    if (color) {
      this.geometry.setAttribute('color', new Float32BufferAttribute(color, 3))
    }

    const buffer = new Float32Array(position.length / 3)
    this.gradientIndexBuffer = new Float32BufferAttribute(buffer, 1)
    this.gradientIndexBuffer.setUsage(DynamicDrawUsage)
    this.geometry.setAttribute('gradientIndex', this.gradientIndexBuffer)
    // console.log(' -- Rest -> ', performance.now() - start5)
    // const start = performance.now()
    this.updateGradientIndexBufferData(0, buffer.length, 0)
    // console.log(' -- Gradient index update -> ', performance.now() - start)
    this.updateGradientIndexBuffer()

    const start2 = performance.now()
    Geometry.computeVertexNormals(this.geometry, position)
    MeshBatch.computeNormals += performance.now() - start2
    // const start3 = performance.now()
    // this.geometry.computeBoundingSphere()
    // this.geometry.computeBoundingBox()
    // MeshBatch.computeBoxAndSphere += performance.now() - start3

    const start4 = performance.now()
    Geometry.updateRTEGeometry(this.geometry, position)
    MeshBatch.computeRTE += performance.now() - start4

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
