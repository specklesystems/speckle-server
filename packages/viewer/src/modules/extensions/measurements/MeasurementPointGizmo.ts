import {
  Box3,
  Camera,
  CircleGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InterleavedBufferAttribute,
  Material,
  MathUtils,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
  type Intersection
} from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { Geometry } from '../../converter/Geometry.js'
import SpeckleLineMaterial from '../../materials/SpeckleLineMaterial.js'
import { SpeckleText } from '../../objects/SpeckleText.js'
import SpeckleTextMaterial from '../../materials/SpeckleTextMaterial.js'
import SpeckleBasicMaterial from '../../materials/SpeckleBasicMaterial.js'
import { ObjectLayers } from '../../../IViewer.js'

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
  textPixelHeight?: number
  pointPixelHeight?: number
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
  textColor: 0xffffff,
  textOpacity: 1,
  textPixelHeight: 17,
  pointPixelHeight: 5
}

export class MeasurementPointGizmo extends Group {
  private disc: Mesh
  public line: LineSegments2
  private point: Mesh
  private text: SpeckleText
  private _style: MeasurementPointGizmoStyle = Object.assign(
    {},
    DefaultMeasurementPointGizmoStyle
  )
  private static vecBuff0: Vector3 = new Vector3()

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
    material.toneMapped = false
    material.polygonOffset = true
    material.polygonOffsetFactor = -5
    material.polygonOffsetUnits = 5
    material.opacity =
      this._style.discOpacity !== undefined
        ? this._style.discOpacity
        : DefaultMeasurementPointGizmoStyle.discOpacity
    material.transparent = material.opacity < 1
    return material
  }

  private getLineMaterial() {
    const lineMaterial = new SpeckleLineMaterial(
      {
        color: 0x047efb,
        linewidth: 1,
        worldUnits: false,
        vertexColors: false,
        alphaToCoverage: false,
        resolution: new Vector2(1, 1)
      },
      ['USE_RTE', 'UNIFORM_OPACITY'].concat(this._style.dashedLine ? ['USE_DASH'] : [])
    )
    lineMaterial.color = new Color(this._style.lineColor)
    lineMaterial.color.convertSRGBToLinear()
    lineMaterial.toneMapped = false
    if (this._style.dashedLine) {
      lineMaterial.dashSize = 1
      lineMaterial.gapSize = 1
      lineMaterial.dashScale = 10
    }
    lineMaterial.linewidth = 2
    lineMaterial.worldUnits = false
    lineMaterial.resolution = new Vector2(256, 256)
    lineMaterial.opacity =
      this._style.lineOpacity !== undefined
        ? this._style.lineOpacity
        : DefaultMeasurementPointGizmoStyle.lineOpacity
    lineMaterial.transparent = lineMaterial.opacity < 1
    lineMaterial.depthTest = false
    return lineMaterial
  }

  private getPointMaterial(color?: number) {
    const material = new SpeckleBasicMaterial(
      { color: color ? color : this._style.pointColor },
      ['BILLBOARD_FIXED']
    )
    material.opacity =
      this._style.pointOpacity !== undefined
        ? this._style.pointOpacity
        : DefaultMeasurementPointGizmoStyle.pointOpacity
    material.transparent = material.opacity < 1
    material.color.convertSRGBToLinear()
    material.toneMapped = false
    material.depthTest = false
    material.billboardPixelHeight =
      (this._style.pointPixelHeight !== undefined
        ? this._style.pointPixelHeight
        : DefaultMeasurementPointGizmoStyle.pointPixelHeight) * window.devicePixelRatio
    material.userData.billboardPos.value.copy(this.point.position)
    return material
  }

  private getTextMaterial() {
    const material = new SpeckleTextMaterial(
      {
        color: this._style.textColor,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE', 'BILLBOARD_FIXED']
    )
    material.toneMapped = false
    material.color.convertSRGBToLinear()
    material.opacity =
      this._style.textOpacity !== undefined
        ? this._style.textOpacity
        : DefaultMeasurementPointGizmoStyle.textOpacity
    material.transparent = material.opacity < 1
    material.depthTest = false
    material.billboardPixelHeight =
      (this._style.textPixelHeight !== undefined
        ? this._style.textPixelHeight
        : DefaultMeasurementPointGizmoStyle.textPixelHeight) * window.devicePixelRatio
    material.userData.billboardPos.value.copy(this.text.position)

    return material.getDerivedMaterial()
  }

  public constructor(style?: MeasurementPointGizmoStyle) {
    super()
    this.layers.set(ObjectLayers.MEASUREMENTS)

    const geometry = new CircleGeometry(1, 16)
    const doublePositions = new Float64Array(geometry.attributes.position.array)
    Geometry.updateRTEGeometry(geometry, doublePositions)

    this.disc = new Mesh(geometry, undefined)
    this.disc.layers.set(ObjectLayers.MEASUREMENTS)

    const buffer = new Float64Array(18)
    const lineGeometry = new LineSegmentsGeometry()
    lineGeometry.setPositions(new Float32Array(buffer))
    ;(
      lineGeometry.attributes['instanceStart'] as InterleavedBufferAttribute
    ).data.setUsage(DynamicDrawUsage)

    Geometry.updateRTEGeometry(lineGeometry, buffer)

    this.line = new LineSegments2(lineGeometry, undefined)
    this.line.computeLineDistances()
    this.line.name = `test-mesurements-line`
    this.line.frustumCulled = false
    this.line.renderOrder = 0
    this.line.layers.set(ObjectLayers.MEASUREMENTS)

    const sphereGeometry = new CircleGeometry(1, 16)

    this.point = new Mesh(sphereGeometry, undefined)
    this.point.layers.set(ObjectLayers.MEASUREMENTS)
    this.point.visible = false
    this.point.renderOrder = 1

    const point2 = new Mesh(sphereGeometry, this.getPointMaterial(0xffffff))
    point2.renderOrder = 2
    point2.material.billboardPixelHeight =
      (this._style.pointPixelHeight !== undefined
        ? this._style.pointPixelHeight
        : DefaultMeasurementPointGizmoStyle.pointPixelHeight) *
        window.devicePixelRatio -
      2 * window.devicePixelRatio
    point2.layers.set(ObjectLayers.MEASUREMENTS)
    this.point.add(point2)

    this.text = new SpeckleText(MathUtils.generateUUID(), ObjectLayers.MEASUREMENTS)
    this.text.textMesh.material = null

    this.add(this.point)
    this.add(this.disc)
    this.add(this.line)
    this.add(this.text)

    this.style = style ? style : DefaultMeasurementPointGizmoStyle
  }

  public enable(disc: boolean, line: boolean, point: boolean, text: boolean) {
    this.disc.visible = disc
    this.line.visible = line
    this.point.visible = point
    this.text.visible = text
    this.text.textMesh.visible = text
    this.line.material.visible = line
  }

  public frameUpdate(camera: Camera, bounds: Box3) {
    if (
      camera.type === 'PerspectiveCamera' &&
      +(this._style.fixedSize !== undefined
        ? this._style.fixedSize
        : DefaultMeasurementPointGizmoStyle.fixedSize) > 0
    ) {
      const cam = camera as PerspectiveCamera
      const cameraObjectDistance = cam.position.distanceTo(this.disc.position)
      const worldSize = Math.abs(2 * Math.tan(cam.fov / 2.0) * cameraObjectDistance)
      const maxWorldSize = bounds.min.distanceTo(bounds.max) * 2
      const size = 0.0035 * Math.min(worldSize, maxWorldSize)
      this.disc.scale.set(size, size, size)
      this.disc.matrixWorldNeedsUpdate = true
    }
    if (
      camera.type === 'OrthographicCamera' &&
      +(this._style.fixedSize !== undefined
        ? this._style.fixedSize
        : DefaultMeasurementPointGizmoStyle.fixedSize) > 0
    ) {
      const cam = camera as OrthographicCamera
      const orthoSize = cam.top - cam.bottom
      const size = (orthoSize / cam.zoom) * 0.0075
      this.disc.scale.set(size, size, size)
      this.disc.matrixWorldNeedsUpdate = true
    }
  }

  public updateDisc(position: Vector3, normal: Vector3) {
    this.disc.position.copy(position)
    MeasurementPointGizmo.vecBuff0.set(0, 0, 1)
    this.disc.quaternion.setFromUnitVectors(MeasurementPointGizmo.vecBuff0, normal)
  }

  public updatePoint(position: Vector3) {
    this.point.position.copy(position)
    ;(this.point.material as SpeckleBasicMaterial).userData.billboardPos.value.copy(
      this.point.position
    )
    ;(
      (this.point.children[0] as Mesh).material as SpeckleBasicMaterial
    ).userData.billboardPos.value.copy(this.point.position)
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

  public updateText(
    value: string,
    position?: Vector3,
    quaternion?: Quaternion,
    scale?: Vector3
  ) {
    void this.text
      .update({
        textValue: value,
        height: 1,
        anchorX: '50%',
        anchorY: '43%' // Apparently this makes it vertically centered
      })
      .then(() => {
        this.text.style = {
          backgroundColor: new Color(0x047efb),
          billboard: true,
          backgroundPixelHeight: 20
        }
        this.text.setTransform(position, quaternion, scale)
        if (this.text.backgroundMesh) this.text.backgroundMesh.renderOrder = 3
        this.text.textMesh.renderOrder = 4
      })
  }

  public updateStyle() {
    this.disc.material = this.getDiscMaterial()
    this.line.material = this.getLineMaterial()
    this.point.material = this.getPointMaterial()
    this.text.textMesh.material = this.getTextMaterial()
  }

  public raycast(raycaster: Raycaster, intersects: Array<Intersection>) {
    // this.disc.raycast(raycaster, intersects)
    this.line.raycast(raycaster, intersects)
    // this.point.raycast(raycaster, intersects)
    this.text.raycast(raycaster, intersects)
  }

  public updateClippingPlanes(planes: Plane[]) {
    ;(this.disc.material as Material).clippingPlanes = planes
    ;(this.point.material as Material).clippingPlanes = planes
    ;((this.point.children[0] as Mesh).material as Material).clippingPlanes = planes
    ;(this.line.material as Material).clippingPlanes = planes
    if (this.text.backgroundMesh) {
      ;(this.text.backgroundMesh.material as Material).clippingPlanes = planes
    }
    if (this.text.textMesh) {
      ;(this.text.textMesh?.material as Material).clippingPlanes = planes
    }
  }
}
