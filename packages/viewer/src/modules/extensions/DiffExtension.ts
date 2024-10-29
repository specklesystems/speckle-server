import { Color, DoubleSide, FrontSide, Material } from 'three'
import { type TreeNode, WorldTree } from '../tree/WorldTree.js'
import Logger from '../utils/Logger.js'
import { groupBy } from 'lodash-es'
import { GeometryType } from '../batching/Batch.js'
import SpeckleLineMaterial from '../materials/SpeckleLineMaterial.js'
import SpecklePointMaterial from '../materials/SpecklePointMaterial.js'
import SpeckleStandardMaterial from '../materials/SpeckleStandardMaterial.js'
import { NodeRenderView } from '../tree/NodeRenderView.js'
import { type IViewer } from '../../IViewer.js'
import { Extension } from './Extension.js'
import { SpeckleTypeAllRenderables } from '../loaders/GeometryConverter.js'
import { SpeckleLoader } from '../loaders/Speckle/SpeckleLoader.js'
import { GPass } from '../pipeline/Passes/GPass.js'
import { DepthPass } from '../pipeline/Passes/DepthPass.js'

type SpeckleMaterialType =
  | SpeckleStandardMaterial
  | SpecklePointMaterial
  | SpeckleLineMaterial

export enum VisualDiffMode {
  PLAIN,
  COLORED
}

export interface DiffResult {
  unchanged: Array<TreeNode>
  added: Array<TreeNode>
  removed: Array<TreeNode>
  modified: Array<Array<TreeNode>>
}

interface VisualDiffResult {
  unchanged: Array<NodeRenderView>
  added: Array<NodeRenderView>
  removed: Array<NodeRenderView>
  modifiedOld: Array<NodeRenderView>
  modifiedNew: Array<NodeRenderView>
}

export class DiffExtension extends Extension {
  public get enabled(): boolean {
    return this._enabled
  }

  public set enabled(value: boolean) {
    this._enabled = value
  }

  protected tree: WorldTree
  private addedMaterialMesh: SpeckleStandardMaterial
  private changedNewMaterialMesh: SpeckleStandardMaterial
  private changedOldMaterialMesh: SpeckleStandardMaterial
  private removedMaterialMesh: SpeckleStandardMaterial

  private addedMaterialPoint: SpecklePointMaterial
  private changedNewMaterialPoint: SpecklePointMaterial
  private changedOldMaterialPoint: SpecklePointMaterial
  private removedMaterialPoint: SpecklePointMaterial

  private addedMaterials: Array<SpeckleMaterialType> = []
  private changedOldMaterials: Array<SpeckleMaterialType> = []
  private changedNewMaterials: Array<SpeckleMaterialType> = []
  private removedMaterials: Array<SpeckleMaterialType> = []

  private _materialGroups:
    | {
        rvs: NodeRenderView[]
        material: SpeckleMaterialType
      }[]
    | null

  private _visualDiff!: VisualDiffResult
  private _diffTime = -1
  private _diffMode: VisualDiffMode = VisualDiffMode.COLORED

