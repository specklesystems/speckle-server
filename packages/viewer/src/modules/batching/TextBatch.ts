/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Box3, Material, Matrix4, Object3D, WebGLRenderer } from 'three'

import { NodeRenderView } from '../tree/NodeRenderView.js'
import {
  AllBatchUpdateRange,
  type Batch,
  type BatchUpdateRange,
  type DrawGroup,
  GeometryType,
  NoneBatchUpdateRange
} from './Batch.js'

import Materials from '../materials/Materials.js'
import { SpeckleBatchedText } from '../objects/SpeckleBatchedText.js'
//@ts-ignore
import { AnchorX, AnchorY, Text } from 'troika-three-text'
import {
  AccelerationStructure,
  BatchObject,
  Geometry,
  ObjectLayers,
  SpeckleTextMaterial
} from '../../index.js'
import { DefaultBVHOptions } from '../objects/AccelerationStructure.js'
import { TextBatchObject } from './TextBatchObject.js'
import { DrawRanges } from './DrawRanges.js'
import Logger from '../utils/Logger.js'
import SpeckleTextColoredMaterial from '../materials/SpeckleTextColoredMaterial.js'

const INSTANCE_TEXT_TRIS_COUNT = 2
const INSTANCE_TEXT_VERT_COUNT = 4

