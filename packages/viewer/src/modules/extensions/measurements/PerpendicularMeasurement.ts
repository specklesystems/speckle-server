import {
  Box3,
  Camera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  type Intersection
} from 'three'
import { MeasurementPointGizmo } from './MeasurementPointGizmo.js'
import { getConversionFactor } from '../../converter/Units.js'
import { Measurement, MeasurementState } from './Measurement.js'
import { ObjectLayers } from '../../../IViewer.js'

export class PerpendicularMeasurement extends Measurement {
  private startGizmo: MeasurementPointGizmo | null = null
  private endGizmo: MeasurementPointGizmo | null = null
  private midPoint: Vector3 = new Vector3()
  private normalIndicatorPixelSize = 15 * window.devicePixelRatio

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
    this.startGizmo?.frameUpdate(camera, bounds)
    this.endGizmo?.frameUpdate(camera, bounds)
    /** Not a fan of this but the camera library fails to tell us when zooming happens
     *  so we need to update the screen space normal indicator each frame, otherwise it
     *  won't look correct while zooming
     */
    if (this._state === MeasurementState.DANGLING_START) {
      this.update()
    }
  }

  public update() {
    if (isNaN(this.startPoint.length())) return
    if (!this.renderingCamera) return

    this.startGizmo?.updateDisc(this.startPoint, this.startNormal)
    this.startGizmo?.updatePoint(this.startPoint)
    this.endGizmo?.updateDisc(this.endPoint, this.endNormal)

    if (this._state === MeasurementState.DANGLING_START) {
      const startLine0 = Measurement.vec3Buff0.copy(this.startPoint)

      // Compute start point in clip space
      const startNDC = Measurement.vec4Buff0
        .set(this.startPoint.x, this.startPoint.y, this.startPoint.z, 1)
        .applyMatrix4(this.renderingCamera.matrixWorldInverse)
        .applyMatrix4(this.renderingCamera.projectionMatrix)
      // Move to NDC
      const startpDiv = startNDC.w
      startNDC.multiplyScalar(1 / startpDiv)

      // Compute start point normal in clip space
      const normalNDC = Measurement.vec4Buff1
        .set(this.startNormal.x, this.startNormal.y, this.startNormal.z, 0)
        .applyMatrix4(this.renderingCamera.matrixWorldInverse)
        .applyMatrix4(this.renderingCamera.projectionMatrix)
        .normalize()
      /** If we apply perspective division, the result is off **/
      // Move to NDC
      // const normalpDiv = normalNDC.w === 0 ? 1 : normalNDC.w
      // normalNDC.multiplyScalar(1 / normalpDiv).normalize()

      const pixelScale = Measurement.vec2Buff0.set(
        (this.normalIndicatorPixelSize / this.renderingSize.x) * 2,
        (this.normalIndicatorPixelSize / this.renderingSize.y) * 2
      )

      // Add the scaled NDC normal to the NDC start point, we get the end point in NDC
      const endNDC = Measurement.vec4Buff2
        .set(startNDC.x, startNDC.y, startNDC.z, 1)
        .add(
          Measurement.vec4Buff1.set(
            normalNDC.x * pixelScale.x,
            normalNDC.y * pixelScale.y,
            0,
            0
          )
        )
      // Back to clip
      endNDC.multiplyScalar(startpDiv)
      // Back to world
      endNDC
        .applyMatrix4(this.renderingCamera.projectionMatrixInverse)
        .applyMatrix4(this.renderingCamera.matrixWorld)
      this.startGizmo?.updateLine([
        startLine0,
        Measurement.vec3Buff1.set(endNDC.x, endNDC.y, endNDC.z)
      ])

      this.endGizmo?.enable(false, false, false, false)
    }

    if (this._state === MeasurementState.DANGLING_END) {
      const startEndDist = this.startPoint.distanceTo(this.endPoint)
      const endStartDir = Measurement.vec3Buff0
        .copy(this.startPoint)
        .sub(this.endPoint)
        .normalize()
      let dot = this.startNormal.dot(endStartDir)
      const angle = Math.acos(Math.min(Math.max(dot, -1), 1))
      this.startLineLength = Math.abs(startEndDist * Math.cos(angle))

      this.midPoint.copy(
        Measurement.vec3Buff0
          .copy(this.startPoint)
          .add(
            Measurement.vec3Buff1
              .copy(this.startNormal)
              .multiplyScalar(this.startLineLength)
          )
      )
      const endLineNormal = Measurement.vec3Buff1
        .copy(this.midPoint)
        .sub(this.endPoint)
        .normalize()

      this.endLineLength = this.midPoint.distanceTo(this.endPoint)

      dot = this.endNormal.dot(endLineNormal)
      const angle1 = Math.acos(Math.min(Math.max(dot, -1), 1))
      const dist1 = this.endLineLength * Math.cos(angle1)

      const endLine3 = Measurement.vec3Buff1
        .copy(this.endPoint)
        .add(Measurement.vec3Buff2.copy(this.endNormal).multiplyScalar(dist1))

      const startLine0 = Measurement.vec3Buff2.copy(this.startPoint)
      const startLine1 = Measurement.vec3Buff3
        .copy(this.startPoint)
        .add(
          Measurement.vec3Buff4
            .copy(this.startNormal)
            .multiplyScalar(this.startLineLength)
        )
      this.startGizmo?.updateLine([startLine0, startLine1])

      const endLine0 = Measurement.vec3Buff3.copy(this.endPoint)

      this.endGizmo?.updateLine([
        endLine0,
        endLine3,
        endLine3,
        this.midPoint,
        this.midPoint,
        endLine0
      ])
      this.endGizmo?.updatePoint(this.midPoint)

      const textPos = Measurement.vec3Buff0
        .copy(this.startPoint)
        .add(
          Measurement.vec3Buff1
            .copy(this.startNormal)
            .multiplyScalar(this.startLineLength * 0.5)
        )

      this.value = this.midPoint.distanceTo(this.startPoint)
      this.startGizmo?.updateText(
        `${(this.value * getConversionFactor('m', this.units)).toFixed(
          this.precision
        )} ${this.units}`,
        textPos
      )
      this.endGizmo?.enable(true, true, true, true)
    }
    if (this._state === MeasurementState.COMPLETE) {
      this.startGizmo?.updateText(
        `${(this.value * getConversionFactor('m', this.units)).toFixed(
          this.precision
        )} ${this.units}`
      )
      this.startGizmo?.enable(false, true, true, true)
      this.endGizmo?.enable(false, false, true, false)
    }
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
