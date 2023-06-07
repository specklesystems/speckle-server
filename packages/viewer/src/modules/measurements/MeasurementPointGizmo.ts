import {
  CircleGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  InterleavedBufferAttribute,
  Mesh,
  MeshBasicMaterial,
  Vector2,
  Vector3
} from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2'
import { ObjectLayers } from '../SpeckleRenderer'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry'
import { Geometry } from '../converter/Geometry'
import SpeckleLineMaterial from '../materials/SpeckleLineMaterial'

export class MeasurementPointGizmo extends Group {
  private disc: Mesh
  private line: LineSegments2

  public set enabled(value: boolean) {
    this.disc.visible = value
    this.line.visible = value
  }

  public constructor() {
    super()
    const geometry = new CircleGeometry(0.25, 16)
    const material = new MeshBasicMaterial({ color: 0x047efb })
    material.polygonOffset = true
    material.polygonOffsetFactor = -5
    material.polygonOffsetUnits = 5
    this.disc = new Mesh(geometry, material)
    this.disc.layers.set(ObjectLayers.PROPS)

    const buffer = new Float64Array(6)
    const lineGeometry = new LineSegmentsGeometry()
    lineGeometry.setPositions(new Float32Array(buffer))
    ;(
      lineGeometry.attributes['instanceStart'] as InterleavedBufferAttribute
    ).data.setUsage(DynamicDrawUsage)

    Geometry.updateRTEGeometry(lineGeometry, buffer)
    const lineMaterial = new SpeckleLineMaterial(
      {
        color: 0x047efb,
        linewidth: 2,
        worldUnits: false,
        vertexColors: false,
        alphaToCoverage: false,
        resolution: new Vector2(919, 848)
      },
      ['USE_RTE']
    )
    lineMaterial.color = new Color(0x047efb)
    lineMaterial.color.convertSRGBToLinear()
    lineMaterial.linewidth = 2
    lineMaterial.worldUnits = false
    lineMaterial.resolution = new Vector2(1513, 1306)

    this.line = new LineSegments2(lineGeometry, lineMaterial)
    this.line.name = `test-mesurements-line`
    this.line.frustumCulled = false
    this.line.renderOrder = 1
    this.line.layers.set(ObjectLayers.PROPS)

    this.add(this.disc)
    this.add(this.line)
  }

  public updateDisc(position: Vector3, normal: Vector3) {
    this.disc.position.copy(position)
    this.disc.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), normal)
  }

  public updateLine(start: Vector3, end: Vector3) {
    const buffer = new Float64Array(6)
    start.toArray(buffer, 0)
    end.toArray(buffer, 3)
    const posAttr = (
      this.line.geometry.attributes['instanceStart'] as InterleavedBufferAttribute
    ).data
    const posAttrLow = (
      this.line.geometry.attributes['instanceStartLow'] as InterleavedBufferAttribute
    ).data
    Geometry.DoubleToHighLowBuffer(
      buffer,
      posAttrLow.array as Float32Array,
      posAttr.array as Float32Array
    )
    posAttr.needsUpdate = true
    posAttr.updateRange = { offset: 0, count: 2 * 3 }
    posAttrLow.needsUpdate = true
    posAttrLow.updateRange = { offset: 0, count: 2 * 3 }
    this.line.visible = true
    this.line.geometry.instanceCount = 1
    this.line.geometry.attributes['instanceStart'].needsUpdate = true
    this.line.geometry.attributes['instanceEnd'].needsUpdate = true
    this.line.geometry.attributes['instanceStartLow'].needsUpdate = true
    this.line.geometry.attributes['instanceEndLow'].needsUpdate = true
    this.line.geometry.computeBoundingBox()
    this.line.geometry.computeBoundingSphere()
  }
}
