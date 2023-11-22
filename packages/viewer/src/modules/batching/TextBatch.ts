/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Box3, Color, Material, Object3D, WebGLRenderer } from 'three'

import { NodeRenderView } from '../tree/NodeRenderView'
import { AllBatchUpdateRange, Batch, BatchUpdateRange, GeometryType } from './Batch'

import { SpeckleText } from '../objects/SpeckleText'
import { ObjectLayers } from '../SpeckleRenderer'
import SpeckleTextMaterial from '../materials/SpeckleTextMaterial'

export default class TextBatch implements Batch {
  public id: string
  public subtreeId: string
  public renderViews: NodeRenderView[]
  public batchMaterial: Material
  public mesh: SpeckleText
  private insertedRanges: BatchUpdateRange[] = []

  public get bounds(): Box3 {
    return new Box3() //this.mesh.BVH.getBoundingBox(new Box3())
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
    return this.mesh.geometry.index.count
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

  public insertDrawRanges(...ranges: BatchUpdateRange[]) {
    /** There is a bug in troika library where cloning their derived materials doubles up
     *  their custom shader code which in turns won't compile anymore. The material we
     *  recieve in the range argument here is such a clone which won't compile. That's why
     *  we're 'cloning' it oursleves
     */
    const material = new SpeckleTextMaterial({})
    material.copy(ranges[0].material)
    ranges[0].material = material.getDerivedMaterial()

    const materialOptions = {
      rampIndexColor: new Color().copy(this.mesh.textMesh.material.color)
    }
    this.insertedRanges.push({
      offset: ranges[0].offset,
      count: ranges[0].count,
      material: this.mesh.textMesh.material,
      materialOptions,
      id: ranges[0].id
    })
    this.setDrawRanges(...ranges)
  }

  public removeDrawRanges(id: string) {
    const ranges = this.insertedRanges.filter((value) => value.id === id)
    if (!ranges.length) {
      return
    }
    this.setDrawRanges(...ranges)
    this.insertedRanges = this.insertedRanges.filter((value) => !ranges.includes(value))
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
    return this.batchMaterial
  }

  public purge() {
    this.renderViews.length = 0
    this.batchMaterial.dispose()
    this.mesh.geometry.dispose()
    this.mesh = null
  }
}
