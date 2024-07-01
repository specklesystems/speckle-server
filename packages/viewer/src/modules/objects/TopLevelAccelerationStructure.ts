import {
  Box3,
  Box3Helper,
  BufferAttribute,
  Color,
  FrontSide,
  Material,
  Matrix4,
  Ray,
  Side,
  Vector3
} from 'three'
import { ExtendedTriangle, HitPointInfo } from 'three-mesh-bvh'
import { BatchObject } from '../batching/BatchObject'
import type {
  ExtendedMeshIntersection,
  ExtendedShapeCastCallbacks,
  MeshIntersection
} from './SpeckleRaycaster'
import { ObjectLayers } from '../../IViewer'
import { AccelerationStructure } from './AccelerationStructure'

/** 
 * 
  _____                            _              _   
 |_   _|                          | |            | |  
   | |  _ __ ___  _ __   ___  _ __| |_ __ _ _ __ | |_ 
   | | | '_ ` _ \| '_ \ / _ \| '__| __/ _` | '_ \| __|
  _| |_| | | | | | |_) | (_) | |  | || (_| | | | | |_ 
 |_____|_| |_| |_| .__/ \___/|_|   \__\__,_|_| |_|\__|
                 | |                                  
                 |_|                                  

  Unlike the BVHs for the individual objects, which act as our BAS, the TAS *is not relative to the world origin*!
  All coordinates are the final world coordinates derived from the BAS bounding boxes, after all transformations.
  In theory this might mean the TAS is not 100% accurate for objects far away from origin, but I think it should do
  fine as it is. If we really really really need that 100% accuracy, we'll just make it relative to the origin
 */
export class TopLevelAccelerationStructure {
  private static debugBoxes = false
  private static cubeIndices = [
    // front
    0, 1, 2, 2, 3, 0,
    // right
    1, 5, 6, 6, 2, 1,
    // back
    7, 6, 5, 5, 4, 7,
    // left
    4, 0, 3, 3, 7, 4,
    // bottom
    4, 5, 1, 1, 0, 4,
    // top
    3, 2, 6, 6, 7, 3
  ]
  private static CUBE_VERTS = 8

  public batchObjects: BatchObject[] = []
  public bounds: Box3 = new Box3(new Vector3(0, 0, 0), new Vector3(0, 0, 0))

  public boxHelpers: Box3Helper[] = []
  public accelerationStructure: AccelerationStructure

  public constructor(batchObjects: BatchObject[]) {
    this.batchObjects = batchObjects
    this.buildBVH()
    this.getBoundingBox(this.bounds)
  }

  private buildBVH() {
    const indices = []
    const vertices: number[] = new Array<number>(
      TopLevelAccelerationStructure.CUBE_VERTS * 3 * this.batchObjects.length
    )
    let vertOffset = 0
    for (let k = 0; k < this.batchObjects.length; k++) {
      const boxBounds: Box3 = this.batchObjects[k].accelerationStructure.getBoundingBox(
        new Box3()
      )
      this.updateVertArray(boxBounds, vertOffset, vertices)
      indices.push(
        ...TopLevelAccelerationStructure.cubeIndices.map((val) => val + vertOffset / 3)
      )
      this.batchObjects[k].tasVertIndexStart = vertOffset / 3
      this.batchObjects[k].tasVertIndexEnd =
        vertOffset / 3 + TopLevelAccelerationStructure.CUBE_VERTS

      vertOffset += TopLevelAccelerationStructure.CUBE_VERTS * 3

      if (TopLevelAccelerationStructure.debugBoxes) {
        const helper = new Box3Helper(boxBounds, new Color(0xff0000))
        helper.layers.set(ObjectLayers.PROPS)
        this.boxHelpers.push(helper)
      }
    }
    this.accelerationStructure = new AccelerationStructure(
      AccelerationStructure.buildBVH(indices, vertices)
    )
    this.accelerationStructure.inputTransform = new Matrix4()
    this.accelerationStructure.outputTransform = new Matrix4()
    this.accelerationStructure.inputOriginTransform = new Matrix4()
    this.accelerationStructure.outputOriginTransfom = new Matrix4()
  }

