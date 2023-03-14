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
import Logger from 'js-logger'
import { World } from '../World'

export default class Batcher {
  private maxHardwareUniformCount = 0
  private maxBatchObjects = 0
  private maxBatchVertices = 500000
  public materials: Materials
  public batches: { [id: string]: Batch } = {}

  public constructor(maxUniformCount: number) {
    this.maxHardwareUniformCount = maxUniformCount
    this.maxBatchObjects = Math.floor(
      (this.maxHardwareUniformCount - Materials.UNIFORM_VECTORS_USED) / 4
    )
    this.materials = new Materials()
    this.materials.createDefaultMaterials()
  }

  public makeBatches(
    subtreeId: string,
    speckleType: SpeckleType[],
    batchType?: GeometryType
  ) {
    const renderViews = WorldTree.getRenderTree(subtreeId)
      .getAtomicRenderViews(...speckleType)
      .sort((a, b) => {
        if (a.renderMaterialHash === 0) return -1
        if (b.renderMaterialHash === 0) return 1
        return a.renderMaterialHash - b.renderMaterialHash
      })
    const materialHashes = [
      ...Array.from(new Set(renderViews.map((value) => value.renderMaterialHash)))
    ]

    Logger.warn(`Batch count: ${materialHashes}`)

    for (let i = 0; i < materialHashes.length; i++) {
      let renderViewsBatch = renderViews.filter(
        (value) => value.renderMaterialHash === materialHashes[i]
      )
      /** Prune any meshes with no geometry data */
      let vertCount
      renderViewsBatch = renderViewsBatch.filter((value) => {
        const valid = value.validGeometry
        if (valid) {
          vertCount += value.renderData.geometry.attributes.POSITION.length / 3
        }
        return value
      })
      const batches = this.splitBatch(renderViewsBatch, vertCount)
      for (let k = 0; k < batches.length; k++) {
        const restrictedRvs = batches[k]
        const batch = this.buildBatch(
          subtreeId,
          restrictedRvs,
          materialHashes[i],
          batchType
        )
        this.batches[batch.id] = batch
      }
    }
  }

  public async *makeBatchesAsync(
    subtreeId: string,
    speckleType: SpeckleType[],
    batchType?: GeometryType,
    priority?: number
  ) {
    const pause = World.getPause(priority)

    const renderViews = WorldTree.getRenderTree(subtreeId)
      .getAtomicRenderViews(...speckleType)
      .sort((a, b) => {
        if (a.renderMaterialHash === 0) return -1
        if (b.renderMaterialHash === 0) return 1
        return a.renderMaterialHash - b.renderMaterialHash
      })
    const materialHashes = [
      ...Array.from(new Set(renderViews.map((value) => value.renderMaterialHash)))
    ]

    let min = Number.MAX_SAFE_INTEGER,
      max = -1,
      average = 0,
      batchCount = 0

    for (let i = 0; i < materialHashes.length; i++) {
      let renderViewsBatch = renderViews.filter(
        (value) => value.renderMaterialHash === materialHashes[i]
      )
      /** Prune any meshes with no geometry data */
      let vertCount = 0
      renderViewsBatch = renderViewsBatch.filter((value) => {
        const valid = value.validGeometry
        if (valid) {
          vertCount += value.renderData.geometry.attributes.POSITION.length / 3
        }
        return value
      })
      const batches = this.splitBatch(renderViewsBatch, vertCount)
      for (let k = 0; k < batches.length; k++) {
        const restrictedRvs = batches[k]
        const batch = this.buildBatch(
          subtreeId,
          restrictedRvs,
          materialHashes[i],
          batchType
        )

        this.batches[batch.id] = batch
        min = Math.min(min, batch.renderViews.length)
        max = Math.max(max, batch.renderViews.length)
        average += batch.renderViews.length
        batchCount++
        yield this.batches[batch.id]
        await pause()
      }
    }
    console.warn(
      `Batch total: ${batchCount} min: ${min}, max: ${max}, average: ${
        average / materialHashes.length
      }`
    )
  }

