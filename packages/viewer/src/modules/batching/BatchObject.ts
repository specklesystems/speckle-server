/* eslint-disable camelcase */
import { Box3, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { SpeckleMeshBVH } from '../objects/SpeckleMeshBVH'
import { NodeRenderView } from '../tree/NodeRenderView'
import { Geometry } from '../converter/Geometry'

type VectorLike = { x: number; y: number; z?: number; w?: number }

export class BatchObject {
  private _renderView: NodeRenderView
  private _bvh: SpeckleMeshBVH
  private _batchIndex: number
  public bounds: Box3
  public transform: Matrix4
  public transformInv: Matrix4
  public quaternion: Quaternion = new Quaternion()
  public pivot_High: Vector3 = new Vector3()
  public pivot_Low: Vector3 = new Vector3()
  public translation: Vector3 = new Vector3()
  public scale: Vector3 = new Vector3(1, 1, 1)

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
    this.bounds = new Box3()
    this.transform = new Matrix4().identity()
    this.transformInv = new Matrix4().identity()
  }

  public buildBVH(bounds: Box3) {
    const rvCenter = this._renderView.aabb.getCenter(new Vector3())
    // console.log(boundsCenter, rvCenter)
    const transform = new Matrix4().makeTranslation(rvCenter.x, rvCenter.y, rvCenter.z)
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
    this.bounds.copy(bounds)
    this._bvh.inputTransform = this.transformInv
    this._bvh.outputTransform = this.transform
    this._bvh.inputOriginTransform = new Matrix4().copy(transform)
    this._bvh.outputOriginTransfom = new Matrix4().copy(transform).invert()
  }

  public transformTRS(
    position: VectorLike,
    euler: VectorLike,
    scale: VectorLike,
    origin: VectorLike
  ) {
    const TOrigin = new Matrix4().makeTranslation(origin.x, origin.y, origin.z)
    const center = this.bounds.getCenter(new Vector3())
    const centerT = new Matrix4().makeTranslation(center.x, center.y, center.z)
    centerT.invert()
    centerT.multiply(TOrigin)

    const T = new Matrix4().makeTranslation(position.x, position.y, position.z)
    const R = new Matrix4().makeRotationFromEuler(
      new Euler(euler.x, euler.y, euler.z, 'XYZ')
    )
    const S = new Matrix4().makeScale(scale.x, scale.y, scale.z)
    this.transform.identity()
    // this.transform.multiply(centerT)
    this.transform.multiply(R)
    this.transform.multiply(S)
    // this.transform.multiply(centerTInv)
    this.transform.premultiply(T)

    this.transformInv.copy(this.transform)
    this.transformInv.invert()

    this.quaternion = new Quaternion().setFromEuler(
      new Euler(euler.x, euler.y, euler.z, 'XYZ')
    )
    Geometry.DoubleToHighLowVector(
      new Vector3(origin.x, origin.y, origin.z),
      this.pivot_Low,
      this.pivot_High
    )
    this.translation.set(position.x, position.y, position.z)
    this.scale.set(scale.x, scale.y, scale.z)
  }
}
