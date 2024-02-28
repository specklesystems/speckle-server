import SpeckleRenderer from '../../SpeckleRenderer'

import { IViewer, ObjectLayers } from '../../../IViewer'
import { PerpendicularMeasurement } from './PerpendicularMeasurement'
import { Plane, Ray, Raycaster, Vector2, Vector3 } from 'three'
import { PointToPointMeasurement } from './PointToPointMeasurement'
import { Measurement, MeasurementState } from './Measurement'
import { ExtendedIntersection } from '../../objects/SpeckleRaycaster'
import Logger from 'js-logger'
import SpeckleMesh from '../../objects/SpeckleMesh'
import SpeckleGhostMaterial from '../../materials/SpeckleGhostMaterial'
import { Extension } from '../core-extensions/Extension'
import { InputEvent } from '../../input/Input'
import { ICameraProvider } from '../core-extensions/Providers'

export enum MeasurementType {
  PERPENDICULAR,
  POINTTOPOINT
}

export interface MeasurementOptions {
  visible: boolean
  type?: MeasurementType
  vertexSnap?: boolean
  units?: string
  precision?: number
}

const DefaultMeasurementsOptions = {
  visible: true,
  type: MeasurementType.POINTTOPOINT,
  vertexSnap: true,
  units: 'm',
  precision: 2
}

export class MeasurementsExtension extends Extension {
  public get inject() {
    return [ICameraProvider.Symbol]
  }

  protected renderer: SpeckleRenderer = null

  protected measurements: Measurement[] = []
  protected measurement: Measurement = null
  protected selectedMeasurement: Measurement = null
  protected raycaster: Raycaster = null
  protected _options: MeasurementOptions = Object.assign({}, DefaultMeasurementsOptions)

  private _frameLock = false
  private _enabled = false
  private _paused = false
  private _sceneHit = false

  private pointBuff: Vector3 = new Vector3()
  private normalBuff: Vector3 = new Vector3()
  private screenBuff0: Vector2 = new Vector2()
  private screenBuff1: Vector2 = new Vector2()

  public get enabled(): boolean {
    return this._enabled
  }

  public get visible(): boolean {
    return this._options.visible
  }

