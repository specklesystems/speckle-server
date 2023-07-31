/* eslint-disable @typescript-eslint/no-unused-vars */
import { Color, FrontSide } from 'three'
import { SpeckleTypeAllRenderables } from './converter/GeometryConverter'
import SpeckleStandardMaterial from './materials/SpeckleStandardMaterial'
import { TreeNode, WorldTree } from './tree/WorldTree'
import SpecklePointMaterial from './materials/SpecklePointMaterial'
import { GeometryType } from './batching/Batch'
import SpeckleLineMaterial from './materials/SpeckleLineMaterial'
import Logger from 'js-logger'
import { NodeRenderView } from './tree/NodeRenderView'
import _, { omit } from 'underscore'

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

interface VisualDiffResult {
  unchanged: Array<NodeRenderView>
  added: Array<NodeRenderView>
  removed: Array<NodeRenderView>
  modifiedOld: Array<NodeRenderView>
  modifiedNew: Array<NodeRenderView>
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

  private intersection(o1, o2) {
    const [k1, k2] = [Object.keys(o1), Object.keys(o2)]
    const [first, next] = k1.length > k2.length ? [k2, o1] : [k1, o2]
    return first.filter((k) => k in next)
  }

  private buildIdMaps(
    rvs: Array<TreeNode>,
    idMap: { [id: string]: { node: TreeNode; applicationId: string } },
    appIdMap: { [id: string]: number }
  ) {
    for (let k = 0; k < rvs.length; k++) {
      const atomicRv = rvs[k]
      const applicationId = atomicRv.model.raw.applicationId
        ? atomicRv.model.raw.applicationId
        : this.tree
            .getAncestors(atomicRv)
            .find((value) => value.model.raw.applicationId)?.model.raw.applicationId

      idMap[atomicRv.model.raw.id] = {
        node: atomicRv,
        applicationId
      }
      if (applicationId) {
        appIdMap[applicationId] = 1
      }
    }
  }

  public diff(urlA: string, urlB: string): Promise<DiffResult> {
    return this.diffIterative(urlA, urlB)
  }

  private diffBoolean(urlA: string, urlB: string): Promise<DiffResult> {
    const start = performance.now()
    const diffResult: DiffResult = {
      unchanged: [],
      added: [],
      removed: [],
      modified: []
    }

    const renderTreeA = this.tree.getRenderTree(urlA)
    const renderTreeB = this.tree.getRenderTree(urlB)
    let rvsA = renderTreeA.getRenderableNodes(...SpeckleTypeAllRenderables)
    let rvsB = renderTreeB.getRenderableNodes(...SpeckleTypeAllRenderables)

    rvsA = rvsA.map((value) => {
      return renderTreeA.getAtomicParent(value)
    })

    rvsB = rvsB.map((value) => {
      return renderTreeB.getAtomicParent(value)
    })

    rvsA = [...Array.from(new Set(rvsA))]
    rvsB = [...Array.from(new Set(rvsB))]

    const idMapA = {}
    const appIdMapA = {}
    this.buildIdMaps(rvsA, idMapA, appIdMapA)

    const idMapB = {}
    const appIdMapB = {}
    this.buildIdMaps(rvsB, idMapB, appIdMapB)

    /** Get the ids which are common between the two maps. This will be objects
     *  which have not changed
     */
    const unchanged: Array<string> = this.intersection(idMapA, idMapB)
    /** We remove the unchanged objects from B and end up with changed + added */
    const addedModified = _.omit(idMapB, unchanged)
    /** We remove the unchanged objects from A and end up with changed + removed */
    const removedModified = _.omit(idMapA, unchanged)
    /** We remove the changed objects from B. An object from B is changed if
     *  it's application ID exists in A
     */
    const added = _.omit(addedModified, function (value, key, object) {
      return value.applicationId && appIdMapA[value.applicationId] !== undefined
    })
    /** We remove the changed objects from A. An object from A is changed if
     *  it's application ID exists in B
     */
    const removed = _.omit(removedModified, function (value, key, object) {
      return value.applicationId && appIdMapB[value.applicationId] !== undefined
    })
    /** We remove the removed objects from A, leaving us only changed objects */
    const modifiedRemoved = _.omit(removedModified, Object.keys(removed))
    /** We remove the removed objects from B, leaving us only changed objects */
    const modifiedAdded = _.omit(addedModified, Object.keys(added))

    /** We fill the arrays from here on out */
    const modifiedOld = Object.values(modifiedRemoved).map(
      (value: { node: TreeNode }) => value.node
    )
    const modifiedNew = Object.values(modifiedAdded).map(
      (value: { node: TreeNode }) => value.node
    )
    diffResult.unchanged.push(...unchanged.map((value) => idMapA[value].node))
    diffResult.unchanged.push(...unchanged.map((value) => idMapB[value].node))
    diffResult.removed.push(
      ...Object.values(removed).map((value: { node: TreeNode }) => value.node)
    )
    diffResult.added.push(
      ...Object.values(added).map((value: { node: TreeNode }) => value.node)
    )

    modifiedOld.forEach((value, index) => {
      value
      diffResult.modified.push([modifiedOld[index], modifiedNew[index]])
    })
    console.warn('Boolean Time -> ', performance.now() - start)
    return Promise.resolve(diffResult)
  }

