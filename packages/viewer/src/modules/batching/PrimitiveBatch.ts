import { Material, Object3D, BufferGeometry, BufferAttribute, Box3 } from 'three'
import { NodeRenderView } from '../..'
import {
  AllBatchUpdateRange,
  Batch,
  BatchUpdateRange,
  GeometryType,
  NoneBatchUpdateRange
} from './Batch'
import { DrawGroup } from './Batch'
import Materials from '../materials/Materials'
import SpeckleStandardColoredMaterial from '../materials/SpeckleStandardColoredMaterial'
import Logger from 'js-logger'

export abstract class Primitive<
  TGeometry extends BufferGeometry = BufferGeometry,
  TMaterial extends Material | Material[] = Material | Material[]
> extends Object3D {
  geometry: TGeometry
  material: TMaterial
  visible: boolean
}

export abstract class PrimitiveBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  public batchMaterial: Material

  protected abstract primitive: Primitive
  protected gradientIndexBuffer: BufferAttribute
  protected needsShuffle: boolean = false

  abstract get geometryType(): GeometryType
  abstract get bounds(): Box3
  abstract get minDrawCalls(): number
  abstract get triCount(): number
  abstract get pointCount(): number
  abstract get lineCount(): number

  public get materials(): Material[] {
    return this.primitive.material as Material[]
  }

  public get groups(): DrawGroup[] {
    return this.primitive.geometry.groups
  }

  public get renderObject(): Object3D {
    return this.primitive
  }

  public get drawCalls(): number {
    return this.groups.length
  }

  public get vertCount(): number {
    return this.primitive.geometry.attributes.position.count
  }

  public getCount(): number {
    return this.primitive.geometry.index.count
  }

  public setBatchMaterial(material: Material): void {
    this.batchMaterial = material
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdate(deltaTime: number) {
    if (this.needsShuffle) {
      this.shuffleDrawGroups()
      this.needsShuffle = false
    }
  }

  public setVisibleRange(...ranges: BatchUpdateRange[]) {
    /** Entire batch needs to NOT be drawn */
    if (ranges.length === 1 && ranges[0] === NoneBatchUpdateRange) {
      this.primitive.geometry.setDrawRange(0, 0)
      /** We unset the 'visible' flag, otherwise three.js will still run pointless buffer binding commands*/
      this.primitive.visible = false
      return
    }
    /** Entire batch needs to BE drawn */
    if (ranges.length === 1 && ranges[0] === AllBatchUpdateRange) {
      this.primitive.geometry.setDrawRange(0, this.getCount())
      this.primitive.visible = true
      return
    }

    /** Parts of the batch need to be visible. We get the min/max offset and total count */
    let minOffset = Infinity
    let maxOffset = 0
    ranges.forEach((range) => {
      minOffset = Math.min(minOffset, range.offset)
      maxOffset = Math.max(maxOffset, range.offset)
    })

    this.primitive.geometry.setDrawRange(
      minOffset,
      maxOffset - minOffset + ranges.find((val) => val.offset === maxOffset).count
    )
    this.primitive.visible = true
  }

  public getVisibleRange(): BatchUpdateRange {
    /** Entire batch is visible */
    if (this.primitive.geometry.groups.length === 1 && this.primitive.visible)
      return AllBatchUpdateRange
    /** Entire batch is hidden */
    if (!this.primitive.visible) return NoneBatchUpdateRange
    /** Parts of the batch are visible */
    return {
      offset: this.primitive.geometry.drawRange.start,
      count: this.primitive.geometry.drawRange.count
    }
  }

  public getOpaque(): BatchUpdateRange {
    /** If there is any transparent or hidden group return the update range up to it's offset */
    const transparentOrHiddenGroup = this.groups.find((value) => {
      return (
        Materials.isTransparent(this.materials[value.materialIndex]) ||
        this.materials[value.materialIndex].visible === false
      )
    })

    if (transparentOrHiddenGroup) {
      return {
        offset: 0,
        count: transparentOrHiddenGroup.start
      }
    }
    /** Entire batch is opaque */
    return AllBatchUpdateRange
  }

  public getDepth(): BatchUpdateRange {
    /** If there is any transparent or hidden group return the update range up to it's offset */
    const transparentOrHiddenGroup = this.groups.find((value) => {
      return (
        Materials.isTransparent(this.materials[value.materialIndex]) ||
        this.materials[value.materialIndex].visible === false ||
        this.materials[value.materialIndex].colorWrite === false
      )
    })

    if (transparentOrHiddenGroup) {
      return {
        offset: 0,
        count: transparentOrHiddenGroup.start
      }
    }
    /** Entire batch is opaque */
    return AllBatchUpdateRange
  }

  public getTransparent(): BatchUpdateRange {
    /** Look for a transparent group */
    const transparentGroup = this.groups.find((value) => {
      return Materials.isTransparent(this.materials[value.materialIndex])
    })
    /** Look for a hidden group */
    const hiddenGroup = this.groups.find((value) => {
      return this.materials[value.materialIndex].visible === false
    })
    /** If there is a transparent group return it's range */
    if (transparentGroup) {
      return {
        offset: transparentGroup.start,
        count:
          hiddenGroup !== undefined
            ? hiddenGroup.start
            : this.getCount() - transparentGroup.start
      }
    }
    /** Entire batch is not transparent */
    return NoneBatchUpdateRange
  }

  public getStencil(): BatchUpdateRange {
    /** If there is a single group and it's material writes to stencil, return all */
    if (this.groups.length === 1) {
      if (this.materials[0].stencilWrite === true) return AllBatchUpdateRange
    }
    const stencilGroup = this.groups.find((value) => {
      return this.materials[value.materialIndex].stencilWrite === true
    })
    if (stencilGroup) {
      return {
        offset: stencilGroup.start,
        count: stencilGroup.count
      }
    }
    /** No stencil group */
    return NoneBatchUpdateRange
  }

  public setBatchBuffers(...range: BatchUpdateRange[]): void {
    let minGradientIndex = Infinity
    let maxGradientIndex = 0
    for (let k = 0; k < range.length; k++) {
      if (range[k].materialOptions) {
        if (range[k].materialOptions.rampIndex !== undefined) {
          const start = range[k].offset
          const len = range[k].offset + range[k].count
          /** The ramp indices specify the *begining* of each ramp color. When sampling with Nearest filter (since we don't want filtering)
           *  we'll always be sampling right at the edge between texels. Most GPUs will sample consistently, but some won't and we end up with
           *  a ton of artifacts. To avoid this, we are shifting the sampling indices so they're right on the center of each texel, so no inconsistent
           *  sampling can occur.
           */
          const shiftedIndex =
            range[k].materialOptions.rampIndex +
            0.5 / range[k].materialOptions.rampWidth
          const minMaxIndices = this.updateGradientIndexBufferData(
            start,
            range[k].count === Infinity
              ? this.primitive.geometry.attributes['gradientIndex'].array.length
              : len,
            shiftedIndex
          )
          minGradientIndex = Math.min(minGradientIndex, minMaxIndices.minIndex)
          maxGradientIndex = Math.max(maxGradientIndex, minMaxIndices.maxIndex)
        }
        /** We need to update the texture here, because each batch uses it's own clone for any material we use on it
         *  because otherwise three.js won't properly update our custom uniforms
         */
        if (range[k].materialOptions.rampTexture !== undefined) {
          if (range[k].material instanceof SpeckleStandardColoredMaterial) {
            ;(range[k].material as SpeckleStandardColoredMaterial).setGradientTexture(
              range[k].materialOptions.rampTexture
            )
          }
        }
      }
    }
    if (minGradientIndex < Infinity && maxGradientIndex > 0)
      this.updateGradientIndexBuffer()
  }

  protected cleanMaterials() {
    const materialsInUse = [
      ...Array.from(
        new Set(this.groups.map((value) => this.materials[value.materialIndex]))
      )
    ]
    let k = 0
    while (this.materials.length > materialsInUse.length) {
      if (!materialsInUse.includes(this.materials[k])) {
        this.materials.splice(k, 1)
        this.groups.forEach((value: DrawGroup) => {
          if (value.materialIndex > k) value.materialIndex--
        })
        k = 0
        continue
      }
      k++
    }
  }

  protected abstract getCurrentIndexBuffer(): BufferAttribute
  protected abstract getNextIndexBuffer(): BufferAttribute
  protected abstract shuffleMaterialOrder(a: DrawGroup, b: DrawGroup): number

  private shuffleDrawGroups() {
    const groups = this.primitive.geometry.groups.slice()
    groups.sort(this.shuffleMaterialOrder.bind(this))

    const materialOrder = []
    groups.reduce((previousValue, currentValue) => {
      if (previousValue.indexOf(currentValue.materialIndex) === -1) {
        previousValue.push(currentValue.materialIndex)
      }
      return previousValue
    }, materialOrder)

    const grouped = []
    for (let k = 0; k < materialOrder.length; k++) {
      grouped.push(
        groups.filter((val) => {
          return val.materialIndex === materialOrder[k]
        })
      )
    }

    const sourceIBO: BufferAttribute = this.getCurrentIndexBuffer()
    const targetIBO: BufferAttribute = this.getNextIndexBuffer()
    const sourceIBOData: Uint16Array | Uint32Array = sourceIBO.array as
      | Uint16Array
      | Uint32Array
    const targetIBOData: Uint16Array | Uint32Array = targetIBO.array as
      | Uint16Array
      | Uint32Array
    const newGroups = []
    const scratchRvs = this.renderViews.slice()
    scratchRvs.sort((a, b) => {
      return a.batchStart - b.batchStart
    })
    let targetIBOOffset = 0
    for (let k = 0; k < grouped.length; k++) {
      const materialGroup = grouped[k]
      const materialGroupStart = targetIBOOffset
      let materialGroupCount = 0
      for (let i = 0; i < (materialGroup as []).length; i++) {
        const start = materialGroup[i].start
        const count = materialGroup[i].count
        const subArray = sourceIBOData.subarray(start, start + count)
        targetIBOData.set(subArray, targetIBOOffset)
        let rvTrisCount = 0
        for (let m = 0; m < scratchRvs.length; m++) {
          if (
            scratchRvs[m].batchStart >= start &&
            scratchRvs[m].batchEnd <= start + count
          ) {
            scratchRvs[m].setBatchData(
              this.id,
              targetIBOOffset + rvTrisCount,
              scratchRvs[m].batchCount
            )
            rvTrisCount += scratchRvs[m].batchCount
            scratchRvs.splice(m, 1)
            m--
          }
        }
        targetIBOOffset += count
        materialGroupCount += count
      }
      newGroups.push({
        offset: materialGroupStart,
        count: materialGroupCount,
        materialIndex: materialGroup[0].materialIndex
      })
    }
    this.primitive.geometry.groups = []
    for (let i = 0; i < newGroups.length; i++) {
      this.primitive.geometry.addGroup(
        newGroups[i].offset,
        newGroups[i].count,
        newGroups[i].materialIndex
      )
    }

    this.primitive.geometry.setIndex(targetIBO)
    this.primitive.geometry.index.needsUpdate = true

    const hiddenGroup = this.primitive.geometry.groups.find((value) => {
      return this.primitive.material[value.materialIndex].visible === false
    })
    if (hiddenGroup) {
      this.setVisibleRange({
        offset: 0,
        count: hiddenGroup.start
      })
    }
    // console.log('Final -> ', this.id, this.groups.slice())
  }

  protected abstract updateGradientIndexBufferData(
    start: number,
    end: number,
    value: number
  ): { minIndex: number; maxIndex: number }

  protected updateGradientIndexBuffer(rangeMin?: number, rangeMax?: number): void {
    this.gradientIndexBuffer.updateRange = {
      offset: rangeMin !== undefined ? rangeMin : 0,
      count:
        rangeMin !== undefined && rangeMax !== undefined ? rangeMax - rangeMin + 1 : -1
    }
    this.gradientIndexBuffer.needsUpdate = true
    this.primitive.geometry.attributes['gradientIndex'].needsUpdate = true
  }

  public abstract setDrawRanges(...ranges: BatchUpdateRange[])

  public resetDrawRanges(): void {
    this.primitive.visible = true
    this.primitive.geometry.clearGroups()
    this.primitive.geometry.addGroup(0, this.getCount(), 0)
    this.primitive.geometry.setDrawRange(0, Infinity)
  }

  public abstract buildBatch(): void
  public abstract getRenderView(index: number): NodeRenderView
  public abstract getMaterialAtIndex(index: number): Material
  public getMaterial(rv: NodeRenderView): Material {
    for (let k = 0; k < this.primitive.geometry.groups.length; k++) {
      try {
        if (
          rv.batchStart >= this.primitive.geometry.groups[k].start &&
          rv.batchEnd <=
            this.primitive.geometry.groups[k].start +
              this.primitive.geometry.groups[k].count
        ) {
          return this.materials[this.primitive.geometry.groups[k].materialIndex]
        }
      } catch (e) {
        Logger.error('Failed to get material')
      }
    }
  }

  public purge(): void {
    this.renderViews.length = 0
    this.primitive.geometry.dispose()
    this.batchMaterial.dispose()
    this.primitive = null
  }
}
