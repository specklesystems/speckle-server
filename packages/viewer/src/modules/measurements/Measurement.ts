import { Box3, Camera, Matrix4, Object3D, Quaternion, Vector3, Vector4 } from 'three'
import { MeasurementPointGizmo } from './MeasurementPointGizmo'
import { ObjectLayers } from '../SpeckleRenderer'

export enum MeasurementState {
  HIDDEN,
  DANGLING_START,
  DANGLING_END,
  COMPLETE
}

export class Measurement extends Object3D {
  public startPoint: Vector3 = new Vector3()
  public endPoint: Vector3 = new Vector3()
  public startNormal: Vector3 = new Vector3()
  public endNormal: Vector3 = new Vector3()
  public startLineLength: number
  public endLineLength: number
  public value = 0

  private startGizmo: MeasurementPointGizmo = null
  private endGizmo: MeasurementPointGizmo = null

  private _state: MeasurementState = MeasurementState.HIDDEN

  private vecBuff0: Vector3 = new Vector3()
  private vecBuff1: Vector3 = new Vector3()
  private vecBuff2: Vector3 = new Vector3()
  private vecBuff3: Vector3 = new Vector3()
  private vecBuff4: Vector3 = new Vector3()
  private matBuff: Matrix4 = new Matrix4()

  public set state(value: MeasurementState) {
    this._state = value
  }

  public get state() {
    return this._state
  }

  public set isVisible(value: boolean) {
    this.startGizmo.enable(value, value, value, value)
    this.endGizmo.enable(value, value, value, value)
  }

  public constructor() {
    super()
    this.type = 'Measurement'
    this.startGizmo = new MeasurementPointGizmo()
    this.endGizmo = new MeasurementPointGizmo({ dashedLine: true, lineOpacity: 0.25 })
    this.startLineLength = 0.25
    this.add(this.startGizmo)
    this.add(this.endGizmo)
    this.layers.set(ObjectLayers.MEASUREMENTS)
  }

  public frameUpdate(camera: Camera, bounds: Box3) {
    this.startGizmo.frameUpdate(camera, bounds)
    this.endGizmo.frameUpdate(camera, bounds)

    // const intersectPoint = this.vecBuff0
    //   .copy(this.startPoint)
    //   .add(this.vecBuff1.copy(this.startNormal).multiplyScalar(this.startLineLength))
    // const view = new Matrix4().copy(camera.matrixWorldInverse)
    // const invView = new Matrix4().copy(view).invert()
    // const lineDir = new Vector3().copy(intersectPoint).sub(this.startPoint).normalize()
    // const lineDirCS4 = new Vector4(lineDir.x, lineDir.y, lineDir.z, 0)
    //   .applyMatrix4(view)
    //   .normalize()
    // const rightCS4 = new Vector4(0, 0, 1, 0).applyMatrix4(view).normalize()

    // const lineDirCS = new Vector3(lineDirCS4.x, lineDirCS4.y, lineDirCS4.z)
    // const rightCS = new Vector3(rightCS4.x, rightCS4.y, rightCS4.z)

    // const upCS = new Vector3().crossVectors(rightCS, lineDirCS).normalize()
    // const forwardCS = new Vector3().crossVectors(lineDirCS, upCS).normalize()

    // const basisCS = new Matrix4().makeBasis(lineDirCS, upCS, forwardCS)
    // basisCS.premultiply(invView)

    // const textPos = this.vecBuff0
    //   .copy(this.startPoint)
    //   .add(
    //     this.vecBuff1.copy(this.startNormal).multiplyScalar(this.startLineLength * 0.5)
    //   )
    // basisCS.setPosition(textPos)
    // const textValue = intersectPoint.distanceTo(this.startPoint)
    // this.startGizmo.updateText(textValue, basisCS)
    // console.log(basisCS)
  }

