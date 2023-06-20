import SpeckleRenderer, { ObjectLayers } from '../SpeckleRenderer'

import { ViewerEvent } from '../../IViewer'
import { PerpendicularMeasurement } from './PerpendicularMeasurement'
import { Plane, Ray, Raycaster, Vector2, Vector3 } from 'three'
import { PointToPointMeasurement } from './PointToPointMeasurement'
import { Measurement, MeasurementState } from './Measurement'
import { ExtendedIntersection } from '../objects/SpeckleRaycaster'
import Logger from 'js-logger'

export class Measurements {
  private renderer: SpeckleRenderer = null
  private measurements: Measurement[] = []
  private measurement: Measurement = null
  private selectedMeasurement: Measurement = null
  private raycaster: Raycaster = null
  private frameLock = false
  private pointBuff: Vector3 = new Vector3()
  private normalBuff: Vector3 = new Vector3()
  private screenBuff0: Vector2 = new Vector2()
  private screenBuff1: Vector2 = new Vector2()

  public constructor(renderer: SpeckleRenderer) {
    this.renderer = renderer
    this.raycaster = new Raycaster()
    this.raycaster.layers.set(ObjectLayers.MEASUREMENTS)

    this.renderer.input.on('pointer-move', this.onPointerMove.bind(this))
    this.renderer.input.on(ViewerEvent.ObjectClicked, this.onPointerClick.bind(this))
    this.renderer.input.on('key-up', this.onKeyUp.bind(this))
  }

  public update() {
    this.frameLock = false
    if (this.measurement)
      this.measurement.frameUpdate(this.renderer.camera, this.renderer.sceneBox)
    this.measurements.forEach((value: Measurement) => {
      value.frameUpdate(this.renderer.camera, this.renderer.sceneBox)
    })
  }

  public fromMeasurementData(startPoint: Vector3, endPoint: Vector3) {
    const measurement = new PointToPointMeasurement()
    measurement.startPoint.copy(startPoint)
    measurement.endPoint.copy(endPoint)
    measurement.state = MeasurementState.DANGLING_END
    measurement.update()
    measurement.state = MeasurementState.COMPLETE
    measurement.update()
    this.measurements.push(this.measurement)
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.measurements.forEach((value) => {
      value.updateClippingPlanes(planes)
    })
  }

  private onPointerMove(data) {
    if (!data.event.ctrlKey && !data.event.altKey) return

    if (this.frameLock) {
      return
    }

    const result = this.renderer.intersections.intersect(
      this.renderer.scene,
      this.renderer.camera,
      data,
      true,
      this.renderer.currentSectionBox,
      [ObjectLayers.STREAM_CONTENT_MESH]
    )
    if (!result || !result.length) return

    if (!this.measurement) {
      if (data.event.ctrlKey) this.measurement = new PerpendicularMeasurement()
      else if (data.event.altKey) this.measurement = new PointToPointMeasurement()
      this.measurement.state = MeasurementState.DANGLING_START
      this.renderer.scene.add(this.measurement)
    }
    this.measurement.isVisible = true

    this.pointBuff.copy(result[0].point)
    this.normalBuff.copy(result[0].face.normal)
    if (data.event.altKey && data.event.shiftKey) {
      this.snap(result[0], this.pointBuff, this.normalBuff)
    }
    if (this.measurement.state === MeasurementState.DANGLING_START) {
      this.measurement.startPoint.copy(this.pointBuff)
      this.measurement.startNormal.copy(this.normalBuff)
    } else if (this.measurement.state === MeasurementState.DANGLING_END) {
      this.measurement.endPoint.copy(this.pointBuff)
      this.measurement.endNormal.copy(this.normalBuff)
    }
    this.measurement.update()

    this.renderer.needsRender = true
    this.renderer.resetPipeline()
    this.frameLock = true
  }

  private onPointerClick(data) {
    if (!data.event.ctrlKey && !data.event.altKey) return

    if (data.event.shiftKey && data.event.ctrlKey) {
      this.autoLazerMeasure(data)
      return
    }

    if (this.measurement.state === MeasurementState.DANGLING_START)
      this.measurement.state = MeasurementState.DANGLING_END
    else if (this.measurement.state === MeasurementState.DANGLING_END) {
      this.finishMeasurement()
    }
  }

