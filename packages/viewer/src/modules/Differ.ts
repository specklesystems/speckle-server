import { Color, FrontSide } from 'three'
import Batcher from './batching/Batcher'
import { SpeckleType } from './converter/GeometryConverter'
import SpeckleStandardMaterial from './materials/SpeckleStandardMaterial'
import { NodeRenderView } from './tree/NodeRenderView'
import { TreeNode, WorldTree } from './tree/WorldTree'

export interface DiffResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unchanged: Array<Record<string, any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  added: Array<Record<string, any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removed: Array<Record<string, any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modifiedNew: Array<Record<string, any>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modifiedOld: Array<Record<string, any>>
}

export class Differ {
  private batcher: Batcher = null
  private addedMaterial: SpeckleStandardMaterial = null
  private changedNewMaterial: SpeckleStandardMaterial = null
  private changedOldMateria: SpeckleStandardMaterial = null
  private removedMaterial: SpeckleStandardMaterial = null

  public constructor(batcher: Batcher) {
    this.batcher = batcher

    this.addedMaterial = new SpeckleStandardMaterial(
      {
        color: new Color('#00ff00'),
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        opacity: 1,
        side: FrontSide
      },
      ['USE_RTE']
    )
    this.addedMaterial.vertexColors = false
    this.addedMaterial.depthWrite = true
    this.addedMaterial.transparent = true
    this.addedMaterial.clipShadows = true
    this.addedMaterial.color.convertSRGBToLinear()

    this.changedNewMaterial = new SpeckleStandardMaterial(
      {
        color: new Color('#ffff00'),
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        opacity: 1,
        side: FrontSide
      },
      ['USE_RTE']
    )
    this.changedNewMaterial.vertexColors = false
    this.changedNewMaterial.transparent = true
    this.addedMaterial.depthWrite = true
    this.changedNewMaterial.clipShadows = true
    this.changedNewMaterial.color.convertSRGBToLinear()

    this.changedOldMateria = new SpeckleStandardMaterial(
      {
        color: new Color('#ffff00'),
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        opacity: 1,
        side: FrontSide
      },
      ['USE_RTE']
    )
    this.changedOldMateria.vertexColors = false
    this.changedOldMateria.transparent = true
    this.addedMaterial.depthWrite = true
    this.changedOldMateria.clipShadows = true
    this.changedOldMateria.color.convertSRGBToLinear()

    this.removedMaterial = new SpeckleStandardMaterial(
      {
        color: new Color('#ff0000'),
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        opacity: 1,
        side: FrontSide
      },
      ['USE_RTE']
    )
    this.removedMaterial.vertexColors = false
    this.removedMaterial.transparent = true
    this.addedMaterial.depthWrite = true
    this.removedMaterial.clipShadows = true
    this.removedMaterial.color.convertSRGBToLinear()
  }

