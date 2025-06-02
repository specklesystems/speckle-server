import {
  Box3,
  Camera,
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
import { MeasurementPointGizmo } from './MeasurementPointGizmo.js'

const vec3Buff0: Vector3 = new Vector3()
const vec3Buff1: Vector3 = new Vector3()
const vec3Buff2: Vector3 = new Vector3()
const vec3Buff3: Vector3 = new Vector3()
const vec3Buff4: Vector3 = new Vector3()
const vec3Buff5: Vector3 = new Vector3()
const vec4Buff0: Vector4 = new Vector4()
const vec4Buff1: Vector4 = new Vector4()
const vec4Buff2: Vector4 = new Vector4()
const vec2Buff0: Vector2 = new Vector2()

export class PerpendicularMeasurement extends Measurement {
  private startGizmo: MeasurementPointGizmo | null = null
  private endGizmo: MeasurementPointGizmo | null = null
  private normalIndicatorPixelSize = 15 * window.devicePixelRatio
  public flipStartNormal: boolean = false
  public midPoint: Vector3 = new Vector3()

  public set isVisible(value: boolean) {
    this.startGizmo?.enable(value, value, value, value)
    this.endGizmo?.enable(value, value, value, value)
  }

  public get bounds(): Box3 {
    return new Box3().expandByPoint(this.startPoint).expandByPoint(this.midPoint)
  }

  public constructor() {
    super()
    this.type = 'PerpendicularMeasurement'
    /** Might be hard to believe but can be traced down to how our camera library works (or better yet how it doesn't) */
    this.startPoint.set(NaN, NaN, NaN)

    this.startGizmo = new MeasurementPointGizmo()
    this.endGizmo = new MeasurementPointGizmo({ dashedLine: true, lineOpacity: 0.25 })
    this.startLineLength = 0.25
    this.add(this.startGizmo)
    this.add(this.endGizmo)
    this.layers.set(ObjectLayers.MEASUREMENTS)
  }

  public frameUpdate(camera: Camera, size: Vector2, bounds: Box3) {
    super.frameUpdate(camera, size, bounds)
    this.startGizmo?.frameUpdate(camera, size)
    this.endGizmo?.frameUpdate(camera, size)
    /** Not a fan of this but the camera library fails to tell us when zooming happens
     *  so we need to update the screen space normal indicator each frame, otherwise it
     *  won't look correct while zooming
     */
    if (this._state === MeasurementState.DANGLING_START) {
      void this.update()
    }
  }

  public locationUpdated(point: Vector3, normal: Vector3): void {
    if (this.state === MeasurementState.DANGLING_START) {
      this.startPoint.copy(point)
      this.startNormal.copy(normal)
    } else if (this.state === MeasurementState.DANGLING_END) {
      const dir = new Vector3().subVectors(point, this.startPoint).normalize()
      const dot = dir.dot(this.startNormal)
      if (dot < 0) this.flipStartNormal = true
      else this.flipStartNormal = false

      this.endPoint.copy(point)
      this.endNormal.copy(normal)
    }
  }
  public locationSelected(): void {
    if (this.state === MeasurementState.DANGLING_START)
      this.state = MeasurementState.DANGLING_END
    else if (this.state === MeasurementState.DANGLING_END)
      this.state = MeasurementState.COMPLETE
  }

  public update(): Promise<void> {
    let ret = Promise.resolve()

    if (isNaN(this.startPoint.length())) return ret
    if (!this.renderingCamera) return ret

    this.startGizmo?.updateNormalIndicator(this.startPoint, this.startNormal)
    this.startGizmo?.updatePoint(this.startPoint)
    this.endGizmo?.updateNormalIndicator(this.endPoint, this.endNormal)

    if (this._state === MeasurementState.DANGLING_START) {
      const startLine0 = vec3Buff0.copy(this.startPoint)

      // Compute start point in clip space
      const startNDC = vec4Buff0
        .set(this.startPoint.x, this.startPoint.y, this.startPoint.z, 1)
        .applyMatrix4(this.renderingCamera.matrixWorldInverse)
        .applyMatrix4(this.renderingCamera.projectionMatrix)
      // Move to NDC
      const startpDiv = startNDC.w
      startNDC.multiplyScalar(1 / startpDiv)

      // Compute start point normal in clip space
      const normalNDC = vec4Buff1
        .set(this.startNormal.x, this.startNormal.y, this.startNormal.z, 0)
        .applyMatrix4(this.renderingCamera.matrixWorldInverse)
        .applyMatrix4(this.renderingCamera.projectionMatrix)
        .normalize()

      const pixelScale = vec2Buff0.set(
        (this.normalIndicatorPixelSize / this.renderingSize.x) * 2,
        (this.normalIndicatorPixelSize / this.renderingSize.y) * 2
      )

      // Add the scaled NDC normal to the NDC start point, we get the end point in NDC
      const endNDC = vec4Buff2
        .set(startNDC.x, startNDC.y, startNDC.z, 1)
        .add(
          vec4Buff1.set(normalNDC.x * pixelScale.x, normalNDC.y * pixelScale.y, 0, 0)
        )
      // Back to clip
      endNDC.multiplyScalar(startpDiv)
      // Back to world
      endNDC
        .applyMatrix4(this.renderingCamera.projectionMatrixInverse)
        .applyMatrix4(this.renderingCamera.matrixWorld)
      this.startGizmo?.updateLine([
        startLine0,
        vec3Buff1.set(endNDC.x, endNDC.y, endNDC.z)
      ])

      this.endGizmo?.enable(false, false, false, false)
    }

    if (this._state === MeasurementState.DANGLING_END) {
      vec3Buff5.copy(this.startNormal)
      if (this.flipStartNormal) vec3Buff5.negate()

      const startEndDist = this.startPoint.distanceTo(this.endPoint)
      const endStartDir = vec3Buff0.copy(this.startPoint).sub(this.endPoint).normalize()
      let dot = vec3Buff5.dot(endStartDir)
      const angle = Math.acos(Math.min(Math.max(dot, -1), 1))
      this.startLineLength = Math.abs(startEndDist * Math.cos(angle))

      this.midPoint.copy(
        vec3Buff0
          .copy(this.startPoint)
          .add(vec3Buff1.copy(vec3Buff5).multiplyScalar(this.startLineLength))
      )
      const endLineNormal = vec3Buff1.copy(this.midPoint).sub(this.endPoint).normalize()

      this.endLineLength = this.midPoint.distanceTo(this.endPoint)

      dot = this.endNormal.dot(endLineNormal)
      const angle1 = Math.acos(Math.min(Math.max(dot, -1), 1))
      const dist1 = this.endLineLength * Math.cos(angle1)

      const endLine3 = vec3Buff1
        .copy(this.endPoint)
        .add(vec3Buff2.copy(this.endNormal).multiplyScalar(dist1))

      const startLine0 = vec3Buff2.copy(this.startPoint)
      const startLine1 = vec3Buff3
        .copy(this.startPoint)
        .add(vec3Buff4.copy(vec3Buff5).multiplyScalar(this.startLineLength))
      this.startGizmo?.updateLine([startLine0, startLine1])

      const endLine0 = vec3Buff3.copy(this.endPoint)

      this.endGizmo?.updateLine([
        endLine0,
        endLine3,
        endLine3,
        this.midPoint,
        this.midPoint,
        endLine0
      ])
      this.endGizmo?.updatePoint(this.midPoint)

      const textPos = vec3Buff0
        .copy(this.startPoint)
        .add(vec3Buff1.copy(vec3Buff5).multiplyScalar(this.startLineLength * 0.5))

      this.value = this.midPoint.distanceTo(this.startPoint)
      if (this.startGizmo)
        ret = this.startGizmo.updateText(
          `${(this.value * getConversionFactor('m', this.units)).toFixed(
            this.precision
          )} ${this.units}`,
          textPos
        )
      this.endGizmo?.enable(true, true, true, true)
    }
    if (this._state === MeasurementState.COMPLETE) {
      if (this.startGizmo)
        ret = this.startGizmo.updateText(
          `${(this.value * getConversionFactor('m', this.units)).toFixed(
            this.precision
          )} ${this.units}`
        )
      this.startGizmo?.enable(false, true, true, true)
      this.endGizmo?.enable(false, false, true, false)
    }

    return ret
  }

  public raycast(raycaster: Raycaster, intersects: Array<Intersection>) {
    const results: Array<Intersection> = []
    this.startGizmo?.raycast(raycaster, results)
    this.endGizmo?.raycast(raycaster, results)
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
    if (this.startGizmo) this.startGizmo.highlight = value
    if (this.endGizmo) this.endGizmo.highlight = value
  }

  public updateClippingPlanes(planes: Plane[]) {
    if (this.startGizmo) this.startGizmo.updateClippingPlanes(planes)
    if (this.endGizmo) this.endGizmo.updateClippingPlanes(planes)
  }
}
