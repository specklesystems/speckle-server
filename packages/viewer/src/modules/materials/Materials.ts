import { Color, DoubleSide, FrontSide, Material, Texture, Vector2 } from 'three'
import { GeometryType } from '../batching/Batch'
import { TreeNode } from '../tree/WorldTree'
import { NodeRenderView } from '../tree/NodeRenderView'
import SpeckleLineMaterial from './SpeckleLineMaterial'
import SpeckleStandardMaterial from './SpeckleStandardMaterial'
import SpecklePointMaterial from './SpecklePointMaterial'
import SpeckleStandardColoredMaterial from './SpeckleStandardColoredMaterial'
import defaultGradient from '../../assets/gradient.png'
import { Assets } from '../Assets'
import { getConversionFactor } from '../converter/Units'
import SpeckleGhostMaterial from './SpeckleGhostMaterial'
import SpeckleTextMaterial from './SpeckleTextMaterial'
import { SpeckleMaterial } from './SpeckleMaterial'
import SpecklePointColouredMaterial from './SpecklePointColouredMaterial'

export interface RenderMaterial {
  id: string
  color: number
  opacity: number
  roughness: number
  metalness: number
  vertexColors: boolean
}

export interface DisplayStyle {
  id: string
  color: number
  lineWeight: number
  opacity?: number
}

export interface MaterialOptions {
  stencilOutlines?: boolean
  pointSize?: number
  depthWrite?: number
}

export enum FilterMaterialType {
  GHOST,
  GRADIENT,
  COLORED,
  HIDDEN
}

export interface FilterMaterial {
  filterType: FilterMaterialType
  rampIndex?: number
  rampIndexColor?: Color
  rampTexture?: Texture
}

export interface FilterMaterialOptions {
  rampIndex?: number
  rampIndexColor?: Color
  rampTexture?: Texture
  rampWidth?: number
}

export default class Materials {
  public static readonly UNIFORM_VECTORS_USED = 33
  private readonly materialMap: { [hash: number]: Material } = {}
  private meshGhostMaterial: Material = null
  private meshGradientMaterial: Material = null
  private meshTransparentGradientMaterial: Material = null
  private meshColoredMaterial: Material = null
  private meshTransparentColoredMaterial: Material = null
  private meshHiddenMaterial: Material = null

  private lineGhostMaterial: Material = null
  private lineColoredMaterial: Material = null
  private lineHiddenMaterial: Material = null

  private pointGhostMaterial: Material = null
  private pointCloudColouredMaterial: Material = null
  private pointCloudGradientMaterial: Material = null

  private textGhostMaterial: Material = null
  private textColoredMaterial: Material = null
  private textHiddenMaterial: Material = null

  private defaultGradientTextureData: ImageData = null

  private static readonly NullRenderMaterialHash = this.hashCode(
    GeometryType.MESH.toString()
  )
  private static readonly NullRenderMaterialVertexColorsHash = this.hashCode(
    GeometryType.MESH.toString() + 'vertexColors'
  )
  private static readonly NullDisplayStyleHash = this.hashCode(
    GeometryType.LINE.toString()
  )
  private static readonly NullTextDisplayStyle = this.hashCode(
    GeometryType.TEXT.toString()
  )
  private static readonly NullPointMaterialHash = this.hashCode(
    GeometryType.POINT.toString()
  )
  private static readonly NullPointCloudMaterialHash = this.hashCode(
    GeometryType.POINT_CLOUD.toString()
  )
  private static readonly NullPointCloudVertexColorsMaterialHash = this.hashCode(
    GeometryType.POINT_CLOUD.toString() + 'vertexColors'
  )
  private static readonly NullRenderMaterialInstancedHash = this.hashCode(
    GeometryType.MESH.toString() + 'instanced'
  )
  private static readonly NullRenderMaterialInstancedVertexColorHash = this.hashCode(
    GeometryType.MESH.toString() + 'vertexColors' + 'instanced'
  )

