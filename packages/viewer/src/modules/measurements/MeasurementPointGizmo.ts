import {
  CircleGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InterleavedBufferAttribute,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector2,
  Vector3
} from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2'
import { ObjectLayers } from '../SpeckleRenderer'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry'
import { Geometry } from '../converter/Geometry'
import SpeckleLineMaterial from '../materials/SpeckleLineMaterial'
import { SpeckleText } from '../objects/SpeckleText'
import SpeckleTextMaterial from '../materials/SpeckleTextMaterial'

export class MeasurementPointGizmo extends Group {
  private disc: Mesh
  private line: LineSegments2
  private point: Mesh
  private text: SpeckleText

  public set dashed(value: boolean) {
    this.line.material = this.getLineMaterial(value)
  }

  private getLineMaterial(dashed: boolean) {
    const lineMaterial = new SpeckleLineMaterial(
      {
        color: 0x047efb,
        linewidth: 2,
        worldUnits: false,
        vertexColors: false,
        alphaToCoverage: false,
        resolution: new Vector2(919, 848)
      },
      ['USE_RTE'].concat(dashed ? ['USE_DASH'] : [])
    )
    lineMaterial.color = new Color(0x047efb)
    lineMaterial.color.convertSRGBToLinear()
    if (dashed) {
      lineMaterial.dashSize = 1
      lineMaterial.gapSize = 1
      lineMaterial.dashScale = 10
    }
    lineMaterial.linewidth = 2
    lineMaterial.worldUnits = false
    lineMaterial.resolution = new Vector2(1513, 1306)
    return lineMaterial
  }

  private getTextMaterial() {
    const mat = new SpeckleTextMaterial(
      {
        color: 0x222222,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    mat.toneMapped = false
    mat.color.convertSRGBToLinear()

    return mat.getDerivedMaterial()
  }

  public constructor() {
    super()
    const geometry = new CircleGeometry(0.25, 16)
    const material = new MeshBasicMaterial({ color: 0x047efb })
    material.color.convertSRGBToLinear()
    material.polygonOffset = true
    material.polygonOffsetFactor = -5
    material.polygonOffsetUnits = 5
    this.disc = new Mesh(geometry, material)
    this.disc.layers.set(ObjectLayers.PROPS)

    const buffer = new Float64Array(18)
    const lineGeometry = new LineSegmentsGeometry()
    lineGeometry.setPositions(new Float32Array(buffer))
    ;(
      lineGeometry.attributes['instanceStart'] as InterleavedBufferAttribute
    ).data.setUsage(DynamicDrawUsage)

    Geometry.updateRTEGeometry(lineGeometry, buffer)

    this.line = new LineSegments2(lineGeometry, this.getLineMaterial(false))
    this.line.computeLineDistances()
    this.line.name = `test-mesurements-line`
    this.line.frustumCulled = false
    this.line.renderOrder = 1
    this.line.layers.set(ObjectLayers.PROPS)

    const sphereGeometry = new SphereGeometry(0.1, 32, 16)
    const sphereMaterial = new MeshBasicMaterial({ color: 0x047efb })
    this.point = new Mesh(sphereGeometry, sphereMaterial)
    this.point.layers.set(ObjectLayers.PROPS)

    this.text = new SpeckleText('test-text')
    this.text.textMesh.material = this.getTextMaterial()
    this.text.matrixAutoUpdate = false
    this.text.layers.set(ObjectLayers.PROPS)
    this.text.textMesh.layers.set(ObjectLayers.PROPS)

    this.add(this.point)
    this.add(this.disc)
    this.add(this.line)
    this.add(this.text)
  }

  public enable(disc: boolean, line: boolean, point: boolean, text: boolean) {
    this.disc.visible = disc
    this.line.visible = line
    this.point.visible = point
    this.text.visible = text
    this.text.textMesh.visible = text
  }

  public updateDisc(position: Vector3, normal: Vector3) {
    this.disc.position.copy(position)
    this.disc.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), normal)
  }

  public updatePoint(position: Vector3) {
    this.point.position.copy(position)
  }

  public updateLine(points: Vector3[]) {
    const buffer = new Float64Array(points.length * 3)
    points.forEach((value, index) => {
      value.toArray(buffer, index * 3)
    })
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
    posAttr.updateRange = { offset: 0, count: points.length * 3 }
    posAttrLow.needsUpdate = true
    posAttrLow.updateRange = { offset: 0, count: points.length * 3 }
    this.line.visible = true
    this.line.geometry.instanceCount = points.length / 2
    this.line.geometry.attributes['instanceStart'].needsUpdate = true
    this.line.geometry.attributes['instanceEnd'].needsUpdate = true
    this.line.geometry.attributes['instanceStartLow'].needsUpdate = true
    this.line.geometry.attributes['instanceEndLow'].needsUpdate = true
    this.line.geometry.computeBoundingBox()
    this.line.geometry.computeBoundingSphere()
    this.line.computeLineDistances()
  }

  public updateText(value: number, transform: Matrix4) {
    this.text
      .update({
        textValue: value.toFixed(2) + 'm',
        height: 0.5
      })
      .then(() => {
        this.text.matrix.copy(transform)
        this.text.matrixWorldNeedsUpdate = true
      })
  }
}
