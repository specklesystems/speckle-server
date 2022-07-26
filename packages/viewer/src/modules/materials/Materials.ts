import { Color, DoubleSide, Material, MathUtils, Texture, Vector2 } from 'three'
import { GeometryType } from '../batching/Batch'
// import { getConversionFactor } from '../converter/Units'
import { TreeNode } from '../tree/WorldTree'
import { DisplayStyle, NodeRenderView, RenderMaterial } from '../tree/NodeRenderView'
import SpeckleLineMaterial from './SpeckleLineMaterial'
import SpeckleStandardMaterial from './SpeckleStandardMaterial'
import SpecklePointMaterial from './SpecklePointMaterial'
import { FilterMaterialType } from '../FilteringManager'
import SpeckleStandardColoredMaterial from './SpeckleStandardColoredMaterial'
import defaultGradient from '../../assets/gradient.png'
import { Assets } from '../Assets'
import { FilterMaterial } from '../FilteringManager'

export interface MaterialOptions {
  rampIndex?: number
  rampIndexColor?: Color
  rampTexture?: Texture
}

export default class Materials {
  private readonly materialMap: { [hash: number]: Material } = {}
  private meshHighlightMaterial: Material = null
  private meshGhostMaterial: Material = null
  private lineHighlightMaterial: Material = null
  private lineGhostMaterial: Material = null
  private lineColoredMaterial: Material = null
  private pointCloudHighlightMaterial: Material = null
  private pointHighlightMaterial: Material = null
  private meshGradientMaterial: Material = null
  private meshColoredMaterial: Material = null

  public static renderMaterialFromNode(node: TreeNode): RenderMaterial {
    if (!node) return null
    let renderMaterial: RenderMaterial = null
    if (node.model.raw.renderMaterial) {
      renderMaterial = {
        id: node.model.raw.renderMaterial.id,
        color: node.model.raw.renderMaterial.diffuse,
        opacity: node.model.raw.renderMaterial.opacity
          ? node.model.raw.renderMaterial.opacity
          : 1
      }
    }
    return renderMaterial
  }

