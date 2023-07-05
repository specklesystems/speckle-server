/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Box3, Material, Object3D, WebGLRenderer } from 'three'

import { NodeRenderView } from '../tree/NodeRenderView'
import { AllBatchUpdateRange, Batch, BatchUpdateRange, GeometryType } from './Batch'

import { SpeckleText } from '../objects/SpeckleText'
import { GlyphGeometry } from 'troika-three-text'
import { ObjectLayers } from '../SpeckleRenderer'

export default class TextBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  private geometry: GlyphGeometry
  public batchMaterial: Material
  public mesh: SpeckleText

  public get bounds(): Box3 {
    return new Box3() //this.mesh.BVH.getBoundingBox(new Box3())
  }

  public constructor(id: string, subtreeId: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.subtreeId = subtreeId
    this.renderViews = renderViews
  }
  insertDrawRanges(...ranges: BatchUpdateRange[]) {
    ranges
  }

  public get geometryType(): GeometryType {
    return GeometryType.TEXT
  }

  public get renderObject(): Object3D {
    return this.mesh
  }

  public getCount(): number {
    return this.geometry.index.count
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

  public setVisibleRange(...ranges: BatchUpdateRange[]) {}

  public getVisibleRange(): BatchUpdateRange {
    return AllBatchUpdateRange
  }

  public setDrawRanges(...ranges: BatchUpdateRange[]) {
    this.mesh.textMesh.material = ranges[0].material
    if (ranges[0].materialOptions && ranges[0].materialOptions.rampIndexColor) {
      this.mesh.textMesh.material.color.copy(ranges[0].materialOptions.rampIndexColor)
    }
  }

  removeDrawRanges(id: string) {
    id
  }

  public autoFillDrawRanges() {}

  public resetDrawRanges() {
    this.mesh.textMesh.material = this.batchMaterial
    this.mesh.textMesh.visible = true
    // this.geometry.clearGroups()
    // this.geometry.setDrawRange(0, Infinity)
  }

  public async buildBatch() {
    this.mesh = new SpeckleText(this.id)
    this.mesh.matrixAutoUpdate = false
    await this.mesh.update(
      SpeckleText.SpeckleTextParamsFromMetadata(
        this.renderViews[0].renderData.geometry.metaData
      )
    )
    this.mesh.matrix.copy(this.renderViews[0].renderData.geometry.bakeTransform)
    this.renderViews[0].setBatchData(
      this.id,
      0,
      this.mesh.textMesh.geometry.index.length / 3
    )
    this.mesh.textMesh.material = this.batchMaterial
    this.mesh.layers.set(ObjectLayers.STREAM_CONTENT_TEXT)
    this.mesh.textMesh.layers.set(ObjectLayers.STREAM_CONTENT_TEXT)
  }

  public getRenderView(index: number): NodeRenderView {
    return this.renderViews[0]
  }

  public getMaterialAtIndex(index: number): Material {
    index
    console.warn('Deprecated! Do not call this anymore')
    return null
  }

  public purge() {
    this.renderViews.length = 0
    this.geometry.dispose()
    this.batchMaterial.dispose()
    this.mesh = null
  }
}
