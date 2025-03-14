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
import SpeckleStandardMaterial from '../../../materials/SpeckleStandardMaterial.js'
import {
  DoubleSide,
  OrthographicCamera,
  PerspectiveCamera,
  RenderItem,
  Scene,
  WebGLRenderer
} from 'three'
import { DepthNormalIdPass } from '../../Passes/DepthNormalIdPass.js'

export class MRTPenViewPipeline extends ProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

    const depthNormalIdPass = new DepthNormalIdPass()
    depthNormalIdPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthNormalIdPass.setVisibility(ObjectVisibility.DEPTH)
    depthNormalIdPass.setJitter(true)
    depthNormalIdPass.setClearColor(0x000000, 1)
    depthNormalIdPass.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const depthNormalIdPassDynamic = new DepthNormalIdPass()
    depthNormalIdPassDynamic.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    depthNormalIdPassDynamic.setVisibility(ObjectVisibility.DEPTH)
    depthNormalIdPassDynamic.setClearColor(0x000000, 1)
    depthNormalIdPassDynamic.setClearFlags(ClearFlags.COLOR | ClearFlags.DEPTH)

    const edgesPass = new EdgePass()
    edgesPass.setTexture('tDepth', depthNormalIdPass.depthTexture)
    edgesPass.setTexture('tNormal', depthNormalIdPass.normalTexture)
    edgesPass.setTexture('tId', depthNormalIdPass.idTexture)

    const edgesPassDynamic = new EdgePass()
    edgesPassDynamic.setTexture('tDepth', depthNormalIdPassDynamic.depthTexture)
    edgesPassDynamic.setTexture('tNormal', depthNormalIdPassDynamic.normalTexture)
    edgesPassDynamic.setTexture('tId', depthNormalIdPassDynamic.idTexture)
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
    geometryPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH, ObjectLayers.PROPS])

    const stencilMaskPass = new StencilMaskPass()
    stencilMaskPass.setVisibility(ObjectVisibility.STENCIL)
    stencilMaskPass.setLayers([ObjectLayers.STREAM_CONTENT_MESH])
    stencilMaskPass.setClearFlags(ClearFlags.DEPTH)

    const overlayPass = new GeometryPass()
    overlayPass.setLayers([ObjectLayers.OVERLAY, ObjectLayers.MEASUREMENTS])

    const outputPass = new OutputPass()
    outputPass.setTexture('tDiffuse', taaPass.outputTarget?.texture)

    this.dynamicStage.push(
      depthNormalIdPassDynamic,
      edgesPassDynamic,
      stencilPass,
      geometryPass,
      stencilMaskPass,
      overlayPass
    )
    this.progressiveStage.push(
      depthNormalIdPass,
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
