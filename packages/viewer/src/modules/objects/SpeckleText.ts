/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-ignore
import { BatchedText } from 'troika-three-text/src/BatchedText.js'
import { TopLevelAccelerationStructure } from './TopLevelAccelerationStructure.js'
import {
  Box3,
  Intersection,
  Material,
  Matrix4,
  Mesh,
  Object3D,
  Ray,
  Raycaster,
  Sphere
} from 'three'
import { BatchObject } from '../batching/BatchObject.js'
import { SpeckleRaycaster } from './SpeckleRaycaster.js'
import { DrawGroup } from '../batching/Batch.js'
import Logger from '../utils/Logger.js'

const ray = /* @__PURE__ */ new Ray()
const tmpInverseMatrix = /* @__PURE__ */ new Matrix4()

export class SpeckleText extends BatchedText {
  private tas: TopLevelAccelerationStructure
  private batchMaterial: Material
  private _batchObjects: BatchObject[]

  public groups: Array<DrawGroup> = []
  public materials: Material[] = []

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
    this.materials.push(this.batchMaterial)
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

  // converts the given BVH raycast intersection to align with the three.js raycast
  // structure (include object, world space distance and point).
  private convertRaycastIntersect(
    hit: Intersection | null,
    object: Object3D,
    raycaster: Raycaster
  ) {
    if (hit === null) {
      return null
    }

    hit.point.applyMatrix4(object.matrixWorld)
    hit.distance = hit.point.distanceTo(raycaster.ray.origin)
    hit.object = object

    if (hit.distance < raycaster.near || hit.distance > raycaster.far) {
      return null
    } else {
      return hit
    }
  }

  public getBatchObjectMaterial(batchObject: BatchObject) {
    const rv = batchObject.renderView
    const group = this.groups.find((value) => {
      return (
        rv.batchStart >= value.start &&
        rv.batchStart + rv.batchCount <= value.count + value.start
      )
    })
    if (!group) {
      Logger.warn(`Could not get material for ${batchObject.renderView.renderData.id}`)
      return null
    }
    return this.materials[group.materialIndex]
  }

  raycast(raycaster: SpeckleRaycaster, intersects: Array<Intersection>) {
    if (this.tas) {
      if (this.batchMaterial === undefined) return

      //@ts-ignore
      tmpInverseMatrix.copy(this.matrixWorld).invert()
      ray.copy(raycaster.ray).applyMatrix4(tmpInverseMatrix)

      if (raycaster.firstHitOnly === true) {
        const hit = this.convertRaycastIntersect(
          this.tas.raycastFirst(ray, raycaster.intersectTASOnly, this.batchMaterial),
          this as unknown as Object3D,
          raycaster
        )
        if (hit) {
          intersects.push(hit)
        }
      } else {
        const hits = this.tas.raycast(
          ray,
          raycaster.intersectTASOnly,
          this.batchMaterial
        )
        for (let i = 0, l = hits.length; i < l; i++) {
          const hit = this.convertRaycastIntersect(
            hits[i],
            this as unknown as Object3D,
            raycaster
          )
          if (hit) {
            intersects.push(hit)
          }
        }
      }
    } else {
      super.raycast(raycaster, intersects)
    }
  }
}
