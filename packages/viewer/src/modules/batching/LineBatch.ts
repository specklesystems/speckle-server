import {
  Box3,
  Color,
  DynamicDrawUsage,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  Material,
  Object3D,
  Vector4,
  WebGLRenderer
} from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { Geometry } from '../converter/Geometry.js'
import SpeckleLineMaterial from '../materials/SpeckleLineMaterial.js'
import { NodeRenderView } from '../tree/NodeRenderView.js'
import {
  AllBatchUpdateRange,
  type Batch,
  type BatchUpdateRange,
  type DrawGroup,
  GeometryType,
  NoneBatchUpdateRange
} from './Batch.js'
import { ObjectLayers } from '../../IViewer.js'
import Materials from '../materials/Materials.js'

export default class LineBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  protected geometry: LineSegmentsGeometry
  public batchMaterial: SpeckleLineMaterial
  protected mesh: LineSegments2
  public colorBuffer!: InstancedInterleavedBuffer
  private static readonly vector4Buffer: Vector4 = new Vector4()

  public get bounds(): Box3 {
    if (!this.geometry.boundingBox) this.geometry.computeBoundingBox()
    return this.geometry.boundingBox ? this.geometry.boundingBox : new Box3()
  }

  public get drawCalls(): number {
    return 1
  }

  public get minDrawCalls(): number {
    return 1
  }

  public get triCount(): number {
    return 0
  }

  public get vertCount(): number {
    return this.geometry.attributes.position.count * this.geometry.instanceCount
  }

  public constructor(id: string, subtreeId: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.subtreeId = subtreeId
    this.renderViews = renderViews
  }
  public get pointCount(): number {
    return 0
  }
  public get lineCount(): number {
    /** Catering to typescript
     * There is no unniverse where the geometry is non-indexed. LineSegments2 are **explicitly** indexed
     */
    const indexCount = this.geometry.index ? this.geometry.index.count : 0
    return (indexCount / 3) * (this.geometry as never)['_maxInstanceCount']
  }

  public get renderObject(): Object3D {
    return this.mesh
  }

  public get geometryType(): GeometryType {
    return GeometryType.LINE
  }

  public get materials(): Material[] {
    return this.mesh.material as unknown as Material[]
  }

  public get groups(): DrawGroup[] {
    return []
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

  public setVisibleRange(ranges: BatchUpdateRange[]) {
    if (
      ranges.length === 1 &&
      ranges[0].offset === NoneBatchUpdateRange.offset &&
      ranges[0].count === NoneBatchUpdateRange.count
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

  public getOpaque(): BatchUpdateRange {
    if (Materials.isOpaque(this.batchMaterial)) return AllBatchUpdateRange
    return NoneBatchUpdateRange
  }

  public getDepth(): BatchUpdateRange {
    return this.getOpaque()
  }

  public getTransparent(): BatchUpdateRange {
    if (Materials.isTransparent(this.batchMaterial)) return AllBatchUpdateRange
    return NoneBatchUpdateRange
  }

  public getStencil(): BatchUpdateRange {
    if (this.batchMaterial.stencilWrite === true) return AllBatchUpdateRange
    return NoneBatchUpdateRange
  }

  public setBatchBuffers(ranges: BatchUpdateRange[]): void {
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

  public setDrawRanges(ranges: BatchUpdateRange[]) {
    this.setBatchBuffers(ranges)
  }

  public resetDrawRanges() {
    this.setDrawRanges([
      {
        offset: 0,
        count: Infinity,
        material: this.batchMaterial
      }
    ])
    this.mesh.material = this.batchMaterial
    this.mesh.visible = true
    this.batchMaterial.transparent = false
  }

  public buildBatch() {
    let attributeCount = 0
    this.renderViews.forEach((val: NodeRenderView) => {
      if (!val.renderData.geometry.attributes) {
        throw new Error(`Cannot build batch ${this.id}. Invalid geometry`)
      }
      attributeCount += val.needsSegmentConversion
        ? (val.renderData.geometry.attributes.POSITION.length - 3) * 2
        : val.renderData.geometry.attributes.POSITION.length
    })
    const position = new Float64Array(attributeCount)
    let offset = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      if (!geometry.attributes) {
        throw new Error(`Cannot build batch ${this.id}. Invalid geometry`)
      }
      let points: Array<number>
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
    this.mesh = new LineSegments2(this.geometry, this.batchMaterial)
    this.mesh.computeLineDistances()
    this.mesh.scale.set(1, 1, 1)

    this.mesh.uuid = this.id
    this.mesh.layers.set(ObjectLayers.STREAM_CONTENT_LINE)
    return Promise.resolve()
  }

  public getRenderView(index: number): NodeRenderView | null {
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
    return null
  }

  public getMaterialAtIndex(index: number): Material {
    index
    return this.batchMaterial
  }

  /** TODO: I wish we wouldn't clone the material here...  */
  public getMaterial(rv: NodeRenderView): Material {
    const start = rv.batchStart * this.colorBuffer.stride
    const data = this.colorBuffer.array as number[]
    const material = this.batchMaterial.clone()
    material.color.setRGB(data[start], data[start + 1], data[start + 2])
    material.opacity = data[start + 3]
    return material
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
    this.colorBuffer.length = 0
  }
}
