/* eslint-disable camelcase */
import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { SpeckleMeshBVH } from '../objects/SpeckleMeshBVH'
import { NodeRenderView } from '../tree/NodeRenderView'
import { Geometry } from '../converter/Geometry'

type VectorLike = { x: number; y: number; z?: number; w?: number }

export class BatchObject {
  private _renderView: NodeRenderView
  private _bvh: SpeckleMeshBVH
  private _batchIndex: number
  private _localOrigin: Vector3
  public transform: Matrix4
  public transformInv: Matrix4

  public tasVertIndexStart: number
  public tasVertIndexEnd: number

  public quaternion: Quaternion = new Quaternion()
  public pivot_High: Vector3 = new Vector3()
  public pivot_Low: Vector3 = new Vector3()
  public translation: Vector3 = new Vector3()
  public scale: Vector3 = new Vector3(1, 1, 1)

  private static matBuff0: Matrix4 = new Matrix4()
  private static matBuff1: Matrix4 = new Matrix4()
  private static matBuff2: Matrix4 = new Matrix4()
  private static eulerBuff: Euler = new Euler()
  private static translationBuff: Vector3 = new Vector3()
  private static scaleBuff: Vector3 = new Vector3()
  private static pivotBuff: Vector3 = new Vector3()

  public get renderView(): NodeRenderView {
    return this._renderView
  }

  public get bvh(): SpeckleMeshBVH {
    return this._bvh
  }

  public get batchIndex(): number {
    return this._batchIndex
  }

  public get speckleId(): string {
    return this._renderView.renderData.id
  }

  public constructor(renderView: NodeRenderView, batchIndex: number) {
    this._renderView = renderView
    this._batchIndex = batchIndex
    this.transform = new Matrix4().identity()
    this.transformInv = new Matrix4().identity()

    this._localOrigin = this._renderView.aabb.getCenter(new Vector3())
    Geometry.DoubleToHighLowVector(
      new Vector3(this._localOrigin.x, this._localOrigin.y, this._localOrigin.z),
      this.pivot_Low,
      this.pivot_High
    )
  }

  public buildBVH() {
    const transform = new Matrix4().makeTranslation(
      this._localOrigin.x,
      this._localOrigin.y,
      this._localOrigin.z
    )
    transform.invert()

    const indices = this._renderView.renderData.geometry.attributes.INDEX
    const position = this._renderView.renderData.geometry.attributes.POSITION

    const localPositions = new Float32Array(position.length)
    const vecBuff = new Vector3()
    for (let k = 0; k < position.length; k += 3) {
      vecBuff.set(position[k], position[k + 1], position[k + 2])
      vecBuff.applyMatrix4(transform)
      localPositions[k] = vecBuff.x
      localPositions[k + 1] = vecBuff.y
      localPositions[k + 2] = vecBuff.z
    }

    this._bvh = SpeckleMeshBVH.buildBVH(indices, localPositions)
    this._bvh.inputTransform = this.transformInv
    this._bvh.outputTransform = this.transform
    this._bvh.inputOriginTransform = new Matrix4().copy(transform)
    this._bvh.outputOriginTransfom = new Matrix4().copy(transform).invert()
  }

  public transformTRS(
    translation: VectorLike,
    euler: VectorLike,
    scale: VectorLike,
    pivot: VectorLike
  ) {
    let T: Matrix4 = BatchObject.matBuff0.identity()
    let R: Matrix4 = BatchObject.matBuff1.identity()
    let S: Matrix4 = BatchObject.matBuff2.identity()
    BatchObject.eulerBuff.set(0, 0, 0, 'XYZ')
    BatchObject.translationBuff.set(0, 0, 0)
    BatchObject.scaleBuff.set(1, 1, 1)
    BatchObject.pivotBuff.copy(this._localOrigin)

    if (translation) {
      T = BatchObject.matBuff0.makeTranslation(
        translation.x,
        translation.y,
        translation.z
      )
      BatchObject.translationBuff.set(translation.x, translation.y, translation.z)
    }

    if (euler) {
      BatchObject.eulerBuff.set(euler.x, euler.y, euler.z, 'XYZ')
      R = BatchObject.matBuff1.makeRotationFromEuler(BatchObject.eulerBuff)
      this.quaternion.setFromEuler(BatchObject.eulerBuff)
    }

    if (scale) {
      S = BatchObject.matBuff2.makeScale(scale.x, scale.y, scale.z)
      BatchObject.scaleBuff.set(scale.x, scale.y, scale.z)
    }

    if (pivot) {
      BatchObject.pivotBuff.set(pivot.x, pivot.y, pivot.z)
    }

    this.transform.identity()
    this.transform.multiply(R)
    this.transform.multiply(S)
    this.transform.premultiply(T)

    this.transformInv.copy(this.transform)
    this.transformInv.invert()

    this.translation.copy(BatchObject.translationBuff)
    this.quaternion.setFromEuler(BatchObject.eulerBuff)
    this.scale.copy(BatchObject.scaleBuff)

    Geometry.DoubleToHighLowVector(
      BatchObject.pivotBuff,
      this.pivot_Low,
      this.pivot_High
    )
  }
}
