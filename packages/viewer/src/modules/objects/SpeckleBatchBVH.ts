import { Box3, FrontSide, Material, Ray, Side, Vector3 } from 'three'
import { ShapecastIntersection, ExtendedTriangle } from 'three-mesh-bvh'
import { BatchObject } from '../batching/BatchObject'
import { ExtendedIntersection, ExtendedShapeCastCallbacks } from './SpeckleRaycaster'

export class SpeckleBatchBVH {
  private static readonly vecBuff: Vector3 = new Vector3()

  public batchObjects: BatchObject[] = []
  public bounds: Box3 = new Box3()

  public constructor(batchObjects: BatchObject[]) {
    this.batchObjects = batchObjects
    this.getBoundingBox(this.bounds)
  }

  /* Core Cast Functions */
  public raycast(
    ray: Ray,
    materialOrSide: Side | Material | Material[] = FrontSide
  ): ExtendedIntersection[] {
    const res = []
    const rayBuff = new Ray()
    rayBuff.copy(ray)
    if (!rayBuff.intersectBox(this.bounds, SpeckleBatchBVH.vecBuff)) {
      return res
    }

    this.batchObjects.forEach((batchObject: BatchObject) => {
      rayBuff.copy(ray)
      const hits = batchObject.bvh.raycast(rayBuff, materialOrSide)
      hits.forEach((hit) => {
        ;(hit as ExtendedIntersection).batchObject = batchObject
      })
      res.push(...hits)
    })
    return res
  }

  public raycastFirst(
    ray: Ray,
    materialOrSide: Side | Material | Material[] = FrontSide
  ): ExtendedIntersection {
    let res = null
    const rayBuff = new Ray()
    rayBuff.copy(ray)
    if (!rayBuff.intersectBox(this.bounds, SpeckleBatchBVH.vecBuff)) {
      return res
    }

    for (let k = 0; k < this.batchObjects.length; k++) {
      rayBuff.copy(ray)
      res = this.batchObjects[k].bvh.raycastFirst(rayBuff, materialOrSide)
      if (res) {
        ;(res as ExtendedIntersection).batchObject = this.batchObjects[k]
        return res
      }
    }
  }

  public shapecast(
    callbacks: {
      intersectsBounds: (
        box: Box3,
        isLeaf: boolean,
        score: number | undefined,
        depth: number,
        nodeIndex: number
      ) => ShapecastIntersection | boolean

      traverseBoundsOrder?: (box: Box3) => number
    } & (
      | {
          intersectsRange: (
            triangleOffset: number,
            triangleCount: number,
            contained: boolean,
            depth: number,
            nodeIndex: number,
            box: Box3
          ) => boolean
        }
      | {
          intersectsTriangle: (
            triangle: ExtendedTriangle,
            triangleIndex: number,
            contained: boolean,
            depth: number,
            batchObject?: BatchObject
          ) => boolean | void
        }
    )
  ): boolean {
    const wrapCallbacks = (batchObject: BatchObject): ExtendedShapeCastCallbacks => {
      const newCallbacks: ExtendedShapeCastCallbacks = Object.create(null)
      if (callbacks.intersectsBounds) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        newCallbacks.intersectsBounds = callbacks.intersectsBounds
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (callbacks.intersectsTriangle) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        newCallbacks.intersectsTriangle = (
          triangle: ExtendedTriangle,
          triangleIndex: number,
          contained: boolean,
          depth: number
        ): boolean | void => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return callbacks.intersectsTriangle(
            triangle,
            triangleIndex,
            contained,
            depth,
            batchObject
          )
        }
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      newCallbacks.intersectsRange = callbacks.intersectsRange
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      newCallbacks.traverseBoundsOrder = callbacks.traverseBoundsOrder
      return newCallbacks
    }

    let ret = false
    this.batchObjects.forEach((batchObject: BatchObject) => {
      ret ||= batchObject.bvh.shapecast(wrapCallbacks(batchObject))
    })
    return ret
  }

  public getBoundingBox(target: Box3): Box3 {
    target.makeEmpty()
    const scratchBox: Box3 = new Box3()
    this.batchObjects.forEach((batchObject: BatchObject) => {
      const objBounds = batchObject.bvh.getBoundingBox(scratchBox)
      target.union(objBounds)
    })
    return target
  }
}
