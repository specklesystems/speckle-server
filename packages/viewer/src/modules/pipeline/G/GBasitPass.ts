import {
  DoubleSide,
  NearestFilter,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget
} from 'three'
import { BaseGPass } from './GPass.js'
import { WorldTree } from '../../tree/WorldTree.js'
import { GeometryType } from '../../batching/Batch.js'
import SpeckleRenderer from '../../SpeckleRenderer.js'
import { MeshBatch } from '../../batching/MeshBatch.js'
import { NodeRenderView } from '../../tree/NodeRenderView.js'
import { MinimalMaterial } from '../../materials/Materials.js'
import SpeckleStandardColoredMaterial from '../../materials/SpeckleStandardColoredMaterial.js'
import { Assets } from '../../../index.js'
import SpeckleMesh from '../../objects/SpeckleMesh.js'

export class GBasitPass extends BaseGPass {
  public clear = false
  protected tree: WorldTree
  protected speckleRenderer: SpeckleRenderer
  protected materialMap: {
    [batchID: string]: [batch: MeshBatch, material: SpeckleStandardColoredMaterial]
  } = {}

  public constructor(tree: WorldTree, renderer: SpeckleRenderer) {
    super()
    this.tree = tree
    this.speckleRenderer = renderer

    this._outputTarget = new WebGLRenderTarget(256, 256, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    })
    /** On Chromium, on MacOS the 16 bit depth render buffer appears broken.
     *  We're not really using a stencil buffer at all, we're just forcing
     *  three.js to use a 24 bit depth render buffer
     */
    this._outputTarget.depthBuffer = true
    this._outputTarget.stencilBuffer = true
  }

  public get displayName(): string {
    return 'BASIT'
  }

  onBeforeRender = () => {
    const batches: MeshBatch[] = this.speckleRenderer.batcher.getBatches(
      undefined,
      GeometryType.MESH
    )

    for (let k = 0; k < batches.length; k++) {
      const batch: MeshBatch = batches[k]
      const colorMap: Map<number, Array<NodeRenderView>> = new Map()
      colorMap.set(0x888888, [])

      for (let i = 0; i < batch.renderViews.length; i++) {
        const rv = batch.renderViews[i]
        const colorMaterial: MinimalMaterial | null = rv.renderData.colorMaterial
        if (!colorMaterial) {
          const defaultColorEntry = colorMap.get(0x888888)
          if (defaultColorEntry) defaultColorEntry.push(rv) /** This is so dumb */
          continue
        }

        if (!colorMap.has(colorMaterial.color)) colorMap.set(colorMaterial.color, [])
        const entry = colorMap.get(colorMaterial.color)
        if (entry) entry.push(rv)
      }
      const rampTexture = Assets.generateDiscreetRampTexture(
        Array.from(colorMap.keys())
      )
      const material = new SpeckleStandardColoredMaterial(
        {
          side: DoubleSide,
          transparent: false,
          wireframe: false
        },
        ['USE_RTE']
      )
      material.clipShadows = true
      material.setGradientTexture(rampTexture)

      this.materialMap[batch.id] = [batch, material]
    }
    // console.log(this.materialMap)

    // const colorNodes = this.tree.findAll(
    //   (node: TreeNode) =>
    //     node.model.renderView &&
    //     node.model.renderView.renderData.colorMaterial &&
    //     node.model.renderView.geometryType === GeometryType.MESH
    // )
    // const colorMap: { [color: number]: Array<string> } = {}
    // for (let k = 0; k < colorNodes.length; k++) {
    //   const node = colorNodes[k]

    //   const color: number = node.model.renderView.renderData.colorMaterial.color
    //   if (!colorMap[color]) colorMap[color] = []

    //   colorMap[color].push(node.model.id)
    // }
    // const colorGroups = []

    // for (const color in colorMap) {
    //   colorGroups.push({
    //     objectIds: colorMap[color],
    //     color: '#' + new Color(Number.parseInt(color)).getHexString()
    //   })
    // }
    // console.log(colorGroups)
    // this.viewer.getExtension(FilteringExtension).setUserObjectColors(colorGroups)
  }

  public render(
    renderer: WebGLRenderer,
    camera: PerspectiveCamera | OrthographicCamera | null,
    scene?: Scene
  ): boolean {
    if (!camera || !scene) return false

    this.applyLayers(camera)

    for (const k in this.materialMap) {
      const tuple: [batch: MeshBatch, material: SpeckleStandardColoredMaterial] =
        this.materialMap[k]
      ;(tuple[0].renderObject as SpeckleMesh).setOverrideMaterial(tuple[1])
    }

    renderer.setRenderTarget(this.outputTarget)

    if (this.clear) {
      renderer.setClearColor(0x000000)
      renderer.setClearAlpha(0.0)
      renderer.clear(true, true, true)
    }

    if (this.onBeforeRender) this.onBeforeRender()
    renderer.render(scene, camera)
    if (this.onAfterRender) this.onAfterRender()

    for (const k in this.materialMap) {
      const tuple: [batch: MeshBatch, material: SpeckleStandardColoredMaterial] =
        this.materialMap[k]
      ;(tuple[0].renderObject as SpeckleMesh).restoreMaterial()
    }
    return false
  }
}
