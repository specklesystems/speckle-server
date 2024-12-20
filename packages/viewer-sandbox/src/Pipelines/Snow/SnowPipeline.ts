import {
  ProgressivePipeline,
  SpeckleRenderer,
  DepthPass,
  ObjectLayers,
  ObjectVisibility,
  ClearFlags,
  GeometryPass,
  ProgressiveAOPass,
  BlendPass,
  StencilPass,
  StencilMaskPass,
  MeshBatch,
  GeometryType,
  SpeckleStandardMaterial,
  Assets,
  AssetType
} from '@speckle/viewer'
import SnowMaterial from './SnowMaterial'
import SpeckleMesh from '@speckle/viewer/dist/modules/objects/SpeckleMesh'
import { RepeatWrapping, NearestFilter } from 'three'
import snowTex from '../../../assets/snow.png'
import { SnowFallPass } from './SnowFallPass'

export class SnowPipeline extends ProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPass = new DepthPass()
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)
    depthPass.setClearColor(0x000000, 1)
    depthPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const opaqueColorPass = new GeometryPass()
    opaqueColorPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT
    ])
    opaqueColorPass.setVisibility(ObjectVisibility.OPAQUE)

    const transparentColorPass = new GeometryPass()
    transparentColorPass.setLayers([
      ObjectLayers.STREAM_CONTENT,
      ObjectLayers.STREAM_CONTENT_MESH,
      ObjectLayers.STREAM_CONTENT_LINE,
      ObjectLayers.STREAM_CONTENT_POINT,
      ObjectLayers.STREAM_CONTENT_POINT_CLOUD,
      ObjectLayers.STREAM_CONTENT_TEXT,
      ObjectLayers.SHADOWCATCHER
    ])
    transparentColorPass.setVisibility(ObjectVisibility.TRANSPARENT)

    const progressiveAOPass = new ProgressiveAOPass()
    progressiveAOPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    progressiveAOPass.accumulationFrames = this.accumulationFrameCount
    progressiveAOPass.setClearColor(0xffffff, 1)

    const blendPass = new BlendPass()
    blendPass.options = { blendAO: true, blendEdges: false }
    blendPass.setTexture('tAo', progressiveAOPass.outputTarget?.texture)
    blendPass.accumulationFrames = this.accumulationFrameCount

    const stencilPass = new StencilPass()
    stencilPass.setVisibility(ObjectVisibility.STENCIL)
    stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    const stencilMaskPass = new StencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilMaskPass.setClearFlags(ClearFlags.DEPTH)

    const overlayPass = new GeometryPass()
    overlayPass.setLayers([
      ObjectLayers.PROPS,
      ObjectLayers.OVERLAY,
      ObjectLayers.MEASUREMENTS
    ])

    const snowfallPass = new SnowFallPass()
    snowfallPass.setClearColor(0x000000, 1)

    this.dynamicStage.push(
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      stencilMaskPass,
      overlayPass,
      snowfallPass
    )
    this.progressiveStage.push(
      depthPass,
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      stencilMaskPass,
      progressiveAOPass,
      blendPass,
      overlayPass,
      snowfallPass
    )
    this.passthroughStage.push(
      stencilPass,
      opaqueColorPass,
      transparentColorPass,
      stencilMaskPass,
      blendPass,
      overlayPass,
      snowfallPass
    )

    this.passList = this.dynamicStage
  }

  public async start() {
    const snowTexture = await Assets.getTexture({
      id: 'snow',
      src: snowTex,
      type: AssetType.TEXTURE_8BPP
    })
    snowTexture.wrapS = RepeatWrapping
    snowTexture.wrapT = RepeatWrapping
    snowTexture.minFilter = NearestFilter
    snowTexture.magFilter = NearestFilter

    const batches: MeshBatch[] = this.speckleRenderer.batcher.getBatches(
      undefined,
      GeometryType.MESH
    )

    for (let k = 0; k < batches.length; k++) {
      const batchRenderable: SpeckleMesh = batches[k].renderObject as SpeckleMesh
      const batchMaterial: SpeckleStandardMaterial = batches[k]
        .batchMaterial as SpeckleStandardMaterial
      const snowMaterial = new SnowMaterial({}, ['USE_RTE'])
      snowMaterial.copy(batchMaterial)
      snowMaterial.normalMap = snowTexture
      batchRenderable.setOverrideBatchMaterial(snowMaterial)
    }
  }
}
