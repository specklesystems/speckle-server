import { Material, Object3D, BufferGeometry, BufferAttribute, Box3 } from 'three'
import { NodeRenderView } from '../../index.js'
import {
  AllBatchUpdateRange,
  type Batch,
  type BatchUpdateRange,
  GeometryType,
  NoneBatchUpdateRange
} from './Batch.js'
import { type DrawGroup } from './Batch.js'
import Materials from '../materials/Materials.js'
import SpeckleStandardColoredMaterial from '../materials/SpeckleStandardColoredMaterial.js'
import SpecklePointColouredMaterial from '../materials/SpecklePointColouredMaterial.js'

export abstract class Primitive<
  TGeometry extends BufferGeometry = BufferGeometry,
  TMaterial extends Material | Material[] = Material | Material[]
> extends Object3D {
  geometry!: TGeometry
  material!: TMaterial
  visible!: boolean
}

export abstract class PrimitiveBatch implements Batch {
  public id!: string
  public subtreeId!: string
  public renderViews!: NodeRenderView[]
  public batchMaterial!: Material

  protected abstract primitive: Primitive
  protected gradientIndexBuffer!: BufferAttribute
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
    /** We always write to geomtry.groups via the set accessor
     *  which takes a DrawGroup[], so geometry.groups will always
     *  be an array of DrawGroup.
     *  Not to mention that **all our draw groupd are DrawGroup because
     *  they always have a materialIndex defined** by design and convention!!!
     */
    return this.primitive.geometry.groups as DrawGroup[]
  }

  public set groups(value: DrawGroup[]) {
    this.primitive.geometry.groups = value
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
    return this.primitive.geometry.index?.count || 0
  }

  public setBatchMaterial(material: Material): void {
    this.batchMaterial = material
  }

  public onUpdate() {
    if (this.needsShuffle) {
      this.shuffleDrawGroups()
      this.needsShuffle = false
    }
  }

  public setVisibleRange(ranges: BatchUpdateRange[]) {
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

    const offset = ranges.find((val) => val.offset === maxOffset)
    this.primitive.geometry.setDrawRange(
      minOffset,
      maxOffset - minOffset + (offset ? offset.count : 0)
    )
    this.primitive.visible = true
  }

  public getVisibleRange(): BatchUpdateRange {
    /** Entire batch is visible */
    if (this.groups.length === 1 && this.primitive.visible) return AllBatchUpdateRange
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
      if (value.materialIndex === undefined) return false
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
      if (value.materialIndex === undefined) return false
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
      if (value.materialIndex === undefined) return false
      return Materials.isTransparent(this.materials[value.materialIndex])
    })
    /** Look for a hidden group */
    const hiddenGroup = this.groups.find((value) => {
      if (value.materialIndex === undefined) return false
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
      if (value.materialIndex === undefined) return false
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

  public setBatchBuffers(ranges: BatchUpdateRange[]): void {
    let minGradientIndex = Infinity
    let maxGradientIndex = 0
    for (let k = 0; k < ranges.length; k++) {
      const range = ranges[k]
      if (range.materialOptions) {
        if (
          range.materialOptions.rampIndex !== undefined &&
          range.materialOptions.rampWidth !== undefined
        ) {
          const start = ranges[k].offset
          const len = ranges[k].offset + ranges[k].count
          /** The ramp indices specify the *begining* of each ramp color. When sampling with Nearest filter (since we don't want filtering)
           *  we'll always be sampling right at the edge between texels. Most GPUs will sample consistently, but some won't and we end up with
           *  a ton of artifacts. To avoid this, we are shifting the sampling indices so they're right on the center of each texel, so no inconsistent
           *  sampling can occur.
           */

          const shiftedIndex =
            range.materialOptions.rampIndex + 0.5 / range.materialOptions.rampWidth
          const minMaxIndices = this.updateGradientIndexBufferData(
            start,
            range.count === Infinity
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
        if (range.materialOptions.rampTexture !== undefined) {
          if (
            range.material instanceof SpeckleStandardColoredMaterial ||
            range.material instanceof SpecklePointColouredMaterial
          ) {
            range.material.setGradientTexture(range.materialOptions.rampTexture)
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
        new Set(
          this.groups.map((value) => {
            if (value.materialIndex === undefined) return undefined
            return this.materials[value.materialIndex]
          })
        )
      )
    ]
    let k = 0
    while (this.materials.length > materialsInUse.length) {
      if (!materialsInUse.includes(this.materials[k])) {
        this.materials.splice(k, 1)
        this.groups.forEach((value: DrawGroup) => {
          if (value.materialIndex === undefined) return
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
    const groups = this.groups.slice()
    groups.sort(this.shuffleMaterialOrder.bind(this))

    const materialOrder: Array<number> = []
    groups.reduce((previousValue, currentValue) => {
      if (currentValue.materialIndex !== undefined) {
        if (previousValue.indexOf(currentValue.materialIndex) === -1) {
          previousValue.push(currentValue.materialIndex)
        }
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
    this.groups = []
    for (let i = 0; i < newGroups.length; i++) {
      this.primitive.geometry.addGroup(
        newGroups[i].offset,
        newGroups[i].count,
        newGroups[i].materialIndex
      )
    }

    this.primitive.geometry.setIndex(targetIBO)
    /** Catering to typescript
     *  The line above literally makes sure the index is set. Absurd
     */
    if (this.primitive.geometry.index) this.primitive.geometry.index.needsUpdate = true

    const hiddenGroup = this.groups.find((value) => {
      if (value.materialIndex === undefined) return false
      return this.materials[value.materialIndex].visible === false
    })
    if (hiddenGroup) {
      this.setVisibleRange([
        {
          offset: 0,
          count: hiddenGroup.start
        }
      ])
    } else this.setVisibleRange([AllBatchUpdateRange])

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

  public abstract setDrawRanges(ranges: BatchUpdateRange[]): void

  public resetDrawRanges(): void {
    this.primitive.visible = true
    this.primitive.geometry.clearGroups()
    this.primitive.geometry.addGroup(0, this.getCount(), 0)
    this.primitive.geometry.setDrawRange(0, Infinity)
  }

  public abstract buildBatch(): Promise<void>
  public abstract getRenderView(index: number): NodeRenderView | null
  public abstract getMaterialAtIndex(index: number): Material | null
  public getMaterial(rv: NodeRenderView): Material | null {
    for (let k = 0; k < this.groups.length; k++) {
      const group = this.groups[k]
      if (rv.batchStart >= group.start && rv.batchEnd <= group.start + group.count) {
        return this.materials[group.materialIndex]
      }
    }
    return null
  }

  public purge(): void {
    this.renderViews.length = 0
    this.primitive.geometry.dispose()
    this.batchMaterial.dispose()
  }
}
