import {
  Box3,
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
import { NodeRenderView } from '../tree/NodeRenderView'
import { SpeckleMeshBVH } from './SpeckleMeshBVH'

export class SpeckleBatchBVH {
  private batchBounds: Box3 = null
  private originTransform: Matrix4 = null
  private originTransformInv: Matrix4 = null
  public bvhs: SpeckleMeshBVH[] = []

  public constructor(rvs: NodeRenderView[], bounds: Box3) {
    this.batchBounds = bounds
    const boundsCenter = bounds.getCenter(new Vector3())
    const transform = new Matrix4().makeTranslation(
      boundsCenter.x,
      boundsCenter.y,
      boundsCenter.z
    )
    transform.invert()
    this.originTransform = transform
    this.originTransformInv = new Matrix4().copy(this.originTransform).invert()

    for (let k = 0; k < rvs.length; k++) {
      const indices = rvs[k].renderData.geometry.attributes.INDEX
      const position = rvs[k].renderData.geometry.attributes.POSITION

      const localPositions = new Float32Array(position.length)
      const vecBuff = new Vector3()
      for (let k = 0; k < position.length; k += 3) {
        vecBuff.set(position[k], position[k + 1], position[k + 2])
        vecBuff.applyMatrix4(transform)
        localPositions[k] = vecBuff.x
        localPositions[k + 1] = vecBuff.y
        localPositions[k + 2] = vecBuff.z
      }
      const bvh = SpeckleMeshBVH.buildBVH(indices, localPositions)
      // bvh.renderView = rvs[k]
      this.bvhs.push(bvh)
    }
  }

  /* Core Cast Functions */
  public raycast(
    ray: Ray,
    materialOrSide: Side | Material | Material[] = FrontSide
  ): Intersection<Object3D<Event>>[] {
    const res = []
    const rayBuff = new Ray()
    this.bvhs.forEach((bvh: SpeckleMeshBVH) => {
      rayBuff.copy(ray)
      const hits = bvh.raycast(this.transformInput(rayBuff), materialOrSide)
      res.push(...hits)
    })
    res.forEach((value) => {
      value.point = this.transformOutput(value.point)
    })
    return res
  }

  public raycastFirst(
    ray: Ray,
    materialOrSide: Side | Material | Material[] = FrontSide
  ): Intersection<Object3D<Event>> {
    let res = null
    const rayBuff = new Ray()
    for (let k = 0; k < this.bvhs.length; k++) {
      rayBuff.copy(ray)
      res = this.bvhs[k].raycastFirst(this.transformInput<Ray>(rayBuff), materialOrSide)
      if (res) {
        res.point = this.transformOutput(res.point)
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
            depth: number
          ) => boolean | void
        }
    )
  ): boolean {
    const boxBuffer = new Box3()
    const triangleBuffer = new ExtendedTriangle()
    const newCallbacks: {
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
            depth: number
          ) => boolean | void
        }
    ) = Object.create(null)
    if (callbacks.intersectsBounds) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      newCallbacks.intersectsBounds = (
        box: Box3,
        isLeaf: boolean,
        score: number | undefined,
        depth: number,
        nodeIndex: number
      ): ShapecastIntersection | boolean => {
        boxBuffer.copy(box)
        this.transformOutput(boxBuffer)
        return callbacks.intersectsBounds(boxBuffer, isLeaf, score, depth, nodeIndex)
      }
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
        triangleBuffer.copy(triangle)
        this.transformOutput(triangleBuffer.a)
        this.transformOutput(triangleBuffer.b)
        this.transformOutput(triangleBuffer.c)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return callbacks.intersectsTriangle(
          triangleBuffer,
          triangleIndex,
          contained,
          depth
        )
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    newCallbacks.intersectsRange = callbacks.intersectsRange
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    newCallbacks.traverseBoundsOrder = callbacks.traverseBoundsOrder

    let ret = false
    this.bvhs.forEach((bvh: SpeckleMeshBVH) => {
      ret ||= bvh.shapecast(newCallbacks)
    })
    return ret
  }

  public getBoundingBox(target: Box3) {
    target.makeEmpty()
    const scratchBox: Box3 = new Box3()
    this.bvhs.forEach((bvh: SpeckleMeshBVH) => {
      target.union(bvh.getBoundingBox(scratchBox))
    })
    return this.transformOutput(target)
  }

  public transformInput<T extends Vector3 | Ray | Box3>(input: T): T {
    return input.applyMatrix4(this.originTransform) as T
  }

  public transformOutput<T extends Vector3 | Ray | Box3>(output: T): T {
    return output.applyMatrix4(this.originTransformInv) as T
  }
}
