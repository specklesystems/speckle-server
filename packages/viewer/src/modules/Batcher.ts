import { generateUUID } from 'three/src/math/MathUtils'
import Batch, { GeometryType } from './Batch'
import { SpeckleType } from './converter/GeometryConverter'
import { WorldTree } from './converter/WorldTree'
import Materials from './materials/Materials'

export default class Batcher {
  private materials: Materials
  public batches: { [id: string]: Batch } = {}

  public constructor() {
    this.materials = new Materials()
    this.materials.createDefaultMaterials()
  }

  // public makeBatches() {
  //   const rendeViews = WorldTree.getRenderTree()
  //     .getRenderViews(SpeckleType.Mesh)
  //     .sort((a, b) => {
  //       if (a.renderMaterialHash === 0) return -1
  //       if (b.renderMaterialHash === 0) return 1
  //       return a.renderMaterialHash - b.renderMaterialHash
  //     })
  //   const materialHashes = [
  //     ...Array.from(new Set(rendeViews.map((value) => value.renderMaterialHash)))
  //   ]

  //   const batches = []
  //   let batchStart = 0
  //   for (let k = 0; k < materialHashes.length; k++) {
  //     for (let m = batchStart; m < rendeViews.length; m++) {
  //       if (rendeViews[m].renderMaterialHash !== materialHashes[k]) {
  //         const batch = rendeViews.slice(batchStart, m)
  //         batches.push(batch)
  //         batchStart += batch.length

  //         const material = this.materials.updateMaterialMap(
  //           materialHashes[k],
  //           batch[0].renderData.renderMaterial,
  //           BatchType.MESH
  //         )
  //         const batchID = generateUUID()
  //         this.batches[batchID] = new Batch(batchID, batch)
  //         this.batches[batchID].setMaterial(material)
  //         this.batches[batchID].buildBatch(BatchType.MESH)
  //         break
  //       }
  //     }
  //   }
  //   console.warn(batches)
  // }

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
      this.batches[batchID].setMaterial(material)
      this.batches[batchID].buildBatch(batchType)
    }

    // const batches = []
    // let batchStart = 0
    // for (let k = 0; k < materialHashes.length; k++) {
    //   for (let m = batchStart; m < rendeViews.length; m++) {
    //     if (
    //       rendeViews[m].renderMaterialHash !== materialHashes[k] ||
    //       m === rendeViews.length - 1
    //     ) {
    //       const batch = rendeViews.slice(
    //         batchStart,
    //         batchStart === rendeViews.length - 1 ? undefined : m
    //       )
    //       batches.push(batch)
    //       batchStart += batch.length
    //       let matRef = null

    //       if (batchType === GeometryType.MESH) {
    //         matRef = batch[0].renderData.renderMaterial
    //       } else if (batchType === GeometryType.LINE) {
    //         matRef = batch[0].renderData.displayStyle
    //       }

    //       const material = this.materials.updateMaterialMap(
    //         materialHashes[k],
    //         matRef,
    //         batchType
    //       )

    //       const batchID = generateUUID()
    //       this.batches[batchID] = new Batch(batchID, batch)
    //       this.batches[batchID].setMaterial(material)
    //       this.batches[batchID].buildBatch(batchType)
    //       break
    //     }
    //   }
    // }
  }
}