  private updateVertArray(box: Box3, offset: number, outPositions: number[]) {
    outPositions[offset] = box.min.x
    outPositions[offset + 1] = box.min.y
    outPositions[offset + 2] = box.max.z

    outPositions[offset + 3] = box.max.x
    outPositions[offset + 4] = box.min.y
    outPositions[offset + 5] = box.max.z

    outPositions[offset + 6] = box.max.x
    outPositions[offset + 7] = box.max.y
    outPositions[offset + 8] = box.max.z

    outPositions[offset + 9] = box.min.x
    outPositions[offset + 10] = box.max.y
    outPositions[offset + 11] = box.max.z

    outPositions[offset + 12] = box.min.x
    outPositions[offset + 13] = box.min.y
    outPositions[offset + 14] = box.min.z

    outPositions[offset + 15] = box.max.x
    outPositions[offset + 16] = box.min.y
    outPositions[offset + 17] = box.min.z

    outPositions[offset + 18] = box.max.x
    outPositions[offset + 19] = box.max.y
    outPositions[offset + 20] = box.min.z

    outPositions[offset + 21] = box.min.x
    outPositions[offset + 22] = box.max.y
    outPositions[offset + 23] = box.min.z
  }

  public refit() {
    const positions = this.accelerationStructure.geometry.attributes.position
      .array as number[]
    const boxBuffer: Box3 = new Box3()
    for (let k = 0; k < this.batchObjects.length; k++) {
      const start = this.batchObjects[k].tasVertIndexStart
      const basBox =
        this.batchObjects[k].accelerationStructure.getBoundingBox(boxBuffer)
      this.updateVertArray(basBox, start * 3, positions)

      if (TopLevelAccelerationStructure.debugBoxes) this.boxHelpers[k].box.copy(basBox)
    }
    this.accelerationStructure.bvh.refit()
  }

  /* Core Cast Functions */
  public raycast(
    ray: Ray,
    tasOnly: boolean = false,
    materialOrSide: Side | Material | Material[] = FrontSide
  ): ExtendedMeshIntersection[] {
    const res: ExtendedMeshIntersection[] = []
    const rayBuff = new Ray()
    rayBuff.copy(ray)
    const tasResults: ExtendedMeshIntersection[] = this.accelerationStructure.raycast(
      rayBuff,
      materialOrSide
    ) as ExtendedMeshIntersection[]
    if (!tasResults.length) return res

    /** The index buffer for the bvh's geometry will *never* be undefined as it uses indexed geometry */
    const indexBufferAttribute: BufferAttribute = this.accelerationStructure.geometry
      .index as BufferAttribute
    tasResults.forEach((tasRes: MeshIntersection) => {
      const vertIndex = indexBufferAttribute.array[tasRes.faceIndex * 3]
      const batchObjectIndex = Math.trunc(
        vertIndex / TopLevelAccelerationStructure.CUBE_VERTS
      )
      ;(tasRes as ExtendedMeshIntersection).batchObject =
        this.batchObjects[batchObjectIndex]

      /** If we requested only a TAS intersection, then we skip the BAS intersections */
      if (!tasOnly) {
        rayBuff.copy(ray)
        const hits = this.batchObjects[batchObjectIndex].accelerationStructure.raycast(
          rayBuff,
          materialOrSide
        )
        hits.forEach((hit) => {
          /** We're promoting the MeshIntersection to ExtendedMeshIntersection because
           *  now we know it's corresponding batch object
           */
          const extendedHit: ExtendedMeshIntersection = hit as ExtendedMeshIntersection
          extendedHit.batchObject = this.batchObjects[batchObjectIndex]
          res.push(extendedHit)
        })
      }
    })

    return tasOnly ? tasResults : res
  }

  public raycastFirst(
    ray: Ray,
    tasOnly: boolean = false,
    materialOrSide: Side | Material | Material[] = FrontSide
  ): ExtendedMeshIntersection | null {
    const rayBuff = new Ray()
    rayBuff.copy(ray)
    let extendedHit: ExtendedMeshIntersection | null = null
    let tasRes: ExtendedMeshIntersection[] | null = null
    if (tasOnly)
      tasRes = [
        this.accelerationStructure.raycastFirst(
          rayBuff,
          materialOrSide
        ) as ExtendedMeshIntersection
      ]
    else
      tasRes = this.accelerationStructure.raycast(
        rayBuff,
        materialOrSide
      ) as ExtendedMeshIntersection[]

    if (!tasRes || tasRes.length === 0) return null

    tasRes.some((tasRes: ExtendedMeshIntersection) => {
      /** The index buffer for the bvh's geometry will *never* be undefined as it uses indexed geometry */
      const indexBufferAttribute: BufferAttribute = this.accelerationStructure.geometry
        .index as BufferAttribute
      const vertIndex = indexBufferAttribute.array[tasRes.faceIndex * 3]
      const batchObjectIndex = Math.trunc(
        vertIndex / TopLevelAccelerationStructure.CUBE_VERTS
      )
      tasRes.batchObject = this.batchObjects[batchObjectIndex]

      /** If we requested only a TAS intersection, then we skip the BAS intersections */
      if (!tasOnly) {
        rayBuff.copy(ray)
        const hit: MeshIntersection = this.batchObjects[
          batchObjectIndex
        ].accelerationStructure.raycastFirst(rayBuff, materialOrSide)
        /** We're promoting the MeshIntersection to ExtendedMeshIntersection because
         *  now we know it's corresponding batch object
         */
        extendedHit = hit as ExtendedMeshIntersection
        if (extendedHit) {
          extendedHit.batchObject = this.batchObjects[batchObjectIndex]
          return true
        }
      }
      return false
    })

    return tasOnly ? tasRes[0] : extendedHit
  }

