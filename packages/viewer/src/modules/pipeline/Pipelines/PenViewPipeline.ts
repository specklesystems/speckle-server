import SpeckleRenderer from '../../SpeckleRenderer.js'
import { DepthPass } from '../Passes/DepthPass.js'
import { EdgePass } from '../Passes/EdgesPass.js'
import { NormalsPass } from '../Passes/NormalsPass.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
import { TAAPass } from '../Passes/TAAPass.js'
import { ObjectLayers } from '../../../IViewer.js'
import { ProgressivePipeline } from './ProgressivePipeline.js'
import { GeometryPass } from '../Passes/GeometryPass.js'
import { StencilMaskPass } from '../Passes/StencilMaskPass.js'
import { StencilPass } from '../Passes/StencilPass.js'
import { OutputPass } from '../Passes/OutputPass.js'
import SpeckleStandardMaterial from '../../materials/SpeckleStandardMaterial.js'
import {
  DoubleSide,
  OrthographicCamera,
  PerspectiveCamera,
  RenderItem,
  Scene,
  WebGLRenderer
} from 'three'

export class PenViewPipeline extends ProgressivePipeline {
  constructor(speckleRenderer: SpeckleRenderer) {
    super(speckleRenderer)

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

    const edgesPass = new EdgePass()
    edgesPass.setTexture('tDepth', depthPass.outputTarget?.texture)
    edgesPass.setTexture('tNormal', normalPass.outputTarget?.texture)

    const edgesPassDynamic = new EdgePass()
    edgesPassDynamic.setTexture('tDepth', depthPassDynamic.outputTarget?.texture)
    edgesPassDynamic.setTexture('tNormal', normalPassDynamic.outputTarget?.texture)
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
      depthPassDynamic,
      normalPassDynamic,
      edgesPassDynamic,
      stencilPass,
      geometryPass,
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

    /** Paper-like background texture */
    // Assets.getTexture({
    //   id: 'paper',
    //   src: paperTex,
    //   type: AssetType.TEXTURE_8BPP
    // })
    //   .then((value: Texture) => {
    //     value.wrapS = RepeatWrapping
    //     value.wrapT = RepeatWrapping
    //     const options = {
    //       backgroundTexture: value,
    //       backgroundTextureIntensity: 0.25
    //     }
    //     edgesPass.options = options
    //     edgesPassDynamic.options = options
    //     this.accumulationFrameIndex = 0
    //   })
    //   .catch((reason) => {
    //     Logger.error(`Matcap texture failed to load ${reason}`)
    //   })
  }
}
