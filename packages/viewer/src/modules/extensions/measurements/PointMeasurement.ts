import {
  Box3,
  Camera,
  Color,
  Material,
  Matrix4,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  Vector4,
  type Intersection
} from 'three'
import { getConversionFactor } from '../../converter/Units.js'
import { Measurement, MeasurementState } from './Measurement.js'
import { ObjectLayers } from '../../../IViewer.js'
import { TextLabel } from '../../objects/TextLabel.js'
import { MeasurementPointGizmo } from './MeasurementPointGizmo.js'
import { MeasurementData, MeasurementType } from '@speckle/shared/viewer/state'

const _vec40 = new Vector4()
const _vec41 = new Vector4()
const _vec42 = new Vector4()
const _vec43 = new Vector4()
const _mat40 = new Matrix4()
const _mat41 = new Matrix4()

export class PointMeasurement extends Measurement {
  protected gizmo: MeasurementPointGizmo
  protected xLabel: TextLabel
  protected yLabel: TextLabel
  protected zLabel: TextLabel
  protected xLabelPosition: Vector3 = new Vector3()
  protected yLabelPosition: Vector3 = new Vector3()
  protected zLabelPosition: Vector3 = new Vector3()
  protected readonly pixelsOffX = 50 * window.devicePixelRatio
  protected readonly pixelsOffY = 25 * window.devicePixelRatio

  public set isVisible(value: boolean) {
    this.gizmo.visible = value
    this.xLabel.visible = value
    this.yLabel.visible = value
    this.zLabel.visible = value
  }

  public constructor() {
    super()
    this.type = 'PointMeasurement'
    this.gizmo = new MeasurementPointGizmo()
    this.add(this.gizmo)

    this.xLabel = new TextLabel({
      text: 'sample',
      textColor: new Color(0xffffff),
      fontSize: 11,
      billboard: 'screen',
      anchorX: 'left',
      anchorY: 'middle',
      backgroundColor: new Color(0xfb0404),
      backgroundMargins: new Vector2(30, 10),
      backgroundCornerRadius: 0.3,
      objectLayer: ObjectLayers.MEASUREMENTS
    })
    this.xLabel.name = 'XLabel'
    this.xLabel.material.depthTest = false
    this.add(this.xLabel)

    this.yLabel = new TextLabel({
      text: 'sample',
      textColor: new Color(0xffffff),
      fontSize: 11,
      anchorX: 'left',
      anchorY: 'middle',
      billboard: 'screen',
      backgroundColor: new Color(0x03c903),
      backgroundMargins: new Vector2(30, 10),
      backgroundCornerRadius: 0.3,
      objectLayer: ObjectLayers.MEASUREMENTS
    })
    this.yLabel.name = 'YLabel'
    this.yLabel.material.depthTest = false
    this.add(this.yLabel)

    this.zLabel = new TextLabel({
      text: 'sample',
      textColor: new Color(0xffffff),
      fontSize: 11,
      billboard: 'screen',
      anchorX: 'left',
      anchorY: 'middle',
      backgroundColor: new Color(0x047efb),
      backgroundMargins: new Vector2(30, 10),
      backgroundCornerRadius: 0.3,
      objectLayer: ObjectLayers.MEASUREMENTS
    })
    this.zLabel.name = 'ZLabel'
    this.zLabel.material.depthTest = false
    this.add(this.zLabel)

    this.layers.set(ObjectLayers.MEASUREMENTS)
  }

  public frameUpdate(camera: Camera, size: Vector2, bounds: Box3) {
    super.frameUpdate(camera, size, bounds)

    this.updateLabelPositions()
    this.xLabel.position.copy(this.xLabelPosition)
    this.yLabel.position.copy(this.yLabelPosition)
    this.zLabel.position.copy(this.zLabelPosition)
    this.gizmo.frameUpdate(camera, size)
  }

  public locationUpdated(point: Vector3, normal: Vector3): void {
    this.startPoint.copy(point)
    this.startNormal.copy(normal)
  }
  public locationSelected(): void {
    if (this.state === MeasurementState.DANGLING_START)
      this.state = MeasurementState.COMPLETE
  }

  protected updateLabelPositions() {
    const camera = this.renderingCamera as PerspectiveCamera | OrthographicCamera
    if (!camera) return
    const ndcPos = _vec40.set(
      this.startPoint.x,
      this.startPoint.y,
      this.startPoint.z,
      1
    )
    ndcPos.applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix)
    const perspective = ndcPos.w
    ndcPos.multiplyScalar(1 / perspective)
    const xOff = (this.pixelsOffX / this.renderingSize.x) * 2
    const yOff = (this.pixelsOffY / this.renderingSize.y) * 2
    const xPos = _vec41.set(ndcPos.x + xOff, ndcPos.y + yOff, ndcPos.z, 1)
    const yPos = _vec42.set(ndcPos.x + xOff, ndcPos.y, ndcPos.z, 1)
    const zPos = _vec43.set(ndcPos.x + xOff, ndcPos.y - yOff, ndcPos.z, 1)

