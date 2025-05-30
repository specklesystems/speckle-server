import { Box3 } from 'three'
import { BatchObject } from './BatchObject.js'

export class TextBatchObject extends BatchObject {
  public get aabb(): Box3 {
    return this._accelerationStructure.getBoundingBox(new Box3())
  }
}
