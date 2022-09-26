import { generateUUID } from 'three/src/math/MathUtils'
import MeshBatch from './MeshBatch'
import { SpeckleType } from '../converter/GeometryConverter'
import { WorldTree } from '../tree/WorldTree'
import LineBatch from './LineBatch'
import Materials from '../materials/Materials'
import { NodeRenderView } from '../tree/NodeRenderView'
import {
  AllBatchUpdateRange,
  Batch,
  BatchUpdateRange,
  GeometryType,
  HideAllBatchUpdateRange
} from './Batch'
import PointBatch from './PointBatch'
// import { FilterMaterialType } from '../FilteringManager'
import { Material, Mesh, WebGLRenderer } from 'three'
import { FilterMaterial, FilterMaterialType } from '../filtering/FilteringManager'

export default class Batcher {
  public materials: Materials
  public batches: { [id: string]: Batch } = {}

  public constructor() {
    this.materials = new Materials()
    this.materials.createDefaultMaterials()
  }

  public makeBatches(
    subtreeId: string,
    batchType: GeometryType,
    ...speckleType: SpeckleType[]
  ) {
    const rendeViews = WorldTree.getRenderTree(subtreeId)
      .getAtomicRenderViews(...speckleType)
      .sort((a, b) => {
        if (a.renderMaterialHash === 0) return -1
        if (b.renderMaterialHash === 0) return 1
        return a.renderMaterialHash - b.renderMaterialHash
      })
    const materialHashes = [
      ...Array.from(new Set(rendeViews.map((value) => value.renderMaterialHash)))
    ]

    console.warn(materialHashes)
    // console.warn(rendeViews)

    for (let i = 0; i < materialHashes.length; i++) {
      const batch = rendeViews.filter(
        (value) => value.renderMaterialHash === materialHashes[i]
      )

      let matRef = null

      if (batchType === GeometryType.MESH) {
        matRef = batch[0].renderData.renderMaterial
      } else if (batchType === GeometryType.LINE) {
        matRef = batch[0].renderData.displayStyle
      } else if (batchType === GeometryType.POINT) {
        matRef = batch[0].renderData.renderMaterial
      } else if (batchType === GeometryType.POINT_CLOUD) {
        matRef = batch[0].renderData.renderMaterial
      }

      const material = this.materials.updateMaterialMap(
        materialHashes[i],
        matRef,
        batchType
      )

      const batchID = generateUUID()
      switch (batchType) {
        case GeometryType.MESH:
          this.batches[batchID] = new MeshBatch(batchID, subtreeId, batch)
          break
        case GeometryType.LINE:
          this.batches[batchID] = new LineBatch(batchID, subtreeId, batch)
          break
        case GeometryType.POINT:
          this.batches[batchID] = new PointBatch(batchID, subtreeId, batch)
          break
        case GeometryType.POINT_CLOUD:
          this.batches[batchID] = new PointBatch(batchID, subtreeId, batch)
          break
      }

      this.batches[batchID].setBatchMaterial(material)
      this.batches[batchID].buildBatch()
      // console.warn(batch)
    }
  }

  public update(deltaTime: number) {
    for (const batchId in this.batches) {
      this.batches[batchId].onUpdate(deltaTime)
    }
  }

  public render(renderer: WebGLRenderer) {
    for (const batchId in this.batches) {
      this.batches[batchId].onRender(renderer)
    }
  }

  public saveVisiblity(): Record<string, BatchUpdateRange> {
    const visibilityRanges = {}
    for (const k in this.batches) {
      const batch: Batch = this.batches[k]
      if (batch.geometryType !== GeometryType.MESH) continue
      visibilityRanges[k] = batch.getVisibleRange()
    }
    return visibilityRanges
  }

  public applyVisibility(ranges: Record<string, BatchUpdateRange>) {
    for (const k in this.batches) {
      const batch: Batch = this.batches[k]
      if (batch.geometryType !== GeometryType.MESH) continue
      const range = ranges[k]
      if (!range) {
        batch.setVisibleRange(HideAllBatchUpdateRange)
      } else {
        batch.setVisibleRange(range)
      }
    }
  }

  public getTransparent(): Record<string, BatchUpdateRange> {
    const visibilityRanges = {}
    for (const k in this.batches) {
      const batch: Batch = this.batches[k]
      if (batch.geometryType !== GeometryType.MESH) continue
      const batchMesh: Mesh = batch.renderObject as Mesh
      if (batchMesh.geometry.groups.length === 0) {
        if ((batchMesh.material as Material).transparent === true)
          visibilityRanges[k] = AllBatchUpdateRange
      } else {
        const transparentGroup = batchMesh.geometry.groups.find((value) => {
          return batchMesh.material[value.materialIndex].visible === true
        })
        const hiddenGroup = batchMesh.geometry.groups.find((value) => {
          return batchMesh.material[value.materialIndex].visible === false
        })
        if (transparentGroup) {
          visibilityRanges[k] = {
            offset: transparentGroup.start,
            count:
              hiddenGroup !== undefined
                ? hiddenGroup.start
                : batch.getCount() - transparentGroup.start
          }
        }
      }
    }
    return visibilityRanges
  }

