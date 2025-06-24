import { Box3, Matrix4 } from 'three'
import { BatchObject, Vector3Like } from './BatchObject.js'
import { NodeRenderView } from '../tree/NodeRenderView.js'

export class TextBatchObject extends BatchObject {
  public textTransform: Matrix4 = new Matrix4()

  public constructor(renderView: NodeRenderView, batchIndex: number) {
    super(renderView, batchIndex)
    if (renderView.renderData.geometry.bakeTransform)
      this.textTransform.copy(renderView.renderData.geometry.bakeTransform)
    this.transform.copy(this.textTransform)
    this.transformInv.copy(new Matrix4().copy(this.textTransform).invert())
    this.transformDirty = false
  }

  public get aabb(): Box3 {
    return this._accelerationStructure.getBoundingBox(new Box3())
  }

  public transformTRS(
    translation: Vector3Like,
    euler: Vector3Like,
    scale: Vector3Like,
    pivot: Vector3Like
  ) {
    super.transformTRS(translation, euler, scale, pivot)
    this.transform.multiply(this.textTransform)
    this.transformInv.copy(this.transform)
    this.transformInv.invert()
  }
}
