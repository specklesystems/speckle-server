import {
  AlwaysStencilFunc,
  Color,
  DoubleSide,
  FrontSide,
  Material,
  MathUtils,
  ReplaceStencilOp,
  Texture,
  Vector2
} from 'three'
import { GeometryType } from '../batching/Batch'
import { TreeNode } from '../tree/WorldTree'
import { DisplayStyle, NodeRenderView, RenderMaterial } from '../tree/NodeRenderView'
import SpeckleLineMaterial from './SpeckleLineMaterial'
import SpeckleStandardMaterial from './SpeckleStandardMaterial'
import SpecklePointMaterial from './SpecklePointMaterial'
import { FilterMaterial, FilterMaterialType } from '../filtering/FilteringManager'
import SpeckleStandardColoredMaterial from './SpeckleStandardColoredMaterial'
import defaultGradient from '../../assets/gradient.png'
import { Assets } from '../Assets'
import { getConversionFactor } from '../converter/Units'
import SpeckleGhostMaterial from './SpeckleGhostMaterial'

export interface MaterialOptions {
  rampIndex?: number
  rampIndexColor?: Color
  rampTexture?: Texture
  rampWidth?: number
}

export default class Materials {
  private readonly materialMap: { [hash: number]: Material } = {}
  private meshHighlightMaterial: Material = null
  private meshTransparentHighlightMaterial: Material = null
  private meshGhostMaterial: Material = null
  private meshGradientMaterial: Material = null
  private meshTransparentGradientMaterial: Material = null
  private meshColoredMaterial: Material = null
  private meshTransparentColoredMaterial: Material = null
  private meshHiddenMaterial: Material = null
  private meshOverlayMaterial: Material = null
  private meshTransparentOverlayMaterial: Material = null

  private lineHighlightMaterial: Material = null
  private lineGhostMaterial: Material = null
  private lineColoredMaterial: Material = null
  private lineHiddenMaterial: Material = null
  private lineOverlayMaterial: Material = null

  private pointCloudHighlightMaterial: Material = null
  private pointHighlightMaterial: Material = null
  private pointGhostMaterial: Material = null
  private pointOverlayMaterial: Material = null
  private pointCloudOverlayMaterial: Material = null

  public static renderMaterialFromNode(node: TreeNode): RenderMaterial {
    if (!node) return null
    let renderMaterial: RenderMaterial = null
    if (node.model.raw.renderMaterial) {
      renderMaterial = {
        id: node.model.raw.renderMaterial.id,
        color: node.model.raw.renderMaterial.diffuse,
        opacity:
          node.model.raw.renderMaterial.opacity !== undefined
            ? node.model.raw.renderMaterial.opacity
            : 1,
        roughness: node.model.raw.renderMaterial.roughness,
        metalness: node.model.raw.renderMaterial.metalness,
        vertexColors: node.model.raw.colors && node.model.raw.colors.length > 0
      }
    }
    return renderMaterial
  }

  public static displayStyleFromNode(node: TreeNode): DisplayStyle {
    if (!node) return null
    let displayStyle: DisplayStyle = null
    if (node.model.raw.displayStyle) {
      /** If there are no units specified, we ignore the line width value */
      let lineWeight = node.model.raw.displayStyle.lineweight || 0
      const units = node.model.raw.displayStyle.units
      lineWeight = units ? lineWeight * getConversionFactor(units) : 0
      /** If the line width is smalle than 1mm, we'll just render it in screen space */
      lineWeight = lineWeight < 0.001 ? 0 : lineWeight
      displayStyle = {
        id: node.model.raw.displayStyle.id,
        color: node.model.raw.displayStyle.diffuse || node.model.raw.displayStyle.color,
        lineWeight
      }
    } else if (node.model.raw.renderMaterial) {
      displayStyle = {
        id: node.model.raw.renderMaterial.id,
        color: node.model.raw.renderMaterial.diffuse,
        lineWeight: 0
      }
    }
    return displayStyle
  }

