import SpeckleRenderer, { ObjectLayers } from '../SpeckleRenderer'

import { ViewerEvent } from '../../IViewer'
import { PerpendicularMeasurement } from './PerpendicularMeasurement'
import { Plane, Ray, Raycaster, Vector2, Vector3 } from 'three'
import { PointToPointMeasurement } from './PointToPointMeasurement'
import { Measurement, MeasurementState } from './Measurement'
import { ExtendedIntersection } from '../objects/SpeckleRaycaster'
import Logger from 'js-logger'
import SpeckleMesh from '../objects/SpeckleMesh'
import SpeckleGhostMaterial from '../materials/SpeckleGhostMaterial'

export enum MeasurementType {
  PERPENDICULAR,
  POINTTOPOINT
}

export interface MeasurementOptions {
  type?: MeasurementType
  vertexSnap?: boolean
  units?: string
  precision?: number
}

const DefaultMeasurementsOptions = {
  type: MeasurementType.POINTTOPOINT,
  vertexSnap: true,
  units: 'm',
  precision: 2
}

export class Measurements {
  private renderer: SpeckleRenderer = null
  private measurements: Measurement[] = []
  private measurement: Measurement = null
  private selectedMeasurement: Measurement = null
  private raycaster: Raycaster = null
  private _options: MeasurementOptions = Object.assign({}, DefaultMeasurementsOptions)
  private frameLock = false
  private _enabled = false
  private _paused = false
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
    this.renderer.input.on(
      ViewerEvent.ObjectDoubleClicked,
      this.onPointerDoubleClick.bind(this)
    )
  }

  public get enabled(): boolean {
    return this._enabled
  }

  public set enabled(value: boolean) {
    this._enabled = value
    if (this.measurement) {
      this.measurement.isVisible = value
      this.measurement.update()
    }
    this.renderer.needsRender = true
    this.renderer.resetPipeline()
  }

  public set paused(value: boolean) {
    this._paused = value
  }

  public set options(options: MeasurementOptions) {
    const resetMeasurement =
      this._options.type !== options.type &&
      this.measurement &&
      this.measurement.state === MeasurementState.DANGLING_START
    Object.assign(this._options, options)
    if (resetMeasurement) {
      this.cancelMeasurement()
      this.startMeasurement()
    }
    this.applyOptions()
  }

  public update() {
    if (!this._enabled) return

    this.frameLock = false
    this.renderer.renderer.getDrawingBufferSize(this.screenBuff0)
    if (this.measurement)
      this.measurement.frameUpdate(
        this.renderer.camera,
        this.screenBuff0,
        this.renderer.sceneBox
      )
    this.measurements.forEach((value: Measurement) => {
      value.frameUpdate(this.renderer.camera, this.screenBuff0, this.renderer.sceneBox)
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
    if (!this._enabled || this._paused) return

    if (this.frameLock) {
      return
    }

    let result =
      (this.renderer.intersections.intersect(
        this.renderer.scene,
        this.renderer.camera,
        data,
        true,
        this.renderer.currentSectionBox,
        [ObjectLayers.STREAM_CONTENT_MESH]
      ) as ExtendedIntersection[]) || []

    result = result.filter((value: ExtendedIntersection) => {
      const material = (value.object as unknown as SpeckleMesh).getBatchObjectMaterial(
        value.batchObject
      )
      return !(material instanceof SpeckleGhostMaterial) && material.visible
    })

    if (!result.length) return

    if (!this.measurement) {
      this.startMeasurement()
    }
    this.measurement.isVisible = true

    this.pointBuff.copy(result[0].point)
    this.normalBuff.copy(result[0].face.normal)
    if (this._options.vertexSnap) {
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
    this.renderer.resetPipeline(
      /* Because of the camera controller library*/ this.renderer.camera.type ===
        'OrthographicCamera'
    )
    this.frameLock = true
  }

  private onPointerClick(data) {
    if (!this._enabled) return

    if (data.event.button === 2) {
      this.cancelMeasurement()
      return
    }

    if (!this.measurement) return

    if (this.measurement.state === MeasurementState.DANGLING_START)
      this.measurement.state = MeasurementState.DANGLING_END
    else if (this.measurement.state === MeasurementState.DANGLING_END) {
      this.finishMeasurement()
    }
  }

  private onPointerDoubleClick(data) {
    if (this._options.type === MeasurementType.PERPENDICULAR) {
      this.autoLazerMeasure(data)
      return
    }
  }

  private autoLazerMeasure(data) {
    if (!this.measurement) return

    this.measurement.state = MeasurementState.DANGLING_START
    let result =
      (this.renderer.intersections.intersect(
        this.renderer.scene,
        this.renderer.camera,
        data,
        true,
        this.renderer.currentSectionBox,
        [ObjectLayers.STREAM_CONTENT_MESH]
      ) as ExtendedIntersection[]) || []

    result = result.filter((value) => {
      const material = (value.object as unknown as SpeckleMesh).getBatchObjectMaterial(
        value.batchObject
      )
      return !(material instanceof SpeckleGhostMaterial) && material.visible
    })

    if (!result.length) return

    const startPoint = new Vector3().copy(result[0].point)
    const startNormal = new Vector3().copy(result[0].face.normal)

    const offsetPoint = new Vector3()
      .copy(startPoint)
      .add(new Vector3().copy(startNormal).multiplyScalar(0.000001))
    let perpResult =
      (this.renderer.intersections.intersectRay(
        this.renderer.scene,
        this.renderer.camera,
        new Ray(offsetPoint, startNormal),
        true,
        this.renderer.currentSectionBox,
        [ObjectLayers.STREAM_CONTENT_MESH]
      ) as ExtendedIntersection[]) || []

    perpResult = perpResult.filter((value) => {
      const material = (value.object as unknown as SpeckleMesh).getBatchObjectMaterial(
        value.batchObject
      )
      return !(material instanceof SpeckleGhostMaterial) && material.visible
    })

    if (!perpResult.length) {
      this.flashMeasurement()
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

  private startMeasurement() {
    if (this._options.type === MeasurementType.PERPENDICULAR)
      this.measurement = new PerpendicularMeasurement()
    else if (this._options.type === MeasurementType.POINTTOPOINT)
      this.measurement = new PointToPointMeasurement()

    this.measurement.state = MeasurementState.DANGLING_START
    this.measurement.frameUpdate(
      this.renderer.camera,
      this.screenBuff0,
      this.renderer.sceneBox
    )
    this.renderer.scene.add(this.measurement)
  }

  private cancelMeasurement() {
    this.renderer.scene.remove(this.measurement)
    this.measurement = null
    this.renderer.needsRender = true
    this.renderer.resetPipeline()
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

  private flashMeasurement() {
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
  }

  public pickMeasurement(data): Measurement {
    this.measurements.forEach((value) => {
      value.highlight(false)
    })
    this.raycaster.setFromCamera(data, this.renderer.camera)
    const res = this.raycaster.intersectObjects(this.measurements, false)
    return res[0]?.object as Measurement
  }

  public selectMeasurement(measurement: Measurement, value: boolean) {
    this.cancelMeasurement()
    measurement.highlight(value)
    this.selectedMeasurement = measurement
  }

  public removeMeasurement() {
    if (this.selectedMeasurement) {
      this.measurements.splice(this.measurements.indexOf(this.selectedMeasurement), 1)
      this.renderer.scene.remove(this.selectedMeasurement)
      this.selectedMeasurement = null
      this.renderer.needsRender = true
      this.renderer.resetPipeline()
    } else {
      this.cancelMeasurement()
    }
  }

  private applyOptions() {
    const all = [this.measurement, ...this.measurements]
    all.forEach((value) => {
      if (value) {
        value.units = this._options.units
        value.precision = this._options.precision
        value.update()
      }
    })
    this.renderer.needsRender = true
    this.renderer.resetPipeline()
  }
}
