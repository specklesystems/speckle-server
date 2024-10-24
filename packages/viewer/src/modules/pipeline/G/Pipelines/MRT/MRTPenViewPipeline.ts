import { Texture, RepeatWrapping } from 'three'
import { ObjectLayers, AssetType } from '../../../../../index.js'
import { Assets } from '../../../../Assets.js'
import SpeckleRenderer from '../../../../SpeckleRenderer.js'
import { GColorPass } from '../../GColorPass.js'
import { GEdgePass } from '../../GEdgesPass.js'
import { GOutputPass } from '../../GOutputPass.js'
import { ObjectVisibility, ClearFlags } from '../../GPass.js'
import { GStencilMaskPass } from '../../GStencilMaskPass.js'
import { GStencilPass } from '../../GStencilPass.js'
import { GTAAPass } from '../../GTAAPass.js'
import { GProgressivePipeline } from '../GProgressivePipeline.js'
import { GDepthNormalPass } from '../../GDepthNormalPass.js'
import paperTex from '../../../../../assets/paper.png'
import Logger from '../../../../utils/Logger.js'

export class MRTPenViewPipeline extends GProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthNormalPass = new GDepthNormalPass()
    depthNormalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthNormalPass.setVisibility(ObjectVisibility.DEPTH)
    depthNormalPass.setJitter(true)
    depthNormalPass.setClearColor(0x000000, 1)
    depthNormalPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthPassNormalDynamic = new GDepthNormalPass()
    depthPassNormalDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassNormalDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassNormalDynamic.setClearColor(0x000000, 1)
    depthPassNormalDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const edgesPass = new GEdgePass()
    edgesPass.setTexture('tDepth', depthNormalPass.depthTexture)
    edgesPass.setTexture('tNormal', depthNormalPass.normalTexture)

    const edgesPassDynamic = new GEdgePass()
    edgesPassDynamic.setTexture('tDepth', depthPassNormalDynamic.depthTexture)
    edgesPassDynamic.setTexture('tNormal', depthPassNormalDynamic.normalTexture)
    edgesPassDynamic.outputTarget = null

    const taaPass = new GTAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    const stencilPass = new GStencilPass()
    stencilPass.setVisibility(ObjectVisibility.STENCIL)
    stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    const stencilSelectPass = new GColorPass()
    stencilSelectPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilSelectPass.setVisibility(ObjectVisibility.STENCIL)
    stencilSelectPass.onBeforeRender = () => {
      speckleRenderer.renderer.getContext().colorMask(false, false, false, false)
    }
    stencilSelectPass.onAfterRender = () => {
      speckleRenderer.renderer.getContext().colorMask(true, true, true, true)
    }

    const stencilMaskPass = new GStencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilMaskPass.setClearFlags(ClearFlags.DEPTH)

    const overlayPass = new GColorPass()
    overlayPass.setLayers([
      ObjectLayers.OVERLAY,
      ObjectLayers.MEASUREMENTS,
      ObjectLayers.PROPS
    ])

    const outputPass = new GOutputPass()
    outputPass.setTexture('tDiffuse', taaPass.outputTarget?.texture)

    this.dynamicStage.push(
      depthPassNormalDynamic,
      edgesPassDynamic,
      stencilPass,
      stencilSelectPass,
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      depthNormalPass,
      edgesPass,
      taaPass,
      outputPass,
      stencilPass,
      stencilSelectPass,
      stencilMaskPass,
      overlayPass
    )

    this.passthroughStage.push(
      outputPass,
      stencilPass,
      stencilSelectPass,
      stencilMaskPass,
      overlayPass
    )

    this.passList = this.dynamicStage

    Assets.getTexture({
      id: 'paper',
      src: paperTex,
      type: AssetType.TEXTURE_8BPP
    })
      .then((value: Texture) => {
        value.wrapS = RepeatWrapping
        value.wrapT = RepeatWrapping
        const options = {
          backgroundTexture: value,
          backgroundTextureIntensity: 0.25
        }
        edgesPass.options = options
        edgesPassDynamic.options = options
        this.accumulationFrameIndex = 0
      })
      .catch((reason) => {
        Logger.error(`Matcap texture failed to load ${reason}`)
      })
  }
}