  public static displayStyleFromNode(node: TreeNode): DisplayStyle {
    if (!node) return null
    let displayStyle: DisplayStyle = null
    if (node.model.raw.displayStyle) {
      /** If there are no units specified, we ignore the line width value */
      const lineWeight = node.model.raw.displayStyle.lineweight || 0
      // const units = node.model.raw.displayStyle.units
      // lineWeigth = units ? lineWeigth * getConversionFactor(units) : 0
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

  public async createDefaultMaterials() {
    this.meshHighlightMaterial = new SpeckleStandardMaterial(
      {
        color: 0xff0000,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        side: DoubleSide // TBD
        // clippingPlanes: this.viewer.sectionBox.planes
      },
      ['USE_RTE']
    )

    this.lineHighlightMaterial = new SpeckleLineMaterial({
      color: 0x7f7fff,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      worldUnits: false,
      vertexColors: false,
      alphaToCoverage: false,
      resolution: new Vector2(1281, 1306)
      // clippingPlanes: this.viewer.sectionBox.planes
    })
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).color = new Color(0xff0000)
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).linewidth = 1
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).worldUnits = false
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).resolution = new Vector2(
      1281,
      1306
    )

    this.lineGhostMaterial = new SpeckleLineMaterial({
      color: 0x00ff00,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      worldUnits: false,
      vertexColors: false,
      alphaToCoverage: false,
      resolution: new Vector2(1281, 1306)
      // clippingPlanes: this.viewer.sectionBox.planes
    })
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).color = new Color(0x00ff00)
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).linewidth = 1
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).worldUnits = false
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).resolution = new Vector2(
      1281,
      1306
    )

    this.lineColoredMaterial = new SpeckleLineMaterial({
      color: 0xffffff,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      worldUnits: false,
      vertexColors: false,
      alphaToCoverage: false,
      resolution: new Vector2(1281, 1306)
      // clippingPlanes: this.viewer.sectionBox.planes
    })
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).color = new Color(0xffffff)
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).linewidth = 1
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).worldUnits = false
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.lineHighlightMaterial).resolution = new Vector2(
      1281,
      1306
    )

    this.pointCloudHighlightMaterial = new SpecklePointMaterial({
      color: 0xff0000,
      vertexColors: true,
      size: 2,
      sizeAttenuation: false
      // clippingPlanes: this.viewer.sectionBox.planes
    })

    this.pointHighlightMaterial = new SpecklePointMaterial({
      color: 0xff0000,
      vertexColors: false,
      size: 2,
      sizeAttenuation: false
      // clippingPlanes: this.viewer.sectionBox.planes
    })

    this.meshGhostMaterial = new SpeckleStandardMaterial(
      {
        color: 0xffffff,
        // side: DoubleSide,
        transparent: true,
        opacity: 0.2,
        wireframe: false
      },
      ['USE_RTE']
    )
    this.meshGhostMaterial.depthWrite = false

    this.meshGradientMaterial = new SpeckleStandardColoredMaterial(
      {
        side: DoubleSide,
        transparent: false,
        opacity: 1,
        wireframe: false
      },
      ['USE_RTE']
    )
    ;(this.meshGradientMaterial as SpeckleStandardColoredMaterial).setGradientTexture(
      await Assets.getTexture(defaultGradient)
    )

    this.meshColoredMaterial = new SpeckleStandardColoredMaterial(
      {
        side: DoubleSide,
        transparent: false,
        opacity: 1,
        wireframe: false
      },
      ['USE_RTE']
    )

    this.materialMap[NodeRenderView.NullRenderMaterialHash] =
      new SpeckleStandardMaterial(
        {
          color: 0x7f7f7f,
          emissive: 0x0,
          roughness: 1,
          metalness: 0,
          side: DoubleSide // TBD,
          // clippingPlanes: this.viewer.sectionBox.planes
        },
        ['USE_RTE']
      )
    this.materialMap[NodeRenderView.NullRenderMaterialVertexColorsHash] =
      new SpeckleStandardMaterial(
        {
          color: 0x7f7f7f,
          emissive: 0x0,
          roughness: 1,
          metalness: 0,
          side: DoubleSide, // TBD
          vertexColors: true
          // clippingPlanes: this.viewer.sectionBox.planes
        },
        ['USE_RTE']
      )

    const hash = NodeRenderView.NullDisplayStyleHash // So prettier doesn't fuck up everything
    this.materialMap[hash] = new SpeckleLineMaterial({
      color: 0xff00ff,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      worldUnits: false,
      vertexColors: false,
      alphaToCoverage: false,
      resolution: new Vector2(1281, 1306)
      // clippingPlanes: this.viewer.sectionBox.planes
    })
    ;(<SpeckleLineMaterial>this.materialMap[hash]).color = new Color(0xff00ff)
    ;(<SpeckleLineMaterial>this.materialMap[hash]).linewidth = 1
    ;(<SpeckleLineMaterial>this.materialMap[hash]).worldUnits = false
    ;(<SpeckleLineMaterial>this.materialMap[hash]).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>this.materialMap[hash]).resolution = new Vector2(1281, 1306)

    this.materialMap[NodeRenderView.NullPointMaterialHash] = new SpecklePointMaterial({
      color: 0x7f7f7f,
      vertexColors: false,
      size: 2,
      sizeAttenuation: false
      // clippingPlanes: this.viewer.sectionBox.planes
    })
    this.materialMap[NodeRenderView.NullPointCloudMaterialHash] =
      new SpecklePointMaterial({
        color: 0xffffff,
        vertexColors: true,
        size: 2,
        sizeAttenuation: false
        // clippingPlanes: this.viewer.sectionBox.planes
      })
  }

  private makeMeshMaterial(materialData: RenderMaterial): Material {
    const mat = new SpeckleStandardMaterial(
      {
        color: materialData.color,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        opacity: materialData.opacity,
        side: DoubleSide // TBD
        // clippingPlanes: this.viewer.sectionBox.planes
      },
      ['USE_RTE']
    )
    mat.transparent = mat.opacity < 1 ? true : false
    mat.depthWrite = mat.transparent ? false : true
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
      resolution: new Vector2(1281, 1306)
    })
    mat.color = new Color(materialData.color)
    mat.linewidth = materialData.lineWeight > 0 ? materialData.lineWeight : 1
    mat.worldUnits = materialData.lineWeight > 0 ? true : false
    mat.vertexColors = true
    mat.pixelThreshold = 0.5
    mat.resolution = new Vector2(1281, 1306)

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
          console.error(`No material definition for points!`)
          break
      }
    }
    return this.materialMap[hash]
  }

  public getHighlightMaterial(renderView: NodeRenderView): Material {
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return this.meshHighlightMaterial
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
        return this.meshGhostMaterial // TO DO
      case GeometryType.POINT_CLOUD:
        return this.meshGhostMaterial // TO DO
    }
  }

  public getGradientMaterial(renderView: NodeRenderView): Material {
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return this.meshGradientMaterial
      case GeometryType.LINE:
        return this.lineGhostMaterial
      case GeometryType.POINT:
        return this.meshGradientMaterial // TO DO
      case GeometryType.POINT_CLOUD:
        return this.meshGradientMaterial // TO DO
    }
  }

  public getColoredMaterial(renderView: NodeRenderView): Material {
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        return this.meshColoredMaterial
      case GeometryType.LINE:
        return this.lineColoredMaterial
      case GeometryType.POINT:
        return this.meshColoredMaterial // TO DO
      case GeometryType.POINT_CLOUD:
        return this.meshColoredMaterial // TO DO
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
            // clippingPlanes: this.viewer.sectionBox.planes
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
          resolution: new Vector2(1281, 1306)
        })
        mat.color = color
        mat.linewidth = 1
        mat.worldUnits = false
        mat.vertexColors = true
        mat.pixelThreshold = 0.5
        mat.resolution = new Vector2(1281, 1306)
        return mat
      }
      case GeometryType.POINT:
        return new SpecklePointMaterial({
          color,
          vertexColors: false,
          size: 2,
          sizeAttenuation: false
        })
      case GeometryType.POINT_CLOUD:
        return new SpecklePointMaterial({
          color,
          vertexColors: true,
          size: 2,
          sizeAttenuation: false
        })
    }
  }

  public getFilterMaterial(
    renderView: NodeRenderView,
    filterMaterial: FilterMaterialType
  ) {
    switch (filterMaterial) {
      case FilterMaterialType.SELECT:
        return this.getHighlightMaterial(renderView)
      case FilterMaterialType.GHOST:
        return this.getGhostMaterial(renderView)
      case FilterMaterialType.GRADIENT:
        return this.getGradientMaterial(renderView)
      case FilterMaterialType.COLORED:
        return this.getColoredMaterial(renderView)
    }
  }

  public getFilterMaterialOptions(filterMaterial: FilterMaterial) {
    return {
      rampIndex: filterMaterial.rampIndex ? filterMaterial.rampIndex : undefined,
      rampIndexColor: filterMaterial.rampIndexColor,
      rampTexture: filterMaterial.rampTexture ? filterMaterial.rampTexture : undefined
    }
  }

  public purge() {
    // to do
  }
}
