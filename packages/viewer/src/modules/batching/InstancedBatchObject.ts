// /* eslint-disable camelcase */
// import { BatchObject } from './BatchObject'

// import { Matrix4, Vector3 } from 'three'
// import { SpeckleMeshBVH } from '../objects/AccelerationStructure'
// import { NodeRenderView } from '../tree/NodeRenderView'

// export class InstancedBatchObject extends BatchObject {
//   protected instanceTransform: Matrix4 = new Matrix4()

//   public constructor(renderView: NodeRenderView, batchIndex: number) {
//     super(renderView, batchIndex)
//   }

//   public buildInstanceBVH(instanceBVH?: SpeckleMeshBVH) {
//     if (instanceBVH) {
//       this._bvh = SpeckleMeshBVH.buildBVH(indices, localPositions)
//       this._bvh.inputTransform = this.transformInv
//       this._bvh.outputTransform = this.transform
//       this._bvh.inputOriginTransform = new Matrix4().copy(transform)
//       this._bvh.outputOriginTransfom = new Matrix4().copy(transform).invert()
//       return
//     } else this.buildBVH()
//   }
// }