  public getOpaque() {
    const visibilityRanges = {}
    for (const k in this.batches) {
      const batch: Batch = this.batches[k]
      if (batch.geometryType !== GeometryType.MESH) continue
      const batchMesh: Mesh = batch.renderObject as Mesh
      if (batchMesh.geometry.groups.length === 0) {
        if ((batchMesh.material as Material).transparent === false)
          visibilityRanges[k] = AllBatchUpdateRange
      } else {
        const transparentOrHiddenGroup = batchMesh.geometry.groups.find((value) => {
          return (
            batchMesh.material[value.materialIndex].transparent === true ||
            batchMesh.material[value.materialIndex].visible === false
          )
        })
        visibilityRanges[k] = {
          offset: 0,
          count:
            transparentOrHiddenGroup !== undefined
              ? transparentOrHiddenGroup.start
              : batch.getCount()
        }
      }
    }
    return visibilityRanges
  }

  public enableTransparent(value: boolean) {
    for (const k in this.batches) {
      const batch: Batch = this.batches[k]
      if (batch.geometryType !== GeometryType.MESH) continue
      const batchMesh: Mesh = batch.renderObject as Mesh
      if (batchMesh.geometry.groups.length === 0) {
        batchMesh.visible = (batchMesh.material as Material).transparent
          ? value
          : batchMesh.visible
      } else {
        const transparentGroup = batchMesh.geometry.groups.find((value) => {
          return batchMesh.material[value.materialIndex].transparent === true
        })
        batch.setVisibleRange({
          offset: 0,
          count: transparentGroup.start
        })
      }
    }
  }

  public purgeBatches(subtreeId: string) {
    for (const k in this.batches) {
      if (this.batches[k].subtreeId === subtreeId) {
        this.batches[k].purge()
        delete this.batches[k]
      }
    }
  }

  public getBatches(subtreeId?: string, geometryType?: GeometryType) {
    return Object.values(this.batches).filter((value: Batch) => {
      const subtree = subtreeId !== undefined ? value.subtreeId === subtreeId : true
      const type =
        geometryType !== undefined ? value.geometryType === geometryType : true
      return subtree && type
    })
  }

  public getRenderView(batchId: string, index: number) {
    return this.batches[batchId].getRenderView(index)
  }

  public resetBatchesDrawRanges() {
    for (const k in this.batches) {
      this.batches[k].resetDrawRanges()
    }
  }

  public setObjectsFilterMaterial(
    rvs: NodeRenderView[],
    filterMaterial: FilterMaterial,
    uniqueRvsOnly = true
  ): string[] {
    let renderViews = rvs
    if (uniqueRvsOnly) renderViews = [...Array.from(new Set(rvs.map((value) => value)))]
    const batchIds = [...Array.from(new Set(renderViews.map((value) => value.batchId)))]
    for (let i = 0; i < batchIds.length; i++) {
      if (!batchIds[i]) {
        continue
      }
      const batch = this.batches[batchIds[i]]
      const views = renderViews
        .filter((value) => value.batchId === batchIds[i])
        .map((rv: NodeRenderView) => {
          return {
            offset: rv.batchStart,
            count: rv.batchCount,
            material: this.materials.getFilterMaterial(
              rv,
              filterMaterial.filterType
            ) as Material,
            materialOptions: this.materials.getFilterMaterialOptions(filterMaterial)
          } as BatchUpdateRange
        })
      batch.setDrawRanges(...views)
    }
    return batchIds
  }

  public autoFillDrawRanges(batchIds: string[]) {
    const uniqueBatches = [...Array.from(new Set(batchIds.map((value) => value)))]
    uniqueBatches.forEach((value) => {
      if (!value) return
      this.batches[value].autoFillDrawRanges()
    })
  }

  /** Conveniece method. This should also work as a filtering action
   *  Though, because the batches are not smart enough yet to group
   *  their draw ranges, it would be currently be inneficient to isolate
   *  via filtering. This will change in the future
   */
  public isolateRenderView(id: string) {
    const rvs = WorldTree.getRenderTree().getRenderViewsForNodeId(id)
    const batchIds = [...Array.from(new Set(rvs.map((value) => value.batchId)))]
    for (const k in this.batches) {
      if (!batchIds.includes(k)) {
        this.batches[k].setDrawRanges({
          offset: 0,
          count: Infinity,
          material: this.materials.getFilterMaterial(
            this.batches[k].renderViews[0],
            FilterMaterialType.GHOST
          )
        })
        this.batches[k].setVisibleRange(HideAllBatchUpdateRange)
      } else {
        const drawRanges = []
        for (let i = 0; i < this.batches[k].renderViews.length; i++) {
          if (!rvs.includes(this.batches[k].renderViews[i])) {
            drawRanges.push({
              offset: this.batches[k].renderViews[i].batchStart,
              count: this.batches[k].renderViews[i].batchCount,
              material: this.materials.getFilterMaterial(
                this.batches[k].renderViews[i],
                FilterMaterialType.GHOST
              )
            })
          } else {
            drawRanges.push({
              offset: this.batches[k].renderViews[i].batchStart,
              count: this.batches[k].renderViews[i].batchCount,
              material: this.materials.getFilterMaterial(
                this.batches[k].renderViews[i],
                FilterMaterialType.SELECT
              )
            })
          }
        }
        if (drawRanges.length > 0) {
          this.batches[k].setDrawRanges(...drawRanges)
          this.batches[k].autoFillDrawRanges()
        }
      }
    }
  }

  public async isolateRenderViewBatch(id: string) {
    const rv = WorldTree.getRenderTree().getRenderViewForNodeId(id)
    for (const k in this.batches) {
      if (k !== rv.batchId) {
        this.batches[k].setDrawRanges({
          offset: 0,
          count: Infinity,
          material: this.materials.getFilterMaterial(
            this.batches[k].renderViews[0],
            FilterMaterialType.GHOST
          )
        })
      }
    }
  }
}
