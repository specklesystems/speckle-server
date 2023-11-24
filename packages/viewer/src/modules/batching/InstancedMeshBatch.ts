import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
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
  HideAllBatchUpdateRange
} from './Batch'
import SpeckleInstancedMesh from '../objects/SpeckleInstancedMesh'
import { ObjectLayers } from '../../IViewer'
import {
  AccelerationStructure,
  DefaultBVHOptions
} from '../objects/AccelerationStructure'
import { InstancedBatchObject } from './InstancedBatchObject'
import Logger from 'js-logger'

export interface DrawGroup {
  start: number
  count: number
  materialIndex?: number
}

export default class InstancedMeshBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  private geometry: BufferGeometry
  public batchMaterial: Material
  public mesh: SpeckleInstancedMesh

  private gradientIndexBuffer: InstancedBufferAttribute

  private needsShuffle = false
  private needsFlatten = false

  public get bounds(): Box3 {
    // return this.mesh.BVH.getBoundingBox(new Box3())
    const bounds = new Box3()
    for (let k = 0; k < this.renderViews.length; k++) {
      bounds.union(this.renderViews[k].aabb)
    }

    return bounds
  }

  public get drawCalls(): number {
    return this.geometry.groups.length
  }

  public get minDrawCalls(): number {
    // return [
    //   ...Array.from(new Set(this.geometry.groups.map((value) => value.materialIndex)))
    // ].length
    return 1
  }

  public constructor(id: string, subtreeId: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.subtreeId = subtreeId
    this.renderViews = renderViews
  }

  public get geometryType(): GeometryType {
    return GeometryType.MESH
  }

  public get renderObject(): Object3D {
    return this.mesh
  }

  public getCount(): number {
    return this.geometry.index.count * this.renderViews.length
  }

  public get materials(): Material[] {
    return this.mesh.materials
  }

  public get groups(): Array<DrawGroup> {
    return this.mesh.groups
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
    // if (this.needsShuffle) {
    //   this.autoFillDrawRangesShuffleIBO()
    //   this.needsShuffle = false
    // }
  }

  public onRender(renderer: WebGLRenderer) {
    renderer
  }

  public setVisibleRange(...ranges: BatchUpdateRange[]) {
    if (ranges.length === 1 && ranges[0] === HideAllBatchUpdateRange) {
      this.mesh.visible = false
      return
    }
    this.mesh.visible = true
    // if (
    //   ranges.length === 1 &&
    //   ranges[0].offset === AllBatchUpdateRange.offset &&
    //   ranges[0].count === AllBatchUpdateRange.count
    // ) {
    //   this.geometry.setDrawRange(0, this.getCount())
    //   this.mesh.visible = true
    //   return
    // }

    // let minOffset = Infinity
    // let maxOffset = 0
    // ranges.forEach((range) => {
    //   minOffset = Math.min(minOffset, range.offset)
    //   maxOffset = Math.max(maxOffset, range.offset)
    // })

    // this.geometry.setDrawRange(
    //   minOffset,
    //   maxOffset - minOffset + ranges.find((val) => val.offset === maxOffset).count
    // )
    // this.mesh.visible = true
  }

  public getVisibleRange(): BatchUpdateRange {
    if (this.mesh.visible) return AllBatchUpdateRange
    return HideAllBatchUpdateRange
  }

  public setBatchBuffers(...range: BatchUpdateRange[]): void {
    range
    // let minGradientIndex = Infinity
    // let maxGradientIndex = 0
    // for (let k = 0; k < range.length; k++) {
    //   if (range[k].materialOptions) {
    //     if (range[k].materialOptions.rampIndex !== undefined) {
    //       const start = range[k].offset
    //       const len = range[k].offset + range[k].count
    //       /** The ramp indices specify the *begining* of each ramp color. When sampling with Nearest filter (since we don't want filtering)
    //        *  we'll always be sampling right at the edge between texels. Most GPUs will sample consistently, but some won't and we end up with
    //        *  a ton of artifacts. To avoid this, we are shifting the sampling indices so they're right on the center of each texel, so no inconsistent
    //        *  sampling can occur.
    //        */
    //       const shiftedIndex =
    //         range[k].materialOptions.rampIndex +
    //         0.5 / range[k].materialOptions.rampWidth
    //       const minMaxIndices = this.updateGradientIndexBufferData(
    //         start,
    //         range[k].count === Infinity
    //           ? this.geometry.attributes['gradientIndex'].array.length
    //           : len,
    //         shiftedIndex
    //       )
    //       minGradientIndex = Math.min(minGradientIndex, minMaxIndices.minIndex)
    //       maxGradientIndex = Math.max(maxGradientIndex, minMaxIndices.maxIndex)
    //     }
    //   }
    // }
    // if (minGradientIndex < Infinity && maxGradientIndex > 0)
    //   this.updateGradientIndexBuffer()
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
          this.groups.splice(this.groups.indexOf(includingGroup), 1)
          if (includingGroup.start === sortedRanges[i].offset) {
            this.groups.push({
              start: sortedRanges[i].offset,
              count: sortedRanges[i].count,
              materialIndex
            })
            if (includingGroup.count - sortedRanges[i].count > 0) {
              this.groups.push({
                start: sortedRanges[i].offset + sortedRanges[i].count,
                count: includingGroup.count - sortedRanges[i].count,
                materialIndex: includingGroup.materialIndex
              })
            }
          } else if (
            sortedRanges[i].offset + sortedRanges[i].count ===
            includingGroup.start + includingGroup.count
          ) {
            this.groups.push({
              start: includingGroup.start,
              count: includingGroup.count - sortedRanges[i].count,
              materialIndex: includingGroup.materialIndex
            })
            this.groups.push({
              start: sortedRanges[i].offset,
              count: sortedRanges[i].count,
              materialIndex
            })
          } else {
            this.groups.push({
              start: includingGroup.start,
              count: sortedRanges[i].offset - includingGroup.start,
              materialIndex: includingGroup.materialIndex
            })
            this.groups.push({
              start: sortedRanges[i].offset,
              count: sortedRanges[i].count,
              materialIndex
            })
            this.groups.push({
              start: sortedRanges[i].offset + sortedRanges[i].count,
              count:
                includingGroup.count -
                (sortedRanges[i].count + sortedRanges[i].offset - includingGroup.start),
              materialIndex: includingGroup.materialIndex
            })
          }
        }
      }
    }
    let count = 0
    this.groups.forEach((value) => (count += value.count))
    if (count !== this.renderViews.length) {
      Logger.error(`Draw groups invalid on ${this.id}`)
    }
    // this.setBatchBuffers(...ranges)
    this.needsFlatten = true
  }

  private getDrawRangeCollision(range: BatchUpdateRange): {
    start: number
    count: number
    materialIndex?: number
  } {
    if (this.groups.length > 0) {
      for (let i = 0; i < this.groups.length; i++) {
        if (
          range.offset === this.groups[i].start &&
          range.count === this.groups[i].count
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
    range
    if (this.groups.length > 0) {
      for (let i = 0; i < this.groups.length; i++) {
        if (
          range.offset >= this.groups[i].start &&
          range.offset + range.count <= this.groups[i].start + this.groups[i].count
        ) {
          return this.groups[i]
        }
      }
      return null
    }
    return null
  }

  private flattenDrawGroups() {
    const materialOrder = []
    this.groups.reduce((previousValue, currentValue) => {
      if (previousValue.indexOf(currentValue.materialIndex) === -1) {
        previousValue.push(currentValue.materialIndex)
      }
      return previousValue
    }, materialOrder)
    const grouped = []
    for (let k = 0; k < materialOrder.length; k++) {
      grouped.push(
        this.groups.filter((val) => {
          return val.materialIndex === materialOrder[k]
        })
      )
    }
    this.groups.length = 0
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
              materialIndex: matGroup[k].materialIndex
            }
            this.groups.push(group)
            break
          }
        }
        if (n === matGroup.length) {
          const group = {
            start: matGroup[k].start,
            count: runningCount,
            materialIndex: matGroup[k].materialIndex
          }
          this.groups.push(group)
        }
        k = n
      }
    }
    console.warn(this.groups)
    if (this.drawCalls > this.minDrawCalls + 2) {
      this.needsShuffle = true
    } else {
      this.groups.sort((a, b) => {
        return a.start - b.start
      })
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
    // this.mesh.setBatchMaterial(this.batchMaterial)
    // this.mesh.visible = true
    // this.geometry.clearGroups()
    // this.geometry.addGroup(0, this.getCount(), 0)
    // this.geometry.setDrawRange(0, Infinity)
  }

  public buildBatch() {
    const batchObjects = []
    let instanceBVH = null
    for (let k = 0; k < this.renderViews.length; k++) {
      this.renderViews[k].setBatchData(this.id, k, 1)
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
    this.mesh = new SpeckleInstancedMesh(this.geometry, this.renderViews.length)
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

    this.groups.push({ start: 0, count: this.renderViews.length, materialIndex: 0 })
    this.materials.push(this.batchMaterial)
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
    rv
    // for (let k = 0; k < this.geometry.groups.length; k++) {
    //   try {
    //     if (
    //       rv.batchStart >= this.geometry.groups[k].start &&
    //       rv.batchEnd <= this.geometry.groups[k].start + this.geometry.groups[k].count
    //     ) {
    //       return this.materials[this.geometry.groups[k].materialIndex]
    //     }
    //   } catch (e) {
    //     Logger.error('Failed to get material')
    //   }
    // }
    return this.batchMaterial
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

    // const buffer = new Float32Array(position.length / 3)
    // this.gradientIndexBuffer = new InstancedBufferAttribute(buffer, 1)
    // this.gradientIndexBuffer.setUsage(DynamicDrawUsage)
    // this.geometry.setAttribute('gradientIndex', this.gradientIndexBuffer)
    // this.updateGradientIndexBufferData(0, buffer.length, 0)
    // this.updateGradientIndexBuffer()

    Geometry.computeVertexNormals(this.geometry, position)

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
