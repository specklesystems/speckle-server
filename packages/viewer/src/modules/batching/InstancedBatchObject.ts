/* eslint-disable camelcase */
import { BatchObject } from './BatchObject'

import { Matrix4 } from 'three'
import { NodeRenderView } from '../tree/NodeRenderView'

export class InstancedBatchObject extends BatchObject {
  protected instanceTransform: Matrix4 = new Matrix4()

  public constructor(renderView: NodeRenderView, batchIndex: number) {
    super(renderView, batchIndex)
    this.instanceTransform.copy(renderView.renderData.geometry.transform)
    this.transform.copy(this.instanceTransform)
    this.transformInv.copy(new Matrix4().copy(this.instanceTransform).invert())
  }
}
