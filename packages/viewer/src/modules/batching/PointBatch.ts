import {
  BufferGeometry,
  Float32BufferAttribute,
  Material,
  Object3D,
  Points,
  WebGLRenderer
} from 'three'
import { Geometry } from '../converter/Geometry'
import { NodeRenderView } from '../tree/NodeRenderView'
import { Viewer } from '../Viewer'
import {
  AllBatchUpdateRange,
  Batch,
  BatchUpdateRange,
  GeometryType,
  HideAllBatchUpdateRange
} from './Batch'
import Logger from 'js-logger'
import { GeometryConverter } from '../converter/GeometryConverter'
import { ObjectLayers } from '../SpeckleRenderer'

export default class PointBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  private geometry: BufferGeometry
  public batchMaterial: Material
  public mesh: Points

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
    for (let k = 0; k < sortedRanges.length; k++) {
      const collidingGroup = this.getDrawRangeCollision(sortedRanges[k])
      if (collidingGroup) {
        Logger.warn(`Draw range collision @ ${this.id} overwritting...`)
        collidingGroup.materialIndex = this.mesh.material.indexOf(
          sortedRanges[k].material
        )
        continue
      }
      newGroups.push(sortedRanges[k])
    }
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
      console.error(`DrawRange autocomplete failed! ${count}vs${this.getCount()}`)
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
            this.geometry.addGroup(
              matGroup[k].start,
              runningCount,
              matGroup[k].materialIndex
            )
            break
          }
        }
        if (n === matGroup.length) {
          this.geometry.addGroup(
            matGroup[k].start,
            runningCount,
            matGroup[k].materialIndex
          )
        }
        k = n
      }
    }
    // console.warn(
    //   `Batch ID ${this.id} Group count ${this.geometry.groups.length} AUTOCOMPLETE`
    // )
  }

  public resetDrawRanges() {
    this.mesh.material = this.batchMaterial
    this.mesh.visible = true
    this.geometry.clearGroups()
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
    this.mesh.uuid = this.id
    this.mesh.layers.set(ObjectLayers.STREAM_CONTENT_POINT)
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

  private makePointGeometry(
    position: Float64Array,
    color: Float32Array
  ): BufferGeometry {
    this.geometry = new BufferGeometry()

    this.geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    this.geometry.setAttribute('color', new Float32BufferAttribute(color, 3))

    this.geometry.computeVertexNormals()
    this.geometry.computeBoundingSphere()
    this.geometry.computeBoundingBox()

    Viewer.World.expandWorld(this.geometry.boundingBox)
    Geometry.updateRTEGeometry(this.geometry, position)

    return this.geometry
  }

  public purge() {
    this.renderViews.length = 0
    this.geometry.dispose()
    this.batchMaterial.dispose()
    this.mesh = null
  }
}