  public update(camera: Camera) {
    this.startGizmo.updateDisc(this.startPoint, this.startNormal)
    this.startGizmo.updatePoint(this.startPoint)
    this.endGizmo.updateDisc(this.endPoint, this.endNormal)

    if (this._state === MeasurementState.DANGLING_START) {
      const startLine0 = this.vecBuff0.copy(this.startPoint)
      const startLine1 = this.vecBuff1
        .copy(this.startPoint)
        .add(this.vecBuff2.copy(this.startNormal).multiplyScalar(this.startLineLength))
      this.startGizmo.updateLine([startLine0, startLine1])
    }

    if (this._state === MeasurementState.DANGLING_END) {
      const startEndDist = this.startPoint.distanceTo(this.endPoint)
      const endStartDir = this.vecBuff0
        .copy(this.startPoint)
        .sub(this.endPoint)
        .normalize()
      const angle = Math.acos(this.startNormal.dot(endStartDir))
      this.startLineLength = Math.abs(startEndDist * Math.cos(angle))

      const intersectPoint = this.vecBuff0
        .copy(this.startPoint)
        .add(this.vecBuff1.copy(this.startNormal).multiplyScalar(this.startLineLength))
      const endLineNormal = this.vecBuff1
        .copy(intersectPoint)
        .sub(this.endPoint)
        .normalize()

      this.endLineLength = intersectPoint.distanceTo(this.endPoint)

      const angle1 = Math.acos(this.endNormal.dot(endLineNormal))
      const dist1 = this.endLineLength * Math.cos(angle1)

      const endLine3 = this.vecBuff1
        .copy(this.endPoint)
        .add(this.vecBuff2.copy(this.endNormal).multiplyScalar(dist1))

      const startLine0 = this.vecBuff2.copy(this.startPoint)
      const startLine1 = this.vecBuff3
        .copy(this.startPoint)
        .add(this.vecBuff4.copy(this.startNormal).multiplyScalar(this.startLineLength))
      this.startGizmo.updateLine([startLine0, startLine1])

      const endLine0 = this.vecBuff3.copy(this.endPoint)

      this.endGizmo.updateLine([
        endLine0,
        endLine3,
        endLine3,
        intersectPoint,
        intersectPoint,
        endLine0
      ])
      this.endGizmo.updatePoint(intersectPoint)

      const view = new Matrix4().copy(camera.matrixWorldInverse)
      const invView = new Matrix4().copy(view).invert()
      const lineDir = new Vector3()
        .copy(intersectPoint)
        .sub(this.startPoint)
        .normalize()
      const lineDirCS4 = new Vector4(lineDir.x, lineDir.y, lineDir.z, 0)
        .applyMatrix4(view)
        .normalize()
      const sign = Math.sign(
        new Vector3(0, 0, -1)
          .applyQuaternion(camera.quaternion)
          .dot(new Vector3(1, 0, 0))
      )

      const rightCS4 = new Vector4(-sign, 0, 0, 0).applyMatrix4(view).normalize()
      // console.log(lineDirCS4)
      const lineDirCS = new Vector3(lineDirCS4.x, lineDirCS4.y, lineDirCS4.z)
      // if (lineDirCS.x < 0) {
      //   lineDirCS
      //     .applyMatrix4(invView)
      //     .applyQuaternion(
      //       new Quaternion().setFromEuler(new Euler(0, Math.PI, 0), true)
      //     )
      //     .applyMatrix4(view)
      //     .normalize()
      // }
      const rightCS = new Vector3(rightCS4.x, rightCS4.y, rightCS4.z)

      const upCS = new Vector3().crossVectors(rightCS, lineDirCS).normalize()
      const forwardCS = new Vector3().crossVectors(lineDirCS, upCS).normalize()

      const basisCS = new Matrix4().makeBasis(lineDirCS, upCS, forwardCS)
      basisCS.premultiply(invView)

      const textPos = this.vecBuff0
        .copy(this.startPoint)
        .add(
          this.vecBuff1
            .copy(this.startNormal)
            .multiplyScalar(this.startLineLength * 0.5)
        )

      const textValue = intersectPoint.distanceTo(this.startPoint)
      this.startGizmo.updateText(
        textValue,
        textPos,
        new Quaternion().setFromRotationMatrix(basisCS)
      )
    }
    if (this._state === MeasurementState.COMPLETE) {
      this.startGizmo.enable(false, true, true, true)
      this.endGizmo.enable(false, false, true, false)
    }
  }

  public raycast(raycaster, intersects) {
    const results = []
    this.startGizmo.raycast(raycaster, results)
    this.endGizmo.raycast(raycaster, results)
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
    this.startGizmo.highlight = value
    this.endGizmo.highlight = value
  }
}
