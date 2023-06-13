import SpeckleRenderer, { ObjectLayers } from '../SpeckleRenderer'

import { ViewerEvent } from '../../IViewer'
import { Measurement, MeasurementState } from './Measurement'
import { Ray, Raycaster, Vector3 } from 'three'

export class Measurements {
  private renderer: SpeckleRenderer = null
  private measurements: Measurement[] = []
  private measurement: Measurement = null
  private selectedMeasurement: Measurement = null
  private raycaster: Raycaster = null
  private frameLock = false

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
    if (this.measurement) this.measurement.frameUpdate(this.renderer.camera)
  }

  private onPointerMove(data) {
    if (!data.event.ctrlKey) return

    if (this.frameLock) {
      return
    }

    const result = this.renderer.intersections.intersect(
      this.renderer.scene,
      this.renderer.camera,
      data,
      true,
      undefined,
      [ObjectLayers.STREAM_CONTENT_MESH]
    )
    if (!result || !result.length) return

    if (!this.measurement) {
      this.measurement = new Measurement()
      this.measurement.state = MeasurementState.DANGLING_START
      this.renderer.scene.add(this.measurement)
    }
    this.measurement.isVisible = true

    if (this.measurement.state === MeasurementState.DANGLING_START) {
      this.measurement.startPoint.copy(result[0].point)
      this.measurement.startNormal.copy(result[0].face.normal)
    } else if (this.measurement.state === MeasurementState.DANGLING_END) {
      this.measurement.endPoint.copy(result[0].point)
      this.measurement.endNormal.copy(result[0].face.normal)
    }
    this.measurement.update()

    this.renderer.needsRender = true
    this.renderer.resetPipeline()
    this.frameLock = true
  }

  private onPointerClick(data) {
    if (!data.event.ctrlKey) return

    if (data.event.shiftKey) {
      this.autoMeasure(data)
      return
    }

    if (this.measurement.state === MeasurementState.DANGLING_START)
      this.measurement.state = MeasurementState.DANGLING_END
    else if (this.measurement.state === MeasurementState.DANGLING_END) {
      this.measurement.state = MeasurementState.COMPLETE
      this.measurement.update()
      this.measurements.push(this.measurement)
      this.measurement = null
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
    if (data.code === 'ControlLeft') {
      if (
        this.measurement &&
        this.measurement.state === MeasurementState.DANGLING_START
      ) {
        this.measurement.isVisible = false
      }
    }
  }

  private autoMeasure(data) {
    if (this.measurement.state === MeasurementState.DANGLING_START) {
      const result = this.renderer.intersections.intersect(
        this.renderer.scene,
        this.renderer.camera,
        data,
        true,
        undefined,
        [ObjectLayers.STREAM_CONTENT_MESH]
      )
      if (!result || !result.length) return

      const startPoint = new Vector3().copy(result[0].point)
      const startNormal = new Vector3().copy(result[0].face.normal)

      const perpResult = this.renderer.intersections.intersectRay(
        this.renderer.scene,
        this.renderer.camera,
        new Ray(startPoint, startNormal),
        true,
        undefined,
        [ObjectLayers.STREAM_CONTENT_MESH]
      )
      if (!perpResult || !perpResult.length) return

      this.measurement.startPoint.copy(startPoint)
      this.measurement.startNormal.copy(startNormal)
      this.measurement.endPoint.copy(perpResult[0].point)
      this.measurement.endNormal.copy(perpResult[0].face.normal)
      this.measurement.state = MeasurementState.DANGLING_END
      this.measurement.update()
      this.measurement.state = MeasurementState.COMPLETE
      this.measurement.update()
      this.measurements.push(this.measurement)
      this.measurement = null
    }
  }

  public pickMeasurement(data): Measurement {
    this.measurements.forEach((value) => {
      value.highlight(false)
    })
    this.raycaster.setFromCamera(data, this.renderer.camera)
    const res = this.raycaster.intersectObjects(this.measurements, false)
    return res[0]?.object as Measurement
  }

  public highlightMeasurement(measurement: Measurement, value: boolean) {
    measurement.highlight(value)
    this.selectedMeasurement = measurement
  }
}