  private diffIterative(urlA: string, urlB: string): Promise<DiffResult> {
    const start = performance.now()
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
    let rvsA = renderTreeA.getRenderableNodes(...SpeckleTypeAllRenderables)
    let rvsB = renderTreeB.getRenderableNodes(...SpeckleTypeAllRenderables)

    rvsA = rvsA.map((value) => {
      return renderTreeA.getAtomicParent(value)
    })

    rvsB = rvsB.map((value) => {
      return renderTreeB.getAtomicParent(value)
    })

    rvsA = [...Array.from(new Set(rvsA))]
    rvsB = [...Array.from(new Set(rvsB))]

    const idMapA = {}
    const appIdMapA = {}
    this.buildIdMaps(rvsA, idMapA, appIdMapA)

    const idMapB = {}
    const appIdMapB = {}
    this.buildIdMaps(rvsB, idMapB, appIdMapB)

    for (let k = 0; k < rvsB.length; k++) {
      const res = idMapA[rvsB[k].model.raw.id]?.node

      if (res) {
        diffResult.unchanged.push(res)
      } else {
        const applicationId = idMapB[rvsB[k].model.raw.id].applicationId
        if (!applicationId) {
          Logger.error(
            `No application ID found. Object id:${rvsB[k].model.raw.id} is considered 'added'!`
          )
          diffResult.added.push(rvsB[k])
          continue
        }
        const res2 = appIdMapA[applicationId]
        if (res2) {
          modifiedNew.push(rvsB[k])
        } else {
          diffResult.added.push(rvsB[k])
        }
      }
    }
    for (let k = 0; k < rvsA.length; k++) {
      const res = idMapB[rvsA[k].model.raw.id]?.node
      if (!res) {
        const applicationId = idMapA[rvsA[k].model.raw.id].applicationId
        if (!applicationId) {
          Logger.error(
            `No application ID found. Object id:${rvsA[k].model.raw.id} is considered 'removed'!`
          )
          diffResult.removed.push(rvsA[k])
          continue
        }
        const res2 = appIdMapB[applicationId]
        if (!res2) {
          diffResult.removed.push(rvsA[k])
        } else {
          modifiedOld.push(rvsA[k])
        }
      } else {
        diffResult.unchanged.push(res)
      }
    }
    modifiedOld.forEach((value, index) => {
      value
      diffResult.modified.push([modifiedOld[index], modifiedNew[index]])
    })
    console.warn('Interative Time -> ', performance.now() - start)
    return Promise.resolve(diffResult)
  }