    const invProjection = _mat40.copy(camera.projectionMatrix).invert()
    const invView = _mat41.copy(camera.matrixWorldInverse).invert()
    xPos.multiplyScalar(perspective)
    xPos.applyMatrix4(invProjection)
    xPos.applyMatrix4(invView)

    yPos.multiplyScalar(perspective)
    yPos.applyMatrix4(invProjection)
    yPos.applyMatrix4(invView)

    zPos.multiplyScalar(perspective)
    zPos.applyMatrix4(invProjection)
    zPos.applyMatrix4(invView)

    this.xLabelPosition.set(xPos.x, xPos.y, xPos.z)
    this.yLabelPosition.set(yPos.x, yPos.y, yPos.z)
    this.zLabelPosition.set(zPos.x, zPos.y, zPos.z)
  }

  public async update(): Promise<void> {
    this.xLabel.position.copy(this.xLabelPosition)
    this.yLabel.position.copy(this.yLabelPosition)
    this.zLabel.position.copy(this.zLabelPosition)
    const xP = this.xLabel.updateParams({
      text: `X : ${(this.startPoint.x * getConversionFactor('m', this.units)).toFixed(
        this.precision
      )} ${this.units}`
    })

    const yP = this.yLabel.updateParams({
      text: `Y : ${(this.startPoint.y * getConversionFactor('m', this.units)).toFixed(
        this.precision
      )} ${this.units}`
    })

    const zP = this.zLabel.updateParams({
      text: `Z : ${(this.startPoint.z * getConversionFactor('m', this.units)).toFixed(
        this.precision
      )} ${this.units}`
    })

    this.gizmo.updateNormalIndicator(this.startPoint, this.startNormal)
    this.gizmo.updatePoint(this.startPoint)
    this.gizmo.enable(true, false, true, false)

    this.value = this.startPoint.length()

    await Promise.all([xP, yP, zP])
  }

  public raycast(raycaster: Raycaster, intersects: Array<Intersection>) {
    const results: Array<Intersection> = []
    this.gizmo.raycast(raycaster, results)
    this.xLabel.raycast(raycaster, results)
    this.yLabel.raycast(raycaster, results)
    this.zLabel.raycast(raycaster, results)
    if (results.length) {
      intersects.push({
        distance: results[0].distance,
        face: results[0].face,
        faceIndex: results[0].faceIndex,
        object: this,
        point: results[0].point,
        uv: results[0].uv
      })
    }
  }

  public highlight(value: boolean) {
    if (this.gizmo) this.gizmo.highlight = value
    if (value) {
      this.xLabel.textMesh.material.color.copy(new Color(0xff0000))
      this.yLabel.textMesh.material.color.copy(new Color(0xff0000))
      this.zLabel.textMesh.material.color.copy(new Color(0xff0000))
    } else {
      this.xLabel.textMesh.material.color.copy(new Color(0xffffff))
      this.yLabel.textMesh.material.color.copy(new Color(0xffffff))
      this.zLabel.textMesh.material.color.copy(new Color(0xffffff))
    }
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.gizmo.updateClippingPlanes(planes)
    if (this.xLabel.backgroundMesh) {
      ;(this.xLabel.backgroundMesh.material as Material).clippingPlanes = planes
    }
    if (this.xLabel.textMesh) {
      ;(this.xLabel.textMesh?.material as Material).clippingPlanes = planes
    }

    if (this.yLabel.backgroundMesh) {
      ;(this.yLabel.backgroundMesh.material as Material).clippingPlanes = planes
    }
    if (this.yLabel.textMesh) {
      ;(this.yLabel.textMesh?.material as Material).clippingPlanes = planes
    }

    if (this.zLabel.backgroundMesh) {
      ;(this.zLabel.backgroundMesh.material as Material).clippingPlanes = planes
    }
    if (this.zLabel.textMesh) {
      ;(this.zLabel.textMesh?.material as Material).clippingPlanes = planes
    }
  }

  public toMeasurementData(): MeasurementData {
    const data = super.toMeasurementData()
    data.type = MeasurementType.POINT
    return data
  }

  public fromMeasurementData(data: MeasurementData): void {
    super.fromMeasurementData(data)
  }
}
