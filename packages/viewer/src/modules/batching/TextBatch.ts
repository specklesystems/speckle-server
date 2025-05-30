/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Box3, Material, Matrix4, Mesh, Object3D, WebGLRenderer } from 'three'

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
import { AccelerationStructure, ObjectLayers } from '../../index.js'
import { DefaultBVHOptions } from '../objects/AccelerationStructure.js'
import { TextBatchObject } from './TextBatchObject.js'

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
    return 1
  }

  public get minDrawCalls(): number {
    return 1
  }

  public get triCount(): number {
    return this.getCount()
  }

  public get vertCount(): number {
    // TO DO
    return 0
  }

  public get pointCount(): number {
    return 0
  }
  public get lineCount(): number {
    return 0
  }

  public constructor(id: string, subtreeId: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.subtreeId = subtreeId
    this.renderViews = renderViews
  }

  public get geometryType(): GeometryType {
    return GeometryType.TEXT
  }

  public get renderObject(): Object3D {
    return this.textBatch as unknown as Object3D
  }

  public getCount(): number {
    // TO DO
    return 0
  }

  public get materials(): Material[] {
    return (this.textBatch as unknown as Mesh).material as Material[]
  }

  public get groups(): DrawGroup[] {
    return []
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
    this.textBatch = new SpeckleText()
    const batchObjects = []
    for (let k = 0; k < this.renderViews.length; k++) {
      const textMeta = this.renderViews[k].renderData.geometry.metaData
      const text = new Text()
      text.matrix.copy(this.renderViews[k].renderData.geometry.bakeTransform)
      text.text = textMeta?.value
      text.fontSize = textMeta?.height
      await text.sync()

      /** Per instance data stride, even though it's written to a tex */
      this.renderViews[k].setBatchData(this.id, k * 32, 32)

      const geometry = text.geometry
      geometry.computeBoundingBox()
      const textBvh = AccelerationStructure.buildBVH(
        geometry.index.array,
        geometry.attributes.position.array,
        DefaultBVHOptions,
        this.renderViews[k].renderData.geometry.bakeTransform as Matrix4
      )
      const batchObject = new TextBatchObject(this.renderViews[k], k)
      batchObject.buildAccelerationStructure(textBvh)
      batchObjects.push(batchObject)
      //@ts-ignore
      this.textBatch.addText(text)
    }

    this.textBatch.setBatchObjects(batchObjects)
    this.textBatch.setBatchMaterial(this.batchMaterial)
    this.textBatch.buildTAS()

    //@ts-ignore
    this.textBatch.uuid = this.id
    //@ts-ignore
    this.textBatch.layers.set(ObjectLayers.STREAM_CONTENT_TEXT)
    //@ts-ignore
    this.textBatch.frustumCulled = false
    //@ts-ignore
    await this.textBatch.sync()
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
