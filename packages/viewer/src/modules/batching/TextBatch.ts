/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Box3, Material, Mesh, Object3D, WebGLRenderer } from 'three'

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
import { ObjectLayers } from '../../index.js'

export default class TextBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  public batchMaterial: Material
  public mesh: SpeckleText

  public get bounds(): Box3 {
    return new Box3().setFromObject(this.mesh as Mesh)
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
    return this.mesh as Mesh
  }

  public getCount(): number {
    // TO DO
    return 0
  }

  public get materials(): Material[] {
    return (this.mesh as Mesh).material as Material[]
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
    this.mesh = new SpeckleText()
    for (let k = 0; k < this.renderViews.length; k++) {
      const text = new Text()
      text.matrix.copy(this.renderViews[k].renderData.geometry.bakeTransform)
      text.text = this.renderViews[k].renderData.geometry.metaData?.value
      text.fontSize = 2
      //@ts-ignore
      this.mesh.addText(text)
    }
    //@ts-ignore
    this.mesh.material = this.batchMaterial
    //@ts-ignore
    this.mesh.layers.set(ObjectLayers.STREAM_CONTENT_TEXT)
    //@ts-ignore
    this.mesh.frustumCulled = false
    //@ts-ignore
    await this.mesh.sync()
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