  public setDiffTime(time: number) {
    const from = Math.min(Math.max(1 - time, 0), 1)
    const to = Math.min(Math.max(time, 0), 1)

    this.addedMaterials.forEach((mat) => {
      mat.opacity =
        mat['clampOpacity'] !== undefined ? Math.min(from, mat['clampOpacity']) : from
      mat.depthWrite = from < 0.5 ? false : true
      mat.transparent = mat.opacity < 1
    })

    this.changedOldMaterials.forEach((mat) => {
      mat.opacity =
        mat['clampOpacity'] !== undefined ? Math.min(to, mat['clampOpacity']) : to
      mat.depthWrite = to < 0.5 ? false : true
      mat.transparent = mat.opacity < 1
    })

    this.changedNewMaterials.forEach((mat) => {
      mat.opacity =
        mat['clampOpacity'] !== undefined ? Math.min(from, mat['clampOpacity']) : from
      mat.depthWrite = from < 0.5 ? false : true
      mat.transparent = mat.opacity < 1
    })

    this.removedMaterials.forEach((mat) => {
      mat.opacity =
        mat['clampOpacity'] !== undefined ? Math.min(to, mat['clampOpacity']) : to
      mat.depthWrite = to < 0.5 ? false : true
      mat.transparent = mat.opacity < 1
    })
  }

  public buildMaterialGroups(
    mode: VisualDiffMode,
    diffResult: DiffResult,
    batchMaterials?: {
      [id: string]: SpeckleStandardMaterial | SpecklePointMaterial | SpeckleLineMaterial
    }
  ) {
    const start = performance.now()
    switch (mode) {
      case VisualDiffMode.COLORED:
        this._materialGroups = this.getColoredMaterialGroups(
          this.getVisualDiffResult(diffResult)
        )
        break
      case VisualDiffMode.PLAIN:
        this._materialGroups = this.getPlainMaterialGroups(
          this.getVisualDiffResult(diffResult),
          batchMaterials
        )
        break
      default:
        Logger.error(`Unsupported visual diff mode ${mode}`)
    }
    console.warn('Material groups -> ', performance.now() - start)
    return this._materialGroups
  }

  public resetMaterialGroups() {
    this._materialGroups = null
    this.addedMaterials = []
    this.changedOldMaterials = []
    this.changedNewMaterials = []
    this.removedMaterials = []
  }

  private getVisualDiffResult(diffResult: DiffResult): VisualDiffResult {
    const renderTree = this.tree.getRenderTree()

    const addedRvs = diffResult.added.flatMap((value) => {
      return renderTree.getRenderViewsForNode(value as TreeNode, value as TreeNode)
    })
    const removedRvs = diffResult.removed.flatMap((value) => {
      return renderTree.getRenderViewsForNode(value as TreeNode, value as TreeNode)
    })
    const unchangedRvs = diffResult.unchanged.flatMap((value) => {
      return renderTree.getRenderViewsForNode(value as TreeNode, value as TreeNode)
    })

    const modifiedOldRvs = diffResult.modified
      .flatMap((value) => {
        return renderTree.getRenderViewsForNode(
          value[0] as TreeNode,
          value[0] as TreeNode
        )
      })
      .filter((value) => {
        return !unchangedRvs.includes(value) && !removedRvs.includes(value)
      })
    const modifiedNewRvs = diffResult.modified
      .flatMap((value) => {
        return renderTree.getRenderViewsForNode(
          value[1] as TreeNode,
          value[1] as TreeNode
        )
      })
      .filter((value) => {
        return !unchangedRvs.includes(value) && !addedRvs.includes(value)
      })

    return {
      unchanged: unchangedRvs,
      added: addedRvs,
      removed: removedRvs,
      modifiedOld: modifiedOldRvs,
      modifiedNew: modifiedNewRvs
    }
  }

