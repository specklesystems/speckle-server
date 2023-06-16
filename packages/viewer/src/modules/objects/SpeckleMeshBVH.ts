import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  FrontSide,
  Intersection,
  Material,
  Matrix4,
  Object3D,
  Ray,
  Side,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  Vector3,
  Event
} from 'three'
import {
  CENTER,
  ExtendedTriangle,
  MeshBVH,
  ShapecastIntersection,
  SplitStrategy
} from 'three-mesh-bvh'

const SKIP_GENERATION = Symbol('skip tree generation')

export interface BVHOptions {
  strategy: SplitStrategy
  maxDepth: number
  maxLeafTris: number
  verbose: boolean
  useSharedArrayBuffer: boolean
  setBoundingBox: boolean
  onProgress: () => void
  [SKIP_GENERATION]: boolean
}

export const DefaultBVHOptions = {
  strategy: CENTER,
  maxDepth: 40,
  maxLeafTris: 10,
  verbose: true,
  useSharedArrayBuffer: false,
  setBoundingBox: false,
  onProgress: null,
  [SKIP_GENERATION]: false
}

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

We've made this wrapper around the original implementation to hide the transformations we do behind the scenes
in order to avoid storing vertex positions as Float64. Instead we store them as Float32, but the whole BVH is 
re-centered around the mesh local origin as (0,0,0). We use the resulting transformations to transform anything that comes
in or out of the BVH in order to keep this re-centering opaque.

We've implemented auto-transformation for raycasting and shapecasting. Other functionalities like bvhcast or geometrycast
will need to be wrapped around if required. 

Otherwise, keep in mind that if you use this class for any other purposes, you can use transformInput and transformOutput
to get the correct values for Vectors, Rays, Boxes, etc
 */
export class SpeckleMeshBVH extends MeshBVH {
  private static readonly MatBuff: Matrix4 = new Matrix4()
  public inputTransform: Matrix4
  public outputTransform: Matrix4
  public inputOriginTransform: Matrix4
  public outputOriginTransfom: Matrix4

  public static buildBVH(
    indices: number[],
    position: Float32Array,
    options: BVHOptions = DefaultBVHOptions
  ): SpeckleMeshBVH {
    const bvhGeometry = new BufferGeometry()
    let bvhIndices = null
    if (position.length >= 65535 || indices.length >= 65535) {
      bvhIndices = new Uint32Array(indices.length)
      ;(bvhIndices as Uint32Array).set(indices, 0)
      bvhGeometry.setIndex(new Uint32BufferAttribute(bvhIndices, 1))
    } else {
      bvhIndices = new Uint16Array(indices.length)
      ;(bvhIndices as Uint16Array).set(indices, 0)
      bvhGeometry.setIndex(new Uint16BufferAttribute(bvhIndices, 1))
    }

    bvhGeometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    bvhGeometry.computeBoundingBox()

    const bvh = new SpeckleMeshBVH(bvhGeometry, options)
    return bvh
  }

  private constructor(geometry, options = {}) {
    super(geometry, options)
  }

  /* Core Cast Functions */
  public raycast(
    ray: Ray,
    materialOrSide: Side | Material | Material[] = FrontSide
  ): Intersection<Object3D<Event>>[] {
    const res = super.raycast(this.transformInput<Ray>(ray), materialOrSide)
    res.forEach((value) => {
      value.point = this.transformOutput(value.point)
    })
    return res
  }

  public raycastFirst(
    ray: Ray,
    materialOrSide: Side | Material | Material[] = FrontSide
  ): Intersection<Object3D<Event>> {
    const res = super.raycastFirst(this.transformInput<Ray>(ray), materialOrSide)
    res.point = this.transformOutput(res.point)
    return res
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

    return super.shapecast(newCallbacks)
  }

  public transformInput<T extends Vector3 | Ray | Box3>(input: T): T {
    SpeckleMeshBVH.MatBuff.copy(this.inputOriginTransform).premultiply(
      this.inputTransform
    )
    return input.applyMatrix4(SpeckleMeshBVH.MatBuff) as T
  }

  public transformOutput<T extends Vector3 | Ray | Box3>(output: T): T {
    SpeckleMeshBVH.MatBuff.copy(this.outputOriginTransfom).multiply(
      this.outputTransform
    )
    return output.applyMatrix4(SpeckleMeshBVH.MatBuff) as T
  }

  public getBoundingBox(target) {
    super.getBoundingBox(target)
    return this.transformOutput(target)
  }

  public getVertexAtIndex(index: number): Vector3 {
    const array = this.geometry.attributes.position.array
    return this.transformOutput(
      new Vector3(array[index * 3], array[index * 3 + 1], array[index * 3 + 2])
    )
  }
}
