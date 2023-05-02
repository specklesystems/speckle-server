import {
  Box3,
  Box3Helper,
  FrontSide,
  Intersection,
  Material,
  Matrix4,
  Object3D,
  Ray,
  Side,
  Vector3
} from 'three'
import { ExtendedTriangle } from 'three-mesh-bvh'
import { BatchObject } from '../batching/BatchObject'
import { ExtendedIntersection, ExtendedShapeCastCallbacks } from './SpeckleRaycaster'
import { SpeckleMeshBVH } from './SpeckleMeshBVH'
import { ObjectLayers } from '../SpeckleRenderer'

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
export class SpeckleBatchBVH {
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
  public tas: SpeckleMeshBVH = null
  public lastRefitTime = 0

  public constructor(batchObjects: BatchObject[]) {
    this.batchObjects = batchObjects
    this.buildTAS()
    this.getBoundingBox(this.bounds)
  }

  private buildTAS() {
    const indices = []
    const vertices = new Float32Array(
      SpeckleBatchBVH.CUBE_VERTS * 3 * this.batchObjects.length
    )
    let vertOffset = 0
    for (let k = 0; k < this.batchObjects.length; k++) {
      const boxBounds: Box3 = this.batchObjects[k].bvh.getBoundingBox(new Box3())
      this.updateVertArray(boxBounds, vertOffset, vertices)
      indices.push(...SpeckleBatchBVH.cubeIndices.map((val) => val + vertOffset / 3))
      this.batchObjects[k].tasVertIndexStart = vertOffset / 3
      this.batchObjects[k].tasVertIndexEnd = vertOffset / 3 + SpeckleBatchBVH.CUBE_VERTS

      vertOffset += SpeckleBatchBVH.CUBE_VERTS * 3

      if (SpeckleBatchBVH.debugBoxes) {
        const helper = new Box3Helper(boxBounds)
        helper.layers.set(ObjectLayers.PROPS)
        this.boxHelpers.push(helper)
      }
    }
    this.tas = SpeckleMeshBVH.buildBVH(indices, vertices)
    this.tas.inputTransform = new Matrix4()
    this.tas.outputTransform = new Matrix4()
    this.tas.inputOriginTransform = new Matrix4()
    this.tas.outputOriginTransfom = new Matrix4()
  }

  private updateVertArray(box: Box3, offset: number, outPositions: Float32Array) {
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
    const start = performance.now()
    const positions = this.tas.geometry.attributes.position.array
    const boxBuffer: Box3 = new Box3()
    for (let k = 0; k < this.batchObjects.length; k++) {
      const start = this.batchObjects[k].tasVertIndexStart
      const basBox = this.batchObjects[k].bvh.getBoundingBox(boxBuffer)
      this.updateVertArray(basBox, start * 3, positions as Float32Array)

      if (SpeckleBatchBVH.debugBoxes) this.boxHelpers[k].box.copy(basBox)
    }
    this.tas.refit()
    this.lastRefitTime = performance.now() - start
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
    if (!tasResults.length) return res

    tasResults.forEach((tasRes: Intersection<Object3D>) => {
      const vertIndex = this.tas.geometry.index.array[tasRes.faceIndex * 3]
      const batchObjectIndex = Math.trunc(vertIndex / SpeckleBatchBVH.CUBE_VERTS)
      rayBuff.copy(ray)
      const hits = this.batchObjects[batchObjectIndex].bvh.raycast(
        rayBuff,
        materialOrSide
      )
      hits.forEach((hit) => {
        ;(hit as ExtendedIntersection).batchObject = this.batchObjects[batchObjectIndex]
      })
      res.push(...hits)
    })

    return res
  }

  public raycastFirst(
    ray: Ray,
    materialOrSide: Side | Material | Material[] = FrontSide
  ): ExtendedIntersection {
    const res = null
    const rayBuff = new Ray()
    rayBuff.copy(ray)
    const tasRes: Intersection<Object3D> = this.tas.raycastFirst(rayBuff, FrontSide)
    if (!tasRes) return res

    const vertIndex = this.tas.geometry.index.array[tasRes.faceIndex * 3]
    const batchObjectIndex = Math.trunc(vertIndex / SpeckleBatchBVH.CUBE_VERTS)
    rayBuff.copy(ray)
    const hits = this.batchObjects[batchObjectIndex].bvh.raycast(
      rayBuff,
      materialOrSide
    )
    hits.forEach((hit) => {
      ;(hit as ExtendedIntersection).batchObject = this.batchObjects[batchObjectIndex]
    })
    res.push(...hits)
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
    this.tas.shapecast({
      intersectsBounds: (box, isLeaf, score, depth, nodeIndex) => {
        const res = callbacks.intersectsTAS(box, isLeaf, score, depth, nodeIndex)
        return res
      },
      intersectsRange: (triangleOffset: number) => {
        const vertIndex = this.tas.geometry.index.array[triangleOffset * 3]
        const batchObjectIndex = Math.trunc(vertIndex / SpeckleBatchBVH.CUBE_VERTS)
        ret ||= this.batchObjects[batchObjectIndex].bvh.shapecast(
          wrapCallbacks(this.batchObjects[batchObjectIndex])
        )

        return false
      }
    })

    return ret
  }

  public getBoundingBox(target: Box3): Box3 {
    this.tas.getBoundingBox(target)
    return target
  }
}