  public static renderMaterialFromNode(
    materialNode: TreeNode,
    geometryNode: TreeNode
  ): RenderMaterial {
    if (!materialNode) return null
    let renderMaterial: RenderMaterial = null
    if (materialNode.model.raw.renderMaterial) {
      renderMaterial = {
        id: materialNode.model.raw.renderMaterial.id,
        color: materialNode.model.raw.renderMaterial.diffuse,
        opacity:
          materialNode.model.raw.renderMaterial.opacity !== undefined
            ? materialNode.model.raw.renderMaterial.opacity
            : 1,
        roughness: materialNode.model.raw.renderMaterial.roughness,
        metalness: materialNode.model.raw.renderMaterial.metalness,
        vertexColors:
          geometryNode.model.raw.colors && geometryNode.model.raw.colors.length > 0
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

  public static fastCopy(from: Material, to: Material) {
    ;(to as unknown as SpeckleMaterial).fastCopy(from, to)
    /** Doing it via three.js is slow as hell */
    // to.setValues(
    //   // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    //   (({ uuid, uniforms, userData, onBeforeCompile, version, ...o }) => o)(from as any)
    // )
  }

  private static renderMaterialToString(renderMaterial: RenderMaterial) {
    return (
      renderMaterial.color.toString() +
      '/' +
      renderMaterial.opacity.toString() +
      '/' +
      renderMaterial.roughness.toString() +
      '/' +
      renderMaterial.metalness.toString()
    )
  }

  private static displayStyleToString(displayStyle: DisplayStyle) {
    const plm =
      displayStyle.color?.toString() +
      '/' +
      displayStyle.lineWeight?.toString() +
      displayStyle.opacity?.toString()
    return plm
  }

  private static hashCode(s: string) {
    let h
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
    return h
  }

  public static isMaterialInstance(material): material is Material {
    return material instanceof Material
  }

  public static isFilterMaterial(material): material is FilterMaterial {
    return 'filterType' in material
  }

  public static isRendeMaterial(materialData): materialData is RenderMaterial {
    return (
      'color' in materialData &&
      'opacity' in materialData &&
      'roughness' in materialData &&
      'metalness' in materialData &&
      'vertexColors' in materialData
    )
  }

  public static isDisplayStyle(materialData): materialData is DisplayStyle {
    return 'color' in materialData && 'lineWeight' in materialData
  }

  public static getMaterialHash(
    renderView: NodeRenderView,
    materialData?: RenderMaterial | DisplayStyle
  ) {
    if (!materialData) {
      materialData =
        renderView.renderData.renderMaterial || renderView.renderData.displayStyle
    }
    let mat = ''
    if (materialData) {
      mat =
        Materials.isRendeMaterial(materialData) &&
        (renderView.geometryType === GeometryType.MESH ||
          renderView.geometryType === GeometryType.POINT ||
          renderView.geometryType === GeometryType.TEXT)
          ? Materials.renderMaterialToString(materialData as RenderMaterial)
          : Materials.isDisplayStyle(materialData) &&
            renderView.geometryType !== GeometryType.MESH &&
            renderView.geometryType !== GeometryType.POINT
          ? Materials.displayStyleToString(materialData as DisplayStyle)
          : ''
    }
    let geometry = ''
    if (renderView.renderData.geometry.attributes)
      geometry = renderView.renderData.geometry.attributes.COLOR ? 'vertexColors' : ''

    const s =
      renderView.geometryType.toString() +
      geometry +
      mat +
      (renderView.geometryType === GeometryType.TEXT && materialData
        ? renderView.renderData.id
        : '') +
      (renderView.renderData.geometry.instanced ? 'instanced' : '')
    return Materials.hashCode(s)
  }

  public static isTransparent(material: Material) {
    return material.transparent === true && material.opacity < 1
  }

  public static isOpaque(material: Material) {
    return (
      material.transparent === false ||
      (material.transparent === true && material.opacity >= 1)
    )
  }

  private async createDefaultMeshMaterials() {
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
  }

  private async createLineDefaultMaterials() {
    this.lineGhostMaterial = new SpeckleLineMaterial(
      {
        color: 0xffffff,
        linewidth: 1, // in world units with size attenuation, pixels otherwise
        worldUnits: false,
        vertexColors: true,
        alphaToCoverage: false,
        resolution: new Vector2()
      },
      ['USE_RTE']
    )
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).color = new Color(0xffffff)
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).linewidth = 1
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).worldUnits = true
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).vertexColors = true
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.lineGhostMaterial).resolution = new Vector2()

    this.lineColoredMaterial = new SpeckleLineMaterial(
      {
        color: 0xffffff,
        linewidth: 1, // in world units with size attenuation, pixels otherwise
        worldUnits: false,
        vertexColors: true,
        alphaToCoverage: false,
        resolution: new Vector2()
      },
      ['USE_RTE']
    )
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).color = new Color(0xffffff)
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).linewidth = 1
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).worldUnits = false
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).vertexColors = true
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.lineColoredMaterial).resolution = new Vector2()

    this.lineHiddenMaterial = new SpeckleLineMaterial(
      {
        color: 0xffffff,
        linewidth: 1, // in world units with size attenuation, pixels otherwise
        worldUnits: false,
        vertexColors: true,
        alphaToCoverage: false,
        resolution: new Vector2()
      },
      ['USE_RTE']
    )
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).color = new Color(0xff0000)
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).linewidth = 1
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).worldUnits = false
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).vertexColors = true
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.lineHiddenMaterial).resolution = new Vector2()
    this.lineHiddenMaterial.visible = false
  }

  private async createDefaultPointMaterials() {
    this.pointGhostMaterial = new SpecklePointMaterial(
      {
        color: 0xffffff,
        vertexColors: false,
        size: 2,
        opacity: 0.01,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )

    this.pointCloudColouredMaterial = new SpecklePointColouredMaterial(
      {
        color: 0xffffff,
        vertexColors: false,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    ;(this.pointCloudColouredMaterial as SpecklePointMaterial).toneMapped = false
    this.pointCloudGradientMaterial = new SpecklePointColouredMaterial(
      {
        color: 0xffffff,
        vertexColors: false,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    ;(
      this.pointCloudGradientMaterial as SpecklePointColouredMaterial
    ).setGradientTexture(await Assets.getTexture(defaultGradient))
    ;(this.pointGhostMaterial as SpecklePointMaterial).toneMapped = false
  }

  private async createDefaultTextMaterials() {
    this.textGhostMaterial = new SpeckleTextMaterial(
      {
        color: 0xffffff,
        opacity: 0.1,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    this.textGhostMaterial.transparent =
      this.textGhostMaterial.opacity < 1 ? true : false
    this.textGhostMaterial.depthWrite = this.textGhostMaterial.transparent
      ? false
      : true
    this.textGhostMaterial.toneMapped = false
    ;(this.textGhostMaterial as SpeckleTextMaterial).color.convertSRGBToLinear()

    this.textGhostMaterial = (
      this.textGhostMaterial as SpeckleTextMaterial
    ).getDerivedMaterial()

    this.textColoredMaterial = new SpeckleTextMaterial(
      {
        color: 0xffffff,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    this.textColoredMaterial.transparent =
      this.textColoredMaterial.opacity < 1 ? true : false
    this.textColoredMaterial.depthWrite = this.textColoredMaterial.transparent
      ? false
      : true
    this.textColoredMaterial.toneMapped = false
    ;(this.textColoredMaterial as SpeckleTextMaterial).color.convertSRGBToLinear()

    this.textColoredMaterial = (
      this.textColoredMaterial as SpeckleTextMaterial
    ).getDerivedMaterial()

    this.textHiddenMaterial = new SpeckleTextMaterial(
      {
        color: 0xffffff,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    this.textHiddenMaterial.visible = false
    this.textHiddenMaterial.toneMapped = false
    ;(this.textHiddenMaterial as SpeckleTextMaterial).color.convertSRGBToLinear()

    this.textHiddenMaterial = (
      this.textHiddenMaterial as SpeckleTextMaterial
    ).getDerivedMaterial()
  }

  private async createDefaultNullMaterials() {
    this.materialMap[Materials.NullRenderMaterialHash] = new SpeckleStandardMaterial(
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
      this.materialMap[Materials.NullRenderMaterialHash] as SpeckleStandardMaterial
    ).color.convertSRGBToLinear()

    this.materialMap[Materials.NullRenderMaterialVertexColorsHash] =
      new SpeckleStandardMaterial(
        {
          color: 0xffffff,
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
        Materials.NullRenderMaterialVertexColorsHash
      ] as SpeckleStandardMaterial
    ).color.convertSRGBToLinear()

    const hash = Materials.NullDisplayStyleHash // So prettier doesn't fuck up everything
    this.materialMap[hash] = new SpeckleLineMaterial(
      {
        color: 0x7f7f7f,
        linewidth: 1, // in world units with size attenuation, pixels otherwise
        worldUnits: false,
        vertexColors: true,
        alphaToCoverage: false,
        resolution: new Vector2()
      },
      ['USE_RTE']
    )
    ;(<SpeckleLineMaterial>this.materialMap[hash]).color = new Color(0x7f7f7f)
    ;(<SpeckleLineMaterial>this.materialMap[hash]).color.convertSRGBToLinear()
    ;(<SpeckleLineMaterial>this.materialMap[hash]).linewidth = 1
    ;(<SpeckleLineMaterial>this.materialMap[hash]).worldUnits = false
    ;(<SpeckleLineMaterial>this.materialMap[hash]).vertexColors = true
    ;(<SpeckleLineMaterial>this.materialMap[hash]).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.materialMap[hash]).resolution = new Vector2()

    this.materialMap[Materials.NullTextDisplayStyle] = new SpeckleTextMaterial(
      {
        color: 0x7f7f7f,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    this.materialMap[Materials.NullTextDisplayStyle].transparent = false
    this.materialMap[Materials.NullTextDisplayStyle].depthWrite = true
    this.materialMap[Materials.NullTextDisplayStyle].toneMapped = false
    ;(
      this.materialMap[Materials.NullTextDisplayStyle] as SpeckleTextMaterial
    ).color.convertSRGBToLinear()

    this.materialMap[Materials.NullPointMaterialHash] = new SpecklePointMaterial(
      {
        color: 0x7f7f7f,
        vertexColors: false,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    ;(
      this.materialMap[Materials.NullPointMaterialHash] as SpecklePointMaterial
    ).color.convertSRGBToLinear()

    this.materialMap[Materials.NullPointCloudVertexColorsMaterialHash] =
      new SpecklePointMaterial(
        {
          color: 0xffffff,
          vertexColors: true,
          size: 2,
          sizeAttenuation: false
        },
        ['USE_RTE']
      )
    this.materialMap[Materials.NullPointCloudMaterialHash] = new SpecklePointMaterial(
      {
        color: 0xffffff,
        vertexColors: false,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )

    this.materialMap[Materials.NullRenderMaterialInstancedHash] =
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
      this.materialMap[
        Materials.NullRenderMaterialInstancedHash
      ] as SpeckleStandardMaterial
    ).color.convertSRGBToLinear()

    this.materialMap[Materials.NullRenderMaterialInstancedVertexColorHash] =
      new SpeckleStandardMaterial(
        {
          color: 0xffffff,
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
        Materials.NullRenderMaterialInstancedVertexColorHash
      ] as SpeckleStandardMaterial
    ).color.convertSRGBToLinear()
  }

  public async createDefaultMaterials() {
    await this.createDefaultMeshMaterials()
    await this.createLineDefaultMaterials()
    await this.createDefaultPointMaterials()
    await this.createDefaultTextMaterials()
    await this.createDefaultNullMaterials()
    this.defaultGradientTextureData = await Assets.getTextureData(defaultGradient)
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
    const mat: SpeckleLineMaterial = new SpeckleLineMaterial(
      {
        color: materialData.color,
        linewidth: materialData.lineWeight > 0 ? materialData.lineWeight : 1,
        worldUnits: materialData.lineWeight > 0 ? true : false,
        vertexColors: true,
        alphaToCoverage: false,
        resolution: new Vector2()
      },
      ['USE_RTE']
    )
    mat.color = new Color(materialData.color)
    mat.color.convertSRGBToLinear()
    mat.opacity = materialData.opacity !== undefined ? materialData.opacity : 1
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

  private makeTextMaterial(materialData: DisplayStyle): Material {
    const mat = new SpeckleTextMaterial(
      {
        color: materialData.color,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    mat.transparent = mat.opacity < 1 ? true : false
    mat.depthWrite = mat.transparent ? false : true
    mat.toneMapped = false
    mat.color.convertSRGBToLinear()

    return mat
  }

  public getMaterial(
    hash: number,
    material: RenderMaterial | DisplayStyle,
    type: GeometryType
  ): Material {
    let mat
    switch (type) {
      case GeometryType.MESH:
        mat = this.getMeshMaterial(hash, material as RenderMaterial)
        break
      case GeometryType.LINE:
        mat = this.getLineMaterial(hash, material)
        break
      case GeometryType.POINT:
        mat = this.getPointMaterial(hash, material as RenderMaterial)
        break
      case GeometryType.POINT_CLOUD:
        mat = this.getPointCloudMaterial(hash, material as RenderMaterial)
        break
      case GeometryType.TEXT:
        mat = this.getTextMaterial(hash, material)
        break
    }
    // }
    /** There's a bug in three.js where it checks for the length of the planes without checking if they exist first
     *  It's been allegedly fixed in a later version but until we update we'll just assing an empty array
     */
    mat.clippingPlanes = []

    return mat
  }

  private getMeshMaterial(hash: number, material: RenderMaterial) {
    if (!this.materialMap[hash]) {
      this.materialMap[hash] = this.makeMeshMaterial(material)
    }
    return this.materialMap[hash]
  }

  private getLineMaterial(hash: number, material: RenderMaterial | DisplayStyle) {
    if (!this.materialMap[hash]) {
      this.materialMap[hash] = this.makeLineMaterial(material as DisplayStyle)
    }
    return this.materialMap[hash]
  }

  private getPointMaterial(hash: number, material: RenderMaterial) {
    if (!this.materialMap[hash]) {
      this.materialMap[hash] = this.makePointMaterial(material as RenderMaterial)
    }
    return this.materialMap[hash]
  }

  private getPointCloudMaterial(hash: number, material: RenderMaterial) {
    if (!this.materialMap[hash]) {
      this.materialMap[hash] = this.getPointMaterial(hash, material)
    }
    return this.materialMap[hash]
  }

  private getTextMaterial(hash: number, material: RenderMaterial | DisplayStyle) {
    if (!this.materialMap[hash]) {
      this.materialMap[hash] = this.makeTextMaterial(material as DisplayStyle)
    }
    return (this.materialMap[hash] as SpeckleTextMaterial).getDerivedMaterial()
  }

  public getGhostMaterial(
    renderView: NodeRenderView,
    filterMaterial?: FilterMaterial
  ): Material {
    filterMaterial
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return this.meshGhostMaterial
      case GeometryType.LINE:
        return this.lineGhostMaterial
      case GeometryType.POINT:
        return this.pointGhostMaterial
      case GeometryType.POINT_CLOUD:
        return this.pointGhostMaterial
      case GeometryType.TEXT:
        return this.textGhostMaterial
    }
  }

  public getGradientMaterial(
    renderView: NodeRenderView,
    filterMaterial?: FilterMaterial
  ): Material {
    switch (renderView.geometryType) {
      case GeometryType.MESH: {
        const material = renderView.transparent
          ? this.meshTransparentGradientMaterial
          : this.meshGradientMaterial
        if (filterMaterial?.rampTexture)
          (material as SpeckleStandardColoredMaterial).setGradientTexture(
            filterMaterial.rampTexture
          )
        return material
      }
      case GeometryType.LINE:
        return this.lineColoredMaterial
      case GeometryType.POINT: {
        const material = this.pointCloudGradientMaterial
        if (filterMaterial?.rampTexture)
          (material as SpeckleStandardColoredMaterial).setGradientTexture(
            filterMaterial.rampTexture
          )
        return material
      }
      case GeometryType.POINT_CLOUD: {
        const material = this.pointCloudGradientMaterial
        if (filterMaterial?.rampTexture)
          (material as SpeckleStandardColoredMaterial).setGradientTexture(
            filterMaterial.rampTexture
          )
        return material
      }
      case GeometryType.TEXT:
        return this.textColoredMaterial
    }
  }

  public getColoredMaterial(
    renderView: NodeRenderView,
    filterMaterial?: FilterMaterial
  ): Material {
    switch (renderView.geometryType) {
      case GeometryType.MESH: {
        const material = renderView.transparent
          ? this.meshTransparentColoredMaterial
          : this.meshColoredMaterial
        if (filterMaterial?.rampTexture)
          (material as SpeckleStandardColoredMaterial).setGradientTexture(
            filterMaterial.rampTexture
          )
        return material
      }
      case GeometryType.LINE:
        return this.lineColoredMaterial
      case GeometryType.POINT: {
        const material = this.pointCloudColouredMaterial
        if (filterMaterial?.rampTexture)
          (material as SpeckleStandardColoredMaterial).setGradientTexture(
            filterMaterial.rampTexture
          )
        return material
      }
      case GeometryType.POINT_CLOUD: {
        const material = this.pointCloudColouredMaterial
        if (filterMaterial?.rampTexture)
          (material as SpeckleStandardColoredMaterial).setGradientTexture(
            filterMaterial.rampTexture
          )
        return material
      }
      case GeometryType.TEXT:
        return this.textColoredMaterial
    }
  }

  public getHiddenMaterial(
    renderView: NodeRenderView,
    filterMaterial?: FilterMaterial
  ): Material {
    filterMaterial
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return this.meshHiddenMaterial
      case GeometryType.LINE:
        return this.lineHiddenMaterial
      case GeometryType.POINT:
        return this.meshHiddenMaterial
      case GeometryType.POINT_CLOUD:
        return this.meshHiddenMaterial
      case GeometryType.TEXT:
        return this.textHiddenMaterial
    }
  }

  public getFilterMaterial(
    renderView: NodeRenderView,
    filterMaterial: FilterMaterial
  ): Material {
    let retMaterial: Material
    switch (filterMaterial.filterType) {
      case FilterMaterialType.GHOST:
        retMaterial = this.getGhostMaterial(renderView, filterMaterial)
        break
      case FilterMaterialType.GRADIENT:
        retMaterial = this.getGradientMaterial(renderView, filterMaterial)
        break
      case FilterMaterialType.COLORED:
        retMaterial = this.getColoredMaterial(renderView, filterMaterial)
        break
      case FilterMaterialType.HIDDEN:
        retMaterial = this.getHiddenMaterial(renderView, filterMaterial)
        break
    }
    /** There's a bug in three.js where it checks for the length of the planes without checking if they exist first
     *  It's been allegedly fixed in a later version but until we update we'll just assing an empty array
     */
    retMaterial.clippingPlanes = []
    return retMaterial
  }

  public getDataMaterial(
    renderView: NodeRenderView,
    materialData: RenderMaterial & DisplayStyle
  ): Material {
    const materialHash = Materials.getMaterialHash(renderView, materialData)
    return this.getMaterial(materialHash, materialData, renderView.geometryType)
  }

  public getFilterMaterialOptions(
    filterMaterial: FilterMaterial
  ): FilterMaterialOptions {
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
          rampIndexColor:
            filterMaterial.rampIndexColor !== undefined
              ? filterMaterial.rampIndexColor
              : new Color()
                  .setRGB(
                    this.defaultGradientTextureData.data[
                      Math.floor(
                        filterMaterial.rampIndex *
                          (this.defaultGradientTextureData.width - 1)
                      ) * 4
                    ] / 255,
                    this.defaultGradientTextureData.data[
                      Math.floor(
                        filterMaterial.rampIndex *
                          (this.defaultGradientTextureData.width - 1)
                      ) *
                        4 +
                        1
                    ] / 255,
                    this.defaultGradientTextureData.data[
                      Math.floor(
                        filterMaterial.rampIndex *
                          (this.defaultGradientTextureData.width - 1)
                      ) *
                        4 +
                        2
                    ] / 255
                  )
                  .convertSRGBToLinear(),
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