  public set enabled(value: boolean) {
    this._enabled = value
    if (this.measurement) {
      this.measurement.isVisible = value
      this.measurement.update()
      if (!value) this.cancelMeasurement()
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

  public constructor(viewer: IViewer, protected cameraProvider: ICameraProvider) {
    super(viewer)
    this.renderer = viewer.getRenderer()
    this.raycaster = new Raycaster()
    this.raycaster.layers.enable(ObjectLayers.MEASUREMENTS)

    this.renderer.input.on(InputEvent.PointerMove, this.onPointerMove.bind(this))
    this.renderer.input.on(InputEvent.Click, this.onPointerClick.bind(this))
    this.renderer.input.on(InputEvent.DoubleClick, this.onPointerDoubleClick.bind(this))
  }

  public onLateUpdate(deltaTime: number) {
    deltaTime
    if (!this._enabled) return

    this._frameLock = false

    if (this.measurement)
      this.measurement.frameUpdate(
        this.renderer.renderingCamera,
        this.screenBuff0,
        this.renderer.sceneBox
      )
    this.measurements.forEach((value: Measurement) => {
      value.frameUpdate(
        this.renderer.renderingCamera,
        this.screenBuff0,
        this.renderer.sceneBox
      )
    })
  }

  public onResize() {
    this.renderer.renderer.getDrawingBufferSize(this.screenBuff0)
  }

  protected onPointerMove(data) {
    if (!this._enabled || this._paused) return

    if (this._frameLock) {
      return
    }

    let result =
      (this.renderer.intersections.intersect(
        this.renderer.scene,
        this.renderer.renderingCamera,
        data,
        true,
        this.renderer.clippingVolume,
        [ObjectLayers.STREAM_CONTENT_MESH]
      ) as ExtendedIntersection[]) || []

    result = result.filter((value: ExtendedIntersection) => {
      const material = (value.object as unknown as SpeckleMesh).getBatchObjectMaterial(
        value.batchObject
      )
      return !(material instanceof SpeckleGhostMaterial) && material.visible
    })

    if (!result.length) {
      this._sceneHit = false
      return
    }

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
    this.renderer.resetPipeline()
    this._frameLock = true
    this._sceneHit = true
  }

  protected onPointerClick(data) {
    if (!this._enabled) return

    const measurement = this.pickMeasurement(data)
    if (measurement) {
      this.selectMeasurement(measurement, true)
      return
    }

    if (data.event.button === 2) {
      this.cancelMeasurement()
      return
    }

    if (!this.measurement) return

    if (!this._sceneHit) return

    if (this.measurement.state === MeasurementState.DANGLING_START)
      this.measurement.state = MeasurementState.DANGLING_END
    else if (this.measurement.state === MeasurementState.DANGLING_END) {
      this.finishMeasurement()
    }
  }

  protected onPointerDoubleClick(data) {
    const measurement = this.pickMeasurement(data)
    if (measurement) {
      this.cameraProvider.setCameraView(measurement.bounds, true)
      return
    }
    if (this._options.type === MeasurementType.PERPENDICULAR) {
      this.autoLazerMeasure(data)
      return
    }
  }

  protected autoLazerMeasure(data) {
    if (!this.measurement) return

    this.measurement.state = MeasurementState.DANGLING_START
    let result =
      (this.renderer.intersections.intersect(
        this.renderer.scene,
        this.renderer.renderingCamera,
        data,
        true,
        this.renderer.clippingVolume,
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
        this.renderer.renderingCamera,
        new Ray(offsetPoint, startNormal),
        true,
        this.renderer.clippingVolume,
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

  protected startMeasurement() {
    if (this._options.type === MeasurementType.PERPENDICULAR)
      this.measurement = new PerpendicularMeasurement()
    else if (this._options.type === MeasurementType.POINTTOPOINT)
      this.measurement = new PointToPointMeasurement()

    this.measurement.state = MeasurementState.DANGLING_START
    this.measurement.frameUpdate(
      this.renderer.renderingCamera,
      this.screenBuff0,
      this.renderer.sceneBox
    )
    this.renderer.scene.add(this.measurement)
  }

  protected cancelMeasurement() {
    this.renderer.scene.remove(this.measurement)
    this.measurement = null
    this.renderer.needsRender = true
    this.renderer.resetPipeline()
  }

  protected finishMeasurement() {
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

  public clearMeasurements() {
    this.removeMeasurement()
    this.measurements.forEach((measurement: Measurement) => {
      this.renderer.scene.remove(measurement)
    })
    this.measurements = []
    this.viewer.requestRender()
  }

  protected flashMeasurement() {
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

  protected pickMeasurement(data): Measurement {
    this.measurements.forEach((value) => {
      value.highlight(false)
    })
    this.raycaster.setFromCamera(data, this.renderer.renderingCamera)
    const res = this.raycaster.intersectObjects(this.measurements, false)
    return res[0]?.object as Measurement
  }

  protected selectMeasurement(measurement: Measurement, value: boolean) {
    this.cancelMeasurement()
    measurement.highlight(value)
    this.selectedMeasurement = measurement
  }

  protected snap(
    intersection: ExtendedIntersection,
    outPoint: Vector3,
    outNormal: Vector3
  ) {
    const v0 = intersection.batchObject.accelerationStructure
      .getVertexAtIndex(intersection.face.a)
      .project(this.renderer.renderingCamera)
    const v1 = intersection.batchObject.accelerationStructure
      .getVertexAtIndex(intersection.face.b)
      .project(this.renderer.renderingCamera)
    const v2 = intersection.batchObject.accelerationStructure
      .getVertexAtIndex(intersection.face.c)
      .project(this.renderer.renderingCamera)

    const projectedIntersection = intersection.point.project(
      this.renderer.renderingCamera
    )
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
    const unprojectedPoint = tri[0].unproject(this.renderer.renderingCamera)
    if (this.screenBuff0.distanceTo(this.screenBuff1) < 10 * window.devicePixelRatio) {
      outPoint.copy(unprojectedPoint)
      outNormal.copy(intersection.face.normal)
    }
  }

  protected updateClippingPlanes(planes: Plane[]) {
    this.measurements.forEach((value) => {
      value.updateClippingPlanes(planes)
    })
  }

  protected applyOptions() {
    const all = [this.measurement, ...this.measurements]
    all.forEach((value) => {
      if (value) {
        value.units = this._options.units
        value.precision = this._options.precision
        value.update()
      }
    })
    this.viewer
      .getRenderer()
      .enableLayers([ObjectLayers.MEASUREMENTS], this._options.visible)

    if (this._options.visible) this.raycaster.layers.enable(ObjectLayers.MEASUREMENTS)
    else this.raycaster.layers.disable(ObjectLayers.MEASUREMENTS)

    this.renderer.needsRender = true
    this.renderer.resetPipeline()
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
}