  public constructor(viewer: IViewer) {
    super(viewer)
    this.tree = viewer.getWorldTree()

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

  private dynamicallyLoadedDiffResources = [] as string[]
  public async diff(
    urlA: string,
    urlB: string,
    mode: VisualDiffMode,
    authToken?: string
  ): Promise<DiffResult> {
    const loadPromises = []
    this.dynamicallyLoadedDiffResources = []

    if (!this.tree.findId(urlA)) {
      loadPromises.push(
        this.viewer.loadObject(
          new SpeckleLoader(this.viewer.getWorldTree(), urlA, authToken),
          false
        )
      )
      this.dynamicallyLoadedDiffResources.push(urlA)
    }
    if (!this.tree.findId(urlB)) {
      loadPromises.push(
        this.viewer.loadObject(
          new SpeckleLoader(this.viewer.getWorldTree(), urlB, authToken),
          false
        )
      )
      this.dynamicallyLoadedDiffResources.push(urlB)
    }
    await Promise.all(loadPromises)

    const diffResult = await this.getDiff(urlA, urlB)

    const depthPasses = this.viewer.getRenderer().pipeline.getPass('DEPTH')
    depthPasses.forEach((value: GPass) => {
      ;(value as DepthPass).depthSide = FrontSide
    })

    this.updateVisualDiff(0, mode)

    return Promise.resolve(diffResult)
  }

  /** Currently, the diff does not store the existing materials. We can do that if we need to */
  public async undiff(): Promise<void> {
    const depthPasses = this.viewer.getRenderer().pipeline.getPass('DEPTH')
    depthPasses.forEach((value: GPass) => {
      ;(value as DepthPass).depthSide = DoubleSide
    })
    this.resetMaterialGroups()
    this.viewer.getRenderer().resetMaterials()

    const unloadPromises = []
    if (this.dynamicallyLoadedDiffResources.length !== 0) {
      for (const id of this.dynamicallyLoadedDiffResources)
        unloadPromises.push(this.viewer.unloadObject(id))
    }
    this.dynamicallyLoadedDiffResources = []
    await Promise.all(unloadPromises)
  }

  private buildIdMaps(
    rvs: Array<TreeNode>,
    idMap: { [id: string]: { node: TreeNode; applicationId: string } },
    appIdMap: { [id: string]: TreeNode }
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
        appIdMap[applicationId] = atomicRv
      }
    }
  }

  private async getDiff(urlA: string, urlB: string): Promise<DiffResult> {
    const diffResult = await this.diffIterative(urlA, urlB)
    this._visualDiff = this.getVisualDiffResult(diffResult)
    return Promise.resolve(diffResult)
  }

  private diffIterative(urlA: string, urlB: string): Promise<DiffResult> {
    const diffResult: DiffResult = {
      unchanged: [],
      added: [],
      removed: [],
      modified: []
    }

    const renderTreeA = this.tree.getRenderTree(urlA)
    const renderTreeB = this.tree.getRenderTree(urlB)
    if (!renderTreeA) {
      return Promise.reject(
        `Could not make diff. Resource ${urlA} could not be fetched`
      )
    }
    if (!renderTreeB) {
      return Promise.reject(
        `Could not make diff. Resource ${urlB} could not be fetched`
      )
    }
    let rvsA: TreeNode[] = renderTreeA.getRenderableNodes(...SpeckleTypeAllRenderables)
    let rvsB: TreeNode[] = renderTreeB.getRenderableNodes(...SpeckleTypeAllRenderables)

    rvsA = rvsA.map((value) => {
      return renderTreeA.getAtomicParent(value)
    })

    rvsB = rvsB.map((value) => {
      return renderTreeB.getAtomicParent(value)
    })

    rvsA = [...Array.from(new Set(rvsA))]
    rvsB = [...Array.from(new Set(rvsB))]

    const idMapA: { [id: string]: { node: TreeNode; applicationId: string } } = {}
    const appIdMapA: { [id: string]: TreeNode } = {}
    this.buildIdMaps(rvsA, idMapA, appIdMapA)

    const idMapB: { [id: string]: { node: TreeNode; applicationId: string } } = {}
    const appIdMapB: { [id: string]: TreeNode } = {}
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
          diffResult.modified.push([res2, rvsB[k]])
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
        }
      } else {
        diffResult.unchanged.push(res)
      }
    }

    return Promise.resolve(diffResult)
  }

  public updateVisualDiff(time?: number, mode?: VisualDiffMode): void {
    if ((mode !== undefined && mode !== this._diffMode) || !this._materialGroups) {
      this.resetMaterialGroups()
      /** Catering to typescript */
      if (mode !== undefined) {
        this.buildMaterialGroups(mode)
        this._diffMode = mode
      }
    }
    if (time !== undefined && time !== this._diffTime) {
      this.setDiffTime(time)
      this._diffTime = time
    }

    if (this._materialGroups)
      this._materialGroups.forEach((value) => {
        this.viewer.getRenderer().setMaterial(value.rvs, value.material)
      })
    this.viewer.requestRender()
  }

  private setDiffTime(time: number) {
    const from = Math.min(Math.max(1 - time, 0), 1)
    const to = Math.min(Math.max(time, 0), 1)

    this.addedMaterials.forEach((mat) => {
      mat.opacity =
        (mat as never)['clampOpacity'] !== undefined
          ? Math.min(from, (mat as never)['clampOpacity'])
          : from
      mat.depthWrite = from < 0.5 ? false : true
      mat.transparent = mat.opacity < 1
      mat.needsCopy = true
    })

    this.changedOldMaterials.forEach((mat) => {
      mat.opacity =
        (mat as never)['clampOpacity'] !== undefined
          ? Math.min(to, (mat as never)['clampOpacity'])
          : to
      mat.depthWrite = to < 0.5 ? false : true
      mat.transparent = mat.opacity < 1
      mat.needsCopy = true
    })

    this.changedNewMaterials.forEach((mat) => {
      mat.opacity =
        (mat as never)['clampOpacity'] !== undefined
          ? Math.min(from, (mat as never)['clampOpacity'])
          : from
      mat.depthWrite = from < 0.5 ? false : true
      mat.transparent = mat.opacity < 1
      mat.needsCopy = true
    })

    this.removedMaterials.forEach((mat) => {
      mat.opacity =
        (mat as never)['clampOpacity'] !== undefined
          ? Math.min(to, (mat as never)['clampOpacity'])
          : to
      mat.depthWrite = to < 0.5 ? false : true
      mat.transparent = mat.opacity < 1
      mat.needsCopy = true
    })
  }

  private buildMaterialGroups(mode: VisualDiffMode) {
    switch (mode) {
      case VisualDiffMode.COLORED:
        this._materialGroups = this.getColoredMaterialGroups(this._visualDiff)
        break
      case VisualDiffMode.PLAIN:
        this._materialGroups = this.getPlainMaterialGroups(this._visualDiff)
        break
      default:
        Logger.error(`Unsupported visual diff mode ${mode}`)
    }
  }

  private resetMaterialGroups() {
    this._materialGroups = null
    this.addedMaterials = []
    this.changedOldMaterials = []
    this.changedNewMaterials = []
    this.removedMaterials = []
  }

  private getVisualDiffResult(diffResult: DiffResult): VisualDiffResult {
    const renderTree = this.tree.getRenderTree()

    const addedRvs = diffResult.added.flatMap((value) => {
      return renderTree.getRenderViewsForNode(value)
    })
    const removedRvs = diffResult.removed.flatMap((value) => {
      return renderTree.getRenderViewsForNode(value)
    })
    const unchangedRvs = diffResult.unchanged.flatMap((value) => {
      return renderTree.getRenderViewsForNode(value)
    })

    const modifiedOldRvs = diffResult.modified
      .flatMap((value) => {
        return renderTree.getRenderViewsForNode(value[0])
      })
      .filter((value) => {
        return !unchangedRvs.includes(value) && !removedRvs.includes(value)
      })
    const modifiedNewRvs = diffResult.modified
      .flatMap((value) => {
        return renderTree.getRenderViewsForNode(value[1])
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
        rvs: visualDiffResult.added.filter(
          (value) =>
            value.geometryType === GeometryType.MESH ||
            value.geometryType === GeometryType.LINE
        ),
        material: this.addedMaterialMesh
      },
      {
        rvs: visualDiffResult.modifiedNew.filter(
          (value) =>
            value.geometryType === GeometryType.MESH ||
            value.geometryType === GeometryType.LINE
        ),
        material: this.changedNewMaterialMesh
      },
      {
        rvs: visualDiffResult.modifiedOld.filter(
          (value) =>
            value.geometryType === GeometryType.MESH ||
            value.geometryType === GeometryType.LINE
        ),
        material: this.changedOldMaterialMesh
      },
      {
        rvs: visualDiffResult.removed.filter(
          (value) =>
            value.geometryType === GeometryType.MESH ||
            value.geometryType === GeometryType.LINE
        ),
        material: this.removedMaterialMesh
      },
      //POINTS
      {
        rvs: visualDiffResult.added.filter(
          (value) =>
            value.geometryType === GeometryType.POINT ||
            value.geometryType === GeometryType.POINT_CLOUD
        ),
        material: this.addedMaterialPoint
      },
      {
        rvs: visualDiffResult.modifiedNew.filter(
          (value) =>
            value.geometryType === GeometryType.POINT ||
            value.geometryType === GeometryType.POINT_CLOUD
        ),
        material: this.changedNewMaterialPoint
      },
      {
        rvs: visualDiffResult.modifiedOld.filter(
          (value) =>
            value.geometryType === GeometryType.POINT ||
            value.geometryType === GeometryType.POINT_CLOUD
        ),
        material: this.changedOldMaterialPoint
      },
      {
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

  private getPlainMaterialGroups(visualDiffResult: VisualDiffResult) {
    const added = this.getBatchesSubgroups(visualDiffResult.added)
    const changedOld = this.getBatchesSubgroups(visualDiffResult.modifiedOld)
    const changedNew = this.getBatchesSubgroups(visualDiffResult.modifiedNew)
    const removed = this.getBatchesSubgroups(visualDiffResult.removed)
    this.addedMaterials = added.map(
      (value: { rvs: NodeRenderView[]; material: SpeckleMaterialType }) =>
        value.material
    )
    this.changedOldMaterials = changedOld.map(
      (value: { rvs: NodeRenderView[]; material: SpeckleMaterialType }) =>
        value.material
    )
    this.changedNewMaterials = changedNew.map(
      (value: { rvs: NodeRenderView[]; material: SpeckleMaterialType }) =>
        value.material
    )
    this.removedMaterials = removed.map(
      (value: { rvs: NodeRenderView[]; material: SpeckleMaterialType }) =>
        value.material
    )
    return [...added, ...changedOld, ...changedNew, ...removed]
  }

  private getBatchesSubgroups(subgroup: Array<NodeRenderView>): {
    rvs: NodeRenderView[]
    material: SpeckleMaterialType
  }[] {
    const groupBatches = groupBy(subgroup, 'batchId')

    const materialGroup: {
      rvs: NodeRenderView[]
      material: SpeckleMaterialType
    }[] = []
    for (const k in groupBatches) {
      const matClone: SpeckleMaterialType = (
        this.viewer.getRenderer().getBatchMaterial(groupBatches[k][0]) as Material
      ).clone() as SpeckleMaterialType

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(matClone as any)['clampOpacity'] = matClone.opacity
      matClone.opacity = 0.5
      matClone.transparent = true
      materialGroup.push({
        rvs: groupBatches[k],
        material: matClone
      })
    }

    return materialGroup
  }

  /** Keeping this for reference */
  // private intersection(o1: object, o2: object) {
  //   const [k1, k2] = [Object.keys(o1), Object.keys(o2)]
  //   const [first, next] = k1.length > k2.length ? [k2, o1] : [k1, o2]
  //   return first.filter((k) => k in next)
  // }

  // private diffBoolean(urlA: string, urlB: string): Promise<DiffResult> {
  //   const diffResult: DiffResult = {
  //     unchanged: [],
  //     added: [],
  //     removed: [],
  //     modified: []
  //   }

  //   const renderTreeA = this.tree!.getRenderTree(urlA)
  //   const renderTreeB = this.tree!.getRenderTree(urlB)
  //   if (!renderTreeA) {
  //     return Promise.reject(
  //       `Could not make diff. Resource ${urlA} could not be fetched`
  //     )
  //   }
  //   if (!renderTreeB) {
  //     return Promise.reject(
  //       `Could not make diff. Resource ${urlB} could not be fetched`
  //     )
  //   }
  //   let rvsA: TreeNode[] = renderTreeA.getRenderableNodes(...SpeckleTypeAllRenderables)
  //   let rvsB: TreeNode[] = renderTreeB.getRenderableNodes(...SpeckleTypeAllRenderables)

  //   rvsA = rvsA.map((value: TreeNode) => {
  //     return renderTreeA.getAtomicParent(value)
  //   })

  //   rvsB = rvsB.map((value) => {
  //     return renderTreeB.getAtomicParent(value)
  //   })

  //   rvsA = [...Array.from(new Set(rvsA))]
  //   rvsB = [...Array.from(new Set(rvsB))]

  //   const idMapA: { [id: string]: { node: TreeNode; applicationId: string } } = {}
  //   const appIdMapA: { [id: string]: TreeNode } = {}
  //   this.buildIdMaps(rvsA, idMapA, appIdMapA)

  //   const idMapB: { [id: string]: { node: TreeNode; applicationId: string } } = {}
  //   const appIdMapB: { [id: string]: TreeNode } = {}
  //   this.buildIdMaps(rvsB, idMapB, appIdMapB)

  //   /** Get the ids which are common between the two maps. This will be objects
  //    *  which have not changed
  //    */
  //   const unchanged: Array<string> = this.intersection(idMapA, idMapB)
  //   /** We remove the unchanged objects from B and end up with changed + added */
  //   const addedModified = _.omit(idMapB, unchanged)
  //   /** We remove the unchanged objects from A and end up with changed + removed */
  //   const removedModified = _.omit(idMapA, unchanged)
  //   /** We remove the changed objects from B. An object from B is changed if
  //    *  it's application ID exists in A
  //    */
  //   const added = _.omit(addedModified, function (value: { applicationId: string }) {
  //     return (
  //       value.applicationId !== undefined &&
  //       appIdMapA[value.applicationId] !== undefined
  //     )
  //   })
  //   /** We remove the changed objects from A. An object from A is changed if
  //    *  it's application ID exists in B
  //    */
  //   const removed = _.omit(
  //     removedModified,
  //     function (value: { applicationId: string }) {
  //       return (
  //         value.applicationId !== undefined &&
  //         appIdMapB[value.applicationId] !== undefined
  //       )
  //     }
  //   )
  //   /** We remove the removed objects from A, leaving us only changed objects */
  //   const modifiedRemoved = _.omit(removedModified, Object.keys(removed))
  //   /** We remove the removed objects from B, leaving us only changed objects */
  //   const modifiedAdded = _.omit(addedModified, Object.keys(added))

  //   /** We fill the arrays from here on out */
  //   const modifiedOld = (Object.values(modifiedRemoved) as { node: TreeNode }[]).map(
  //     (value: { node: TreeNode }) => value.node
  //   )
  //   const modifiedNew = (Object.values(modifiedAdded) as { node: TreeNode }[]).map(
  //     (value: { node: TreeNode }) => value.node
  //   )
  //   diffResult.unchanged.push(...unchanged.map((value) => idMapA[value].node))
  //   diffResult.unchanged.push(...unchanged.map((value) => idMapB[value].node))
  //   diffResult.removed.push(
  //     ...(Object.values(removed) as { node: TreeNode }[]).map(
  //       (value: { node: TreeNode }) => value.node
  //     )
  //   )
  //   diffResult.added.push(
  //     ...(Object.values(added) as { node: TreeNode }[]).map(
  //       (value: { node: TreeNode }) => value.node
  //     )
  //   )

  //   modifiedOld.forEach((value, index) => {
  //     value
  //     diffResult.modified.push([modifiedOld[index], modifiedNew[index]])
  //   })
  //   return Promise.resolve(diffResult)
  // }
}
