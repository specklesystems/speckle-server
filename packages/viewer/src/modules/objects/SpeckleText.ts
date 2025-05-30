/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-ignore
import { BatchedText } from 'troika-three-text/src/BatchedText.js'
import { TopLevelAccelerationStructure } from './TopLevelAccelerationStructure.js'
import { Box3, Material, Mesh, Sphere } from 'three'
import { BatchObject } from '../batching/BatchObject.js'

export class SpeckleText extends BatchedText {
  private tas: TopLevelAccelerationStructure
  private batchMaterial: Material
  private _batchObjects: BatchObject[]

  public get TAS(): TopLevelAccelerationStructure {
    return this.tas
  }

  public get batchObjects(): BatchObject[] {
    return this._batchObjects
  }

  public setBatchMaterial(material: Material) {
    this.batchMaterial = material
    //@ts-ignore
    this.material = material
  }

  public setBatchObjects(batchObjects: BatchObject[]) {
    this._batchObjects = batchObjects
  }

  public buildTAS() {
    this.tas = new TopLevelAccelerationStructure(this.batchObjects)
    /** We do a refit here, because for some reason the bvh library incorrectly computes the total bvh bounds at creation,
     *  so we force a refit in order to get the proper bounds value out of it
     */
    this.tas.refit()

    /** Copy computed bounds over so that three.js doesn't freak out */
    ;(this as unknown as Mesh).geometry.boundingBox = this.TAS.getBoundingBox(
      new Box3()
    )
    //@ts-ignore
    ;(this as unknown as Mesh).geometry.boundingSphere = (
      this as unknown as Mesh
    ).geometry.boundingBox.getBoundingSphere(new Sphere())
  }
}
