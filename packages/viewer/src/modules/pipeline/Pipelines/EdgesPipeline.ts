import SpeckleRenderer from '../../SpeckleRenderer.js'
import { EdgesPass } from '../Passes/EdgesPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { TAAPass } from '../Passes/TAAPass.js'
import { ObjectLayers } from '../../../IViewer.js'
import { ProgressivePipeline } from './ProgressivePipeline.js'
import { DepthNormalIdPass } from '../Passes/DepthNormalIdPass.js'
import { Texture, WebGLMultipleRenderTargets } from 'three'
import { DepthPass } from '../Passes/DepthPass.js'
import { NormalsPass } from '../Passes/NormalsPass.js'
import { BasePipelineOptions } from './Pipeline.js'
import {
  BatchUpdateRange,
  GeometryType,
  NoneBatchUpdateRange
} from '../../batching/Batch.js'
import Materials from '../../materials/Materials.js'
import SpeckleGhostMaterial from '../../materials/SpeckleGhostMaterial.js'

export interface EdgesPipelineOptions extends BasePipelineOptions {
  outlineThickness?: number
  outlineColor?: number
  outlineOpacity?: number
}

export const DefaultEdgesPipelineOptions = {
  outlineThickness: 1,
  outlineOpacity: 0.75,
  outlineColor: 0x323232
}

export class EdgesPipeline extends ProgressivePipeline {
  public depthPass: DepthNormalIdPass | DepthPass
  public depthPassDynamic: DepthNormalIdPass | DepthPass
  public edgePass: EdgesPass
  public edgePassDynamic: EdgesPass
  public outputTexture?: Texture
  public outputTextureDynamic?: Texture

  constructor(
    speckleRenderer: SpeckleRenderer,
    options: EdgesPipelineOptions = DefaultEdgesPipelineOptions
  ) {
    super(speckleRenderer, options)

    const isMRTCapable =
      speckleRenderer.renderer.capabilities.isWebGL2 ||
      speckleRenderer.renderer.context.getExtension('WEBGL_draw_buffers') !== null

    if (isMRTCapable) this.MRTPipeline(options)
    else this.SRTPipeline(options)
  }

  protected depthNormalIdPassVisibility(
    renderer: SpeckleRenderer
  ): Record<string, BatchUpdateRange> {
    const visibilityRanges: Record<string, BatchUpdateRange> = {}
    for (const k in renderer.batcher.batches) {
      const batch = renderer.batcher.batches[k]
      if (batch.geometryType !== GeometryType.MESH) {
        visibilityRanges[k] = NoneBatchUpdateRange
        continue
      }
      /** Look for a transparent group */
      const transparentGroup = batch.groups.find((value) => {
        if (value.materialIndex === undefined) return false
        const material = batch.materials[value.materialIndex]
        return (
          Materials.isTransparent(material) &&
          material.visible &&
          !(material instanceof SpeckleGhostMaterial)
        )
      })
      /** Look for a hidden group */
      const hiddenGroup = batch.groups.find((value) => {
        if (value.materialIndex === undefined) return false
        return batch.materials[value.materialIndex].visible === false
      })
      /** If there is a group return it's range */
      if (transparentGroup) {
        visibilityRanges[k] = {
          offset: transparentGroup.start,
          count:
            hiddenGroup !== undefined
              ? hiddenGroup.start - transparentGroup.start
              : batch.getCount() - transparentGroup.start
        }
        continue
      }
      /** Exclude entire batch */
      visibilityRanges[k] = NoneBatchUpdateRange
    }
    return visibilityRanges
  }

  protected MRTPipeline(options: EdgesPipelineOptions) {
    const depthNormalIdPass = new DepthNormalIdPass()
    depthNormalIdPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthNormalIdPass.setJitter(true)
    depthNormalIdPass.setClearColor(0x000000, 1)
    depthNormalIdPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)
    depthNormalIdPass.setVisibility(ObjectVisibility.DEPTH)

    const depthNormalIdPassTransparent = new DepthNormalIdPass()
    depthNormalIdPassTransparent.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthNormalIdPassTransparent.setJitter(true)
    depthNormalIdPassTransparent.setVisibility(
      ObjectVisibility.CUSTOM,
      this.depthNormalIdPassVisibility
    )

