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
import { SpeckleText } from '../objects/SpeckleText.js'
//@ts-ignore
import { Text } from 'troika-three-text'
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

const INSTANCE_TEXT_TRIS_COUNT = 2
const INSTANCE_TEXT_VERT_COUNT = 4

export default class TextBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  public batchMaterial: Material
  public mesh: SpeckleText
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

  public setBatchBuffers(ranges: BatchUpdateRange[]): void {
    console.warn(' Groups -> ', this.mesh.groups)
    console.warn(' Ranges -> ', ranges)
    //@ts-ignore

    this.mesh._members.forEach((packingInfo, text) => {
      const range = ranges.find((val) => val.offset === packingInfo.index)
      if (!range) return

      //@ts-ignore
      text.color = range.material?.color
      //@ts-ignore
      text.material.opacity = range.material?.opacity
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
    // this.mesh.textMesh.material = this.batchMaterial
    // this.mesh.textMesh.visible = true
  }

  protected alignmentXToAnchorX(value: number): string {
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

  protected alignmentYToAnchorY(value: number): string {
    switch (value) {
      case 0:
        return 'left'
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
      this.mesh = new SpeckleText()
      const textMap = new Map()
      const batchObjects: BatchObject[] = []
      const textObjects: Text[] = []
      const box = new Box3()
      let needsRTE = false
      let textSynced = this.renderViews.length
      for (let k = 0; k < this.renderViews.length; k++) {
        const textMeta = this.renderViews[k].renderData.geometry.metaData
        const text = new Text()
        this.renderViews[k].renderData.geometry.bakeTransform?.decompose(
          text.position,
          text.quaternion,
          text.scale
        )
        if (textMeta) {
          text.text = textMeta.value
          text.fontSize = textMeta.height
          text.maxWidth =
            textMeta.maxWidth !== null ? textMeta.maxWidth : Number.POSITIVE_INFINITY
          text.anchorX = this.alignmentXToAnchorX(textMeta.alignmentH as number)
          text.anchorY = this.alignmentYToAnchorY(textMeta.alignmentV as number)
        }
        box.setFromBufferAttribute(text.geometry.attributes.position)
        box.applyMatrix4(
          this.renderViews[k].renderData.geometry.bakeTransform || new Matrix4()
        )
        needsRTE ||= Geometry.needsRTE(box)
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
          const geometry = text.geometry
          geometry.computeBoundingBox()
          const textBvh = AccelerationStructure.buildBVH(
            geometry.index.array,
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
            if (needsRTE) {
              if (!this.batchMaterial.defines) this.batchMaterial.defines = {}
              this.batchMaterial.defines['USE_RTE'] = ' '
            }
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
              resolve()
            })
          }
        })
      }
    })
  }

  public getRenderView(index: number): NodeRenderView {
    index
    return this.renderViews[0]
  }

  public getMaterialAtIndex(index: number): Material {
    index
    return this.batchMaterial
  }

  public getMaterial(rv: NodeRenderView): Material {
    rv
    return this.batchMaterial
  }

  public purge() {
    this.renderViews.length = 0
    this.batchMaterial.dispose()
    //@ts-ignore
    this.mesh.dispose()
  }
}
