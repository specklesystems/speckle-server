import SpeckleRenderer, { ObjectLayers } from '../SpeckleRenderer'

import { ViewerEvent } from '../../IViewer'
import { Measurement, MeasurementState } from './Measurement'
import { Ray, Vector3 } from 'three'

export class Measurements {
  private renderer: SpeckleRenderer = null
  private measurement: Measurement = null
  private clickTimeout

  public constructor(renderer: SpeckleRenderer) {
    this.renderer = renderer
    this.renderer.input.on('pointer-move', this.onPointerMove.bind(this))
    this.renderer.input.on(ViewerEvent.ObjectClicked, this.onPointerClick.bind(this))
    this.renderer.input.on(
      ViewerEvent.ObjectDoubleClicked,
      this.onPointerDoubleClick.bind(this)
    )
  }

  private onPointerMove(data) {
    if (!data.event.ctrlKey) return

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
      this.renderer.scene.add(this.measurement.startGizmo)
      this.renderer.scene.add(this.measurement.endGizmo)
    }

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
  }

  private onPointerClick(data) {
    if (!data.event.ctrlKey) return
    this.clickTimeout = setTimeout(() => {
      if (this.measurement.state === MeasurementState.DANGLING_START)
        this.measurement.state = MeasurementState.DANGLING_END
      else if (this.measurement.state === MeasurementState.DANGLING_END) {
        this.measurement.state = MeasurementState.COMPLETE
        this.measurement.update()
        this.measurement = null
      }
    }, 300)
  }

  private onPointerDoubleClick(data) {
    if (!data.event.ctrlKey) return
    clearTimeout(this.clickTimeout)

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
      this.measurement = null
    }
  }
}
