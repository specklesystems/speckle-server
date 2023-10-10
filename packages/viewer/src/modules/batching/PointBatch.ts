import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Material,
  Object3D,
  Points,
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
import { GeometryConverter } from '../converter/GeometryConverter'
import { ObjectLayers } from '../SpeckleRenderer'
import Logger from 'js-logger'
import SpecklePointColouredMaterial from '../materials/SpecklePointColouredMaterial'

export default class PointBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  private geometry: BufferGeometry
  public batchMaterial: Material
  public mesh: Points

  private gradientIndexBuffer: BufferAttribute

  public get bounds() {
    if (!this.geometry.boundingBox) this.geometry.computeBoundingBox()
    return this.geometry.boundingBox
  }

  public constructor(id: string, subtreeId: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.subtreeId = subtreeId
    this.renderViews = renderViews
  }

  updateBatchObjects() {
    // TO DO
  }

  public get renderObject(): Object3D {
    return this.mesh
  }

  public get geometryType(): GeometryType {
    return this.renderViews[0].geometryType
  }

  public getCount() {
    return this.geometry.attributes.position.array.length / 3
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

  public getVisibleRange() {
    return AllBatchUpdateRange
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
            sortedRanges[k].material as SpecklePointColouredMaterial
          ).setGradientTexture(sortedRanges[k].materialOptions.rampTexture)
        }
      }

      const collidingGroup = this.getDrawRangeCollision(sortedRanges[k])
      if (collidingGroup) {
        // Logger.warn(`Draw range collision @ ${this.id} overwritting...`)
        collidingGroup.materialIndex = this.mesh.material.indexOf(
          sortedRanges[k].material
        )
        continue
      }
      newGroups.push(sortedRanges[k])
    }

    this.updateGradientIndexBuffer()

    for (let i = 0; i < newGroups.length; i++) {
      this.geometry.addGroup(
        newGroups[i].offset,
        newGroups[i].count,
        this.mesh.material.indexOf(newGroups[i].material)
      )
    }
  }

  insertDrawRanges(...ranges: BatchUpdateRange[]) {
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

    this.flattenGroups()
  }

  removeDrawRanges(id: string) {
    this.geometry.groups = this.geometry.groups.filter((value) => {
      return !(value['id'] && value['id'] === id)
    })
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
    if (
      this.geometry.groups.length > 1 &&
      this.geometry.groups[0].start === 0 &&
      this.geometry.groups[0].count === this.getCount()
    ) {
      this.geometry.groups.shift()
    }
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
      console.error(`DrawRange autocomplete failed! ${count}vs${this.getCount()}`)
    }

    this.flattenGroups()
  }

  private flattenGroups() {
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
    // console.warn(
    //   `Batch ID ${this.id} Group count ${this.geometry.groups.length} AUTOCOMPLETE`
    // )
  }

  public resetDrawRanges() {
    this.mesh.material = [this.batchMaterial]
    this.mesh.visible = true
    this.geometry.clearGroups()
    this.geometry.addGroup(0, this.getCount(), 0)
    this.geometry.setDrawRange(0, Infinity)
  }

  public buildBatch() {
    const attributeCount = this.renderViews.flatMap(
      (val: NodeRenderView) => val.renderData.geometry.attributes.POSITION
    ).length
    const position = new Float64Array(attributeCount)
    const color = new Float32Array(attributeCount).fill(1)
    let offset = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      position.set(geometry.attributes.POSITION, offset)
      if (geometry.attributes.COLOR) color.set(geometry.attributes.COLOR, offset)
      this.renderViews[k].setBatchData(
        this.id,
        offset / 3,
        geometry.attributes.POSITION.length / 3
      )

      offset += geometry.attributes.POSITION.length

      if (!GeometryConverter.keepGeometryData) {
        this.renderViews[k].disposeGeometry()
      }
    }
    this.makePointGeometry(position, color)
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

  private makePointGeometry(
    position: Float64Array,
    color: Float32Array
  ): BufferGeometry {
    this.geometry = new BufferGeometry()

    this.geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    this.geometry.setAttribute('color', new Float32BufferAttribute(color, 3))

    const buffer = new Float32Array(position.length / 3)
    this.gradientIndexBuffer = new Float32BufferAttribute(buffer, 1)
    this.gradientIndexBuffer.setUsage(DynamicDrawUsage)
    this.geometry.setAttribute('gradientIndex', this.gradientIndexBuffer)
    this.updateGradientIndexBufferData(0, buffer.length, 0)
    this.updateGradientIndexBuffer()

    this.geometry.computeVertexNormals()
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