export default class TextBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  public batchMaterial: Material
  public mesh: SpeckleBatchedText
  protected drawRanges: DrawRanges = new DrawRanges()

  public get bounds(): Box3 {
    return this.mesh.TAS.getBoundingBox(new Box3())
  }

  public get drawCalls(): number {
    return this.groups.length
  }

  public get minDrawCalls(): number {
    return [...Array.from(new Set(this.groups.map((value) => value.materialIndex)))]
      .length
  }

  public get maxDrawCalls(): number {
    return 1
  }

  public get triCount(): number {
    return INSTANCE_TEXT_TRIS_COUNT * this.renderViews.length
  }

  public get vertCount(): number {
    return INSTANCE_TEXT_VERT_COUNT * this.renderViews.length
  }

  public get pointCount(): number {
    return 0
  }

  public get lineCount(): number {
    return 0
  }

  public get geometryType(): GeometryType {
    return GeometryType.TEXT
  }

  public get renderObject(): Object3D {
    return this.mesh as unknown as Object3D
  }

  public getCount(): number {
    return this.renderViews.length
  }

  public get materials(): Material[] {
    return this.mesh.materials
  }

  public get groups(): Array<DrawGroup> {
    return this.mesh.groups
  }

  public constructor(id: string, subtreeId: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.subtreeId = subtreeId
    this.renderViews = renderViews
  }

  public setBatchMaterial(material: Material) {
    this.batchMaterial = material
  }

  public onUpdate(deltaTime: number) {
    deltaTime
  }

  public onRender(renderer: WebGLRenderer) {
    renderer
  }

  public setVisibleRange(ranges: BatchUpdateRange[]) {
    ranges
    // TO DO
  }

  public getVisibleRange(): BatchUpdateRange {
    return AllBatchUpdateRange
  }

  public getOpaque(): BatchUpdateRange {
    if (Materials.isOpaque(this.batchMaterial)) return AllBatchUpdateRange
    return NoneBatchUpdateRange
  }
  public getDepth(): BatchUpdateRange {
    return this.getOpaque()
  }
  public getTransparent(): BatchUpdateRange {
    if (Materials.isTransparent(this.batchMaterial)) return AllBatchUpdateRange
    return NoneBatchUpdateRange
  }
  public getStencil(): BatchUpdateRange {
    if (this.batchMaterial.stencilWrite === true) return AllBatchUpdateRange
    return NoneBatchUpdateRange
  }

  /** Text batches are mix between how mesh and line batches work.
   * - They still keep track of various draw groups each with it's material
   * - However that material is not really being used, bur rather the properies are copied over to the batch fp32 data texture
   * - For filtering we cheat and use `SpeckleTextColoredMaterial` only to store the gradient/ramp texture + gradient indices for each text in the batch
   * - The color from the gradient/ramp texture will be used only if the gradient index > 0, otherwise the regular color will be used
   * - The gradient index is stored in each text object in it's `userData` and written to the 27'th float in the batch data texture, where the shader reads if from
   * - Even if, the **text batch does not use the materials in it's draw groups**, it emulates the behavior as if it would
   */
  public setBatchBuffers(ranges: BatchUpdateRange[]): void {
    // console.warn(' Groups -> ', this.mesh.groups)
    // console.warn(' Ranges -> ', ranges)
    const splitRanges: BatchUpdateRange[] = []
    ranges.forEach((range: BatchUpdateRange) => {
      for (let k = 0; k < range.count; k++) {
        splitRanges.push({
          offset: range.offset + k,
          count: 1,
          material: range.material,
          materialOptions: range.materialOptions
        })
      }
    })
    //@ts-ignore
    this.mesh._members.forEach((packingInfo, text) => {
      const range = splitRanges.find((val) => val.offset === packingInfo.index)
      if (!range) return

      //@ts-ignore
      text.color = range.material?.color
      //@ts-ignore
      text.material.color = range.material?.color
      //@ts-ignore
      text.material.opacity = range.material?.visible ? range.material?.opacity : 0

      if (range.material instanceof SpeckleTextColoredMaterial) {
        // Group has gradient/ramp texture color source
        if (range.materialOptions) {
          if (
            range.materialOptions.rampIndex !== undefined &&
            range.materialOptions.rampWidth !== undefined
          ) {
            /** The ramp indices specify the *begining* of each ramp color. When sampling with Nearest filter (since we don't want filtering)
             *  we'll always be sampling right at the edge between texels. Most GPUs will sample consistently, but some won't and we end up with
             *  a ton of artifacts. To avoid this, we are shifting the sampling indices so they're right on the center of each texel, so no inconsistent
             *  sampling can occur.
             */
            const shiftedIndex =
              range.materialOptions.rampIndex + 0.5 / range.materialOptions.rampWidth
            /** Update the gradient indices for the individual texts
             *  The colored material is singular, as provided by Materials
             */
            range.material.updateGradientIndexMap(packingInfo.index, shiftedIndex)
            text.userData.gradientIndex = shiftedIndex
          }
          if (range.materialOptions.rampTexture !== undefined) {
            ;(range.material as SpeckleTextMaterial).setGradientTexture(
              range.materialOptions.rampTexture
            )
            this.mesh.setGradientTexture(range.materialOptions.rampTexture)
          }
        } else {
          text.userData.gradientIndex =
            range.material.gradientIndexMap[packingInfo.index]
          this.mesh.setGradientTexture(range.material.userData.gradientRamp.value)
        }
      } else {
        // No gradient or ramp color source
        text.userData.gradientIndex = -1
      }

      packingInfo.needsUpdate = true
    })
    //@ts-ignore
    this.mesh.dirty = true
    //@ts-ignore
    this.mesh.sync()
  }

  public setDrawRanges(ranges: BatchUpdateRange[]) {
    const materials: Array<Material> = ranges.map((val: BatchUpdateRange) => {
      return val.material as Material
    })
    const uniqueMaterials = [...Array.from(new Set(materials.map((value) => value)))]

    for (let k = 0; k < uniqueMaterials.length; k++) {
      if (!this.materials.includes(uniqueMaterials[k]))
        this.materials.push(uniqueMaterials[k])
    }

    this.mesh.groups = this.drawRanges.integrateRanges(
      this.groups,
      this.materials,
      ranges
    )

    let count = 0
    this.groups.forEach((value) => (count += value.count))
    if (count !== this.renderViews.length) {
      Logger.error(`Draw groups invalid on ${this.id}`)
    }
    this.setBatchBuffers(ranges)
    this.cleanMaterials()
  }

  private cleanMaterials() {
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

  public resetDrawRanges() {
    this.groups.length = 0
    this.materials.length = 0

    this.materials.push(this.batchMaterial)
    this.setVisibleRange([AllBatchUpdateRange])
    this.setDrawRanges([
      {
        offset: 0,
        count: this.renderViews.length,
        material: this.batchMaterial
      }
    ])
  }

  protected alignmentXToAnchorX(value: number): AnchorX {
    switch (value) {
      case 0:
        return 'left'
      case 1:
        return 'center'
      case 2:
        return 'right'
      default:
        return 'center'
    }
  }

  protected alignmentYToAnchorY(value: number): AnchorY {
    switch (value) {
      case 0:
        return 'top'
      case 1:
        return 'middle'
      case 2:
        return 'bottom'
      default:
        return 'middle'
    }
  }

  public async buildBatch(): Promise<void> {
    return new Promise((resolve) => {
      this.mesh = new SpeckleBatchedText()
      const textMap = new Map()
      const batchObjects: BatchObject[] = []
      const textObjects: Text[] = []
      const box = new Box3()
      let needsRTE = false
      let needsBillboard = false
      let textSynced = this.renderViews.length
      for (let k = 0; k < this.renderViews.length; k++) {
        const textMeta = this.renderViews[k].renderData.geometry
          .metaData as unknown as {
          value: string
          height: number
          maxWidth: number
          alignmentH: number
          alignmentV: number
          screenOriented: boolean
        }
        const text = new Text()
        this.renderViews[k].renderData.geometry.transform?.decompose(
          text.position,
          text.quaternion,
          text.scale
        )
        text.updateMatrixWorld(true)

        if (textMeta) {
          text.text = textMeta.value
          text.fontSize = textMeta.height
          text.maxWidth =
            textMeta.maxWidth !== null ? textMeta.maxWidth : Number.POSITIVE_INFINITY
          text.anchorX = this.alignmentXToAnchorX(textMeta.alignmentH)
          text.anchorY = this.alignmentYToAnchorY(textMeta.alignmentV)
        }
        needsBillboard ||= textMeta !== undefined ? textMeta.screenOriented : false

        text.material = new SpeckleTextMaterial({
          color: 0xff0000 // control color
        }).getDerivedMaterial()

        textMap.set(text, this.renderViews[k])

        text.sync(() => {
          const { textRenderInfo } = text
          /** We're using visibleBounds for a better fit */
          const bounds = textRenderInfo.visibleBounds
          // console.log('bounds -> ', bounds)
          const vertices = []
          vertices.push(
            bounds[0],
            bounds[3],
            0,
            bounds[2],
            bounds[3],
            0,
            bounds[0],
            bounds[1],
            0,
            bounds[2],
            bounds[1],
            0
          )
          box.setFromArray(vertices)
          box.applyMatrix4(
            this.renderViews[k].renderData.geometry.transform || new Matrix4()
          )

          needsRTE ||= Geometry.needsRTE(box)

          const geometry = text.geometry
          geometry.computeBoundingBox()
          const textBvh = AccelerationStructure.buildBVH(
            geometry.index?.array as number[],
            vertices,
            DefaultBVHOptions
          )
          /** The bounds bug. <Sigh> it needs a refit to report the correct bounds */
          textBvh.refit()

          const batchObject = new TextBatchObject(this.renderViews[k], k)
          batchObject.buildAccelerationStructure(textBvh)
          batchObjects.push(batchObject)
          textObjects.push(text)
          //@ts-ignore
          this.mesh.addText(text)
          textSynced--
          if (!textSynced) {
            if (!this.batchMaterial.defines) this.batchMaterial.defines = {}
            if (needsRTE) {
              this.batchMaterial.defines['USE_RTE'] = ' '
            }
            if (needsBillboard) this.batchMaterial.defines['BILLBOARD'] = ' '
            this.mesh.setBatchObjects(batchObjects, textObjects)
            this.mesh.setBatchMaterial(this.batchMaterial)
            this.mesh.buildTAS()

            //@ts-ignore
            this.mesh.uuid = this.id
            //@ts-ignore
            this.mesh.layers.set(ObjectLayers.STREAM_CONTENT_TEXT)
            //@ts-ignore
            this.mesh.frustumCulled = false

            this.mesh.dirty = true

            this.groups.push({
              start: 0,
              count: this.renderViews.length,
              materialIndex: 0
            })
            //@ts-ignore
            this.mesh.sync(() => {
              /** We assign the allocated packing info to the text render views as we'll be using the same batch indices for simplicity */
              //@ts-ignore
              this.mesh._members.forEach((packingInfo, text) => {
                textMap.get(text).setBatchData(this.id, packingInfo.index, 1)
                packingInfo.needsUpdate = true
              })
              this.setBatchBuffers([
                {
                  offset: 0,
                  count: this.renderViews.length,
                  material: this.batchMaterial
                }
              ])
              resolve()
            })
          }
        })
      }
    })
  }

  public getRenderView(index: number): NodeRenderView | null {
    index
    Logger.warn('Deprecated! Use InstancedBatchObject')
    return null
  }

  public getMaterialAtIndex(index: number): Material | null {
    index
    Logger.warn('Deprecated! Use InstancedBatchObject')
    return null
  }

  public getMaterial(rv: NodeRenderView): Material | null {
    const group = this.groups.find((value) => {
      return (
        rv.batchStart >= value.start &&
        rv.batchStart + rv.batchCount <= value.count + value.start
      )
    })
    if (!group) {
      Logger.warn(`Could not get material for ${rv.renderData.id}`)
      return null
    }
    return this.materials[group.materialIndex]

    // /** Just like for lines, this isn't ideal but it's quicker */
    // const material = this.materials[group.materialIndex].clone() as SpeckleTextMaterial
    // //@ts-ignore
    // this.mesh._members.forEach((packingInfo, text) => {
    //   if (group.start === packingInfo.index) {
    //     material.color.copy(text.material.color)
    //     material.opacity = text.material.opacity
    //   }
    // })

    // return material
  }

  public purge() {
    this.renderViews.length = 0
    this.batchMaterial.dispose()
    //@ts-ignore
    this.mesh.dispose()
  }
}
