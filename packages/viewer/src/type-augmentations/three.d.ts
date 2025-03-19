import { MeshBVH } from 'three-mesh-bvh'
import { OBB } from 'three/examples/jsm/math/OBB.js'

declare module 'three/examples/jsm/math/OBB.js' {
  interface OBB {
    isEmpty(): boolean
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
  }
}

export {}
