import { Box3, type Intersection, Material, Object3D, Raycaster, Vector3 } from 'three'
import { ExtendedTriangle, ShapecastIntersection } from 'three-mesh-bvh'
import { BatchObject } from '../batching/BatchObject'
import { ObjectLayers } from '../../IViewer'

export type ExtendedShapeCastCallbacks = {
  intersectsTAS?: (
    box: Box3,
    isLeaf: boolean,
    score: number | undefined,
    depth: number,
    nodeIndex: number
  ) => ShapecastIntersection | boolean
  intersectTASRange?: (batchObject: BatchObject) => ShapecastIntersection | boolean
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
  public onObjectIntersectionTest: ((object: Object3D) => void) | null = null

  constructor(origin?: Vector3, direction?: Vector3, near = 0, far = Infinity) {
    super(origin, direction, near, far)
    this.layers.disableAll()
    this.layers.enable(ObjectLayers.STREAM_CONTENT)
    this.layers.enable(ObjectLayers.STREAM_CONTENT_MESH)
    this.layers.enable(ObjectLayers.STREAM_CONTENT_LINE)
    this.layers.enable(ObjectLayers.STREAM_CONTENT_TEXT)
    this.layers.enable(ObjectLayers.STREAM_CONTENT_POINT_CLOUD)
    // OFF by default
    this.layers.enable(ObjectLayers.STREAM_CONTENT_POINT)
  }

  public intersectObjects(objects: Array<Object3D>, recursive = true, intersects = []) {
    for (let i = 0, l = objects.length; i < l; i++) {
      intersectObject(objects[i], this, intersects, recursive)
    }

    intersects.sort(ascSort)

    return intersects
  }
}

function ascSort(a: Intersection, b: Intersection) {
  return a.distance - b.distance
}

function intersectObject(
  object: Object3D,
  raycaster: SpeckleRaycaster,
  intersects: Array<Intersection>,
  recursive: boolean
) {
  if (object.layers.test(raycaster.layers)) {
    if (raycaster.onObjectIntersectionTest) {
      raycaster.onObjectIntersectionTest(object)
    }
    object.raycast(raycaster, intersects)
  }
  recursive &&=
    // eslint-disable-next-line eqeqeq
    object.userData.raycastChildren != undefined
      ? object.userData.raycastChildren
      : true
  if (recursive === true) {
    const children = object.children

    for (let i = 0, l = children.length; i < l; i++) {
      intersectObject(children[i], raycaster, intersects, true)
    }
  }
}
