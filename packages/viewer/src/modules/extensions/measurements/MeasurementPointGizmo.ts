import {
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
import Logger from '../../utils/Logger.js'

export interface MeasurementPointGizmoStyle {
  dashedLine?: boolean
  normalIndicatorPixelSize?: number
  normalIndicatorColor?: number
  normalIndicatorOpacity?: number
  lineColor?: number
  lineOpacity?: number
  pointColor?: number
  pointOpacity?: number
  textColor?: number
  textOpacity?: number
  textPixelHeight?: number
  pointPixelHeight?: number
}
const _vec30: Vector3 = new Vector3()

const DefaultMeasurementPointGizmoStyle = {
  dashedLine: false,
  normalIndicatorPixelSize: 40,
  normalIndicatorColor: 0x047efb,
  normalIndicatorOpacity: 1,
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
  private normalIndicator: LineSegments2
  private normalIndicatorBuffer: Float64Array = new Float64Array(24)
  private normalIndicatorNormal: Vector3 = new Vector3()
  private normalIndicatorTangent: Vector3 = new Vector3()
  private normalIndicatorBitangent: Vector3 = new Vector3()
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
      ;(this.normalIndicator.material as SpeckleLineMaterial).color = new Color(
        0xff0000
      )
      ;(this.line.material as SpeckleLineMaterial).color = new Color(0xff0000)
      ;(this.point.material as SpeckleBasicMaterial).color = new Color(0xff0000)
      ;(this.text.textMesh.material as SpeckleTextMaterial).color.copy(
        new Color(0xff0000)
      )
    } else this.updateStyle()
  }

  private getNormalIndicatorMaterial() {
    const material = new SpeckleLineMaterial({
      color: 0x047efb,
      linewidth: 1,
      worldUnits: false,
      vertexColors: false,
      alphaToCoverage: false,
      resolution: new Vector2(1, 1)
    })
    material.color = new Color(this._style.normalIndicatorColor)
    material.color.convertSRGBToLinear()
    material.toneMapped = false
    material.linewidth = 2
    material.worldUnits = false
    material.resolution = new Vector2(256, 256)
    material.opacity =
      this._style.normalIndicatorOpacity !== undefined
        ? this._style.normalIndicatorOpacity
        : DefaultMeasurementPointGizmoStyle.normalIndicatorOpacity
    material.transparent = material.opacity < 1
    material.depthTest = false
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
      ['BILLBOARD_FIXED']
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

    const normalIndicatorGeometry = new LineSegmentsGeometry()
    normalIndicatorGeometry.setPositions(
      new Float32Array(this.normalIndicatorBuffer.length)
    )
    ;(
      normalIndicatorGeometry.attributes['instanceStart'] as InterleavedBufferAttribute
    ).data.setUsage(DynamicDrawUsage)

    Geometry.updateRTEGeometry(normalIndicatorGeometry, this.normalIndicatorBuffer)

    this.normalIndicator = new LineSegments2(normalIndicatorGeometry, undefined)
    this.normalIndicator.computeLineDistances()
    this.normalIndicator.name = `test-mesurements-normal-indicator`
    this.normalIndicator.frustumCulled = false
    this.normalIndicator.layers.set(ObjectLayers.MEASUREMENTS)

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
    this.add(this.normalIndicator)
    this.add(this.line)
    this.add(this.text)

    this.style = style ? style : DefaultMeasurementPointGizmoStyle
  }

  public enable(
    normalIndicator: boolean,
    line: boolean,
    point: boolean,
    text: boolean
  ) {
    this.normalIndicator.visible = normalIndicator
    this.line.visible = line
    this.point.visible = point
    this.text.visible = text
    this.text.textMesh.visible = text
    this.line.material.visible = line
  }

  public frameUpdate(camera: Camera, size: Vector2) {
    let halfSize: number = 0
    const pixelSize =
      this._style.normalIndicatorPixelSize !== undefined
        ? this._style.normalIndicatorPixelSize
        : DefaultMeasurementPointGizmoStyle.normalIndicatorPixelSize
    if (camera instanceof PerspectiveCamera) {
      const distance = camera.position.distanceTo(this.normalIndicator.position)
      const fov = MathUtils.degToRad(camera.fov)
      const screenHeightWorld = 2 * distance * Math.tan(fov / 2)
      const worldUnitsPerPixel = screenHeightWorld / size.y
      halfSize = (pixelSize * worldUnitsPerPixel) / 2
    } else if (camera instanceof OrthographicCamera) {
      const worldHeight = camera.top - camera.bottom
      const worldUnitsPerPixel = worldHeight / size.y
      halfSize = (pixelSize * worldUnitsPerPixel) / 2
    }

    _vec30
      .copy(this.normalIndicator.position)
      .addScaledVector(this.normalIndicatorTangent, halfSize)
      .addScaledVector(this.normalIndicatorBitangent, -halfSize)
    _vec30.toArray(this.normalIndicatorBuffer, 0)

    _vec30
      .copy(this.normalIndicator.position)
      .addScaledVector(this.normalIndicatorTangent, -halfSize)
      .addScaledVector(this.normalIndicatorBitangent, -halfSize)
    _vec30.toArray(this.normalIndicatorBuffer, 3)

    _vec30
      .copy(this.normalIndicator.position)
      .addScaledVector(this.normalIndicatorTangent, -halfSize)
      .addScaledVector(this.normalIndicatorBitangent, -halfSize)
    _vec30.toArray(this.normalIndicatorBuffer, 6)

    _vec30
      .copy(this.normalIndicator.position)
      .addScaledVector(this.normalIndicatorTangent, -halfSize)
      .addScaledVector(this.normalIndicatorBitangent, halfSize)
    _vec30.toArray(this.normalIndicatorBuffer, 9)

    _vec30
      .copy(this.normalIndicator.position)
      .addScaledVector(this.normalIndicatorTangent, -halfSize)
      .addScaledVector(this.normalIndicatorBitangent, halfSize)
    _vec30.toArray(this.normalIndicatorBuffer, 12)

    _vec30
      .copy(this.normalIndicator.position)
      .addScaledVector(this.normalIndicatorTangent, halfSize)
      .addScaledVector(this.normalIndicatorBitangent, halfSize)
    _vec30.toArray(this.normalIndicatorBuffer, 15)

    _vec30
      .copy(this.normalIndicator.position)
      .addScaledVector(this.normalIndicatorTangent, halfSize)
      .addScaledVector(this.normalIndicatorBitangent, halfSize)
    _vec30.toArray(this.normalIndicatorBuffer, 18)

    _vec30
      .copy(this.normalIndicator.position)
      .addScaledVector(this.normalIndicatorTangent, halfSize)
      .addScaledVector(this.normalIndicatorBitangent, -halfSize)
    _vec30.toArray(this.normalIndicatorBuffer, 21)

    const posAttr = (
      this.normalIndicator.geometry.attributes[
        'instanceStart'
      ] as InterleavedBufferAttribute
    ).data
    const posAttrLow = (
      this.normalIndicator.geometry.attributes[
        'instanceStartLow'
      ] as InterleavedBufferAttribute
    ).data
    Geometry.DoubleToHighLowBuffer(
      this.normalIndicatorBuffer,
      posAttrLow.array as Float32Array,
      posAttr.array as Float32Array
    )
    posAttr.needsUpdate = true
    posAttrLow.needsUpdate = true
    this.normalIndicator.geometry.computeBoundingBox()
    this.normalIndicator.geometry.computeBoundingSphere()
    this.normalIndicator.computeLineDistances()
  }

  public updateNormalIndicator(position: Vector3, normal: Vector3) {
    this.normalIndicator.position.copy(position)
    this.normalIndicatorNormal.copy(normal)
    if (Math.abs(normal.x) > Math.abs(normal.z)) {
      this.normalIndicatorTangent.set(-normal.y, normal.x, 0)
    } else {
      this.normalIndicatorTangent.set(0, -normal.z, normal.y)
    }
    this.normalIndicatorTangent.normalize()
    this.normalIndicatorBitangent
      .crossVectors(this.normalIndicatorNormal, this.normalIndicatorTangent)
      .normalize()
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
  ): Promise<void> {
    return this.text
      .update({
        textValue: value,
        height: 1,
        anchorX: '50%',
        anchorY: '50%'
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
      .catch((reason) => {
        Logger.log(`Could not update text: ${reason}`)
      })
  }

  public updateStyle() {
    this.normalIndicator.material = this.getNormalIndicatorMaterial()
    this.line.material = this.getLineMaterial()
    this.point.material = this.getPointMaterial()
    this.text.textMesh.material = this.getTextMaterial()
  }

  public raycast(raycaster: Raycaster, intersects: Array<Intersection>) {
    /** We're not testing the line, points and disc because testing the label only
     *  was explicitly requested.
     *  However, I'll keep these commented because this last request could change in the future
     *  and also to emphasize that raycasting agains the gizmo is not restricted to text object only
     *  and that we *explictly* do not test any other components
     */
    // this.disc.raycast(raycaster, intersects)
    // this.line.raycast(raycaster, intersects)
    // this.point.raycast(raycaster, intersects)
    this.text.raycast(raycaster, intersects)
  }

  public updateClippingPlanes(planes: Plane[]) {
    ;(this.normalIndicator.material as Material).clippingPlanes = planes
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