  public shapecast(callbacks: ExtendedShapeCastCallbacks): boolean {
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
    this.accelerationStructure.shapecast({
      intersectsBounds: (box, isLeaf, score, depth, nodeIndex) => {
        if (callbacks.intersectsTAS)
          return callbacks.intersectsTAS(box, isLeaf, score, depth, nodeIndex)
        return false
      },
      intersectsRange: (triangleOffset: number) => {
        /** The index buffer for the bvh's geometry will *never* be undefined as it uses indexed geometry */
        const indexBufferAttribute: BufferAttribute = this.accelerationStructure
          .geometry.index as BufferAttribute
        const vertIndex = indexBufferAttribute.array[triangleOffset * 3]
        const batchObjectIndex = Math.trunc(
          vertIndex / TopLevelAccelerationStructure.CUBE_VERTS
        )
        if (callbacks.intersectTASRange) {
          const ret = callbacks.intersectTASRange(this.batchObjects[batchObjectIndex])
          if (!ret) return false
        }
        ret ||= this.batchObjects[batchObjectIndex].accelerationStructure.shapecast(
          wrapCallbacks(this.batchObjects[batchObjectIndex])
        )

        return false
      }
    })

    return ret
  }

  public closestPointToPoint(point: Vector3) {
    return this.accelerationStructure.bvh.closestPointToPoint(point)
  }

  public closestPointToPointHalfplane(
    point: Vector3,
    planeNormal: Vector3,
    target: HitPointInfo = {
      point: new Vector3(),
      distance: 0,
      faceIndex: 0
    },
    minThreshold = 0,
    maxThreshold = Infinity
  ) {
    // early out if under minThreshold
    // skip checking if over maxThreshold
    // set minThreshold = maxThreshold to quickly check if a point is within a threshold
    // returns Infinity if no value found
    const temp = new Vector3()
    const temp1 = new Vector3()
    const temp2 = new Vector3()
    const minThresholdSq = minThreshold * minThreshold
    const maxThresholdSq = maxThreshold * maxThreshold
    let closestDistanceSq = Infinity
    let closestDistanceTriIndex = -1
    this.accelerationStructure.bvh.shapecast({
      boundsTraverseOrder: (box: Box3) => {
        temp.copy(point).clamp(box.min, box.max)
        return temp.distanceToSquared(point)
      },

      // This is the default `closestPointToPoint` implementation. Keeping it intact for reference
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      intersectsBounds: (_box: Box3, _isLeaf, score: number) => {
        return score < closestDistanceSq && score < maxThresholdSq
      },

      intersectsTriangle: (tri, triIndex) => {
        tri.closestPointToPoint(point, temp)
        const distSq = point.distanceToSquared(temp)
        const v = temp2.subVectors(temp, point)
        const planarity = planeNormal.dot(v)
        if (planarity >= 0 && distSq < closestDistanceSq) {
          temp1.copy(temp)
          closestDistanceSq = distSq
          closestDistanceTriIndex = triIndex
        }

        if (distSq < minThresholdSq) {
          return true
        } else {
          return false
        }
      }
    })

    if (closestDistanceSq === Infinity) return null

    const closestDistance = Math.sqrt(closestDistanceSq)

    if (!target.point) target.point = temp1.clone()
    else target.point.copy(temp1)
    ;(target.distance = closestDistance), (target.faceIndex = closestDistanceTriIndex)

    return target
  }

  public getBoundingBox(target: Box3): Box3 {
    this.accelerationStructure.getBoundingBox(target)
    return target
  }
}
