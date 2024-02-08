import { MathUtils } from 'three'
import MeshBatch from './MeshBatch'
import LineBatch from './LineBatch'
import Materials, { FilterMaterialType } from '../materials/Materials'
import { NodeRenderView } from '../tree/NodeRenderView'
import { Batch, BatchUpdateRange, GeometryType, NoneBatchUpdateRange } from './Batch'
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
import { Geometry } from '../converter/Geometry'

export default class Batcher {
  private maxHardwareUniformCount = 0
  private floatTextures = false
  private maxBatchObjects = 0
  private maxBatchVertices = 500000
  private minInstancedBatchVertices = 10000
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

  public async *makeBatches(
    worldTree: WorldTree,
    renderTree: RenderTree,
    speckleType: SpeckleType[],
    batchType?: GeometryType
  ) {
    const start = performance.now()
    let min = Number.MAX_SAFE_INTEGER,
      max = -1,
      average = 0,
      batchCount = 0

    const instanceGroups = renderTree.getInstances()
    const instancedBatches: { [id: string]: Array<string> } = {}

    const pause = new AsyncPause()
    const startInstancedGathering = performance.now()
    for (const g in instanceGroups) {
      pause.tick(100)
      if (pause.needsWait) {
        await pause.wait(50)
      }

      let instancedNodes = worldTree.findId(g)
      instancedNodes = instancedNodes.filter((node: TreeNode) => {
        return (
          node.model.renderView &&
          node.model.renderView.speckleType === SpeckleType.Mesh
        )
      })
      if (!instancedNodes.length) continue

      const vertCount =
        (instancedNodes[0].model.renderView.renderData.geometry.attributes.POSITION
          .length /
          3) *
        instancedNodes.length

      if (!instancedBatches[vertCount]) {
        instancedBatches[vertCount] = []
      }
      instancedBatches[vertCount].push(g)
    }
    const instancedGathering = performance.now() - startInstancedGathering

    let deInstancing = 0
    let instanceBuild = 0
    for (const v in instancedBatches) {
      for (let k = 0; k < instancedBatches[v].length; k++) {
        const nodes = worldTree.findId(instancedBatches[v][k])
        /** Make sure entire instance set is instanced */
        let instanced = true
        nodes.every((node: TreeNode) => (instanced &&= node.model.instanced))

        const rvs = nodes
          .map((node: TreeNode) => node.model.renderView)
          /** This disconsiders orphaned nodes caused by incorrect id duplication in the stream */
          .filter((rv) => rv)

        if (Number.parseInt(v) < this.minInstancedBatchVertices || !instanced) {
          const t0 = performance.now()
          rvs.forEach((nodeRv) => {
            const geometry = nodeRv.renderData.geometry
            geometry.instanced = false
            const attribs = geometry.attributes
            geometry.attributes = {
              POSITION: attribs.POSITION.slice(),
              INDEX: attribs.INDEX.slice(),
              ...(attribs.COLOR && {
                COLOR: attribs.COLOR.slice()
              })
            }
            /**  - I don't particularly like this branch -
             *  All instances should have a transform. But it's the easiest thing we can do
             *  until we figure out the viewer <-> connector object duplication inconsistency
             */
            if (geometry.transform)
              Geometry.transformGeometryData(geometry, geometry.transform)
            nodeRv.computeAABB()
          })
          deInstancing += performance.now() - t0
          continue
        }

        const t1 = performance.now()
        const materialHash = rvs[0].renderMaterialHash
        const instancedBatch = await this.buildInstancedBatch(
          renderTree,
          rvs,
          materialHash
        )
        instanceBuild += performance.now() - t1

        this.batches[instancedBatch.id] = instancedBatch
        min = Math.min(min, instancedBatch.renderViews.length)
        max = Math.max(max, instancedBatch.renderViews.length)
        average += instancedBatch.renderViews.length
        batchCount++
        yield this.batches[instancedBatch.id]
      }
    }
    const totalInstanced = performance.now() - start

    const renderViews = renderTree
      .getRenderableNodes(...speckleType)
      .flatMap((node: TreeNode) => {
        if (node.model.renderView) {
          if (node.model.renderView.renderData.geometry.instanced) {
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
    Logger.warn(
      `Batch total: ${batchCount} min: ${min}, max: ${max}, average: ${
        average / materialHashes.length
      }`
    )
    Logger.warn('Buffer setup -> ', MeshBatch.bufferSetup)
    Logger.warn('Array work -> ', MeshBatch.arrayWork)
    Logger.warn('Object BVH -> ', MeshBatch.objectBvh)
    Logger.warn('Compute normals -> ', MeshBatch.computeNormals)
    Logger.warn('Compute box and sphere -> ', MeshBatch.computeBoxAndSphere)
    Logger.warn('Compute RTE -> ', MeshBatch.computeRTE)
    Logger.warn('Batch BVH -> ', MeshBatch.batchBVH)
    Logger.warn('Total instanced -> ', totalInstanced)
    Logger.warn('Instance gathering -> ', instancedGathering)
    Logger.warn('De-instancing -> ', deInstancing)
    Logger.warn('Instanced build -> ', instanceBuild)
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
    const material = this.materials.getMaterial(materialHash, matRef, GeometryType.MESH)
    const batchID = MathUtils.generateUUID()
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

    const batchID = MathUtils.generateUUID()
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
        batch.setVisibleRange(NoneBatchUpdateRange)
      } else {
        batch.setVisibleRange(range)
      }
    }
  }

  public getTransparent(): Record<string, BatchUpdateRange> {
    const visibilityRanges = {}
    for (const k in this.batches) {
      visibilityRanges[k] = this.batches[k].getTransparent()
    }
    return visibilityRanges
  }

  public getStencil(): Record<string, BatchUpdateRange> {
    const visibilityRanges = {}
    for (const k in this.batches) {
      visibilityRanges[k] = this.batches[k].getStencil()
    }
    return visibilityRanges
  }

  public getOpaque(): Record<string, BatchUpdateRange> {
    const visibilityRanges = {}
    for (const k in this.batches) {
      visibilityRanges[k] = this.batches[k].getOpaque()
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
