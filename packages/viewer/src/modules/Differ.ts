import { Color, FrontSide } from 'three'
import { SpeckleType } from './converter/GeometryConverter'
import { FilteringManager } from './filtering/FilteringManager'
import SpeckleStandardMaterial from './materials/SpeckleStandardMaterial'
import { TreeNode, WorldTree } from './tree/WorldTree'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeckleObject = Record<string, any>

export interface DiffResult {
  unchanged: Array<SpeckleObject>
  added: Array<SpeckleObject>
  removed: Array<SpeckleObject>
  modified: Array<Array<SpeckleObject>>
}

export class Differ {
  private addedMaterial: SpeckleStandardMaterial = null
  private changedNewMaterial: SpeckleStandardMaterial = null
  private changedOldMateria: SpeckleStandardMaterial = null
  private removedMaterial: SpeckleStandardMaterial = null

  public constructor() {
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
    const modifiedNew: Array<SpeckleObject> = []
    const modifiedOld: Array<SpeckleObject> = []

    const diffResult: DiffResult = {
      unchanged: [],
      added: [],
      removed: [],
      modified: []
    }

    const renderTreeA = WorldTree.getRenderTree(urlA)
    const renderTreeB = WorldTree.getRenderTree(urlB)
    const rootA = WorldTree.getInstance().findId(urlA)
    const rootB = WorldTree.getInstance().findId(urlB)
    const rvsA = renderTreeA.getAtomicNodes(SpeckleType.Mesh)
    const rvsB = renderTreeB.getAtomicNodes(SpeckleType.Mesh)

    for (let k = 0; k < rvsB.length; k++) {
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
          modifiedNew.push(rvsB[k])
        } else {
          diffResult.added.push(rvsB[k])
        }
      }
    }

    for (let k = 0; k < rvsA.length; k++) {
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
        else modifiedOld.push(rvsA[k])
      }
    }

    modifiedOld.forEach((value, index) => {
      diffResult.modified.push([modifiedOld[index], modifiedNew[index]])
    })

    console.warn(diffResult)
    return Promise.resolve(diffResult)
  }

  public visualDiff(diffResult: DiffResult, filterManager: FilteringManager) {
    if (diffResult === null) {
      filterManager.removeUserMaterials()
      return
    }

    filterManager.setUserMaterials([
      {
        objectIds: diffResult.added.map((value) => value.model.raw.id),
        material: this.addedMaterial
      },
      {
        objectIds: diffResult.modified.map((value) => value[1].model.raw.id),
        material: this.changedNewMaterial
      },
      {
        objectIds: diffResult.modified.map((value) => value[0].model.raw.id),
        material: this.changedOldMateria
      },
      {
        objectIds: diffResult.removed.map((value) => value.model.raw.id),
        material: this.removedMaterial
      }
    ])
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
