import SpeckleRenderer from '../../SpeckleRenderer.js'

import { type IViewer, ObjectLayers } from '../../../IViewer.js'
import { PerpendicularMeasurement } from './PerpendicularMeasurement.js'
import { Plane, Ray, Raycaster, Vector2, Vector3 } from 'three'
import { PointToPointMeasurement } from './PointToPointMeasurement.js'
import { Measurement, MeasurementState } from './Measurement.js'
import { ExtendedMeshIntersection } from '../../objects/SpeckleRaycaster.js'
import SpeckleGhostMaterial from '../../materials/SpeckleGhostMaterial.js'
import { Extension } from '../Extension.js'
import { InputEvent } from '../../input/Input.js'
import { CameraController } from '../CameraController.js'
import Logger from '../../utils/Logger.js'

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
    return [CameraController]
  }

  protected renderer: SpeckleRenderer

  protected measurements: Measurement[] = []
  protected _activeMeasurement: Measurement | null = null
  protected _selectedMeasurement: Measurement | null = null
  protected raycaster: Raycaster
  protected _options: MeasurementOptions = Object.assign({}, DefaultMeasurementsOptions)

  private _frameLock = false
  private _paused = false
  private _sceneHit = false

  private pointBuff: Vector3 = new Vector3()
  private normalBuff: Vector3 = new Vector3()
  private screenBuff0: Vector2 = new Vector2()
  private screenBuff1: Vector2 = new Vector2()

  public get enabled(): boolean {
    return this._enabled
  }

  public set enabled(value: boolean) {
    this._enabled = value
    if (this._activeMeasurement) {
      this._activeMeasurement.isVisible = value
      this._activeMeasurement.update()
      if (!value) this.cancelMeasurement()
    }
    this.viewer.requestRender()
  }

  public get options(): MeasurementOptions {
    return this._options
  }

  public set options(options: MeasurementOptions) {
    const resetMeasurement =
      this._options.type !== options.type &&
      this._activeMeasurement &&
      this._activeMeasurement.state === MeasurementState.DANGLING_START
    Object.assign(this._options, options)
    if (resetMeasurement) {
      this.cancelMeasurement()
      this.startMeasurement()
    }
    this.applyOptions()
  }

  public get selectedMeasurement(): Measurement | null {
    return this._selectedMeasurement
  }

  public get activeMeasurement(): Measurement | null {
    return this._activeMeasurement
  }

  public constructor(viewer: IViewer, protected cameraProvider: CameraController) {
    super(viewer)
    this.renderer = viewer.getRenderer()
    this.raycaster = new Raycaster()
    this.raycaster.layers.enable(ObjectLayers.MEASUREMENTS)

    this.renderer.input.on(InputEvent.PointerMove, this.onPointerMove.bind(this))
    this.renderer.input.on(InputEvent.Click, this.onPointerClick.bind(this))
    this.renderer.input.on(InputEvent.DoubleClick, this.onPointerDoubleClick.bind(this))
  }

  public onLateUpdate() {
    if (!this._enabled) return
    const camera = this.renderer.renderingCamera
    if (!camera) return

    this._frameLock = false
    this.renderer.renderer.getDrawingBufferSize(this.screenBuff0)

    if (this._activeMeasurement)
      this._activeMeasurement.frameUpdate(
        camera,
        this.screenBuff0,
        this.renderer.sceneBox
      )
    this.measurements.forEach((value: Measurement) => {
      value.frameUpdate(camera, this.screenBuff0, this.renderer.sceneBox)
    })
  }

  public onResize() {
    this.renderer.renderer.getDrawingBufferSize(this.screenBuff0)
  }

  protected onPointerMove(data: Vector2 & { event: Event }) {
    if (!this._enabled || this._paused) return

    const camera = this.renderer.renderingCamera
    if (!camera) return

    if (this._frameLock) {
      return
    }

    let result: ExtendedMeshIntersection[] =
      this.renderer.intersections.intersect(
        this.renderer.scene,
        camera,
        data,
        ObjectLayers.STREAM_CONTENT_MESH,
        true,
        this.renderer.clippingVolume
      ) || []

    result = result.filter((value: ExtendedMeshIntersection) => {
      const material = value.object.getBatchObjectMaterial(value.batchObject)
      return material && !(material instanceof SpeckleGhostMaterial) && material.visible
    })

    if (!result.length) {
      this._sceneHit = false
      return
    }

    /** Catering to typescript
     *  There will always be an intersected face. We're casting against indexed meshes only
     */
    this.pointBuff.copy(result[0].point)
    this.normalBuff.copy(result[0].face.normal)

    if (this._options.vertexSnap) {
      this.snap(result[0], this.pointBuff, this.normalBuff)
    }

    if (!this._activeMeasurement) {
      this._activeMeasurement = this.startMeasurement()
      this._activeMeasurement.isVisible = true
    }

    if (this._activeMeasurement.state === MeasurementState.DANGLING_START) {
      this._activeMeasurement.startPoint.copy(this.pointBuff)
      this._activeMeasurement.startNormal.copy(this.normalBuff)
    } else if (this._activeMeasurement.state === MeasurementState.DANGLING_END) {
      this._activeMeasurement.endPoint.copy(this.pointBuff)
      this._activeMeasurement.endNormal.copy(this.normalBuff)
    }
    this._activeMeasurement.update()

    this.viewer.requestRender()
    this._frameLock = true
    this._sceneHit = true
    // console.log('Time -> ', performance.now() - start)
  }

  protected onPointerClick(
    data: { event: PointerEvent; multiSelect: boolean } & Vector2
  ) {
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

    if (!this._activeMeasurement) return

    if (!this._sceneHit) return

    if (this._activeMeasurement.state === MeasurementState.DANGLING_START)
      this._activeMeasurement.state = MeasurementState.DANGLING_END
    else if (this._activeMeasurement.state === MeasurementState.DANGLING_END) {
      this.finishMeasurement()
    }
  }

  protected onPointerDoubleClick(
    data: Vector2 & { event: PointerEvent; multiSelect: boolean }
  ) {
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

  protected autoLazerMeasure(data: Vector2) {
    if (!this._activeMeasurement) return
    if (!this.renderer.renderingCamera) return

    this._activeMeasurement.state = MeasurementState.DANGLING_START
    let result: ExtendedMeshIntersection[] =
      this.renderer.intersections.intersect(
        this.renderer.scene,
        this.renderer.renderingCamera,
        data,
        ObjectLayers.STREAM_CONTENT_MESH,
        true,
        this.renderer.clippingVolume
      ) || []

    result = result.filter((value) => {
      const material = value.object.getBatchObjectMaterial(value.batchObject)
      return material && !(material instanceof SpeckleGhostMaterial) && material.visible
    })

    if (!result.length) return

    const startPoint = new Vector3().copy(result[0].point)
    const startNormal = new Vector3().copy(result[0].face.normal)

    const offsetPoint = new Vector3()
      .copy(startPoint)
      .add(new Vector3().copy(startNormal).multiplyScalar(0.000001))
    let perpResult: ExtendedMeshIntersection[] =
      this.renderer.intersections.intersectRay(
        this.renderer.scene,
        this.renderer.renderingCamera,
        new Ray(offsetPoint, startNormal),
        ObjectLayers.STREAM_CONTENT_MESH,
        true,
        this.renderer.clippingVolume
      ) || []

    perpResult = perpResult.filter((value: ExtendedMeshIntersection) => {
      const material = value.object.getBatchObjectMaterial(value.batchObject)
      return material && !(material instanceof SpeckleGhostMaterial) && material.visible
    })

    if (!perpResult.length) {
      this.flashMeasurement()
      return
    }

    this._activeMeasurement.startPoint.copy(startPoint)
    this._activeMeasurement.startNormal.copy(startNormal)
    this._activeMeasurement.endPoint.copy(perpResult[0].point)
    this._activeMeasurement.endNormal.copy(perpResult[0].face.normal)
    this._activeMeasurement.state = MeasurementState.DANGLING_END
    this._activeMeasurement.update()
    this.finishMeasurement()
  }

  protected startMeasurement(): Measurement {
    let measurement: Measurement
    if (this._options.type === MeasurementType.PERPENDICULAR)
      measurement = new PerpendicularMeasurement()
    else if (this._options.type === MeasurementType.POINTTOPOINT)
      measurement = new PointToPointMeasurement()
    else throw new Error('Unsupported measurement type!')

    measurement.state = MeasurementState.DANGLING_START
    measurement.frameUpdate(
      this.renderer.renderingCamera,
      this.screenBuff0,
      this.renderer.sceneBox
    )
    this.renderer.scene.add(measurement)
    return measurement
  }

  protected cancelMeasurement() {
    if (this._activeMeasurement) this.renderer.scene.remove(this._activeMeasurement)
    this._activeMeasurement = null
    this.viewer.requestRender()
  }

  protected finishMeasurement() {
    if (!this._activeMeasurement) return

    this._activeMeasurement.state = MeasurementState.COMPLETE
    this._activeMeasurement.update()
    if (this._activeMeasurement.value > 0) {
      this.measurements.push(this._activeMeasurement)
    } else {
      this.renderer.scene.remove(this._activeMeasurement)
      Logger.error('Ignoring zero value measurement!')
    }
    this._activeMeasurement = null
  }

  public removeMeasurement() {
    if (this._selectedMeasurement) {
      this.measurements.splice(this.measurements.indexOf(this._selectedMeasurement), 1)
      this.renderer.scene.remove(this._selectedMeasurement)
      this._selectedMeasurement = null
      this.viewer.requestRender()
    } else {
      this.cancelMeasurement()
    }
  }

  public clearMeasurements(): void {
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
      if (this._activeMeasurement) {
        this._activeMeasurement.highlight(Boolean(flashCount++ % 2))
        if (flashCount >= maxFlashCount) {
          clearInterval(handle)
        }
        this.viewer.requestRender()
      }
    }, 100)
  }

  protected pickMeasurement(data: Vector2): Measurement | null {
    if (!this.renderer.renderingCamera) return null

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
    this._selectedMeasurement = measurement
  }

  protected snap(
    intersection: ExtendedMeshIntersection,
    outPoint: Vector3,
    outNormal: Vector3
  ) {
    if (!this.renderer.renderingCamera) return

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

  protected updateClippingPlanes(planes: Plane[]): void {
    this.measurements.forEach((value) => {
      value.updateClippingPlanes(planes)
    })
  }

  protected applyOptions() {
    const all = [this._activeMeasurement, ...this.measurements]
    all.forEach((value) => {
      if (value) {
        value.units =
          this._options.units !== undefined
            ? this._options.units
            : DefaultMeasurementsOptions.units
        value.precision =
          this._options.precision !== undefined
            ? this._options.precision
            : DefaultMeasurementsOptions.precision
        value.update()
      }
    })
    this.viewer
      .getRenderer()
      .enableLayers([ObjectLayers.MEASUREMENTS], this._options.visible)

    if (this._options.visible) this.raycaster.layers.enable(ObjectLayers.MEASUREMENTS)
    else this.raycaster.layers.disable(ObjectLayers.MEASUREMENTS)

    this.viewer.requestRender()
  }

  public fromMeasurementData(startPoint: Vector3, endPoint: Vector3) {
    const measurement = new PointToPointMeasurement()
    measurement.startPoint.copy(startPoint)
    measurement.endPoint.copy(endPoint)
    measurement.state = MeasurementState.DANGLING_END
    measurement.update()
    measurement.state = MeasurementState.COMPLETE
    measurement.update()
    this.measurements.push(measurement)
  }
}
