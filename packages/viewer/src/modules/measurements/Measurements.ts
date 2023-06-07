import { Vector3 } from 'three'
import SpeckleRenderer, { ObjectLayers } from '../SpeckleRenderer'

import { ViewerEvent } from '../../IViewer'
import { Measurement, MeasurementState } from './Measurement'

export class Measurements {
  private renderer: SpeckleRenderer = null
  private measurement: Measurement = null

  public constructor(renderer: SpeckleRenderer) {
    this.renderer = renderer
    this.renderer.input.on('pointer-move', this.onPointerMove.bind(this))
    this.renderer.input.on(ViewerEvent.ObjectClicked, this.onPointerClick.bind(this))
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

      const startEndDist = this.measurement.startPoint.distanceTo(
        this.measurement.endPoint
      )
      const endStartDir = new Vector3()
        .copy(this.measurement.startPoint)
        .sub(this.measurement.endPoint)
        .normalize()
      const angle = Math.acos(this.measurement.startNormal.dot(endStartDir))
      this.measurement.startLineLength = Math.abs(startEndDist * Math.cos(angle))

      const intersectPoint = new Vector3()
        .copy(this.measurement.startPoint)
        .add(
          new Vector3()
            .copy(this.measurement.startNormal)
            .multiplyScalar(this.measurement.startLineLength)
        )
      this.measurement.endLineNormal.copy(
        new Vector3().copy(intersectPoint).sub(this.measurement.endPoint).normalize()
      )
      this.measurement.endLineLength = intersectPoint.distanceTo(
        this.measurement.endPoint
      )
    }
    this.measurement.update()
    // let start, end
    // if (!this.setDisc) {
    //   this.circle.position.copy(result[0].point)
    //   this.circle.quaternion.setFromUnitVectors(
    //     new Vector3(0, 0, 1),
    //     result[0].face.normal
    //   )
    //   this.circle.visible = true

    //   start = result[0].point
    //   end = new Vector3()
    //     .copy(result[0].point)
    //     .add(new Vector3().copy(result[0].face.normal).multiplyScalar(0.2))
    //   this.setNormal.copy(result[0].face.normal)
    // } else {
    //   const discNDC4 = new Vector4(
    //     this.circle.position.x,
    //     this.circle.position.y,
    //     this.circle.position.z,
    //     1
    //   ).applyMatrix4(
    //     new Matrix4().multiplyMatrices(
    //       this.renderer.camera.projectionMatrix,
    //       this.renderer.camera.matrixWorldInverse
    //     )
    //   )
    //   //   discNDC4.x /= discNDC4.w
    //   //   discNDC4.y /= discNDC4.w
    //   //   discNDC4.z /= discNDC4.w

    //   const discView4 = new Vector4(
    //     this.circle.position.x,
    //     this.circle.position.y,
    //     this.circle.position.z
    //   ).applyMatrix4(this.renderer.camera.matrixWorldInverse)
    //   const discView = new Vector3(discView4.x, discView4.y, discView4.z)

    //   const mouseView4 = new Vector4(data.x, data.y, 0, 1).applyMatrix4(
    //     this.renderer.camera.projectionMatrixInverse
    //   )
    //   mouseView4.x /= mouseView4.w
    //   mouseView4.y /= mouseView4.w

    //   const mouseView = new Vector3(mouseView4.x, mouseView4.y, discView.z)
    //   console.log(discView4, mouseView4)
    //   console.log('Delta', discView.distanceTo(mouseView))
    //   start = this.circle.position
    //   end = new Vector3()
    //     .copy(start)
    //     .add(
    //       new Vector3()
    //         .copy(this.setNormal)
    //         .multiplyScalar(discView.distanceTo(mouseView))
    //     )
    // }
    // this.updateLine(start, end)

    this.renderer.needsRender = true
    this.renderer.resetPipeline()
  }

  private onPointerClick(data) {
    if (!data.event.ctrlKey) return
    this.measurement.state = MeasurementState.DANGLING_END
  }
}
