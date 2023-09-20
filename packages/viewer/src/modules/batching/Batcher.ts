import { generateUUID } from 'three/src/math/MathUtils'
import MeshBatch from './MeshBatch'
import { SpeckleType } from '../converter/GeometryConverter'
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
import { RenderTree } from '../tree/RenderTree'
import SpeckleMesh from '../objects/SpeckleMesh'
import TextBatch from './TextBatch'

export enum TransformStorage {
  VERTEX_TEXTURE = 0,
  UNIFORM_ARRAY = 1
}

export default class Batcher {
  private maxHardwareUniformCount = 0
  private floatTextures = false
  private maxBatchObjects = 0
  private maxBatchVertices = 500000
  public materials: Materials
  public batches: { [id: string]: Batch } = {}

  public constructor(maxUniformCount: number, floatTextures: boolean) {
    this.maxHardwareUniformCount = maxUniformCount
    this.maxBatchObjects = Math.floor(
      (this.maxHardwareUniformCount - Materials.UNIFORM_VECTORS_USED) / 4
    )
    this.floatTextures = floatTextures
    this.materials = new Materials()
    this.materials.createDefaultMaterials()
  }

  public async makeBatches(
    renderTree: RenderTree,
    speckleType: SpeckleType[],
    batchType?: GeometryType
  ) {
    const renderViews = renderTree
      .getRenderableRenderViews(...speckleType)
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
        return valid || value.hasMetadata
      })
      const batches = this.splitBatch(renderViewsBatch, vertCount)
      for (let k = 0; k < batches.length; k++) {
        const restrictedRvs = batches[k]
        const batch = await this.buildBatch(
          renderTree,
          restrictedRvs,
          materialHashes[i],
          batchType
        )
        this.batches[batch.id] = batch
      }
    }
  }

  public async *makeBatchesAsync(
    renderTree: RenderTree,
    speckleType: SpeckleType[],
    batchType?: GeometryType,
    priority?: number
  ) {
    const pause = World.getPause(priority)

    const renderViews = renderTree
      .getRenderableRenderViews(...speckleType)
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
        return valid || value.hasMetadata
      })
      if (renderViewsBatch.length === 0) continue

      const batches = this.splitBatch(renderViewsBatch, vertCount)
      for (let k = 0; k < batches.length; k++) {
        const restrictedRvs = batches[k]
        const batch = await this.buildBatch(
          renderTree,
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

  private async buildBatch(
    renderTree: RenderTree,
    renderViews: NodeRenderView[],
    materialHash: number,
    batchType?: GeometryType
  ): Promise<Batch> {
    const batch = renderViews.filter(
      (value) => value.renderMaterialHash === materialHash
    )

    if (!batch.length) {
      /** This is for the case when all renderviews have invalid geometries, and it generally
       * means there is something wrong with the stream
       */
      Logger.warn(
        'All renderviews have invalid geometries. Skipping batch!',
        renderViews
      )
      return null
    }

    const geometryType = batchType !== undefined ? batchType : batch[0].geometryType
    let matRef = null

    if (geometryType === GeometryType.MESH) {
      matRef = renderViews[0].renderData.renderMaterial
    } else if (geometryType === GeometryType.LINE) {
      matRef = renderViews[0].renderData.displayStyle
    } else if (geometryType === GeometryType.POINT) {
      matRef = renderViews[0].renderData.renderMaterial
    } else if (geometryType === GeometryType.POINT_CLOUD) {
      matRef = renderViews[0].renderData.renderMaterial
    } else if (geometryType === GeometryType.TEXT) {
      matRef = renderViews[0].renderData.displayStyle
    }

    const material = this.materials.getMaterial(materialHash, matRef, geometryType)

    const batchID = generateUUID()
    let geometryBatch: Batch = null
    switch (geometryType) {
      case GeometryType.MESH:
        geometryBatch = new MeshBatch(
          batchID,
          renderTree.id,
          batch,
          this.floatTextures
            ? TransformStorage.VERTEX_TEXTURE
            : TransformStorage.UNIFORM_ARRAY
        )
        break
      case GeometryType.LINE:
        geometryBatch = new LineBatch(batchID, renderTree.id, batch)
        break
      case GeometryType.POINT:
        geometryBatch = new PointBatch(batchID, renderTree.id, batch)
        break
      case GeometryType.POINT_CLOUD:
        geometryBatch = new PointBatch(batchID, renderTree.id, batch)
        break
      case GeometryType.TEXT:
        geometryBatch = new TextBatch(batchID, renderTree.id, batch)
        break
    }

    geometryBatch.setBatchMaterial(material)
    await geometryBatch.buildBatch()

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
      visibilityRanges[k] = batch.getVisibleRange()
    }
    return visibilityRanges
  }

  public applyVisibility(ranges: Record<string, BatchUpdateRange>) {
    for (const k in this.batches) {
      const batch: Batch = this.batches[k]
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
      const batchMesh: Mesh = batch.renderObject as Mesh
      if (batchMesh.geometry.groups.length === 0) {
        if (Materials.isTransparent(batchMesh.material as Material))
          visibilityRanges[k] = AllBatchUpdateRange
      } else {
        const transparentGroup = batchMesh.geometry.groups.find((value) => {
          return Materials.isTransparent(batchMesh.material[value.materialIndex])
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

  public getOpaque(): Record<string, BatchUpdateRange> {
    const visibilityRanges = {}
    for (const k in this.batches) {
      const batch: Batch = this.batches[k]
      const batchMesh: Mesh = batch.renderObject as Mesh
      if (batchMesh.geometry.groups.length === 0) {
        if (Materials.isOpaque(batchMesh.material as Material))
          visibilityRanges[k] = AllBatchUpdateRange
      } else {
        const transparentOrHiddenGroup = batchMesh.geometry.groups.find((value) => {
          return (
            Materials.isTransparent(batchMesh.material[value.materialIndex]) ||
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

  public overrideMaterial(
    ranges: Record<string, BatchUpdateRange>,
    material: Material
  ) {
    for (const k in ranges) {
      if (this.batches[k].geometryType !== GeometryType.MESH) continue
      const mesh = this.batches[k].renderObject as SpeckleMesh
      mesh.setOverrideMaterial(material)
    }
  }

  public restoreMaterial(ranges: Record<string, BatchUpdateRange>) {
    for (const k in ranges) {
      if (this.batches[k].geometryType !== GeometryType.MESH) continue
      const mesh = this.batches[k].renderObject as SpeckleMesh
      mesh.restoreMaterial()
    }
  }

  public getByMaterialUUID(materialUUID: string) {
    const visibilityRanges = {}
    for (const k in this.batches) {
      const batch: Batch = this.batches[k]
      const batchMesh: Mesh = batch.renderObject as Mesh
      if (batchMesh.geometry.groups.length === 0) {
        if ((batchMesh.material as Material).uuid === materialUUID)
          visibilityRanges[k] = AllBatchUpdateRange
      } else {
        const materialUUIDGroup = batchMesh.geometry.groups.find((value) => {
          return batchMesh.material[value.materialIndex].uuid === materialUUID
        })
        visibilityRanges[k] = {
          offset: 0,
          count:
            materialUUIDGroup !== undefined ? materialUUIDGroup.start : batch.getCount()
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

  public getBatch(rv: NodeRenderView) {
    return Object.values(this.batches).find((value: Batch) => {
      return value.renderViews.includes(rv)
    })
  }

  public getRenderView(batchId: string, index: number) {
    if (!this.batches[batchId]) {
      Logger.error('Invalid batch id!')
      return null
    }

    return this.batches[batchId].getRenderView(index)
  }

  public getRenderViewMaterial(batchId: string, index: number) {
    if (!this.batches[batchId]) {
      Logger.error('Invalid batch id!')
      return null
    }

    return this.batches[batchId].getMaterialAtIndex(index)
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
    return this.setObjectsMaterial(
      rvs,
      (rv: NodeRenderView) => {
        return {
          offset: rv.batchStart,
          count: rv.batchCount,
          material: this.materials.getFilterMaterial(
            rv,
            filterMaterial.filterType
          ) as Material,
          materialOptions: this.materials.getFilterMaterialOptions(filterMaterial)
        } as BatchUpdateRange
      },
      uniqueRvsOnly
    )
  }

  public setObjectsMaterial(
    rvs: NodeRenderView[],
    batchRangeDelegate: (rv: NodeRenderView) => BatchUpdateRange,
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
        .map(batchRangeDelegate)
      batch.setDrawRanges(...views)
    }
    return batchIds
  }

  public insertObjectsFilterMaterial(
    rvs: NodeRenderView[],
    filterMaterial: FilterMaterial
  ): string {
    let renderViews = rvs
    renderViews = [...Array.from(new Set(rvs.map((value) => value)))]
    const batchIds = [...Array.from(new Set(renderViews.map((value) => value.batchId)))]
    const id = generateUUID()
    for (let i = 0; i < batchIds.length; i++) {
      if (!batchIds[i]) {
        continue
      }
      const batch = this.batches[batchIds[i]]
      const batchRenderViews = renderViews.filter(
        (value) => value.batchId === batchIds[i]
      )
      const opaqueRvs = batchRenderViews.filter((rv) => !rv.transparent)
      const transparentRvs = batchRenderViews.filter((rv) => rv.transparent)
      let opaqueMaterial, transparentMaterial
      if (opaqueRvs.length)
        opaqueMaterial = this.materials
          .getFilterMaterial(opaqueRvs[0], filterMaterial.filterType)
          .clone() as Material
      if (transparentRvs.length)
        transparentMaterial = this.materials
          .getFilterMaterial(transparentRvs[0], filterMaterial.filterType)
          .clone() as Material
      const views = batchRenderViews.map((rv: NodeRenderView) => {
        return {
          offset: rv.batchStart,
          count: rv.batchCount,
          material: rv.transparent ? transparentMaterial : opaqueMaterial,
          materialOptions: this.materials.getFilterMaterialOptions(filterMaterial),
          id
        } as BatchUpdateRange
      })
      batch.insertDrawRanges(...views)
    }
    return id
  }

  public removeObjectsMaterial(id: string) {
    for (const k in this.batches) {
      if (this.batches[k]) {
        this.batches[k].removeDrawRanges(id)
      }
    }
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

  public async isolateRenderViewBatch(id: string, renderTree: RenderTree) {
    const rv = renderTree.getRenderViewForNodeId(id)
    for (const k in this.batches) {
      if (k !== rv.batchId) {
        this.batches[k].setDrawRanges({
          offset: 0,
          count: this.batches[k].getCount(),
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
          count: this.batches[k].getCount(),
          material: this.materials.getFilterMaterial(
            this.batches[k].renderViews[0],
            FilterMaterialType.GHOST
          )
        })
      }
    }
  }
}
