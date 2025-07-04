import { Vector3 } from 'three'
import { MeshBVH } from 'three-mesh-bvh'
import { OBB } from 'three/examples/jsm/math/OBB.js'

declare module 'three/examples/jsm/math/OBB.js' {
  interface OBB {
    isEmpty(): boolean
    equals(other: OBB): boolean
    _min: Vector3
    _max: Vector3
    get min(): Vector3
    set min(value: Vector3): void
    get max(): Vector3
    set max(value: Vector3): void
  }
}

declare module 'three' {
  interface Raycaster {
    firstHitOnly: boolean
  }
  interface BufferGeometry {
    boundsTree: MeshBVH
  }

  interface WebGLMultipleRenderTargets {
    width: number
    height: number
  }

  interface Box3 {
    intersectOBB(obb: OBB): OBB | null
    fromOBB(obb: OBB): Box3
    isInfiniteBox(): boolean
  }
}

export {}
