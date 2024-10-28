import { ObjectLayers } from '../../../../index.js'
import SpeckleRenderer from '../../../SpeckleRenderer.js'
import { GeometryPass } from '../../Passes/GeometryPass.js'
import { EdgePass } from '../../Passes/EdgesPass.js'
import { OutputPass } from '../../Passes/OutputPass.js'
import { ObjectVisibility, ClearFlags } from '../../Passes/GPass.js'
import { StencilMaskPass } from '../../Passes/StencilMaskPass.js'
import { StencilPass } from '../../Passes/StencilPass.js'
import { TAAPass } from '../../Passes/TAAPass.js'
import { ProgressivePipeline } from '../ProgressivePipeline.js'
import { DepthNormalPass } from '../../Passes/DepthNormalPass.js'
import SpeckleStandardMaterial from '../../../materials/SpeckleStandardMaterial.js'
import {
  DoubleSide,
  OrthographicCamera,
  PerspectiveCamera,
  RenderItem,
  Scene,
  WebGLRenderer
} from 'three'

export class MRTPenViewPipeline extends ProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthNormalPass = new DepthNormalPass()
    depthNormalPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthNormalPass.setVisibility(ObjectVisibility.DEPTH)
    depthNormalPass.setJitter(true)
    depthNormalPass.setClearColor(0x000000, 1)
    depthNormalPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthPassNormalDynamic = new DepthNormalPass()
    depthPassNormalDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthPassNormalDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthPassNormalDynamic.setClearColor(0x000000, 1)
    depthPassNormalDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const edgesPass = new EdgePass()
    edgesPass.setTexture('tDepth', depthNormalPass.depthTexture)
    edgesPass.setTexture('tNormal', depthNormalPass.normalTexture)

    const edgesPassDynamic = new EdgePass()
    edgesPassDynamic.setTexture('tDepth', depthPassNormalDynamic.depthTexture)
    edgesPassDynamic.setTexture('tNormal', depthPassNormalDynamic.normalTexture)
    edgesPassDynamic.outputTarget = null

    const taaPass = new TAAPass()
    taaPass.inputTexture = edgesPass.outputTarget?.texture
    taaPass.accumulationFrames = this.accumulationFrameCount

    const stencilPass = new StencilPass()
    stencilPass.setVisibility(ObjectVisibility.STENCIL)
    stencilPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    /** We can anonymously extend a pass and inline it */
    const geometryPass = new (class extends GeometryPass {
      private hiddenMaterial: SpeckleStandardMaterial

      public get displayName(): string {
        return 'GEOMETRY-HIDDEN'
      }

      public get overrideBatchMaterial() {
        return this.hiddenMaterial
      }

      constructor() {
        super()
        this.hiddenMaterial = new SpeckleStandardMaterial(
          {
            side: DoubleSide,
            transparent: false,
            opacity: 1,
            wireframe: false
          },
          ['USE_RTE']
        )
        this.hiddenMaterial.colorWrite = false
      }

      public render(
        renderer: WebGLRenderer,
        camera: PerspectiveCamera | OrthographicCamera | null,
        scene?: Scene
      ): boolean {
        renderer.setOpaqueSort(this.sortOpaque)
        const ret = super.render(renderer, camera, scene)
        //@ts-expect-error shut up
        renderer.setOpaqueSort(null)
        return ret
      }

      protected sortOpaque(a: RenderItem, b: RenderItem): number {
        /** We prioritize on materials that only write depth, so that other visible materials get properly occluded */
        return +a.material.colorWrite - +b.material.colorWrite
      }
    })()
    geometryPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])

    const stencilMaskPass = new StencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilMaskPass.setClearFlags(ClearFlags.DEPTH)

    const overlayPass = new GeometryPass()
    overlayPass.setLayers([
      ObjectLayers.OVERLAY,
      ObjectLayers.MEASUREMENTS,
      ObjectLayers.PROPS
    ])

    const outputPass = new OutputPass()
    outputPass.setTexture('tDiffuse', taaPass.outputTarget?.texture)

    this.dynamicStage.push(
      depthPassNormalDynamic,
      edgesPassDynamic,
      stencilPass,
      geometryPass,
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      depthNormalPass,
      edgesPass,
      taaPass,
      outputPass,
      stencilPass,
      geometryPass,
      stencilMaskPass,
      overlayPass
    )

    this.passthroughStage.push(
      outputPass,
      stencilPass,
      geometryPass,
      stencilMaskPass,
      overlayPass
    )

    this.passList = this.dynamicStage
  }
}
