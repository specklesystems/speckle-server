import SpeckleRenderer from '../../SpeckleRenderer.js'
import { ClearFlags, ObjectVisibility } from '../Passes/GPass.js'
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
import { EdgesPipeline } from './EdgesPipeline.js'
import { DefaultPipelineOptions, PipelineOptions } from './Pipeline.js'

export class PenViewPipeline extends ProgressivePipeline {
  constructor(
    speckleRenderer: SpeckleRenderer,
    options: PipelineOptions = DefaultPipelineOptions
  ) {
    options
    super(speckleRenderer)

    const edgesPipeline = new EdgesPipeline(speckleRenderer)
    edgesPipeline.edgePassDynamic.outputTarget = null
    edgesPipeline.depthPass.setVisibility(ObjectVisibility.DEPTH)
    edgesPipeline.depthPassDynamic.setVisibility(ObjectVisibility.DEPTH)
    edgesPipeline.edgePass.options = { backgroundColor: 0x000000, ...options }
    edgesPipeline.edgePassDynamic.options = { backgroundColor: 0x000000, ...options }

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
        this.hiddenMaterial = new SpeckleStandardMaterial({
          side: DoubleSide,
          transparent: false,
          opacity: 1,
          wireframe: false
        })
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
    outputPass.setTexture('tDiffuse', edgesPipeline.outputTexture)

    this.dynamicStage.push(
      ...edgesPipeline.dynamicPasses,
      stencilPass,
      geometryPass,
      stencilMaskPass,
      overlayPass
    )

    this.progressiveStage.push(
      ...edgesPipeline.progressivePasses,
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
