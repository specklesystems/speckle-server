import {
  Box3,
  Camera,
  Color,
  DoubleSide,
  Material,
  MathUtils,
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
import SpeckleTextMaterial from '../../materials/SpeckleTextMaterial.js'
import { MeasurementPointGizmo } from './MeasurementPointGizmo.js'

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
  protected readonly pixelsOffY = 27 * window.devicePixelRatio

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
    this.xLabel = new TextLabel(MathUtils.generateUUID(), ObjectLayers.MEASUREMENTS)
    const xLabelMaterial = new SpeckleTextMaterial(
      {
        color: 0xffffff,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE', 'BILLBOARD_FIXED']
    )
    xLabelMaterial.toneMapped = false
    xLabelMaterial.color.convertSRGBToLinear()
    xLabelMaterial.opacity = 1
    xLabelMaterial.transparent = false
    xLabelMaterial.depthTest = false
    xLabelMaterial.billboardPixelHeight = 17 * window.devicePixelRatio
    xLabelMaterial.userData.billboardPos.value.copy(this.position)

    this.xLabel.textMesh.material = xLabelMaterial.getDerivedMaterial()
    this.add(this.xLabel)

    this.yLabel = new TextLabel(MathUtils.generateUUID(), ObjectLayers.MEASUREMENTS)
    const yLabelMaterial = new SpeckleTextMaterial(
      {
        color: 0xffffff,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE', 'BILLBOARD_FIXED']
    )
    yLabelMaterial.toneMapped = false
    yLabelMaterial.color.convertSRGBToLinear()
    yLabelMaterial.opacity = 1
    yLabelMaterial.transparent = false
    yLabelMaterial.depthTest = false
    yLabelMaterial.billboardPixelHeight = 17 * window.devicePixelRatio
    yLabelMaterial.userData.billboardPos.value.copy(this.position)

    this.yLabel.textMesh.material = yLabelMaterial.getDerivedMaterial()
    this.add(this.yLabel)

    this.zLabel = new TextLabel(MathUtils.generateUUID(), ObjectLayers.MEASUREMENTS)
    const zLabelMaterial = new SpeckleTextMaterial(
      {
        color: 0xffffff,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE', 'BILLBOARD_FIXED']
    )
    zLabelMaterial.toneMapped = false
    zLabelMaterial.color.convertSRGBToLinear()
    zLabelMaterial.opacity = 1
    zLabelMaterial.transparent = false
    zLabelMaterial.depthTest = false
    zLabelMaterial.billboardPixelHeight = 17 * window.devicePixelRatio
    zLabelMaterial.userData.billboardPos.value.copy(this.position)

    this.zLabel.textMesh.material = zLabelMaterial.getDerivedMaterial()
    this.add(this.zLabel)
    this.layers.set(ObjectLayers.MEASUREMENTS)
  }

  public frameUpdate(camera: Camera, size: Vector2, bounds: Box3) {
    super.frameUpdate(camera, size, bounds)

    this.updateLabelPositions()
    this.xLabel.setTransform(this.xLabelPosition)
    this.yLabel.setTransform(this.yLabelPosition)
    this.zLabel.setTransform(this.zLabelPosition)
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
    const xP = this.xLabel
      .update({
        textValue: `x : ${(
          this.startPoint.x * getConversionFactor('m', this.units)
        ).toFixed(this.precision)} ${this.units}`,
        height: 1,
        anchorX: '0%',
        anchorY: '50%'
      })
      .then(() => {
        this.xLabel.style = {
          backgroundColor: new Color(0xfb0404),
          billboard: true,
          backgroundPixelHeight: 20
        }
        this.xLabel.setTransform(this.xLabelPosition)
        if (this.xLabel.backgroundMesh) this.xLabel.backgroundMesh.renderOrder = 3
        this.xLabel.textMesh.renderOrder = 4
      })
    const yP = this.yLabel
      .update({
        textValue: `y : ${(
          this.startPoint.y * getConversionFactor('m', this.units)
        ).toFixed(this.precision)} ${this.units}`,
        height: 1,
        anchorX: '0%',
        anchorY: '50%'
      })
      .then(() => {
        this.yLabel.style = {
          backgroundColor: new Color(0x03c903),
          billboard: true,
          backgroundPixelHeight: 20
        }
        this.yLabel.setTransform(this.yLabelPosition)
        if (this.yLabel.backgroundMesh) this.yLabel.backgroundMesh.renderOrder = 3
        this.yLabel.textMesh.renderOrder = 4
      })

    const zP = this.zLabel
      .update({
        textValue: `z : ${(
          this.startPoint.z * getConversionFactor('m', this.units)
        ).toFixed(this.precision)} ${this.units}`,
        height: 1,
        anchorX: '0%',
        anchorY: '50%'
      })
      .then(() => {
        this.zLabel.style = {
          backgroundColor: new Color(0x047efb),
          billboard: true,
          backgroundPixelHeight: 20
        }
        this.zLabel.setTransform(this.zLabelPosition)
        if (this.zLabel.backgroundMesh) this.zLabel.backgroundMesh.renderOrder = 3
        this.zLabel.textMesh.renderOrder = 4
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
}
