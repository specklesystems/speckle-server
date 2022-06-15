import { generateUUID } from 'three/src/math/MathUtils'
import Batch, { GeometryType } from './Batch'
import { SpeckleType } from './converter/GeometryConverter'
import { WorldTree } from './converter/WorldTree'
import Materials from './materials/Materials'
import { NodeRenderView } from './NodeRenderView'

export default class Batcher {
  private materials: Materials
  public batches: { [id: string]: Batch } = {}

  public constructor() {
    this.materials = new Materials()
    this.materials.createDefaultMaterials()
  }

  public makeBatches(batchType: GeometryType, ...speckleType: SpeckleType[]) {
    const rendeViews = WorldTree.getRenderTree()
      .getRenderViews(...speckleType)
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
      this.batches[batchID] = new Batch(batchID, batch)
      this.batches[batchID].setBatchMaterial(material)
      this.batches[batchID].buildBatch(batchType)
      console.warn(batch)
    }
  }

  public getRenderView(batchId: string, index: number) {
    return this.batches[batchId].getRenderView(index)
  }

  public resetBatchesDrawGroups() {
    for (const k in this.batches) {
      this.batches[k].clearDrawGroups()
      this.batches[k].mesh.material = this.batches[k].batchMaterial
    }
  }

  public selectRenderView(renderView: NodeRenderView) {
    const batch = this.batches[renderView.batchId]
    batch.setMaterial([batch.batchMaterial, this.materials.meshHighlightMaterial])
    batch.clearDrawGroups()
    batch.addDrawGroup(0, renderView.batchStart, 0)
    batch.addDrawGroup(renderView.batchStart, renderView.batchCount, 1)
    batch.addDrawGroup(renderView.batchEnd, Infinity, 0)
  }
}
