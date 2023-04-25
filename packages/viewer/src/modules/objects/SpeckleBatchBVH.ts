import {
  Box3,
  BoxGeometry,
  FrontSide,
  Intersection,
  Material,
  Matrix4,
  Object3D,
  Ray,
  Side,
  Vector3
} from 'three'
import { ShapecastIntersection, ExtendedTriangle } from 'three-mesh-bvh'
import { BatchObject } from '../batching/BatchObject'
import { ExtendedIntersection, ExtendedShapeCastCallbacks } from './SpeckleRaycaster'
import { SpeckleMeshBVH } from './SpeckleMeshBVH'

export class SpeckleBatchBVH {
  private static readonly vecBuff: Vector3 = new Vector3()

  public batchObjects: BatchObject[] = []
  public bounds: Box3 = new Box3()

  public boxGeometries: BoxGeometry[] = []
  public tas: SpeckleMeshBVH = null

  public constructor(batchObjects: BatchObject[]) {
    this.batchObjects = batchObjects
    this.getBoundingBox(this.bounds)
    this.buildBoxGeometry()
  }

  private buildBoxGeometry() {
    const indices = new Int32Array(36 * this.batchObjects.length)
    const vertices = new Float32Array(72 * this.batchObjects.length)
    let indexOffset = 0
    let vertOffset = 0
    for (let k = 0; k < this.batchObjects.length; k++) {
      const boxBounds: Box3 = this.batchObjects[k].bvh.getBoundingBox(new Box3())
      const boxSize = boxBounds.getSize(new Vector3())
      const boxCenter = boxBounds.getCenter(new Vector3())
      const boxGeometry = new BoxGeometry(boxSize.x, boxSize.y, boxSize.z, 1, 1, 1)
      boxGeometry.translate(boxCenter.x, boxCenter.y, boxCenter.z)

      indices.set(
        (boxGeometry.index.array as number[]).map((val) => val + vertOffset / 3),
        indexOffset
      )
      vertices.set(boxGeometry.attributes.position.array, vertOffset)
      this.batchObjects[k].tasVertIndexStart = vertOffset / 3
      this.batchObjects[k].tasVertIndexEnd =
        vertOffset / 3 + boxGeometry.attributes.position.array.length / 3

      indexOffset += boxGeometry.index.array.length
      vertOffset += boxGeometry.attributes.position.array.length

      this.boxGeometries.push(boxGeometry)
    }
    // const batchBoxes = mergeBufferGeometries(this.boxGeometries)
    this.tas = SpeckleMeshBVH.buildBVH(indices as unknown as number[], vertices)
    this.tas.inputTransform = new Matrix4()
    this.tas.outputTransform = new Matrix4()
    this.tas.inputOriginTransform = new Matrix4()
    this.tas.outputOriginTransfom = new Matrix4()
  }

  /* Core Cast Functions */
  public raycast(
    ray: Ray,
    materialOrSide: Side | Material | Material[] = FrontSide
  ): ExtendedIntersection[] {
    const res = []
    const rayBuff = new Ray()
    rayBuff.copy(ray)
    const tasResults: Intersection<Object3D>[] = this.tas.raycast(rayBuff, FrontSide)
    // console.log('For Batch -> ', this.batchObjects[0].renderView.batchId)
    if (!tasResults.length) return res

    tasResults.forEach((tasRes: Intersection<Object3D>) => {
      for (let k = 0; k < this.batchObjects.length; k++) {
        const vertIndex = this.tas.geometry.index.array[tasRes.faceIndex * 3]
        if (
          vertIndex >= this.batchObjects[k].tasVertIndexStart &&
          vertIndex < this.batchObjects[k].tasVertIndexEnd
        ) {
          rayBuff.copy(ray)
          const hits = this.batchObjects[k].bvh.raycast(rayBuff, materialOrSide)
          hits.forEach((hit) => {
            ;(hit as ExtendedIntersection).batchObject = this.batchObjects[k]
            // console.log(this.batchObjects[k].renderView.renderData.id)
          })
          res.push(...hits)
        }
      }
    })

    // if (!rayBuff.intersectBox(this.bounds, SpeckleBatchBVH.vecBuff)) {
    //   return res
    // }

    // this.batchObjects.forEach((batchObject: BatchObject) => {
    //   rayBuff.copy(ray)
    //   const hits = batchObject.bvh.raycast(rayBuff, materialOrSide)
    //   hits.forEach((hit) => {
    //     ;(hit as ExtendedIntersection).batchObject = batchObject
    //   })
    //   res.push(...hits)
    // })
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