    depthNormalIdPassTransparent.outputTarget =
      depthNormalIdPass.outputTarget as unknown as WebGLMultipleRenderTargets

    const depthPassNormalIdDynamic = new DepthNormalIdPass()
    depthPassNormalIdDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassNormalIdDynamic.setClearColor(0x000000, 1)
    depthPassNormalIdDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)
    depthPassNormalIdDynamic.setVisibility(ObjectVisibility.DEPTH)

    const depthPassNormalIdDynamicTransparent = new DepthNormalIdPass()
    depthPassNormalIdDynamicTransparent.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassNormalIdDynamicTransparent.setVisibility(
      ObjectVisibility.CUSTOM,
      this.depthNormalIdPassVisibility
    )
    depthPassNormalIdDynamicTransparent.outputTarget =
      depthPassNormalIdDynamic.outputTarget as unknown as WebGLMultipleRenderTargets

    const edgesPass = new EdgesPass()
    edgesPass.setTexture('tDepth', depthNormalIdPass.depthTexture)
    edgesPass.setTexture('tNormal', depthNormalIdPass.normalTexture)
    edgesPass.setTexture('tId', depthNormalIdPass.idTexture)
    edgesPass.options = options

    const edgesPassDynamic = new EdgesPass()
    edgesPassDynamic.setTexture('tDepth', depthPassNormalIdDynamic.depthTexture)
    edgesPassDynamic.setTexture('tNormal', depthPassNormalIdDynamic.normalTexture)
    edgesPassDynamic.setTexture('tId', depthPassNormalIdDynamic.idTexture)
    edgesPassDynamic.options = options

    const taaPass = new TAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    this.dynamicStage.push(
      depthPassNormalIdDynamic,
      depthPassNormalIdDynamicTransparent,
      edgesPassDynamic
    )
    this.progressiveStage.push(
      depthNormalIdPass,
      depthNormalIdPassTransparent,
      edgesPass,
      taaPass
    )

    this.passList = this.dynamicStage

    this.depthPass = depthNormalIdPass
    this.depthPassDynamic = depthPassNormalIdDynamic
    this.edgePass = edgesPass
    this.edgePassDynamic = edgesPassDynamic
    this.outputTexture = taaPass.outputTarget?.texture
    this.outputTextureDynamic = edgesPassDynamic.outputTarget?.texture
  }

  protected SRTPipeline(options: EdgesPipelineOptions) {
    const depthPass = new DepthPass()
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)
    depthPass.setClearColor(0x000000, 1)
    depthPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const normalPass = new NormalsPass()
    normalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPass.setVisibility(ObjectVisibility.OPAQUE)
    normalPass.setJitter(true)
    normalPass.setClearColor(0x000000, 1)
    normalPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthPassDynamic = new DepthPass()
    depthPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassDynamic.setClearColor(0x000000, 1)
    depthPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const normalPassDynamic = new NormalsPass()
    normalPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassDynamic.setVisibility(ObjectVisibility.OPAQUE)
    normalPassDynamic.setClearColor(0x000000, 1)
    normalPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const edgesPass = new EdgesPass()
    edgesPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    edgesPass.setTexture('tNormal', normalPass.outputTarget?.texture)
    edgesPass.options = options

    const edgesPassDynamic = new EdgesPass()
    edgesPassDynamic.setTexture('tDepth', depthPassDynamic.outputTarget?.texture)
    edgesPassDynamic.setTexture('tNormal', normalPassDynamic.outputTarget?.texture)
    edgesPassDynamic.options = options

    const taaPass = new TAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    this.dynamicStage.push(depthPassDynamic, normalPassDynamic, edgesPassDynamic)
    this.progressiveStage.push(depthPass, normalPass, edgesPass, taaPass)

    this.passList = this.dynamicStage

    this.depthPass = depthPass
    this.depthPassDynamic = depthPassDynamic
    this.edgePass = edgesPass
    this.edgePassDynamic = edgesPassDynamic
    this.outputTexture = taaPass.outputTarget?.texture
    this.outputTextureDynamic = edgesPassDynamic.outputTarget?.texture
  }
}
