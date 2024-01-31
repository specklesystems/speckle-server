import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Material,
  Object3D,
  Points,
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
  NoneBatchUpdateRange
} from './Batch'
import Logger from 'js-logger'
import { ObjectLayers } from '../../IViewer'
import { DrawGroup } from './InstancedMeshBatch'
import Materials from '../materials/Materials'

export default class PointBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  private geometry: BufferGeometry
  public batchMaterial: Material
  public mesh: Points
  private needsFlatten = false
  private needsShuffle = false

  private gradientIndexBuffer: BufferAttribute

  public get bounds() {
    if (!this.geometry.boundingBox) this.geometry.computeBoundingBox()
    return this.geometry.boundingBox
  }

  public get drawCalls(): number {
    return this.geometry.groups.length
  }

  public get minDrawCalls(): number {
    return (this.mesh.material as Material[]).length
  }

  public get triCount(): number {
    return this.getCount()
  }

  public get vertCount(): number {
    return this.geometry.attributes.position.count
  }

  public constructor(id: string, subtreeId: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.subtreeId = subtreeId
    this.renderViews = renderViews
  }

  public get renderObject(): Object3D {
    return this.mesh
  }

  public get geometryType(): GeometryType {
    return this.renderViews[0].geometryType
  }

  public get materials(): Material[] {
    return this.mesh.material as Material[]
  }

  public get groups(): DrawGroup[] {
    return this.geometry.groups
  }

  public getCount() {
    return this.geometry.attributes.position.array.length / 3
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
    /** Entire batch needs to NOT be drawn */
    if (ranges.length === 1 && ranges[0] === NoneBatchUpdateRange) {
      this.geometry.setDrawRange(0, 0)
      /** We unset the 'visible' flag, otherwise three.js will still run pointless buffer binding commands*/
      this.mesh.visible = false
      return
    }
    /** Entire batch needs to BE drawn */
    if (ranges.length === 1 && ranges[0] === AllBatchUpdateRange) {
      this.geometry.setDrawRange(0, this.getCount())
      this.mesh.visible = true
      return
    }

    /** Parts of the batch need to be visible. We get the min/max offset and total count */
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
    /** Entire batch is visible */
    if (this.geometry.groups.length === 1 && this.mesh.visible)
      return AllBatchUpdateRange
    /** Entire batch is hidden */
    if (!this.mesh.visible) return NoneBatchUpdateRange
    /** Parts of the batch are visible */
    return {
      offset: this.geometry.drawRange.start,
      count: this.geometry.drawRange.count
    }
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
      return {
        offset: transparentGroup.start,
        count:
          hiddenGroup !== undefined
            ? hiddenGroup.start
            : this.getCount() - transparentGroup.start
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

    const sourceIBO: BufferAttribute = this.geometry.index
    const targetIBOData: Uint16Array | Uint32Array = (
      sourceIBO.array as Uint16Array | Uint32Array
    ).slice()

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
        const subArray = (sourceIBO.array as Uint16Array | Uint32Array).subarray(
          start,
          start + count
        )
        targetIBOData.set(subArray, targetIBOOffset)
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

    ;(this.geometry.index.array as Uint16Array | Uint32Array).set(targetIBOData)
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
    this.mesh.material = [this.batchMaterial]
    this.mesh.visible = true
    this.geometry.clearGroups()
    this.geometry.addGroup(0, this.getCount(), 0)
    this.geometry.setDrawRange(0, Infinity)
  }

  public buildBatch() {
    let attributeCount = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      attributeCount +=
        this.renderViews[k].renderData.geometry.attributes.POSITION.length
    }
    const position = new Float64Array(attributeCount)
    const color = new Float32Array(attributeCount).fill(1)
    const index = new Int32Array(attributeCount / 3)
    let offset = 0
    let indexOffset = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      position.set(geometry.attributes.POSITION, offset)
      if (geometry.attributes.COLOR) color.set(geometry.attributes.COLOR, offset)
      index.set(
        new Int32Array(geometry.attributes.POSITION.length / 3).map(
          (value, index) => index + indexOffset
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
    this.makePointGeometry(index, position, color)
    this.mesh = new Points(this.geometry, this.batchMaterial)
    this.mesh.material = [this.batchMaterial]
    this.mesh.geometry.addGroup(0, this.getCount(), 0)
    this.mesh.uuid = this.id
    this.mesh.layers.set(
      this.renderViews[0].geometryType === GeometryType.POINT
        ? ObjectLayers.STREAM_CONTENT_POINT
        : ObjectLayers.STREAM_CONTENT_POINT_CLOUD
    )
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

  public getMaterialAtIndex(index: number): Material {
    for (let k = 0; k < this.renderViews.length; k++) {
      if (
        index >= this.renderViews[k].batchStart &&
        index < this.renderViews[k].batchEnd
      ) {
        const rv = this.renderViews[k]
        const group = this.geometry.groups.find((value) => {
          return (
            rv.batchStart >= value.start &&
            rv.batchStart + rv.batchCount <= value.count + value.start
          )
        })
        if (!Array.isArray(this.mesh.material)) {
          return this.mesh.material
        } else {
          if (!group) {
            Logger.warn(`Malformed material index!`)
            return null
          }
          return this.mesh.material[group.materialIndex]
        }
      }
    }
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

  private makePointGeometry(
    index: Int32Array,
    position: Float64Array,
    color: Float32Array
  ): BufferGeometry {
    this.geometry = new BufferGeometry()

    this.geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    this.geometry.setAttribute('color', new Float32BufferAttribute(color, 3))
    if (position.length >= 65535 || index.length >= 65535) {
      this.geometry.setIndex(new Uint32BufferAttribute(index, 1))
    } else {
      this.geometry.setIndex(new Uint16BufferAttribute(index, 1))
    }

    const buffer = new Float32Array(position.length / 3)
    this.gradientIndexBuffer = new Float32BufferAttribute(buffer, 1)
    this.gradientIndexBuffer.setUsage(DynamicDrawUsage)
    this.geometry.setAttribute('gradientIndex', this.gradientIndexBuffer)
    this.updateGradientIndexBufferData(0, buffer.length, 0)
    this.updateGradientIndexBuffer()

    this.geometry.computeBoundingSphere()
    this.geometry.computeBoundingBox()

    Geometry.updateRTEGeometry(this.geometry, position)

    return this.geometry
  }

  private updateGradientIndexBufferData(
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
    this.geometry.attributes['gradientIndex'].needsUpdate = true
    return {
      minIndex: start,
      maxIndex: end
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
