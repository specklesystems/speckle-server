import {
  Camera,
  CircleGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InterleavedBufferAttribute,
  Matrix4,
  Mesh,
  PerspectiveCamera,
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
import SpeckleBasicMaterial from '../materials/SpeckleBasicMaterial'

export interface MeasurementPointGizmoStyle {
  fixedSize?: number | boolean
  dashedLine?: boolean
  discColor?: number
  discOpacity?: number
  lineColor?: number
  lineOpacity?: number
  pointColor?: number
  pointOpacity?: number
  textColor?: number
  textOpacity?: number
}

const DefaultMeasurementPointGizmoStyle = {
  fixedSize: true,
  dashedLine: false,
  discColor: 0x047efb,
  discOpacity: 1,
  lineColor: 0x047efb,
  lineOpacity: 1,
  pointColor: 0x047efb,
  pointOpacity: 1,
  textColor: 0x222222,
  textOpacity: 1
}

export class MeasurementPointGizmo extends Group {
  private disc: Mesh
  private line: LineSegments2
  private point: Mesh
  private text: SpeckleText
  private _style: MeasurementPointGizmoStyle = Object.assign(
    {},
    DefaultMeasurementPointGizmoStyle
  )

  public set style(value: MeasurementPointGizmoStyle) {
    Object.assign(this._style, value)
    this.updateStyle()
  }

  public set highlight(value: boolean) {
    if (value) {
      ;(this.disc.material as SpeckleBasicMaterial).color = new Color(0xff0000)
      ;(this.line.material as SpeckleLineMaterial).color = new Color(0xff0000)
      ;(this.point.material as SpeckleBasicMaterial).color = new Color(0xff0000)
      ;(this.text.textMesh.material as SpeckleTextMaterial).color.copy(
        new Color(0xff0000)
      )
    } else this.updateStyle()
  }

  private getDiscMaterial() {
    const material = new SpeckleBasicMaterial({ color: this._style.discColor })
    material.color.convertSRGBToLinear()
    material.polygonOffset = true
    material.polygonOffsetFactor = -5
    material.polygonOffsetUnits = 5
    material.opacity = this._style.discOpacity
    material.transparent = material.opacity < 1
    return material
  }

  private getLineMaterial() {
    const lineMaterial = new SpeckleLineMaterial(
      {
        color: 0x047efb,
        linewidth: 2,
        worldUnits: false,
        vertexColors: false,
        alphaToCoverage: false,
        resolution: new Vector2(919, 848)
      },
      ['USE_RTE', 'UNIFORM_OPACITY'].concat(this._style.dashedLine ? ['USE_DASH'] : [])
    )
    lineMaterial.color = new Color(this._style.lineColor)
    lineMaterial.color.convertSRGBToLinear()
    if (this._style.dashedLine) {
      lineMaterial.dashSize = 1
      lineMaterial.gapSize = 1
      lineMaterial.dashScale = 10
    }
    lineMaterial.linewidth = 2
    lineMaterial.worldUnits = false
    lineMaterial.resolution = new Vector2(1513, 1306)
    lineMaterial.opacity = this._style.lineOpacity
    lineMaterial.transparent = lineMaterial.opacity < 1
    return lineMaterial
  }

  private getPointMaterial() {
    const material = new SpeckleBasicMaterial({ color: this._style.pointColor })
    material.opacity = this._style.pointOpacity
    material.transparent = material.opacity < 1
    return material
  }

  private getTextMaterial() {
    const material = new SpeckleTextMaterial(
      {
        color: this._style.textColor,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    material.toneMapped = false
    material.color.convertSRGBToLinear()
    material.opacity = this._style.textOpacity
    material.transparent = material.opacity < 1

    return material.getDerivedMaterial()
  }

  public constructor(style?: MeasurementPointGizmoStyle) {
    super()
    this.layers.set(ObjectLayers.MEASUREMENTS)

    const geometry = new CircleGeometry(0.25, 16)
    const doublePositions = new Float64Array(geometry.attributes.position.array)
    Geometry.updateRTEGeometry(geometry, doublePositions)

    this.disc = new Mesh(geometry, null)
    this.disc.layers.set(ObjectLayers.MEASUREMENTS)

    const buffer = new Float64Array(18)
    const lineGeometry = new LineSegmentsGeometry()
    lineGeometry.setPositions(new Float32Array(buffer))
    ;(
      lineGeometry.attributes['instanceStart'] as InterleavedBufferAttribute
    ).data.setUsage(DynamicDrawUsage)

    Geometry.updateRTEGeometry(lineGeometry, buffer)

    this.line = new LineSegments2(lineGeometry, null)
    this.line.computeLineDistances()
    this.line.name = `test-mesurements-line`
    this.line.frustumCulled = false
    this.line.renderOrder = 1
    this.line.layers.set(ObjectLayers.MEASUREMENTS)

    const sphereGeometry = new SphereGeometry(0.1, 32, 16)

    this.point = new Mesh(sphereGeometry, null)
    this.point.layers.set(ObjectLayers.MEASUREMENTS)
    this.point.visible = false

    this.text = new SpeckleText('test-text')
    this.text.textMesh.material = null
    this.text.matrixAutoUpdate = false
    this.text.layers.set(ObjectLayers.MEASUREMENTS)
    this.text.textMesh.layers.set(ObjectLayers.MEASUREMENTS)

    this.add(this.point)
    this.add(this.disc)
    this.add(this.line)
    this.add(this.text)

    this.style = style
  }

  public enable(disc: boolean, line: boolean, point: boolean, text: boolean) {
    this.disc.visible = disc
    this.line.visible = line
    this.point.visible = point
    this.text.visible = text
    this.text.textMesh.visible = text
  }

  public frameUpdate(camera: Camera) {
    if (camera.type === 'PerspectiveCamera' && +this._style.fixedSize > 0) {
      const cam = camera as PerspectiveCamera
      const cameraObjectDistance = cam.position.distanceTo(this.disc.position)
      const worldSize = Math.abs(2 * Math.tan(cam.fov / 2.0) * cameraObjectDistance)
      const size = 0.025 * worldSize
      this.disc.scale.copy(new Vector3(size, size, size))
    }
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

  public updateStyle() {
    this.disc.material = this.getDiscMaterial()
    this.line.material = this.getLineMaterial()
    this.point.material = this.getPointMaterial()
    this.text.textMesh.material = this.getTextMaterial()
  }

  public raycast(raycaster, intersects) {
    this.disc.raycast(raycaster, intersects)
    this.line.raycast(raycaster, intersects)
    this.point.raycast(raycaster, intersects)
    this.text.textMesh.raycast(raycaster, intersects)
  }
}
