import { RepeatWrapping, Texture } from 'three'
import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GDepthPass } from '../GDepthPass.js'
import { GEdgePass } from '../GEdgesPass.js'
import { GNormalsPass } from '../GNormalPass.js'
import { ClearFlags, ObjectVisibility } from '../GPass.js'
import { GTAAPass } from '../GTAAPass.js'
import { AssetType, ObjectLayers } from '../../../../IViewer.js'
import { Assets } from '../../../Assets.js'
import paperTex from '../../../../assets/paper.png'
import Logger from '../../../utils/Logger.js'
import { GProgressivePipeline } from './GProgressivePipeline.js'
import { GColorPass } from '../GColorPass.js'
import { GStencilMaskPass } from '../GStencilMaskPass.js'
import { GStencilPass } from '../GStencilPass.js'
import { GOutputPass } from '../GOutputPass.js'

export class PenViewPipeline extends GProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthPass = new GDepthPass()
    depthPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPass.setVisibility(ObjectVisibility.DEPTH)
    depthPass.setJitter(true)
    depthPass.setClearColor(0x000000, 1)
    depthPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const normalPass = new GNormalsPass()
    normalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPass.setVisibility(ObjectVisibility.OPAQUE)
    normalPass.setJitter(true)
    normalPass.setClearColor(0x000000, 1)
    normalPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthPassDynamic = new GDepthPass()
    depthPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassDynamic.setClearColor(0x000000, 1)
    depthPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const normalPassDynamic = new GNormalsPass()
    normalPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    normalPassDynamic.setVisibility(ObjectVisibility.OPAQUE)
    normalPassDynamic.setClearColor(0x000000, 1)
    normalPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const edgesPass = new GEdgePass()
    edgesPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    edgesPass.setTexture('tNormal', normalPass.outputTarget?.texture)

    const edgesPassDynamic = new GEdgePass()
    edgesPassDynamic.setTexture('tDepth', depthPassDynamic.outputTarget?.texture)
    edgesPassDynamic.setTexture('tNormal', normalPassDynamic.outputTarget?.texture)
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
    overlayPass.setLayers([ObjectLayers.OVERLAY, ObjectLayers.MEASUREMENTS])

    const outputPass = new GOutputPass()
    outputPass.setTexture('tDiffuse', taaPass.outputTarget?.texture)

    this.dynamicStage.push(
      depthPassDynamic,
      normalPassDynamic,
      edgesPassDynamic,
      stencilPass,
      stencilSelectPass,
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      depthPass,
      normalPass,
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
