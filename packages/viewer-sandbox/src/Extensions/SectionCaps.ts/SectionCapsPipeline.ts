import {
  DefaultPipeline,
  ObjectLayers,
  ObjectVisibility,
  PipelineOptions,
  SpeckleRenderer
} from '@speckle/viewer'
import { StencilFrontPass } from './StencilFrontPass'
import { StencilBackPass } from './StencilBackPass'

export class SectionCapsPipeline extends DefaultPipeline {
  constructor(speckleRenderer: SpeckleRenderer, options?: PipelineOptions) {
    super(speckleRenderer, options)

    const stencilFrontPass = new StencilFrontPass()
    stencilFrontPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilFrontPass.setVisibility(ObjectVisibility.OPAQUE)

    const stencilBackPass = new StencilBackPass()
    stencilBackPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilBackPass.setVisibility(ObjectVisibility.OPAQUE)

    this.dynamicStage.splice(3, 0, stencilFrontPass, stencilBackPass)
    this.progressiveStage.splice(4, 0, stencilFrontPass, stencilBackPass)
    this.passthroughStage.splice(1, 0, stencilFrontPass, stencilBackPass)
  }
}