  private splitBatch(
    renderViews: NodeRenderView[],
    vertCount: number
  ): NodeRenderView[][] {
    /** We're first splitting based on the batch's max vertex count */
    const vSplit = []
    const vDiv = Math.floor(vertCount / this.maxBatchVertices)
    if (vDiv > 0) {
      let count = 0
      let index = 0
      vSplit.push([])
      for (let k = 0; k < renderViews.length; k++) {
        vSplit[index].push(renderViews[k])
        count += renderViews[k].renderData.geometry.attributes.POSITION.length / 3
        const nexCount =
          count +
          (renderViews[k + 1]
            ? renderViews[k + 1].renderData.geometry.attributes.POSITION.length / 3
            : 0)
        if (nexCount >= this.maxBatchVertices && renderViews[k + 1]) {
          vSplit.push([])
          index++
          count = 0
        }
      }
    } else {
      vSplit.push(renderViews)
    }
    /** Finally we're splitting again based on the batch's max object count */
    const geometryType = renderViews[0].geometryType
    if (geometryType === GeometryType.MESH) {
      const oSplit = []
      for (let i = 0; i < vSplit.length; i++) {
        const objCount = vSplit[i].length
        const div = Math.floor(objCount / this.maxBatchObjects)
        const mod = objCount % this.maxBatchObjects
        let index = 0
        for (let k = 0; k < div; k++) {
          oSplit.push(vSplit[i].slice(index, index + this.maxBatchObjects))
          index += this.maxBatchObjects
        }
        if (mod > 0) {
          oSplit.push(vSplit[i].slice(index, index + mod))
        }
      }
      return oSplit
    }

    return vSplit
  }

  private buildBatch(
    subtreeId: string,
    renderViews: NodeRenderView[],
    materialHash: number,
    batchType?: GeometryType
  ): Batch {
    const geometryType =
      batchType !== undefined ? batchType : renderViews[0].geometryType
    let matRef = null

    if (geometryType === GeometryType.MESH) {
      matRef = renderViews[0].renderData.renderMaterial
    } else if (geometryType === GeometryType.LINE) {
      matRef = renderViews[0].renderData.displayStyle
    } else if (geometryType === GeometryType.POINT) {
      matRef = renderViews[0].renderData.renderMaterial
    } else if (geometryType === GeometryType.POINT_CLOUD) {
      matRef = renderViews[0].renderData.renderMaterial
    }

    const material = this.materials.getMaterial(materialHash, matRef, geometryType)

    const batchID = generateUUID()
    let geometryBatch: Batch = null
    switch (geometryType) {
      case GeometryType.MESH:
        geometryBatch = new MeshBatch(batchID, subtreeId, renderViews)
        break
      case GeometryType.LINE:
        geometryBatch = new LineBatch(batchID, subtreeId, renderViews)
        break
      case GeometryType.POINT:
        geometryBatch = new PointBatch(batchID, subtreeId, renderViews)
        break
      case GeometryType.POINT_CLOUD:
        geometryBatch = new PointBatch(batchID, subtreeId, renderViews)
        break
    }

    geometryBatch.setBatchMaterial(material)
    geometryBatch.buildBatch()
    geometryBatch.updateBatchObjects()

    return geometryBatch
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
      // if (batch.geometryType !== GeometryType.MESH) continue
      visibilityRanges[k] = batch.getVisibleRange()
    }
    return visibilityRanges
  }

  public applyVisibility(ranges: Record<string, BatchUpdateRange>) {
    for (const k in this.batches) {
      const batch: Batch = this.batches[k]
      // if (batch.geometryType !== GeometryType.MESH) continue
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
      // if (batch.geometryType !== GeometryType.MESH) {
      //   visibilityRanges[k] = HideAllBatchUpdateRange
      //   continue
      // }
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

  public getStencil(): Record<string, BatchUpdateRange> {
    const visibilityRanges = {}
    for (const k in this.batches) {
      const batch: Batch = this.batches[k]
      // if (batch.geometryType !== GeometryType.MESH) {
      //   visibilityRanges[k] = HideAllBatchUpdateRange
      //   continue
      // }
      const batchMesh: Mesh = batch.renderObject as Mesh
      if (batchMesh.geometry.groups.length === 0) {
        if ((batchMesh.material as Material).stencilWrite === true)
          visibilityRanges[k] = AllBatchUpdateRange
      } else {
        const stencilGroup = batchMesh.geometry.groups.find((value) => {
          return batchMesh.material[value.materialIndex].stencilWrite === true
        })
        if (stencilGroup) {
          visibilityRanges[k] = {
            offset: stencilGroup.start,
            count: stencilGroup.count
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
      // if (batch.geometryType !== GeometryType.MESH) {
      //   visibilityRanges[k] = HideAllBatchUpdateRange
      //   continue
      // }
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

  /**
   * Used for debuggin only
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

  /**
   * Used for debuggin only
   */
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

  public async isolateBatch(batchId: string) {
    for (const k in this.batches) {
      if (k !== batchId) {
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