  private async createDefaultMeshMaterials() {
    this.meshHighlightMaterial = new SpeckleStandardMaterial(
      {
        color: 0x047efb,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    this.meshHighlightMaterial.clipShadows = true
    this.meshHighlightMaterial.stencilWrite = true
    this.meshHighlightMaterial.stencilWriteMask = 0xff
    this.meshHighlightMaterial.stencilRef = 0x00
    this.meshHighlightMaterial.stencilFunc = AlwaysStencilFunc
    this.meshHighlightMaterial.stencilZFail = ReplaceStencilOp
    this.meshHighlightMaterial.stencilZPass = ReplaceStencilOp
    this.meshHighlightMaterial.stencilFail = ReplaceStencilOp

    this.meshTransparentHighlightMaterial = new SpeckleStandardMaterial(
      {
        color: 0x047efb,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        side: DoubleSide,
        transparent: true,
        opacity: 0.5
      },
      ['USE_RTE']
    )
    this.meshTransparentHighlightMaterial.clipShadows = true
    this.meshTransparentHighlightMaterial.stencilWrite = true
    this.meshTransparentHighlightMaterial.stencilWriteMask = 0xff
    this.meshTransparentHighlightMaterial.stencilRef = 0x00
    this.meshTransparentHighlightMaterial.stencilFunc = AlwaysStencilFunc
    this.meshTransparentHighlightMaterial.stencilZFail = ReplaceStencilOp
    this.meshTransparentHighlightMaterial.stencilZPass = ReplaceStencilOp
    this.meshTransparentHighlightMaterial.stencilFail = ReplaceStencilOp

    this.meshGhostMaterial = new SpeckleGhostMaterial(
      {
        color: 0xffffff,
        side: FrontSide,
        transparent: true,
        opacity: 0.1
      },
      ['USE_RTE']
    )
    this.meshGhostMaterial.depthWrite = false
    this.meshGhostMaterial.alphaTest = 1

    this.meshGradientMaterial = new SpeckleStandardColoredMaterial(
      {
        side: DoubleSide,
        transparent: false,
        opacity: 1
      },
      ['USE_RTE']
    )
    ;(this.meshGradientMaterial as SpeckleStandardColoredMaterial).setGradientTexture(
      await Assets.getTexture(defaultGradient)
    )
    this.meshGradientMaterial.clipShadows = true

    this.meshTransparentGradientMaterial = new SpeckleStandardColoredMaterial(
      {
        side: DoubleSide,
        transparent: true,
        opacity: 0.5
      },
      ['USE_RTE']
    )
    ;(
      this.meshTransparentGradientMaterial as SpeckleStandardColoredMaterial
    ).setGradientTexture(await Assets.getTexture(defaultGradient))
    this.meshTransparentGradientMaterial.clipShadows = true

    this.meshColoredMaterial = new SpeckleStandardColoredMaterial(
      {
        side: DoubleSide,
        transparent: false,
        opacity: 1,
        wireframe: false
      },
      ['USE_RTE']
    )
    this.meshColoredMaterial.clipShadows = true

    this.meshTransparentColoredMaterial = new SpeckleStandardColoredMaterial(
      {
        side: DoubleSide,
        transparent: true,
        opacity: 0.5
      },
      ['USE_RTE']
    )

    this.meshHiddenMaterial = new SpeckleStandardMaterial(
      {
        side: DoubleSide,
        transparent: false,
        opacity: 1,
        wireframe: false
      },
      ['USE_RTE']
    )
    this.meshHiddenMaterial.visible = false

    this.meshOverlayMaterial = new SpeckleStandardMaterial(
      {
        color: 0x04cbfb,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        side: DoubleSide // TBD,
        // clippingPlanes: []
      },
      ['USE_RTE']
    )
    this.meshOverlayMaterial.clipShadows = true

    this.meshTransparentOverlayMaterial = new SpeckleStandardMaterial(
      {
        color: 0x04cbfb,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        side: DoubleSide,
        transparent: true,
        opacity: 0.5
      },
      ['USE_RTE']
    )

    // Jesus prettier... o_0
    ;(
      this.meshTransparentHighlightMaterial as SpeckleStandardMaterial
    ).color.convertSRGBToLinear()
    ;(this.meshHighlightMaterial as SpeckleStandardMaterial).color.convertSRGBToLinear()
    ;(this.meshOverlayMaterial as SpeckleStandardMaterial).color.convertSRGBToLinear()
    // Jesus prettier... o_0
    ;(
      this.meshTransparentOverlayMaterial as SpeckleStandardMaterial
    ).color.convertSRGBToLinear()
  }

  private async createLineDefaultMaterials() {
    this.lineHighlightMaterial = new SpeckleLineMaterial({
      color: 0x047efb,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      worldUnits: false,
      vertexColors: true,
      alphaToCoverage: false,
      resolution: new Vector2()
    })
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).color = new Color(0x047efb)
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).linewidth = 1
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).worldUnits = false
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).vertexColors = true
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).resolution = new Vector2()

    this.lineGhostMaterial = new SpeckleLineMaterial({
      color: 0xffffff,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      worldUnits: false,
      vertexColors: true,
      alphaToCoverage: false,
      resolution: new Vector2()
    })
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).color = new Color(0xffffff)
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).linewidth = 1
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).worldUnits = true
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).vertexColors = true
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).resolution = new Vector2()

    this.lineColoredMaterial = new SpeckleLineMaterial({
      color: 0xffffff,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      worldUnits: false,
      vertexColors: true,
      alphaToCoverage: false,
      resolution: new Vector2()
    })
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).color = new Color(0xffffff)
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).linewidth = 1
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).worldUnits = false
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).vertexColors = true
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).resolution = new Vector2()

    this.lineHiddenMaterial = new SpeckleLineMaterial({
      color: 0xffffff,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      worldUnits: false,
      vertexColors: true,
      alphaToCoverage: false,
      resolution: new Vector2()
    })
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).color = new Color(0xff0000)
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).linewidth = 1
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).worldUnits = false
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).vertexColors = true
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).resolution = new Vector2()
    this.lineHiddenMaterial.visible = false

    this.lineOverlayMaterial = new SpeckleLineMaterial({
      color: 0x04cbfb,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      worldUnits: false,
      vertexColors: true,
      alphaToCoverage: false,
      resolution: new Vector2()
    })
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).color = new Color(0x04cbfb)
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).linewidth = 1
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).worldUnits = false
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).vertexColors = true
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).resolution = new Vector2()
    // Manual line break
    ;(this.lineHighlightMaterial as SpeckleLineMaterial).color.convertSRGBToLinear()
    ;(this.lineOverlayMaterial as SpeckleLineMaterial).color.convertSRGBToLinear()
  }

  private async createDefaultPointMaterials() {
    this.pointCloudHighlightMaterial = new SpecklePointMaterial(
      {
        color: 0x047efb,
        vertexColors: true,
        size: 2,
        sizeAttenuation: false
        // clippingPlanes: this.viewer.sectionBox.planes
      },
      ['USE_RTE']
    )

    this.pointHighlightMaterial = new SpecklePointMaterial(
      {
        color: 0x047efb,
        vertexColors: false,
        size: 2,
        sizeAttenuation: false
        // clippingPlanes: this.viewer.sectionBox.planes
      },
      ['USE_RTE']
    )

    this.pointGhostMaterial = new SpecklePointMaterial(
      {
        color: 0xffffff,
        vertexColors: false,
        size: 2,
        opacity: 0.01,
        sizeAttenuation: false
        // clippingPlanes: this.viewer.sectionBox.planes
      },
      ['USE_RTE']
    )

    this.pointCloudOverlayMaterial = new SpecklePointMaterial(
      {
        color: 0x04cbfb,
        vertexColors: true,
        size: 2,
        sizeAttenuation: false
        // clippingPlanes: this.viewer.sectionBox.planes
      },
      ['USE_RTE']
    )

    this.pointOverlayMaterial = new SpecklePointMaterial(
      {
        color: 0x04cbfb,
        vertexColors: false,
        size: 2,
        sizeAttenuation: false
        // clippingPlanes: this.viewer.sectionBox.planes
      },
      ['USE_RTE']
    )

    // Jesus prettier... o_0
    ;(
      this.pointCloudHighlightMaterial as SpecklePointMaterial
    ).color.convertSRGBToLinear()
    ;(this.pointCloudHighlightMaterial as SpecklePointMaterial).toneMapped = false
    ;(this.pointHighlightMaterial as SpecklePointMaterial).color.convertSRGBToLinear()
    ;(this.pointHighlightMaterial as SpecklePointMaterial).toneMapped = false
    ;(this.pointOverlayMaterial as SpecklePointMaterial).color.convertSRGBToLinear()
    ;(this.pointOverlayMaterial as SpecklePointMaterial).toneMapped = false
    // Jesus prettier... o_0
    ;(
      this.pointCloudOverlayMaterial as SpecklePointMaterial
    ).color.convertSRGBToLinear()
    ;(this.pointCloudOverlayMaterial as SpecklePointMaterial).toneMapped = false
    ;(this.pointGhostMaterial as SpecklePointMaterial).toneMapped = false
  }

  private async createDefaultNullMaterials() {
    this.materialMap[NodeRenderView.NullRenderMaterialHash] =
      new SpeckleStandardMaterial(
        {
          color: 0x7f7f7f,
          emissive: 0x0,
          roughness: 1,
          metalness: 0,
          side: DoubleSide
        },
        ['USE_RTE']
      )
    ;(
      this.materialMap[NodeRenderView.NullRenderMaterialHash] as SpeckleStandardMaterial
    ).color.convertSRGBToLinear()

    this.materialMap[NodeRenderView.NullRenderMaterialVertexColorsHash] =
      new SpeckleStandardMaterial(
        {
          color: 0x7f7f7f,
          emissive: 0x0,
          roughness: 1,
          metalness: 0,
          side: DoubleSide,
          vertexColors: true
        },
        ['USE_RTE']
      )
    ;(
      this.materialMap[
        NodeRenderView.NullRenderMaterialVertexColorsHash
      ] as SpeckleStandardMaterial
    ).color.convertSRGBToLinear()

    const hash = NodeRenderView.NullDisplayStyleHash // So prettier doesn't fuck up everything
    this.materialMap[hash] = new SpeckleLineMaterial({
      color: 0x7f7f7f,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      worldUnits: false,
      vertexColors: true,
      alphaToCoverage: false,
      resolution: new Vector2()
    })
    ;(<SpeckleLineMaterial>this.materialMap[hash]).color = new Color(0x7f7f7f)
    ;(<SpeckleLineMaterial>this.materialMap[hash]).color.convertSRGBToLinear()
    ;(<SpeckleLineMaterial>this.materialMap[hash]).linewidth = 1
    ;(<SpeckleLineMaterial>this.materialMap[hash]).worldUnits = false
    ;(<SpeckleLineMaterial>this.materialMap[hash]).vertexColors = true
    ;(<SpeckleLineMaterial>this.materialMap[hash]).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.materialMap[hash]).resolution = new Vector2()

    this.materialMap[NodeRenderView.NullPointMaterialHash] = new SpecklePointMaterial(
      {
        color: 0x7f7f7f,
        vertexColors: false,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    ;(
      this.materialMap[NodeRenderView.NullPointMaterialHash] as SpecklePointMaterial
    ).color.convertSRGBToLinear()

    this.materialMap[NodeRenderView.NullPointCloudVertexColorsMaterialHash] =
      new SpecklePointMaterial(
        {
          color: 0xffffff,
          vertexColors: true,
          size: 2,
          sizeAttenuation: false
        },
        ['USE_RTE']
      )
    this.materialMap[NodeRenderView.NullPointCloudMaterialHash] =
      new SpecklePointMaterial(
        {
          color: 0xffffff,
          vertexColors: false,
          size: 2,
          sizeAttenuation: false
        },
        ['USE_RTE']
      )
  }

  public async createDefaultMaterials() {
    await this.createDefaultMeshMaterials()
    await this.createLineDefaultMaterials()
    await this.createDefaultPointMaterials()
    await this.createDefaultNullMaterials()
  }

  private makeMeshMaterial(materialData: RenderMaterial): Material {
    const mat = new SpeckleStandardMaterial(
      {
        color: materialData.color,
        emissive: 0x0,
        roughness: materialData.roughness,
        metalness: materialData.metalness,
        opacity: materialData.opacity,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    mat.vertexColors = materialData.vertexColors
    mat.transparent = mat.opacity < 1 ? true : false
    mat.depthWrite = mat.transparent ? false : true
    mat.clipShadows = true
    mat.color.convertSRGBToLinear()
    return mat
  }

  private makeLineMaterial(materialData: DisplayStyle): Material {
    const mat: SpeckleLineMaterial = new SpeckleLineMaterial({
      color: materialData.color,
      linewidth: materialData.lineWeight > 0 ? materialData.lineWeight : 1,
      worldUnits: materialData.lineWeight > 0 ? true : false,
      vertexColors: true,
      alphaToCoverage: false,
      resolution: new Vector2()
    })
    mat.color = new Color(materialData.color)
    mat.color.convertSRGBToLinear()
    mat.linewidth = materialData.lineWeight > 0 ? materialData.lineWeight : 1
    mat.worldUnits = materialData.lineWeight > 0 ? true : false
    mat.vertexColors = true
    mat.pixelThreshold = 0.5
    mat.resolution = new Vector2()

    return mat
  }

  private makePointMaterial(materialData: RenderMaterial): Material {
    /** There's an issue with how the data is being sent. Some point clouds
     *  have render materials with 0x000000 as the base color + vertex colors
     *  By default three.js modulates the base color with the vertex colors
     *  But since the base color is black, the result is also black. We'll have
     *  to avoid this
     */
    const isBaseColorBlack = materialData.color === -16777216 // 0xff000000 (black)
    const safeColor = materialData.vertexColors
      ? isBaseColorBlack
        ? 0xffffff
        : materialData.color
      : materialData.color
    const mat = new SpecklePointMaterial(
      {
        color: safeColor,
        opacity: materialData.opacity,
        vertexColors: materialData.vertexColors,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    mat.transparent = mat.opacity < 1 ? true : false
    mat.depthWrite = mat.transparent ? false : true
    mat.toneMapped = false
    mat.color.convertSRGBToLinear()
    return mat
  }

  public updateMaterialMap(
    hash: number,
    material: RenderMaterial | DisplayStyle,
    type: GeometryType
  ): Material {
    // console.log(this.materialMap)
    if (this.materialMap[hash]) {
      // console.warn(`Duplicate material hash found: ${hash}`)
      return this.materialMap[hash]
    }

    if (material) {
      switch (type) {
        case GeometryType.MESH:
          this.materialMap[hash] = this.makeMeshMaterial(material as RenderMaterial)
          break
        case GeometryType.LINE:
          this.materialMap[hash] = this.makeLineMaterial(material as DisplayStyle)
          break
        case GeometryType.POINT:
          this.materialMap[hash] = this.makePointMaterial(material as RenderMaterial)
          break
        case GeometryType.POINT_CLOUD:
          this.materialMap[hash] = this.makePointMaterial(material as RenderMaterial)
          break
      }
    }
    /** There's a bug in three.js where it checks for the length of the planes without checking if they exist first
     *  It's been allegedly fixed in a later version but until we update we'll just assing an empty array
     */
    this.materialMap[hash].clippingPlanes = []
    return this.materialMap[hash]
  }

  public getHighlightMaterial(renderView: NodeRenderView): Material {
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return renderView.transparent
          ? this.meshTransparentHighlightMaterial
          : this.meshHighlightMaterial
      case GeometryType.LINE:
        return this.lineHighlightMaterial
      case GeometryType.POINT:
        return this.pointHighlightMaterial
      case GeometryType.POINT_CLOUD:
        return this.pointCloudHighlightMaterial
    }
  }

  public getGhostMaterial(renderView: NodeRenderView): Material {
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return this.meshGhostMaterial
      case GeometryType.LINE:
        return this.lineGhostMaterial
      case GeometryType.POINT:
        return this.pointGhostMaterial
      case GeometryType.POINT_CLOUD:
        return this.pointGhostMaterial
    }
  }

  public getGradientMaterial(renderView: NodeRenderView): Material {
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return renderView.transparent
          ? this.meshTransparentGradientMaterial
          : this.meshGradientMaterial
      case GeometryType.LINE:
        return this.lineGhostMaterial
      case GeometryType.POINT:
        return this.pointGhostMaterial
      case GeometryType.POINT_CLOUD:
        return this.pointGhostMaterial
    }
  }

  public getColoredMaterial(renderView: NodeRenderView): Material {
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return renderView.transparent
          ? this.meshTransparentColoredMaterial
          : this.meshColoredMaterial
      case GeometryType.LINE:
        return this.lineColoredMaterial
      case GeometryType.POINT:
        return this.pointGhostMaterial
      case GeometryType.POINT_CLOUD:
        return this.pointGhostMaterial
    }
  }

  public getOverlayMaterial(renderView: NodeRenderView): Material {
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return renderView.transparent
          ? this.meshTransparentOverlayMaterial
          : this.meshOverlayMaterial
      case GeometryType.LINE:
        return this.lineOverlayMaterial
      case GeometryType.POINT:
        return this.pointOverlayMaterial
      case GeometryType.POINT_CLOUD:
        return this.pointCloudOverlayMaterial
    }
  }

  public getHiddenMaterial(renderView: NodeRenderView): Material {
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return this.meshHiddenMaterial
      case GeometryType.LINE:
        return this.lineHiddenMaterial
      case GeometryType.POINT:
        return this.meshHiddenMaterial
      case GeometryType.POINT_CLOUD:
        return this.meshHiddenMaterial
    }
  }

  public getDebugBatchMaterial(renderView: NodeRenderView) {
    const color = new Color(MathUtils.randInt(0, 0xffffff))
    color.convertSRGBToLinear()

    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return new SpeckleStandardMaterial(
          {
            color,
            emissive: 0x0,
            roughness: 1,
            metalness: 0,
            opacity: 1,
            side: DoubleSide // TBD
          },
          ['USE_RTE']
        )
      case GeometryType.LINE: {
        const mat: SpeckleLineMaterial = new SpeckleLineMaterial({
          color,
          linewidth: 1,
          worldUnits: false,
          vertexColors: true,
          alphaToCoverage: false,
          resolution: new Vector2()
        })
        mat.color = color
        mat.linewidth = 1
        mat.worldUnits = false
        mat.vertexColors = true
        mat.pixelThreshold = 0.5
        mat.resolution = new Vector2()
        return mat
      }
      case GeometryType.POINT:
        return new SpecklePointMaterial(
          {
            color,
            vertexColors: false,
            size: 2,
            sizeAttenuation: false
          },
          ['USE_RTE']
        )
      case GeometryType.POINT_CLOUD:
        return new SpecklePointMaterial(
          {
            color,
            vertexColors: true,
            size: 2,
            sizeAttenuation: false
          },
          ['USE_RTE']
        )
    }
  }

  public getFilterMaterial(
    renderView: NodeRenderView,
    filterMaterial: FilterMaterialType
  ): Material {
    let retMaterial: Material
    switch (filterMaterial) {
      case FilterMaterialType.SELECT:
        retMaterial = this.getHighlightMaterial(renderView)
        break
      case FilterMaterialType.GHOST:
        retMaterial = this.getGhostMaterial(renderView)
        break
      case FilterMaterialType.GRADIENT:
        retMaterial = this.getGradientMaterial(renderView)
        break
      case FilterMaterialType.COLORED:
        retMaterial = this.getColoredMaterial(renderView)
        break
      case FilterMaterialType.OVERLAY:
        retMaterial = this.getOverlayMaterial(renderView)
        break
      case FilterMaterialType.HIDDEN:
        retMaterial = this.getHiddenMaterial(renderView)
        break
    }
    /** There's a bug in three.js where it checks for the length of the planes without checking if they exist first
     *  It's been allegedly fixed in a later version but until we update we'll just assing an empty array
     */
    retMaterial.clippingPlanes = []
    return retMaterial
  }

  public getFilterMaterialOptions(filterMaterial: FilterMaterial): MaterialOptions {
    switch (filterMaterial.filterType) {
      case FilterMaterialType.COLORED:
        return {
          rampIndex:
            filterMaterial.rampIndex !== undefined
              ? filterMaterial.rampIndex
              : undefined,
          rampIndexColor: filterMaterial.rampIndexColor,
          rampTexture: filterMaterial.rampTexture
            ? filterMaterial.rampTexture
            : undefined,
          rampWidth: filterMaterial.rampTexture
            ? filterMaterial.rampTexture.image.width
            : undefined
        }
      case FilterMaterialType.GRADIENT:
        return {
          rampIndex:
            filterMaterial.rampIndex !== undefined
              ? filterMaterial.rampIndex
              : undefined,
          rampTexture: filterMaterial.rampTexture
            ? filterMaterial.rampTexture
            : this.meshGradientMaterial.userData.gradientRamp.value,
          rampWidth: filterMaterial.rampTexture
            ? filterMaterial.rampTexture.image.width
            : this.meshGradientMaterial.userData.gradientRamp.value.image.width
        }
    }
  }

  public purge() {
    // to do
  }
}
