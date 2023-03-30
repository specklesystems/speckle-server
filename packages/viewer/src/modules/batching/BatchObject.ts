import { Box3, Euler, Matrix4, Vector3 } from 'three'
import { SpeckleMeshBVH } from '../objects/SpeckleMeshBVH'
import { NodeRenderView } from '../tree/NodeRenderView'

type VectorLike = { x: number; y: number; z?: number; w?: number }

export class BatchObject {
  private _renderView: NodeRenderView
  private _bvh: SpeckleMeshBVH
  private _batchIndex: number
  public transform: Matrix4
  public transformInv: Matrix4
  public bvhTransform: Matrix4

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
    this.bvhTransform = new Matrix4().identity()
  }

  public buildBVH(bounds: Box3) {
    const boundsCenter = bounds.getCenter(new Vector3())
    const transform = new Matrix4().makeTranslation(
      boundsCenter.x,
      boundsCenter.y,
      boundsCenter.z
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
    this._bvh.outputTransform = this.bvhTransform
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
    const TOriginInv = new Matrix4().copy(TOrigin).invert()

    const T = new Matrix4().makeTranslation(position.x, position.y, position.z)
    const R = new Matrix4().makeRotationFromEuler(
      new Euler(euler.x, euler.y, euler.z, 'XYZ')
    )
    const S = new Matrix4().makeScale(scale.x, scale.y, scale.z)

    this.transform.copy(
      TOriginInv.premultiply(S).premultiply(R).premultiply(TOrigin).premultiply(T)
    )

    this.bvhTransform.copy(this.transform)
    this.transformInv.copy(this.bvhTransform)
    this.transformInv.invert()

    this.transform.elements[12] *= 0.5
    this.transform.elements[13] *= 0.5
    this.transform.elements[14] *= 0.5
  }
}
