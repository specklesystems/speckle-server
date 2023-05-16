import { Color, FrontSide } from 'three'
import { SpeckleTypeAllRenderables } from './converter/GeometryConverter'
import SpeckleStandardMaterial from './materials/SpeckleStandardMaterial'
import { TreeNode, WorldTree } from './tree/WorldTree'
import SpecklePointMaterial from './materials/SpecklePointMaterial'
import { GeometryType } from './batching/Batch'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeckleObject = Record<string, any>

export interface DiffResult {
  unchanged: Array<SpeckleObject>
  added: Array<SpeckleObject>
  removed: Array<SpeckleObject>
  modified: Array<Array<SpeckleObject>>
}

export class Differ {
  public addedMaterialMesh: SpeckleStandardMaterial = null
  public changedNewMaterialMesh: SpeckleStandardMaterial = null
  public changedOldMaterialMesh: SpeckleStandardMaterial = null
  public removedMaterialMesh: SpeckleStandardMaterial = null

  public addedMaterialPoint: SpecklePointMaterial = null
  public changedNewMaterialPoint: SpecklePointMaterial = null
  public changedOldMaterialPoint: SpecklePointMaterial = null
  public removedMaterialPoint: SpecklePointMaterial = null

  public constructor() {
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

  public diff(tree: WorldTree, urlA: string, urlB: string): Promise<DiffResult> {
    const modifiedNew: Array<SpeckleObject> = []
    const modifiedOld: Array<SpeckleObject> = []

    const diffResult: DiffResult = {
      unchanged: [],
      added: [],
      removed: [],
      modified: []
    }

    const renderTreeA = tree.getRenderTree(urlA)
    const renderTreeB = tree.getRenderTree(urlB)
    const rootA = tree.findId(urlA)
    const rootB = tree.findId(urlB)
    const rvsA = renderTreeA.getRenderableNodes(...SpeckleTypeAllRenderables)
    const rvsB = renderTreeB.getRenderableNodes(...SpeckleTypeAllRenderables)

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

    this.addedMaterialMesh.opacity = from
    this.changedNewMaterialMesh.opacity = from
    this.changedOldMaterialMesh.opacity = to
    this.removedMaterialMesh.opacity = to
    this.addedMaterialMesh.depthWrite = from < 0.5 ? false : true
    this.changedNewMaterialMesh.depthWrite = from < 0.5 ? false : true
    this.changedOldMaterialMesh.depthWrite = to < 0.5 ? false : true
    this.removedMaterialMesh.depthWrite = to < 0.5 ? false : true

    this.addedMaterialPoint.opacity = from
    this.changedNewMaterialPoint.opacity = from
    this.changedOldMaterialPoint.opacity = to
    this.removedMaterialPoint.opacity = to
    this.addedMaterialPoint.depthWrite = from < 0.5 ? false : true
    this.changedNewMaterialPoint.depthWrite = from < 0.5 ? false : true
    this.changedOldMaterialPoint.depthWrite = to < 0.5 ? false : true
    this.removedMaterialPoint.depthWrite = to < 0.5 ? false : true
  }

  public getMaterialGroups(diffResult: DiffResult) {
    const groups = [
      // MESHES & LINES
      // Currently lines work with mesh specific materials due to how the LineBatch is implemented.
      // We could use specific line materials, but it won't make a difference until we elevate the
      // LineBatch a bit
      {
        objectIds: diffResult.added
          .filter(
            (value: TreeNode) =>
              value.model.renderView.geometryType === GeometryType.MESH ||
              value.model.renderView.geometryType === GeometryType.LINE
          )
          .map((value): string => value.model.raw.id),
        material: this.addedMaterialMesh
      },
      {
        objectIds: diffResult.modified
          .filter(
            (value) =>
              value[1].model.renderView.geometryType === GeometryType.MESH ||
              value[1].model.renderView.geometryType === GeometryType.LINE
          )
          .map((value): string => value[1].model.raw.id),
        material: this.changedNewMaterialMesh
      },
      {
        objectIds: diffResult.modified
          .filter((value) => {
            value[0].model.renderView.geometryType === GeometryType.MESH ||
              value[0].model.renderView.geometryType === GeometryType.LINE
          })
          .map((value): string => value[0].model.raw.id),
        material: this.changedOldMaterialMesh
      },
      {
        objectIds: diffResult.removed
          .filter(
            (value: TreeNode) =>
              value.model.renderView.geometryType === GeometryType.MESH ||
              value.model.renderView.geometryType === GeometryType.LINE
          )
          .map((value): string => value.model.raw.id),
        material: this.removedMaterialMesh
      },

      // POINTS
      {
        objectIds: diffResult.added
          .filter(
            (value: TreeNode) =>
              value.model.renderView.geometryType === GeometryType.POINT ||
              value.model.renderView.geometryType === GeometryType.POINT_CLOUD
          )
          .map((value): string => value.model.raw.id),
        material: this.addedMaterialPoint
      },
      {
        objectIds: diffResult.modified
          .filter(
            (value) =>
              value[1].model.renderView.geometryType === GeometryType.POINT ||
              value[1].model.renderView.geometryType === GeometryType.POINT_CLOUD
          )
          .map((value): string => value[1].model.raw.id),
        material: this.changedNewMaterialPoint
      },
      {
        objectIds: diffResult.modified
          .filter((value) => {
            value[0].model.renderView.geometryType === GeometryType.POINT ||
              value[0].model.renderView.geometryType === GeometryType.POINT_CLOUD
          })
          .map((value): string => value[0].model.raw.id),
        material: this.changedOldMaterialPoint
      },
      {
        objectIds: diffResult.removed
          .filter(
            (value: TreeNode) =>
              value.model.renderView.geometryType === GeometryType.POINT ||
              value.model.renderView.geometryType === GeometryType.POINT_CLOUD
          )
          .map((value): string => value.model.raw.id),
        material: this.removedMaterialPoint
      }
    ]
    return groups.filter((value) => value.objectIds.length > 0)
  }
}
