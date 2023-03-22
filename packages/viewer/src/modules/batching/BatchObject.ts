import { Box3, Matrix4, Vector3 } from 'three'
import { SpeckleMeshBVH } from '../objects/SpeckleMeshBVH'
import { NodeRenderView } from '../tree/NodeRenderView'

export class BatchObject {
  private _renderView: NodeRenderView
  private _bvh: SpeckleMeshBVH
  private _batchIndex: number
  public transform: Matrix4
  public transformInv: Matrix4

  public get renderView(): NodeRenderView {
    return this._renderView
  }

  public get bvh(): SpeckleMeshBVH {
    return this._bvh
  }

  public get batchIndex(): number {
    return this._batchIndex
  }

  public constructor(renderView: NodeRenderView, batchIndex: number) {
    this._renderView = renderView
    this._batchIndex = batchIndex
    this.transform = new Matrix4().identity()
    this.transformInv = new Matrix4().identity()
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
    this._bvh.outputTransform = this.transform
  }
}
