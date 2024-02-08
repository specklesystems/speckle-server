/* eslint-disable @typescript-eslint/no-unused-vars */
import { Box3, Material, Object3D, WebGLRenderer } from 'three'

import { NodeRenderView } from '../tree/NodeRenderView'
import {
  AllBatchUpdateRange,
  Batch,
  BatchUpdateRange,
  GeometryType,
  NoneBatchUpdateRange
} from './Batch'

import { SpeckleText } from '../objects/SpeckleText'
import { ObjectLayers } from '../../IViewer'
import { DrawGroup } from './InstancedMeshBatch'
import Materials from '../materials/Materials'

export default class TextBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  public batchMaterial: Material
  public mesh: SpeckleText

  public get bounds(): Box3 {
    return new Box3().setFromObject(this.mesh)
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
    return (
      this.mesh.textMesh.geometry.attributes.position.count +
      this.mesh.backgroundMesh?.geometry.attributes.position.count
    )
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
    return this.mesh
  }

  public getCount(): number {
    return (
      this.mesh.textMesh.geometry.index.count +
      this.mesh.backgroundMesh?.geometry.index.count
    )
  }

  public get materials(): Material[] {
    return this.mesh.material as Material[]
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

  public setVisibleRange(...ranges: BatchUpdateRange[]) {
    // TO DO
  }

  public getVisibleRange(): BatchUpdateRange {
    return AllBatchUpdateRange
  }

  public getOpaque(): BatchUpdateRange {
    if (Materials.isOpaque(this.batchMaterial)) return AllBatchUpdateRange
    return NoneBatchUpdateRange
  }
  public getTransparent(): BatchUpdateRange {
    if (Materials.isTransparent(this.batchMaterial)) return AllBatchUpdateRange
    return NoneBatchUpdateRange
  }
  public getStencil(): BatchUpdateRange {
    if (this.batchMaterial.stencilWrite === true) return AllBatchUpdateRange
    return NoneBatchUpdateRange
  }

  public setBatchBuffers(...range: BatchUpdateRange[]): void {
    throw new Error('Method not implemented.')
  }

  public setDrawRanges(...ranges: BatchUpdateRange[]) {
    this.mesh.textMesh.material = ranges[0].material
    if (ranges[0].materialOptions && ranges[0].materialOptions.rampIndexColor) {
      this.mesh.textMesh.material.color.copy(ranges[0].materialOptions.rampIndexColor)
    }
  }

  public resetDrawRanges() {
    this.mesh.textMesh.material = this.batchMaterial
    this.mesh.textMesh.visible = true
    // this.geometry.clearGroups()
    // this.geometry.setDrawRange(0, Infinity)
  }

  public async buildBatch() {
    this.mesh = new SpeckleText(this.id, ObjectLayers.STREAM_CONTENT_TEXT)
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
      this.mesh.textMesh.geometry.index.count / 3
    )
    this.mesh.textMesh.material = this.batchMaterial
  }

  public getRenderView(index: number): NodeRenderView {
    return this.renderViews[0]
  }

  public getMaterialAtIndex(index: number): Material {
    return this.batchMaterial
  }

  public getMaterial(rv: NodeRenderView): Material {
    return this.batchMaterial
  }

  public purge() {
    this.renderViews.length = 0
    this.batchMaterial.dispose()
    this.mesh.geometry.dispose()
    this.mesh = null
  }
}
