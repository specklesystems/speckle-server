/* eslint-disable camelcase */
import { BatchObject, VectorLike } from './BatchObject'

import { Box3, Matrix4 } from 'three'
import { NodeRenderView } from '../tree/NodeRenderView'
import { AccelerationStructure } from '../objects/AccelerationStructure'

export class InstancedBatchObject extends BatchObject {
  protected instanceTransform: Matrix4 = new Matrix4()

  public get aabb(): Box3 {
    const box = new Box3().copy(this.renderView.aabb)
    box.applyMatrix4(this.transform).applyMatrix4(this.instanceTransform)
    return box
  }

  public constructor(renderView: NodeRenderView, batchIndex: number) {
    super(renderView, batchIndex)
    this.instanceTransform.copy(renderView.renderData.geometry.transform)
    this.transform.copy(this.instanceTransform)
    this.transformInv.copy(this.instanceTransform)
  }

  public buildInstanceBVH(accelerationStructure?: AccelerationStructure) {
    if (accelerationStructure) {
      this._accelerationStructure = accelerationStructure
      this._accelerationStructure.inputTransform = this.transformInv
      this._accelerationStructure.outputTransform = this.transform
      const transform = new Matrix4().makeTranslation(
        this._localOrigin.x,
        this._localOrigin.y,
        this._localOrigin.z
      )
      transform.invert()
      this._accelerationStructure.inputOriginTransform = new Matrix4().copy(transform)
      this._accelerationStructure.outputOriginTransfom = new Matrix4()
        .copy(transform)
        .invert()
    } else this.buildBVH()
  }

  public transformTRS(
    translation: VectorLike,
    euler: VectorLike,
    scale: VectorLike,
    pivot: VectorLike
  ) {
    super.transformTRS(translation, euler, scale, pivot)
    this.transform.multiply(this.instanceTransform)
    this.transformInv.multiply(this.instanceTransform)
  }
}
