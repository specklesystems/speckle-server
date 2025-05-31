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
import { AccelerationStructure, BatchObject, ObjectLayers } from '../../index.js'
import { DefaultBVHOptions } from '../objects/AccelerationStructure.js'
import { TextBatchObject } from './TextBatchObject.js'

const INSTANCE_TEXT_BUFFER_STRIDE = 32
const INSTANCE_TEXT_TRIS_COUNT = 2
const INSTANCE_TEXT_VERT_COUNT = 4

export default class TextBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  public batchMaterial: Material
  public textBatch: SpeckleText

  public get bounds(): Box3 {
    return this.textBatch.TAS.getBoundingBox(new Box3())
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
    return this.textBatch as unknown as Object3D
  }

  public getCount(): number {
    return this.renderViews.length
  }

  public get materials(): Material[] {
    return this.textBatch.materials
  }

  public get groups(): Array<DrawGroup> {
    return this.textBatch.groups
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

  public setBatchBuffers(range: BatchUpdateRange[]): void {
    range
    throw new Error('Method not implemented.')
  }

  public setDrawRanges(ranges: BatchUpdateRange[]) {
    ranges
    // this.mesh.textMesh.material = ranges[0].material
    // if (ranges[0].materialOptions && ranges[0].materialOptions.rampIndexColor) {
    //   this.mesh.textMesh.material.color.copy(ranges[0].materialOptions.rampIndexColor)
    // }
  }

  public resetDrawRanges() {
    // this.mesh.textMesh.material = this.batchMaterial
    // this.mesh.textMesh.visible = true
  }

  public async buildBatch(): Promise<void> {
    return new Promise((resolve) => {
      this.textBatch = new SpeckleText()
      const batchObjects: BatchObject[] = []
      let textSynced = this.renderViews.length
      for (let k = 0; k < this.renderViews.length; k++) {
        const textMeta = this.renderViews[k].renderData.geometry.metaData
        const text = new Text()
        text.matrix.copy(this.renderViews[k].renderData.geometry.bakeTransform)
        text.text = textMeta?.value
        text.fontSize = textMeta?.height
        text.sync(() => {
          const { textRenderInfo } = text
          const bounds = textRenderInfo.blockBounds
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
            DefaultBVHOptions,
            this.renderViews[k].renderData.geometry.bakeTransform as Matrix4
          )
          const batchObject = new TextBatchObject(this.renderViews[k], k)
          batchObject.buildAccelerationStructure(textBvh)
          batchObjects.push(batchObject)
          //@ts-ignore
          this.textBatch.addText(text)
          textSynced--
          if (!textSynced) {
            this.textBatch.setBatchObjects(batchObjects)
            this.textBatch.setBatchMaterial(this.batchMaterial)
            this.textBatch.buildTAS()

            //@ts-ignore
            this.textBatch.uuid = this.id
            //@ts-ignore
            this.textBatch.layers.set(ObjectLayers.STREAM_CONTENT_TEXT)
            //@ts-ignore
            this.textBatch.frustumCulled = false

            this.groups.push({
              start: 0,
              count: this.renderViews.length * INSTANCE_TEXT_BUFFER_STRIDE,
              materialIndex: 0
            })
            //@ts-ignore
            this.textBatch.sync(() => {
              resolve()
            })
          }
        })

        /** Per instance data stride, even though it's written to a tex */
        this.renderViews[k].setBatchData(this.id, k * 32, 32)
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
    this.textBatch.dispose()
  }
}