  public diff(urlA: string, urlB: string): Promise<DiffResult> {
    const diffResult: DiffResult = {
      unchanged: [],
      added: [],
      removed: [],
      modifiedNew: [],
      modifiedOld: []
    }
    const renderTreeA = WorldTree.getRenderTree(urlA)
    const renderTreeB = WorldTree.getRenderTree(urlB)
    const rootA = WorldTree.getInstance().findId(urlA)
    const rootB = WorldTree.getInstance().findId(urlB)
    const rvsA = renderTreeA.getAtomicNodes(SpeckleType.Mesh)
    const rvsB = renderTreeB.getAtomicNodes(SpeckleType.Mesh)
    // console.log(rvsA.map((value: TreeNode) => value.model.raw.id))
    // console.log(rvsB.map((value: TreeNode) => value.model.raw.id))

    for (let k = 0; k < rvsB.length; k++) {
      // console.log('Node -> ', rvsB[k].model.raw.id)
      const res = rootA.first((node: TreeNode) => {
        return rvsB[k].model.raw.id === node.model.raw.id
      })
      if (res) {
        diffResult.unchanged.push(res)
      } else {
        const applicationId = rvsB[k].model.applicationId
          ? rvsB[k].model.raw.applicationId
          : rvsB[k].parent.model.raw.applicationId
        const res2 = rootA.first((node: TreeNode) => {
          return applicationId === node.model.raw.applicationId
        })
        if (res2) {
          diffResult.modifiedNew.push(rvsB[k])
        } else {
          diffResult.added.push(rvsB[k])
        }
      }
    }

    for (let k = 0; k < rvsA.length; k++) {
      // console.log('Node -> ', rvsB[k].model.raw.id)
      const res = rootB.first((node: TreeNode) => {
        return rvsA[k].model.raw.id === node.model.raw.id
      })
      if (!res) {
        const applicationId = rvsA[k].model.applicationId
          ? rvsA[k].model.raw.applicationId
          : rvsA[k].parent.model.raw.applicationId
        const res2 = rootB.first((node: TreeNode) => {
          return applicationId === node.model.raw.applicationId
        })
        if (!res2) diffResult.removed.push(rvsA[k])
        else diffResult.modifiedOld.push(rvsA[k])
      }
    }
    // this.setUserObjectColors([
    //   {
    //     objectIds: diffResult.added.map((value) => value.model.raw.id),
    //     color: '#00ff00'
    //   },
    //   {
    //     objectIds: diffResult.removed.map((value) => value.model.raw.id),
    //     color: '#ff0000'
    //   },
    //   {
    //     objectIds: diffResult.modifiedNew.map((value) => value.model.raw.id),
    //     color: '#ffff00'
    //   },
    //   {
    //     objectIds: diffResult.modifiedOld.map((value) => value.model.raw.id),
    //     color: '#ffff00'
    //   }
    // ])
    // for (let k = 0; k < diffResult.modifiedOld.length; k++) {
    //   const rv: NodeRenderView = diffResult.modifiedOld[k].model.renderView
    //   const batch: MeshBatch = this.speckleRenderer.batcher.getBatch(rv) as MeshBatch
    //   batch.updateDiffOpacity(rv.vertStart, rv.vertEnd, 0.2)
    //   batch.renderObject.renderOrder = 1
    // }
    // for (let k = 0; k < diffResult.removed.length; k++) {
    //   const rv: NodeRenderView = diffResult.removed[k].model.renderView
    //   const batch: MeshBatch = this.speckleRenderer.batcher.getBatch(rv) as MeshBatch
    //   batch.updateDiffOpacity(rv.vertStart, rv.vertEnd, 0.2)
    //   batch.renderObject.renderOrder = 1
    // }

    console.warn(diffResult)
    return Promise.resolve(diffResult)
  }

  public visualDiff(diffResult: DiffResult) {
    const batches = []

    batches.push(
      ...this.batcher.setObjectsMaterial(
        diffResult.added.map((value) => value.model.renderView),
        (rv: NodeRenderView) => {
          return {
            offset: rv.batchStart,
            count: rv.batchCount,
            material: this.addedMaterial,
            materialOptions: null
          }
        }
      )
    )
    batches.push(
      ...this.batcher.setObjectsMaterial(
        diffResult.modifiedNew.map((value) => value.model.renderView),
        (rv: NodeRenderView) => {
          return {
            offset: rv.batchStart,
            count: rv.batchCount,
            material: this.changedNewMaterial,
            materialOptions: null
          }
        }
      )
    )
    batches.push(
      ...this.batcher.setObjectsMaterial(
        diffResult.modifiedOld.map((value) => value.model.renderView),
        (rv: NodeRenderView) => {
          return {
            offset: rv.batchStart,
            count: rv.batchCount,
            material: this.changedOldMateria,
            materialOptions: null
          }
        }
      )
    )
    batches.push(
      ...this.batcher.setObjectsMaterial(
        diffResult.removed.map((value) => value.model.renderView),
        (rv: NodeRenderView) => {
          return {
            offset: rv.batchStart,
            count: rv.batchCount,
            material: this.removedMaterial,
            materialOptions: null
          }
        }
      )
    )

    this.batcher.autoFillDrawRanges(batches)
  }

  public setDiffTime(time: number) {
    const from = Math.min(Math.max(1 - time, 0.2), 1)
    const to = Math.min(Math.max(time, 0.2), 1)
    this.addedMaterial.opacity = from
    this.changedNewMaterial.opacity = from
    this.changedOldMateria.opacity = to
    this.removedMaterial.opacity = to
    this.addedMaterial.depthWrite = from < 0.5 ? false : true
    this.changedNewMaterial.depthWrite = from < 0.5 ? false : true
    this.changedOldMateria.depthWrite = to < 0.5 ? false : true
    this.removedMaterial.depthWrite = to < 0.5 ? false : true
  }
}