  private onKeyUp(data) {
    if (data.code === 'Escape') {
      this.renderer.scene.remove(this.measurement)
      this.measurement = null
      this.renderer.needsRender = true
      this.renderer.resetPipeline()
    }
    if (data.code === 'Delete') {
      this.measurements.splice(this.measurements.indexOf(this.selectedMeasurement), 1)
      this.renderer.scene.remove(this.selectedMeasurement)
      this.selectedMeasurement = null
      this.renderer.needsRender = true
      this.renderer.resetPipeline()
    }
    if (data.code === 'ControlLeft' || data.code === 'AltLeft') {
      if (
        this.measurement &&
        this.measurement.state === MeasurementState.DANGLING_START
      ) {
        this.measurement.isVisible = false
      }
    }
  }

  private autoLazerMeasure(data) {
    if (this.measurement.state === MeasurementState.DANGLING_START) {
      const result = this.renderer.intersections.intersect(
        this.renderer.scene,
        this.renderer.camera,
        data,
        true,
        this.renderer.currentSectionBox,
        [ObjectLayers.STREAM_CONTENT_MESH]
      )
      if (!result || !result.length) return

      const startPoint = new Vector3().copy(result[0].point)
      const startNormal = new Vector3().copy(result[0].face.normal)

      const offsetPoint = new Vector3()
        .copy(startPoint)
        .add(new Vector3().copy(startNormal).multiplyScalar(0.000001))
      const perpResult = this.renderer.intersections.intersectRay(
        this.renderer.scene,
        this.renderer.camera,
        new Ray(offsetPoint, startNormal),
        true,
        this.renderer.currentSectionBox,
        [ObjectLayers.STREAM_CONTENT_MESH]
      )
      if (!perpResult || !perpResult.length) {
        let flashCount = 0
        const maxFlashCount = 5
        const handle = setInterval(() => {
          this.measurement.highlight(Boolean(flashCount++ % 2))
          if (flashCount >= maxFlashCount) {
            clearInterval(handle)
          }
          this.renderer.needsRender = true
          this.renderer.resetPipeline()
        }, 100)
        return
      }

      this.measurement.startPoint.copy(startPoint)
      this.measurement.startNormal.copy(startNormal)
      this.measurement.endPoint.copy(perpResult[0].point)
      this.measurement.endNormal.copy(perpResult[0].face.normal)
      this.measurement.state = MeasurementState.DANGLING_END
      this.measurement.update()
      this.finishMeasurement()
    }
  }

  private finishMeasurement() {
    this.measurement.state = MeasurementState.COMPLETE
    this.measurement.update()
    if (this.measurement.value > 0) {
      this.measurements.push(this.measurement)
    } else {
      this.renderer.scene.remove(this.measurement)
      Logger.error('Ignoring zero value measurement!')
    }
    this.measurement = null
  }

  private snap(
    intersection: ExtendedIntersection,
    outPoint: Vector3,
    outNormal: Vector3
  ) {
    const v0 = intersection.batchObject.bvh
      .getVertexAtIndex(intersection.face.a)
      .project(this.renderer.camera)
    const v1 = intersection.batchObject.bvh
      .getVertexAtIndex(intersection.face.b)
      .project(this.renderer.camera)
    const v2 = intersection.batchObject.bvh
      .getVertexAtIndex(intersection.face.c)
      .project(this.renderer.camera)

    const projectedIntersection = intersection.point.project(this.renderer.camera)
    const tri = [v0, v1, v2]
    tri.sort((a, b) => {
      return projectedIntersection.distanceTo(a) - projectedIntersection.distanceTo(b)
    })
    const closestScreen = this.renderer.NDCToScreen(tri[0].x, tri[0].y)
    const intersectionScreen = this.renderer.NDCToScreen(
      projectedIntersection.x,
      projectedIntersection.y
    )
    this.screenBuff0.set(closestScreen.x, closestScreen.y)
    this.screenBuff1.set(intersectionScreen.x, intersectionScreen.y)
    const unprojectedPoint = tri[0].unproject(this.renderer.camera)
    if (this.screenBuff0.distanceTo(this.screenBuff1) < 10 * window.devicePixelRatio) {
      outPoint.copy(unprojectedPoint)
      outNormal.copy(intersection.face.normal)
    }
  }

  public pickMeasurement(data): PerpendicularMeasurement {
    if (data.event.ctrlKey || data.event.altKey) return

    this.measurements.forEach((value) => {
      value.highlight(false)
    })
    this.raycaster.setFromCamera(data, this.renderer.camera)
    const res = this.raycaster.intersectObjects(this.measurements, false)
    return res[0]?.object as PerpendicularMeasurement
  }

  public highlightMeasurement(measurement: PerpendicularMeasurement, value: boolean) {
    measurement.highlight(value)
    this.selectedMeasurement = measurement
  }
}
