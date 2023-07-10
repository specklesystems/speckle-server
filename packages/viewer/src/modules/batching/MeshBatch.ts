import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Material,
  Object3D,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  WebGLRenderer
} from 'three'
import { Geometry } from '../converter/Geometry'
import SpeckleStandardColoredMaterial from '../materials/SpeckleStandardColoredMaterial'
import SpeckleMesh from '../objects/SpeckleMesh'
import { NodeRenderView } from '../tree/NodeRenderView'
import {
  AllBatchUpdateRange,
  Batch,
  BatchUpdateRange,
  GeometryType,
  HideAllBatchUpdateRange
} from './Batch'
import { ObjectLayers } from '../SpeckleRenderer'
import { TransformStorage } from './Batcher'
import { BatchObject } from './BatchObject'
import { GeometryConverter } from '../converter/GeometryConverter'

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

  public get bounds(): Box3 {
    return this.mesh.BVH.getBoundingBox(new Box3())
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

  public setBatchMaterial(material: Material) {
    this.batchMaterial = material
  }

  public onUpdate(deltaTime: number) {
    deltaTime
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

  public setDrawRanges(...ranges: BatchUpdateRange[]) {
    ranges.forEach((value: BatchUpdateRange) => {
      if (value.material) {
        value.material = this.mesh.getCachedMaterial(
          value.material,
          value.materialOptions?.needsCopy
        )
      }
    })
    const materials = ranges.map((val) => val.material)
    const uniqueMaterials = [...Array.from(new Set(materials.map((value) => value)))]
    if (!Array.isArray(this.mesh.material)) {
      this.mesh.material = [this.mesh.material]
    }
    for (let k = 0; k < uniqueMaterials.length; k++) {
      if (!this.mesh.material.includes(uniqueMaterials[k]))
        this.mesh.material.push(uniqueMaterials[k])
    }

    const sortedRanges = ranges.sort((a, b) => {
      return a.offset - b.offset
    })

    const newGroups = []
    let minGradientIndex = Infinity
    let maxGradientIndex = 0
    for (let k = 0; k < sortedRanges.length; k++) {
      if (sortedRanges[k].materialOptions) {
        if (sortedRanges[k].materialOptions.rampIndex !== undefined) {
          const start = sortedRanges[k].offset
          const len = sortedRanges[k].offset + sortedRanges[k].count
          /** The ramp indices specify the *begining* of each ramp color. When sampling with Nearest filter (since we don't want filtering)
           *  we'll always be sampling right at the edge between texels. Most GPUs will sample consistently, but some won't and we end up with
           *  a ton of artifacts. To avoid this, we are shifting the sampling indices so they're right on the center of each texel, so no inconsistent
           *  sampling can occur.
           */
          const shiftedIndex =
            sortedRanges[k].materialOptions.rampIndex +
            0.5 / sortedRanges[k].materialOptions.rampWidth
          const minMaxIndices = this.updateGradientIndexBufferData(
            start,
            sortedRanges[k].count === Infinity
              ? this.geometry.attributes['gradientIndex'].array.length
              : len,
            shiftedIndex
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

  public insertDrawRanges(...ranges: BatchUpdateRange[]) {
    const materials = ranges.map((val) => val.material)
    const uniqueMaterials = [...Array.from(new Set(materials.map((value) => value)))]
    if (!Array.isArray(this.mesh.material)) {
      this.mesh.material = [this.mesh.material]
    }
    for (let k = 0; k < uniqueMaterials.length; k++) {
      if (!this.mesh.material.includes(uniqueMaterials[k]))
        this.mesh.material.push(uniqueMaterials[k])
    }

    const sortedRanges = ranges.sort((a, b) => {
      return a.offset - b.offset
    })

    for (let i = 0; i < sortedRanges.length; i++) {
      const group = {
        start: sortedRanges[i].offset,
        count: sortedRanges[i].count,
        materialIndex: this.mesh.material.indexOf(sortedRanges[i].material),
        id: sortedRanges[i].id
      }
      this.geometry.groups.push(group)
    }

    /** We're flattening sequential groups to avoid redundant draw calls.
     *  ! Not thoroughly tested !
     */
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
      const matGroup = grouped[matIndex]
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
    // console.log(`Batch ${this.id} -> ${this.geometry.groups.length}`)
  }

  public removeDrawRanges(id: string) {
    const materialCount = (this.mesh.material as Material[]).length
    const materialIndex = this.geometry.groups.find(
      (value) => value['id'] === id
    )?.materialIndex
    if (!materialIndex) {
      return
    }

    this.geometry.groups = this.geometry.groups.filter((value) => {
      return !(value['id'] && value['id'] === id)
    })
    ;(this.mesh.material as Material[]).splice(materialIndex, 1)
    if (materialIndex !== materialCount - 1) {
      this.geometry.groups.forEach((value) => {
        if (value.materialIndex > materialIndex) value.materialIndex--
      })
    }
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

  private getCurrentIndexBuffer(): BufferAttribute {
    return this.indexBufferIndex % 2 === 0 ? this.indexBuffer0 : this.indexBuffer1
  }

  private getNextIndexBuffer(): BufferAttribute {
    return ++this.indexBufferIndex % 2 === 0 ? this.indexBuffer0 : this.indexBuffer1
  }

  public autoFillDrawRanges() {
    this.autoFillDrawRangesShuffleIBO()
    // this.autoFillDrawRangesBasic()
  }

  private autoFillDrawRangesShuffleIBO() {
    const fullRangeIndex = this.geometry.groups.findIndex((value) => {
      return (
        value.start === 0 &&
        value.count === this.getCount() &&
        value.materialIndex === 0
      )
    })
    if (fullRangeIndex !== -1) this.geometry.groups.splice(fullRangeIndex, 1)

    const groups = this.geometry.groups
      .sort((a, b) => {
        return a.start - b.start
      })
      .slice()
    const groupsStart = groups.map((val) => {
      return val.start
    })

    for (let k = 0; k < this.renderViews.length; k++) {
      if (!groupsStart.includes(this.renderViews[k].batchStart)) {
        groups.push({
          start: this.renderViews[k].batchStart,
          count: this.renderViews[k].batchCount,
          materialIndex: 0
        })
      }
    }

    groups.sort((a, b) => {
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
    const newMapping: { [index: number]: number } = {}
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

        newMapping[start] = targetIBOOffset
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
    const oldMapping = this.createRenderViewMapping()
    for (const index in oldMapping) {
      const rv = oldMapping[index]
      rv.setBatchData(rv.batchId, newMapping[index], rv.batchCount)
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

  /** This is the initial basic way of dealing with auto-completing draw groups
   *  It's simpler, but it cand add a lot of redundant draw calls. I'm keeping it
   *  for now
   */
  /*
  private autoFillDrawRangesBasic() {
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
  */

  private createRenderViewMapping(): { [index: number]: NodeRenderView } {
    const mapping: { [index: number]: NodeRenderView } = {}
    for (let k = 0; k < this.renderViews.length; k++) {
      mapping[this.renderViews[k].batchStart] = this.renderViews[k]
    }
    return mapping
  }

  public resetDrawRanges() {
    this.mesh.material = [this.batchMaterial]
    this.mesh.visible = true
    this.geometry.clearGroups()
    this.geometry.addGroup(0, this.getCount(), 0)
    this.geometry.setDrawRange(0, Infinity)
  }

  public buildBatch() {
    const indicesCount = this.renderViews.flatMap(
      (val: NodeRenderView) => val.renderData.geometry.attributes.INDEX
    ).length
    const attributeCount = this.renderViews.flatMap(
      (val: NodeRenderView) => val.renderData.geometry.attributes.POSITION
    ).length
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
      batchObject.buildBVH()
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

    this.mesh = new SpeckleMesh(this.geometry, this.batchMaterial)
    this.mesh.setBatchObjects(batchObjects, this.transformStorage)
    this.mesh.buildBVH()
    this.mesh.uuid = this.id
    this.mesh.layers.set(ObjectLayers.STREAM_CONTENT_MESH)
    this.mesh.frustumCulled = false
    this.mesh.material = [this.batchMaterial]
    this.mesh.geometry.addGroup(0, this.getCount(), 0)

    if (!GeometryConverter.keepGeometryData) {
      batchObjects.forEach((element: BatchObject) => {
        element.renderView.disposeGeometry()
      })
    }
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

  private makeMeshGeometry(
    indices: Uint32Array | Uint16Array,
    position: Float64Array,
    batchIndices: Float32Array,
    color?: Float32Array
  ): BufferGeometry {
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
    this.updateGradientIndexBufferData(0, buffer.length, 0)
    this.updateGradientIndexBuffer()

    Geometry.computeVertexNormals(this.geometry, position)
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
