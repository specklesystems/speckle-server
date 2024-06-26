import {
  Box3,
  type Intersection,
  Object3D,
  Raycaster,
  Vector3,
  RaycasterParameters,
  Face
} from 'three'
import { ExtendedTriangle, ShapecastIntersection } from 'three-mesh-bvh'
import { BatchObject } from '../batching/BatchObject.js'
import { ObjectLayers } from '../../IViewer.js'
import SpeckleMesh from './SpeckleMesh.js'
import SpeckleInstancedMesh from './SpeckleInstancedMesh.js'

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
  pointOnLine?: Vector3
  // material?: Material
}

export interface MeshIntersection extends Intersection {
  face: Face
  faceIndex: number
}

export interface ExtendedMeshIntersection extends MeshIntersection {
  batchObject: BatchObject
  object: SpeckleMesh | SpeckleInstancedMesh
}

export interface ExtendedRaycasterParameters extends RaycasterParameters {
  Line2: { threshold: number }
}

export class SpeckleRaycaster extends Raycaster {
  public intersectTASOnly: boolean = false
  public onObjectIntersectionTest: ((object: Object3D) => void) | null = null
  public params: ExtendedRaycasterParameters

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
    this.params = { Line2: { threshold: 0 } }
  }

  public intersectObjects(objects: Array<Object3D>, recursive = true, intersects = []) {
    for (let i = 0, l = objects.length; i < l; i++) {
      const ret = intersectObject(objects[i], this, intersects, recursive)

      if (this.firstHitOnly === true && !ret) break
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
): boolean {
  const len = intersects.length
  if (object.layers.test(raycaster.layers)) {
    if (raycaster.onObjectIntersectionTest) {
      raycaster.onObjectIntersectionTest(object)
    }
    object.raycast(raycaster, intersects)
  }
  if (raycaster.firstHitOnly === true && intersects.length - len > 0) {
    return true
  }

  let ret = false
  recursive &&=
    // eslint-disable-next-line eqeqeq
    object.userData.raycastChildren != undefined
      ? object.userData.raycastChildren
      : true
  if (recursive === true) {
    const children = object.children

    for (let i = 0, l = children.length; i < l; i++) {
      ret = intersectObject(children[i], raycaster, intersects, true)
      if (raycaster.firstHitOnly === true && ret) break
    }
  }
  return ret
}