  private getColoredMaterialGroups(visualDiffResult: VisualDiffResult) {
    const groups = [
      // MESHES & LINES
      // Currently lines work with mesh specific materials due to how the LineBatch is implemented.
      // We could use specific line materials, but it won't make a difference until we elevate the
      // LineBatch a bit

      {
        objectIds: [],
        rvs: visualDiffResult.added.filter(
          (value) =>
            value.geometryType === GeometryType.MESH ||
            value.geometryType === GeometryType.LINE
        ),
        material: this.addedMaterialMesh
      },
      {
        objectIds: [],
        rvs: visualDiffResult.modifiedNew.filter(
          (value) =>
            value.geometryType === GeometryType.MESH ||
            value.geometryType === GeometryType.LINE
        ),
        material: this.changedNewMaterialMesh
      },
      {
        objectIds: [],
        rvs: visualDiffResult.modifiedOld.filter(
          (value) =>
            value.geometryType === GeometryType.MESH ||
            value.geometryType === GeometryType.LINE
        ),
        material: this.changedOldMaterialMesh
      },
      {
        objectIds: [],
        rvs: visualDiffResult.removed.filter(
          (value) =>
            value.geometryType === GeometryType.MESH ||
            value.geometryType === GeometryType.LINE
        ),
        material: this.removedMaterialMesh
      },
      //POINTS
      {
        objectIds: [],
        rvs: visualDiffResult.added.filter(
          (value) =>
            value.geometryType === GeometryType.POINT ||
            value.geometryType === GeometryType.POINT_CLOUD
        ),
        material: this.addedMaterialPoint
      },
      {
        objectIds: [],
        rvs: visualDiffResult.modifiedNew.filter(
          (value) =>
            value.geometryType === GeometryType.POINT ||
            value.geometryType === GeometryType.POINT_CLOUD
        ),
        material: this.changedNewMaterialPoint
      },
      {
        objectIds: [],
        rvs: visualDiffResult.modifiedOld.filter(
          (value) =>
            value.geometryType === GeometryType.POINT ||
            value.geometryType === GeometryType.POINT_CLOUD
        ),
        material: this.changedOldMaterialPoint
      },
      {
        objectIds: [],
        rvs: visualDiffResult.removed.filter(
          (value) =>
            value.geometryType === GeometryType.POINT ||
            value.geometryType === GeometryType.POINT_CLOUD
        ),
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

    return groups.filter((value) => value.rvs.length > 0)
  }

  private getPlainMaterialGroups(
    visualDiffResult: VisualDiffResult,
    batchMaterials: {
      [id: string]: SpeckleStandardMaterial | SpecklePointMaterial | SpeckleLineMaterial
    }
  ) {
    const added = this.getBatchesSubgroups(visualDiffResult.added, batchMaterials)
    const changedOld = this.getBatchesSubgroups(
      visualDiffResult.modifiedOld,
      batchMaterials
    )
    const changedNew = this.getBatchesSubgroups(
      visualDiffResult.modifiedNew,
      batchMaterials
    )
    const removed = this.getBatchesSubgroups(visualDiffResult.removed, batchMaterials)
    this.addedMaterials = added.map((value) => value.material)
    this.changedOldMaterials = changedOld.map((value) => value.material)
    this.changedNewMaterials = changedNew.map((value) => value.material)
    this.removedMaterials = removed.map((value) => value.material)
    return [...added, ...changedOld, ...changedNew, ...removed]
  }

  private getBatchesSubgroups(
    subgroup: Array<NodeRenderView>,
    batchMaterials: {
      [id: string]: SpeckleStandardMaterial | SpecklePointMaterial | SpeckleLineMaterial
    }
  ) {
    const groupBatches: Array<string> = [
      ...Array.from(new Set(subgroup.map((value) => value.batchId)))
    ] as Array<string>

    const materialGroup = []
    for (let k = 0; k < groupBatches.length; k++) {
      const matClone = batchMaterials[groupBatches[k]].clone()
      matClone['clampOpacity'] = matClone.opacity
      matClone.opacity = 0.5
      matClone.transparent = true
      materialGroup.push({
        objectIds: [],
        rvs: subgroup.filter((value) => value.batchId === groupBatches[k]),
        material: matClone
      })
    }

    return materialGroup
  }
}
