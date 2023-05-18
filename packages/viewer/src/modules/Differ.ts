import { Color, FrontSide } from 'three'
import { SpeckleTypeAllRenderables } from './converter/GeometryConverter'
import SpeckleStandardMaterial from './materials/SpeckleStandardMaterial'
import { TreeNode, WorldTree } from './tree/WorldTree'
import SpecklePointMaterial from './materials/SpecklePointMaterial'
import { GeometryType } from './batching/Batch'
import SpeckleLineMaterial from './materials/SpeckleLineMaterial'
import Logger from 'js-logger'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeckleObject = Record<string, any>
type SpeckleMaterialType =
  | SpeckleStandardMaterial
  | SpecklePointMaterial
  | SpeckleLineMaterial

export enum VisualDiffMode {
  PLAIN,
  COLORED
}

export interface DiffResult {
  unchanged: Array<SpeckleObject>
  added: Array<SpeckleObject>
  removed: Array<SpeckleObject>
  modified: Array<Array<SpeckleObject>>
}

export class Differ {
  private tree: WorldTree = null

  private addedMaterialMesh: SpeckleStandardMaterial = null
  private changedNewMaterialMesh: SpeckleStandardMaterial = null
  private changedOldMaterialMesh: SpeckleStandardMaterial = null
  private removedMaterialMesh: SpeckleStandardMaterial = null

  private addedMaterialPoint: SpecklePointMaterial = null
  private changedNewMaterialPoint: SpecklePointMaterial = null
  private changedOldMaterialPoint: SpecklePointMaterial = null
  private removedMaterialPoint: SpecklePointMaterial = null

  /** Urgh, state */
  private addedMaterials: Array<SpeckleMaterialType> = []
  private changedOldMaterials: Array<SpeckleMaterialType> = []
  private changedNewMaterials: Array<SpeckleMaterialType> = []
  private removedMaterials: Array<SpeckleMaterialType> = []

  private _materialGroups = null

  public get materialGroups() {
    return this._materialGroups
  }

