import { BatchObject, type Vector3Like } from './BatchObject.js'

import { Matrix4 } from 'three'
import { NodeRenderView } from '../tree/NodeRenderView.js'

export class InstancedBatchObject extends BatchObject {
  protected instanceTransform: Matrix4 = new Matrix4()

  public constructor(renderView: NodeRenderView, batchIndex: number) {
    super(renderView, batchIndex)
    if (renderView.renderData.geometry.transform)
      this.instanceTransform.copy(renderView.renderData.geometry.transform)
    this.transform.copy(this.instanceTransform)
    this.transformInv.copy(new Matrix4().copy(this.instanceTransform).invert())
    this.transformDirty = false
  }

  public transformTRS(
    translation: Vector3Like,
    euler: Vector3Like,
    scale: Vector3Like,
    pivot: Vector3Like
  ) {
    super.transformTRS(translation, euler, scale, pivot)
    this.transform.multiply(this.instanceTransform)
    this.transformInv.copy(this.transform)
    this.transformInv.invert()
  }
}
