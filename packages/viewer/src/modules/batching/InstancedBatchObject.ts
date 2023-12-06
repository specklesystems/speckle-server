/* eslint-disable camelcase */
import { BatchObject, VectorLike } from './BatchObject'

import { Matrix4 } from 'three'
import { NodeRenderView } from '../tree/NodeRenderView'

export class InstancedBatchObject extends BatchObject {
  protected instanceTransform: Matrix4 = new Matrix4()

  public constructor(renderView: NodeRenderView, batchIndex: number) {
    super(renderView, batchIndex)
    this.instanceTransform.copy(renderView.renderData.geometry.transform)
    this.transform.copy(this.instanceTransform)
    this.transformInv.copy(new Matrix4().copy(this.instanceTransform).invert())
    this.transformDirty = false
  }

  public transformTRS(
    translation: VectorLike,
    euler: VectorLike,
    scale: VectorLike,
    pivot: VectorLike
  ) {
    super.transformTRS(translation, euler, scale, pivot)
    this.transform.multiply(this.instanceTransform)
    this.transformInv.copy(this.transform)
    this.transformInv.invert()
  }
}