  public constructor(tree: WorldTree) {
    this.tree = tree

    this.addedMaterialMesh = new SpeckleStandardMaterial(
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
    this.addedMaterialMesh.vertexColors = false
    this.addedMaterialMesh.depthWrite = true
    this.addedMaterialMesh.transparent = true
    this.addedMaterialMesh.clipShadows = true
    this.addedMaterialMesh.color.convertSRGBToLinear()

    this.changedNewMaterialMesh = new SpeckleStandardMaterial(
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
    this.changedNewMaterialMesh.vertexColors = false
    this.changedNewMaterialMesh.transparent = true
    this.addedMaterialMesh.depthWrite = true
    this.changedNewMaterialMesh.clipShadows = true
    this.changedNewMaterialMesh.color.convertSRGBToLinear()

    this.changedOldMaterialMesh = new SpeckleStandardMaterial(
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
    this.changedOldMaterialMesh.vertexColors = false
    this.changedOldMaterialMesh.transparent = true
    this.addedMaterialMesh.depthWrite = true
    this.changedOldMaterialMesh.clipShadows = true
    this.changedOldMaterialMesh.color.convertSRGBToLinear()

    this.removedMaterialMesh = new SpeckleStandardMaterial(
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
    this.removedMaterialMesh.vertexColors = false
    this.removedMaterialMesh.transparent = true
    this.addedMaterialMesh.depthWrite = true
    this.removedMaterialMesh.clipShadows = true
    this.removedMaterialMesh.color.convertSRGBToLinear()

    this.addedMaterialPoint = new SpecklePointMaterial(
      {
        color: 0x00ff00,
        vertexColors: false,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    this.addedMaterialPoint.transparent = true
    this.addedMaterialPoint.color.convertSRGBToLinear()
    this.addedMaterialPoint.toneMapped = false

    this.changedNewMaterialPoint = new SpecklePointMaterial(
      {
        color: 0xffff00,
        vertexColors: false,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    this.changedNewMaterialPoint.transparent = true
    this.changedNewMaterialPoint.color.convertSRGBToLinear()
    this.changedNewMaterialPoint.toneMapped = false

    this.changedOldMaterialPoint = new SpecklePointMaterial(
      {
        color: 0xffff00,
        vertexColors: false,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    this.changedOldMaterialPoint.transparent = true
    this.changedOldMaterialPoint.color.convertSRGBToLinear()
    this.changedOldMaterialPoint.toneMapped = false

    this.removedMaterialPoint = new SpecklePointMaterial(
      {
        color: 0xff0000,
        vertexColors: false,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    this.removedMaterialPoint.transparent = true
    this.removedMaterialPoint.color.convertSRGBToLinear()
    this.removedMaterialPoint.toneMapped = false
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

    const renderTreeA = this.tree.getRenderTree(urlA)
    const renderTreeB = this.tree.getRenderTree(urlB)
    const rootA = this.tree.findId(urlA)
    const rootB = this.tree.findId(urlB)
    let rvsA = renderTreeA.getRenderableNodes(...SpeckleTypeAllRenderables)
    let rvsB = renderTreeB.getRenderableNodes(...SpeckleTypeAllRenderables)

    rvsA = rvsA.map((value) => {
      return renderTreeA.getAtomicParent(value)
    })

    rvsB = rvsB.map((value) => {
      return renderTreeB.getAtomicParent(value)
    })

    for (let k = 0; k < rvsB.length; k++) {
      const res = rootA.first((node: TreeNode) => {
        return rvsB[k].model.raw.id === node.model.raw.id
      })
      if (res) {
        diffResult.unchanged.push(res)
      } else {
        const applicationId = rvsB[k].model.raw.applicationId
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
        const applicationId = rvsA[k].model.raw.applicationId
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
      value
      diffResult.modified.push([modifiedOld[index], modifiedNew[index]])
    })

    console.warn(diffResult)
    return Promise.resolve(diffResult)
  }

  public setDiffTime(time: number) {
    const from = Math.min(Math.max(1 - time, 0.2), 1)
    const to = Math.min(Math.max(time, 0.2), 1)

    this.addedMaterials.forEach((mat) => {
      mat.opacity = from
      mat.depthWrite = from < 0.5 ? false : true
    })

    this.changedOldMaterials.forEach((mat) => {
      mat.opacity = to
      mat.depthWrite = to < 0.5 ? false : true
    })

    this.changedNewMaterials.forEach((mat) => {
      mat.opacity = from
      mat.depthWrite = from < 0.5 ? false : true
    })

    this.removedMaterials.forEach((mat) => {
      mat.opacity = to
      mat.depthWrite = to < 0.5 ? false : true
    })
  }

  public buildMaterialGroups(
    mode: VisualDiffMode,
    diffResult: DiffResult,
    batchMaterials?: {
      [id: string]: SpeckleStandardMaterial | SpecklePointMaterial | SpeckleLineMaterial
    }
  ) {
    switch (mode) {
      case VisualDiffMode.COLORED:
        this._materialGroups = this.getColoredMaterialGroups(diffResult)
        break
      case VisualDiffMode.PLAIN:
        this._materialGroups = this.getPlainMaterialGroups(diffResult, batchMaterials)
        break
      default:
        Logger.error(`Unsupported visual diff mode ${mode}`)
    }
    return this._materialGroups
  }

  public resetMaterialGroups() {
    this._materialGroups = null
    this.addedMaterials = []
    this.changedOldMaterials = []
    this.changedNewMaterials = []
    this.removedMaterials = []
  }

  private getColoredMaterialGroups(diffResult: DiffResult) {
    const renderTree = this.tree.getRenderTree()
    const groups = [
      // MESHES & LINES
      // Currently lines work with mesh specific materials due to how the LineBatch is implemented.
      // We could use specific line materials, but it won't make a difference until we elevate the
      // LineBatch a bit
      {
        objectIds: diffResult.added
          .filter((value: TreeNode) => {
            const rv = renderTree.getRenderViewsForNode(value as TreeNode)[0]
            return (
              rv.geometryType === GeometryType.MESH ||
              rv.geometryType === GeometryType.LINE
            )
          })
          .map((value): string => value.model.raw.id),
        material: this.addedMaterialMesh
      },
      {
        objectIds: diffResult.modified
          .filter((value) => {
            const rv = renderTree.getRenderViewsForNode(value[1] as TreeNode)[0]
            return (
              rv.geometryType === GeometryType.MESH ||
              rv.geometryType === GeometryType.LINE
            )
          })
          .map((value): string => value[1].model.raw.id),
        material: this.changedNewMaterialMesh
      },
      {
        objectIds: diffResult.modified
          .filter((value) => {
            const rv = renderTree.getRenderViewsForNode(value[0] as TreeNode)[0]
            return (
              rv.geometryType === GeometryType.MESH ||
              rv.geometryType === GeometryType.LINE
            )
          })
          .map((value): string => value[0].model.raw.id),
        material: this.changedOldMaterialMesh
      },
      {
        objectIds: diffResult.removed
          .filter((value: TreeNode) => {
            const rv = renderTree.getRenderViewsForNode(value as TreeNode)[0]
            return (
              rv.geometryType === GeometryType.MESH ||
              rv.geometryType === GeometryType.LINE
            )
          })
          .map((value): string => value.model.raw.id),
        material: this.removedMaterialMesh
      },

      // POINTS
      {
        objectIds: diffResult.added
          .filter((value: TreeNode) => {
            const rv = renderTree.getRenderViewsForNode(value as TreeNode)[0]
            return (
              rv.geometryType === GeometryType.POINT ||
              rv.geometryType === GeometryType.POINT_CLOUD
            )
          })
          .map((value): string => value.model.raw.id),
        material: this.addedMaterialPoint
      },
      {
        objectIds: diffResult.modified
          .filter((value) => {
            const rv = renderTree.getRenderViewsForNode(value[1] as TreeNode)[0]
            return (
              rv.geometryType === GeometryType.POINT ||
              rv.geometryType === GeometryType.POINT_CLOUD
            )
          })
          .map((value): string => value[1].model.raw.id),
        material: this.changedNewMaterialPoint
      },
      {
        objectIds: diffResult.modified
          .filter((value) => {
            const rv = renderTree.getRenderViewsForNode(value[0] as TreeNode)[0]
            return (
              rv.geometryType === GeometryType.POINT ||
              rv.geometryType === GeometryType.POINT_CLOUD
            )
          })
          .map((value): string => value[0].model.raw.id),
        material: this.changedOldMaterialPoint
      },
      {
        objectIds: diffResult.removed
          .filter((value: TreeNode) => {
            const rv = renderTree.getRenderViewsForNode(value as TreeNode)[0]
            return (
              rv.geometryType === GeometryType.POINT ||
              rv.geometryType === GeometryType.POINT_CLOUD
            )
          })
          .map((value): string => value.model.raw.id),
        material: this.removedMaterialPoint
      }
    ]
    this.addedMaterials.push(this.addedMaterialMesh, this.addedMaterialPoint)
    this.changedOldMaterials.push(
      this.changedOldMaterialMesh,
      this.changedOldMaterialPoint
    )
    this.changedNewMaterials.push(
      this.changedNewMaterialMesh,
      this.changedNewMaterialPoint
    )
    this.removedMaterials.push(this.removedMaterialMesh, this.removedMaterialPoint)

    return groups.filter((value) => value.objectIds.length > 0)
  }

  private getPlainMaterialGroups(
    diffResult: DiffResult,
    batchMaterials: {
      [id: string]: SpeckleStandardMaterial | SpecklePointMaterial | SpeckleLineMaterial
    }
  ) {
    const added = this.getBatchesSubgroups(diffResult.added, batchMaterials)
    const changedOld = this.getBatchesSubgroups(
      diffResult.modified.map((value) => value[0]),
      batchMaterials
    )
    const changedNew = this.getBatchesSubgroups(
      diffResult.modified.map((value) => value[1]),
      batchMaterials
    )
    const removed = this.getBatchesSubgroups(diffResult.removed, batchMaterials)
    this.addedMaterials = added.map((value) => value.material)
    this.changedOldMaterials = changedOld.map((value) => value.material)
    this.changedNewMaterials = changedNew.map((value) => value.material)
    this.removedMaterials = removed.map((value) => value.material)
    return [...added, ...changedOld, ...changedNew, ...removed]
  }

  private getBatchesSubgroups(
    subgroup: Array<SpeckleObject>,
    batchMaterials: {
      [id: string]: SpeckleStandardMaterial | SpecklePointMaterial | SpeckleLineMaterial
    }
  ) {
    const renderTree = this.tree.getRenderTree()
    const groupBatches: Array<string> = [
      ...Array.from(
        new Set(
          subgroup.flatMap(
            (value) => renderTree.getRenderViewsForNode(value as TreeNode)[0].batchId
          )
        )
      )
    ] as Array<string>

    const materialGroup = []
    for (let k = 0; k < groupBatches.length; k++) {
      const matClone = batchMaterials[groupBatches[k]].clone()
      matClone.opacity = 0.5
      matClone.transparent = true
      materialGroup.push({
        objectIds: subgroup
          .filter(
            (value) =>
              renderTree.getRenderViewsForNode(value as TreeNode)[0].batchId ===
              groupBatches[k]
          )
          .map((value) => value.model.raw.id),
        material: matClone
      })
    }

    return materialGroup
  }
}
