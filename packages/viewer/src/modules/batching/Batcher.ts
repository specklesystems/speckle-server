import { generateUUID } from 'three/src/math/MathUtils'
import MeshBatch from './MeshBatch'
import LineBatch from './LineBatch'
import Materials, { FilterMaterialType } from '../materials/Materials'
import { NodeRenderView } from '../tree/NodeRenderView'
import {
  AllBatchUpdateRange,
  Batch,
  BatchUpdateRange,
  GeometryType,
  HideAllBatchUpdateRange
} from './Batch'
import PointBatch from './PointBatch'
import { Material, WebGLRenderer } from 'three'
import Logger from 'js-logger'
import { AsyncPause } from '../World'
import { RenderTree } from '../tree/RenderTree'
import TextBatch from './TextBatch'
import SpeckleMesh, { TransformStorage } from '../objects/SpeckleMesh'
import { SpeckleType } from '../loaders/GeometryConverter'
import { TreeNode, WorldTree } from '../..'
import InstancedMeshBatch from './InstancedMeshBatch'

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

  public async *makeInstancedBatches(tree: WorldTree, renderTree: RenderTree) {
    // const renderViews = tree
    //   .getRenderTree()
    //   .getInstancedRenderableRenderViews(...[SpeckleType.Mesh])
    //   .sort((a, b) => +(a.renderData.id. === b.renderData.id))
    // console.log(renderViews)
    const pause = new AsyncPause()
    const instanceGroups = tree.getInstances('1')
    for (const g in instanceGroups) {
      pause.tick(100)
      if (pause.needsWait) {
        await pause.wait(50)
      }
      let instancedNodes = tree.findId(g)
      instancedNodes = instancedNodes.filter((node: TreeNode) => {
        return (
          node.model.renderView &&
          node.model.renderView.speckleType === SpeckleType.Mesh
        )
      })
      const rvs = instancedNodes.map((node: TreeNode) => node.model.renderView)

      if (rvs.length) {
        const materialHash = rvs[0].renderMaterialHash
        const instancedBatch = await this.buildInstancedBatch(
          renderTree,
          rvs,
          materialHash
        )

        this.batches[instancedBatch.id] = instancedBatch
        yield this.batches[instancedBatch.id]
      }
    }
    yield
  }

  public async *makeBatches(
    renderTree: RenderTree,
    speckleType: SpeckleType[],
    batchType?: GeometryType
  ) {
    const renderViews = renderTree
      .getRenderableNodes(...speckleType)
      .flatMap((node: TreeNode) => {
        if (node.model.renderView) {
          if (node.model.instanced) {
            if (node.model.renderView.speckleType !== SpeckleType.Mesh) {
              return [node.model.renderView]
            }
            return []
          }
          return [node.model.renderView]
        } else return []
      })
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

    const pause = new AsyncPause()
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
        pause.tick(100)
        if (pause.needsWait) {
          await pause.wait(50)
        }
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
      }
    }
    console.warn(
      `Batch total: ${batchCount} min: ${min}, max: ${max}, average: ${
        average / materialHashes.length
      }`
    )
    console.warn('Buffer setup -> ', MeshBatch.bufferSetup)
    console.warn('Array work -> ', MeshBatch.arrayWork)
    console.warn('Object BVH -> ', MeshBatch.objectBvh)
    console.warn('Compute normals -> ', MeshBatch.computeNormals)
    console.warn('Compute box and sphere -> ', MeshBatch.computeBoxAndSphere)
    console.warn('Compute RTE -> ', MeshBatch.computeRTE)
    console.warn('Batch BVH -> ', MeshBatch.batchBVH)
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

  private async buildInstancedBatch(
    renderTree: RenderTree,
    renderViews: NodeRenderView[],
    materialHash: number
  ): Promise<Batch> {
    if (!renderViews.length) {
      /** This is for the case when all renderviews have invalid geometries, and it generally
       * means there is something wrong with the stream
       */
      Logger.warn(
        'All renderviews have invalid geometries. Skipping batch!',
        renderViews
      )
      return null
    }

    const matRef = renderViews[0].renderData.renderMaterial
    const material = this.materials.getMaterial(
      materialHash,
      matRef,
      GeometryType.MESH,
      false
    )
    const batchID = generateUUID()
    const geometryBatch = new InstancedMeshBatch(batchID, renderTree.id, renderViews)
    geometryBatch.setBatchMaterial(material)
    await geometryBatch.buildBatch()

    return geometryBatch
  }

  private async buildBatch(
    renderTree: RenderTree,
    renderViews: NodeRenderView[],
    materialHash: number,
    batchType?: GeometryType
  ): Promise<Batch> {
    if (!renderViews.length) {
      /** This is for the case when all renderviews have invalid geometries, and it generally
       * means there is something wrong with the stream
       */
      Logger.warn(
        'All renderviews have invalid geometries. Skipping batch!',
        renderViews
      )
      return null
    }

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
          renderViews,
          this.floatTextures
            ? TransformStorage.VERTEX_TEXTURE
            : TransformStorage.UNIFORM_ARRAY
        )
        break
      case GeometryType.LINE:
        geometryBatch = new LineBatch(batchID, renderTree.id, renderViews)
        break
      case GeometryType.POINT:
        geometryBatch = new PointBatch(batchID, renderTree.id, renderViews)
        break
      case GeometryType.POINT_CLOUD:
        geometryBatch = new PointBatch(batchID, renderTree.id, renderViews)
        break
      case GeometryType.TEXT:
        geometryBatch = new TextBatch(batchID, renderTree.id, renderViews)
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
      if (batch.groups.length === 0) {
        if (Materials.isTransparent(batch.batchMaterial))
          visibilityRanges[k] = AllBatchUpdateRange
      } else {
        const transparentGroup = batch.groups.find((value) => {
          return Materials.isTransparent(batch.materials[value.materialIndex])
        })
        const hiddenGroup = batch.groups.find((value) => {
          return batch.materials[value.materialIndex].visible === false
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
      if (batch.groups.length === 0) {
        if (batch.batchMaterial.stencilWrite === true)
          visibilityRanges[k] = AllBatchUpdateRange
      } else {
        const stencilGroup = batch.groups.find((value) => {
          return batch.materials[value.materialIndex].stencilWrite === true
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
      if (batch.groups.length === 0) {
        if (Materials.isOpaque(batch.batchMaterial as Material))
          visibilityRanges[k] = AllBatchUpdateRange
      } else {
        const transparentOrHiddenGroup = batch.groups.find((value) => {
          return (
            Materials.isTransparent(batch.materials[value.materialIndex]) ||
            batch.materials[value.materialIndex].visible === false
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
    return this.batches[rv.batchId]
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
          material: this.materials.getFilterMaterial(this.batches[k].renderViews[0], {
            filterType: FilterMaterialType.GHOST
          })
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
          material: this.materials.getFilterMaterial(this.batches[k].renderViews[0], {
            filterType: FilterMaterialType.GHOST
          })
        })
      }
    }
  }
}
