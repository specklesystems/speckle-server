import { generateUUID } from 'three/src/math/MathUtils'
import MeshBatch from './MeshBatch'
import { SpeckleType } from '../converter/GeometryConverter'
import { WorldTree } from '../tree/WorldTree'
import LineBatch from './LineBatch'
import Materials from '../materials/Materials'
import SpeckleLineMaterial from '../materials/SpeckleLineMaterial'
import { NodeRenderView } from '../tree/NodeRenderView'
import { Batch, BatchUpdateRange, GeometryType } from './Batch'

export default class Batcher {
  private materials: Materials
  public batches: { [id: string]: Batch } = {}

  public constructor() {
    this.materials = new Materials()
    this.materials.createDefaultMaterials()
  }

  public makeBatches(batchType: GeometryType, ...speckleType: SpeckleType[]) {
    const rendeViews = WorldTree.getRenderTree()
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
    console.warn(rendeViews)

    for (let i = 0; i < materialHashes.length; i++) {
      const batch = rendeViews.filter(
        (value) => value.renderMaterialHash === materialHashes[i]
      )

      let matRef = null

      if (batchType === GeometryType.MESH) {
        matRef = batch[0].renderData.renderMaterial
      } else if (batchType === GeometryType.LINE) {
        matRef = batch[0].renderData.displayStyle
      }

      const material = this.materials.updateMaterialMap(
        materialHashes[i],
        matRef,
        batchType
      )

      const batchID = generateUUID()
      if (batchType === GeometryType.MESH)
        this.batches[batchID] = new MeshBatch(batchID, batch)
      else this.batches[batchID] = new LineBatch(batchID, batch)
      this.batches[batchID].setBatchMaterial(material as SpeckleLineMaterial)
      this.batches[batchID].buildBatch()
      console.warn(batch)
    }
  }

  public getRenderView(batchId: string, index: number) {
    return this.batches[batchId].getRenderView(index)
  }

  public resetBatchesDrawGroups() {
    for (const k in this.batches) {
      this.batches[k].resetDrawRanges()
    }
  }

  public selectRenderView(renderView: NodeRenderView) {
    this.resetBatchesDrawGroups()
    const batch = this.batches[renderView.batchId]
    batch.setDrawRanges(
      ...[
        {
          offset: 0,
          count: renderView.batchStart,
          material: batch.batchMaterial
        } as BatchUpdateRange,
        {
          offset: renderView.batchStart,
          count: renderView.batchCount,
          material: this.materials.meshHighlightMaterial
        } as BatchUpdateRange,
        {
          offset: renderView.batchEnd,
          count: Infinity,
          material: batch.batchMaterial
        } as BatchUpdateRange
      ]
    )
  }
}
