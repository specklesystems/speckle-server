import {
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  Line,
  Material,
  Mesh
} from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry'
import { BatchUpdateRange } from './Batcher'
import { Geometry } from './converter/Geometry'
import SpeckleLineMaterial from './materials/SpeckleLineMaterial'
import { NodeRenderView } from './NodeRenderView'
import { World } from './World'

export enum GeometryType {
  MESH,
  LINE
}

export default class LineBatch {
  private id: string
  private renderViews: NodeRenderView[]
  private geometry: BufferGeometry | LineSegmentsGeometry
  public batchMaterial: Material
  public material: Material | Material[]
  public mesh: Mesh | Line | Line2
  public colorBuffer: InstancedInterleavedBuffer

  public constructor(id: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.renderViews = renderViews
  }

  public setBatchMaterial(material: Material) {
    this.batchMaterial = material
  }

  public setMaterial(material: Material | Material[]) {
    this.material = material
  }

  //   public addDrawGroup(start: number, count: number, materialIndex: number) {
  //     this.colorBuffer.updateRange = { offset: 0, count: this.colorBuffer.array.length }
  //     this.colorBuffer.needsUpdate = true
  //     this.geometry.attributes['instanceColorStart'].needsUpdate = true
  //     this.geometry.attributes['instanceColorEnd'].needsUpdate = true
  //   }

  public updateDrawRanges(...ranges: BatchUpdateRange[]) {
    const data = this.colorBuffer.array as number[]

    for (let i = 0; i < ranges.length; i++) {
      const material = this.material[ranges[i].materialIndex]
      const start = ranges[i].offset * this.colorBuffer.stride
      const len =
        ranges[i].offset * this.colorBuffer.stride +
        ranges[i].count * this.colorBuffer.stride
      for (
        let k = start;
        k < (ranges[i].count === Infinity ? this.colorBuffer.array.length : len);
        k += 4
      ) {
        data[k] = material.color.r
        data[k + 1] = material.color.g
        data[k + 2] = material.color.b
        data[k + 3] = 1
      }
    }
    this.colorBuffer.updateRange = { offset: 0, count: data.length }
    this.colorBuffer.needsUpdate = true
    this.geometry.attributes['instanceColorStart'].needsUpdate = true
    this.geometry.attributes['instanceColorEnd'].needsUpdate = true
  }

  public clearDrawGroups() {
    this.updateDrawRanges({
      offset: 0,
      count: Infinity,
      materialIndex: 0
    })
  }

  public buildBatch(type: GeometryType) {
    type
    this.buildLineBatch()
    this.mesh.uuid = this.id
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

  private buildLineBatch() {
    let attributeCount = 0
    this.renderViews.forEach(
      (val: NodeRenderView) =>
        (attributeCount += val.needsSegmentConversion
          ? (val.renderData.geometry.attributes.POSITION.length - 3) * 2
          : val.renderData.geometry.attributes.POSITION.length)
    )
    const position = new Float32Array(attributeCount)
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
    if (Geometry.THICK_LINES) {
      this.mesh = new LineSegments2(
        this.geometry as LineSegmentsGeometry,
        this.batchMaterial as SpeckleLineMaterial
      )
      ;(this.mesh as LineSegments2).computeLineDistances()
      this.mesh.scale.set(1, 1, 1)
    } else {
      this.mesh = new Line(this.geometry, this.batchMaterial)
    }
  }

  private makeLineGeometry(position: Float32Array) {
    if (Geometry.THICK_LINES) {
      this.geometry = this.makeLineGeometryTriangle(position)
    } else {
      this.geometry = this.makeLineGeometryLine(position)
    }
    if (Geometry.USE_RTE) {
      Geometry.updateRTEGeometry(this.geometry)
    }
    World.expandWorld(this.geometry.boundingBox)
  }

  private makeLineGeometryLine(position: Float32Array): BufferGeometry {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    geometry.computeBoundingBox()
    return geometry
  }

  private makeLineGeometryTriangle(position: Float32Array): LineSegmentsGeometry {
    const geometry = new LineSegmentsGeometry()
    geometry.setPositions(position)

    const buffer = new Float32Array(position.length + position.length / 3).fill(0.0)
    this.colorBuffer = new InstancedInterleavedBuffer(buffer, 8, 1) // rgba, rgba
    this.colorBuffer.setUsage(DynamicDrawUsage)
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
}
