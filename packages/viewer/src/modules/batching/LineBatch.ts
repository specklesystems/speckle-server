import {
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  Line,
  Material,
  Object3D,
  Vector4,
  WebGLRenderer
} from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { Geometry } from '../converter/Geometry'
import SpeckleLineMaterial from '../materials/SpeckleLineMaterial'
import { ObjectLayers } from '../SpeckleRenderer'
import { NodeRenderView } from '../tree/NodeRenderView'
import {
  AllBatchUpdateRange,
  Batch,
  BatchUpdateRange,
  GeometryType,
  HideAllBatchUpdateRange
} from './Batch'

export default class LineBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  private geometry: BufferGeometry | LineSegmentsGeometry
  public batchMaterial: SpeckleLineMaterial
  private mesh: LineSegments2 | Line
  public colorBuffer: InstancedInterleavedBuffer
  private insertedRanges: BatchUpdateRange[] = []
  private static readonly vector4Buffer: Vector4 = new Vector4()

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

  public getCount(): number {
    return this.geometry.attributes.position.array.length / 6
  }

  public setBatchMaterial(material: SpeckleLineMaterial) {
    this.batchMaterial = material
  }

  public onUpdate(deltaTime: number) {
    deltaTime
  }

  public onRender(renderer: WebGLRenderer) {
    renderer.getDrawingBufferSize(this.batchMaterial.resolution)
  }

  public setVisibleRange(...ranges: BatchUpdateRange[]) {
    if (
      ranges.length === 1 &&
      ranges[0].offset === HideAllBatchUpdateRange.offset &&
      ranges[0].count === HideAllBatchUpdateRange.count
    ) {
      this.mesh.visible = false
      return
    }

    if (
      ranges.length === 1 &&
      ranges[0].offset === AllBatchUpdateRange.offset &&
      ranges[0].count === AllBatchUpdateRange.count
    ) {
      this.mesh.visible = true
      return
    }
    this.mesh.visible = true
    const data = this.colorBuffer.array as number[]
    for (let k = 0; k < data.length; k += 4) {
      data[k + 3] = 0
    }
    for (let i = 0; i < ranges.length; i++) {
      const start = ranges[i].offset * this.colorBuffer.stride
      const len =
        ranges[i].offset * this.colorBuffer.stride +
        ranges[i].count * this.colorBuffer.stride
      for (let k = start; k < len; k += 4) {
        data[k + 3] = 1
      }
    }

    this.colorBuffer.updateRange = { offset: 0, count: data.length }
    this.colorBuffer.needsUpdate = true
    this.geometry.attributes['instanceColorStart'].needsUpdate = true
    this.geometry.attributes['instanceColorEnd'].needsUpdate = true
  }

  public getVisibleRange() {
    return AllBatchUpdateRange
    // TO DO if required
  }

  public setDrawRanges(...ranges: BatchUpdateRange[]) {
    const data = this.colorBuffer.array as number[]

    for (let i = 0; i < ranges.length; i++) {
      const material = ranges[i].material as SpeckleLineMaterial
      const materialOptions = ranges[i].materialOptions
      const color: Color =
        materialOptions && materialOptions.rampIndexColor
          ? materialOptions.rampIndexColor
          : material.color
      const alpha: number = material.visible ? material.opacity : 0
      this.batchMaterial.transparent ||= material.opacity < 1
      const start = ranges[i].offset * this.colorBuffer.stride
      const len =
        ranges[i].offset * this.colorBuffer.stride +
        ranges[i].count * this.colorBuffer.stride

      LineBatch.vector4Buffer.set(color.r, color.g, color.b, alpha)
      this.updateColorBuffer(
        start,
        ranges[i].count === Infinity ? this.colorBuffer.array.length : len,
        LineBatch.vector4Buffer
      )
    }
    this.colorBuffer.updateRange = { offset: 0, count: data.length }
    this.colorBuffer.needsUpdate = true
    this.geometry.attributes['instanceColorStart'].needsUpdate = true
    this.geometry.attributes['instanceColorEnd'].needsUpdate = true
  }

  insertDrawRanges(...ranges: BatchUpdateRange[]) {
    for (let k = 0; k < ranges.length; k++) {
      const start = ranges[k].offset * this.colorBuffer.stride
      const data = this.colorBuffer.array as number[]
      const materialOptions = {
        rampIndexColor: new Color(data[start], data[start + 1], data[start + 2])
      }
      this.insertedRanges.push({
        offset: ranges[k].offset,
        count: ranges[k].count,
        material: ranges[k].material,
        materialOptions,
        id: ranges[k].id
      })
    }
    this.setDrawRanges(...ranges)
  }

  removeDrawRanges(id: string) {
    const ranges = this.insertedRanges.filter((value) => value.id === id)
    if (!ranges.length) {
      return
    }
    this.setDrawRanges(...ranges)
    this.insertedRanges = this.insertedRanges.filter((value) => !ranges.includes(value))
  }

  autoFillDrawRanges() {
    // to do
  }

  public resetDrawRanges() {
    this.setDrawRanges({
      offset: 0,
      count: Infinity,
      material: this.batchMaterial
    })
    this.mesh.material = this.batchMaterial
    this.mesh.visible = true
    this.batchMaterial.transparent = false
  }

  public buildBatch() {
    let attributeCount = 0
    this.renderViews.forEach(
      (val: NodeRenderView) =>
        (attributeCount += val.needsSegmentConversion
          ? (val.renderData.geometry.attributes.POSITION.length - 3) * 2
          : val.renderData.geometry.attributes.POSITION.length)
    )
    const position = new Float64Array(attributeCount)
    let offset = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      let points = null
      /** We need to make sure the line geometry has a layout of :
       *  start(x,y,z), end(x,y,z), start(x,y,z), end(x,y,z)... etc
       *  Some geometries have that inherent form, some don't
       */
      if (this.renderViews[k].needsSegmentConversion) {
        const length = geometry.attributes.POSITION.length - 3
        points = new Array(2 * length)

        for (let i = 0; i < length; i += 3) {
          points[2 * i] = geometry.attributes.POSITION[i]
          points[2 * i + 1] = geometry.attributes.POSITION[i + 1]
          points[2 * i + 2] = geometry.attributes.POSITION[i + 2]

          points[2 * i + 3] = geometry.attributes.POSITION[i + 3]
          points[2 * i + 4] = geometry.attributes.POSITION[i + 4]
          points[2 * i + 5] = geometry.attributes.POSITION[i + 5]
        }
      } else {
        points = geometry.attributes.POSITION
      }

      position.set(points, offset)
      this.renderViews[k].setBatchData(this.id, offset / 6, points.length / 6)

      offset += points.length
    }
    this.makeLineGeometry(position)
    this.mesh = new LineSegments2(
      this.geometry as LineSegmentsGeometry,
      this.batchMaterial as SpeckleLineMaterial
    )
    ;(this.mesh as LineSegments2).computeLineDistances()
    this.mesh.scale.set(1, 1, 1)

    this.mesh.uuid = this.id
    this.mesh.layers.set(ObjectLayers.STREAM_CONTENT_LINE)
  }

  public getRenderView(index: number): NodeRenderView {
    for (let k = 0; k < this.renderViews.length; k++) {
      if (
        index >= this.renderViews[k].batchStart &&
        index < this.renderViews[k].batchEnd &&
        /** A bit cheaty, but ok for now */
        this.colorBuffer.array[index * this.colorBuffer.stride + 3] !== 0
      ) {
        return this.renderViews[k]
      }
    }
  }

  public getMaterialAtIndex(index: number): Material {
    index
    return this.batchMaterial
  }

  private makeLineGeometry(position: Float64Array) {
    this.geometry = this.makeLineGeometryTriangle(new Float32Array(position))
    Geometry.updateRTEGeometry(this.geometry, position)
  }

  private makeLineGeometryTriangle(position: Float32Array): LineSegmentsGeometry {
    const geometry = new LineSegmentsGeometry()
    /** This will set the instanceStart and instanceEnd attributes. These will be our high parts */
    geometry.setPositions(position)

    const buffer = new Float32Array(position.length + position.length / 3)
    this.colorBuffer = new InstancedInterleavedBuffer(buffer, 8, 1) // rgba, rgba
    this.colorBuffer.setUsage(DynamicDrawUsage)
    this.updateColorBuffer(
      0,
      buffer.length,
      new Vector4(
        this.batchMaterial.color.r,
        this.batchMaterial.color.g,
        this.batchMaterial.color.b,
        1
      )
    )
    geometry.setAttribute(
      'instanceColorStart',
      new InterleavedBufferAttribute(this.colorBuffer, 4, 0)
    ) // rgb
    geometry.setAttribute(
      'instanceColorEnd',
      new InterleavedBufferAttribute(this.colorBuffer, 4, 4)
    ) // rgb
    geometry.computeBoundingBox()
    return geometry
  }

  private updateColorBuffer(start: number, end: number, color: Vector4) {
    const data = this.colorBuffer.array as number[]
    for (let k = start; k < end; k += 4) {
      data[k] = color.x
      data[k + 1] = color.y
      data[k + 2] = color.z
      data[k + 3] = color.w
    }
  }

  public purge() {
    this.renderViews.length = 0
    this.geometry.dispose()
    this.batchMaterial.dispose()
    this.mesh = null
    this.colorBuffer.length = 0
  }
}
