import { Box3, Intersection, Material, Object3D, Raycaster } from 'three'
import { ExtendedTriangle, ShapecastIntersection } from 'three-mesh-bvh'
import { BatchObject } from '../batching/BatchObject'
import { ObjectLayers } from '../SpeckleRenderer'

export type ExtendedShapeCastCallbacks = {
  intersectsTAS?: (
    box: Box3,
    isLeaf: boolean,
    score: number | undefined,
    depth: number,
    nodeIndex: number
  ) => ShapecastIntersection | boolean

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

export interface ExtendedIntersection extends Intersection {
  batchObject?: BatchObject
  material?: Material
}

export class SpeckleRaycaster extends Raycaster {
  public onObjectIntersectionTest: (object: Object3D) => void = null

  constructor(origin?, direction?, near = 0, far = Infinity) {
    super(origin, direction, near, far)
    this.layers.disableAll()
    this.layers.enable(ObjectLayers.STREAM_CONTENT)
    this.layers.enable(ObjectLayers.STREAM_CONTENT_MESH)
    this.layers.enable(ObjectLayers.STREAM_CONTENT_LINE)
    this.layers.enable(ObjectLayers.STREAM_CONTENT_TEXT)
    this.layers.enable(ObjectLayers.STREAM_CONTENT_POINT_CLOUD)
    // OFF by default
    // this.layers.enable(ObjectLayers.STREAM_CONTENT_POINT)
  }

  public intersectObjects(objects, recursive = true, intersects = []) {
    for (let i = 0, l = objects.length; i < l; i++) {
      intersectObject(objects[i], this, intersects, recursive)
    }

    intersects.sort(ascSort)

    return intersects
  }
}

function ascSort(a, b) {
  return a.distance - b.distance
}

function intersectObject(object, raycaster, intersects, recursive) {
  if (object.layers.test(raycaster.layers)) {
    if (raycaster.onObjectIntersectionTest) {
      raycaster.onObjectIntersectionTest(object)
    }
    object.raycast(raycaster, intersects)
  }

  if (recursive === true) {
    const children = object.children

    for (let i = 0, l = children.length; i < l; i++) {
      intersectObject(children[i], raycaster, intersects, true)
    }
  }
}
