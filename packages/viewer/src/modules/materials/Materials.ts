import { Color, DoubleSide, Material, Vector2 } from 'three'
import { GeometryType } from '../Batch'
import { getConversionFactor } from '../converter/Units'
import { TreeNode } from '../converter/WorldTree'
import { DisplayStyle, NodeRenderView, RenderMaterial } from '../NodeRenderView'
import SpeckleLineMaterial from './SpeckleLineMaterial'
import SpeckleStandardMaterial from './SpeckleStandardMaterial'

export default class Materials {
  private readonly materialMap: { [hash: number]: Material } = {}

  public static renderMaterialFromNode(node: TreeNode): RenderMaterial {
    if (!node) return null
    let renderMaterial: RenderMaterial = null
    if (node.model.raw.renderMaterial) {
      renderMaterial = {
        id: node.model.raw.renderMaterial.id,
        color: node.model.raw.renderMaterial.diffuse,
        opacity: node.model.raw.renderMaterial.opacity
      }
    }
    return renderMaterial
  }

  public static displayStyleFromNode(node: TreeNode): DisplayStyle {
    if (!node) return null
    let displayStyle: DisplayStyle = null
    if (node.model.raw.displayStyle) {
      /** If there are no units specified, we ignore the line width value */
      let lineWeigth = node.model.raw.displayStyle.lineweigth
      const units = node.model.raw.displayStyle.units
      lineWeigth = units ? lineWeigth * getConversionFactor(units) : 0
      displayStyle = {
        id: node.model.raw.displayStyle.id,
        color: node.model.raw.displayStyle.diffuse,
        lineWeigth
      }
    } else if (node.model.raw.renderMaterial) {
      displayStyle = {
        id: node.model.raw.renderMaterial.id,
        color: node.model.raw.renderMaterial.diffuse,
        lineWeigth: 0
      }
    }
    return displayStyle
  }

  public createDefaultMaterials() {
    this.materialMap[NodeRenderView.NullRenderMaterialHash] =
      new SpeckleStandardMaterial(
        {
          color: 0x000000,
          emissive: 0x0,
          roughness: 1,
          metalness: 0,
          side: DoubleSide // TBD
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
    mat.color.convertSRGBToLinear()
    return mat
  }

  private makeLineMaterial(materialData: DisplayStyle): Material {
    const mat = new SpeckleLineMaterial({
      color: materialData.color,
      linewidth: materialData.lineWeigth > 0 ? materialData.lineWeigth : 1,
      worldUnits: materialData.lineWeigth > 0 ? true : false,
      vertexColors: false,
      alphaToCoverage: false,
      resolution: new Vector2(1281, 1306)
      // clippingPlanes: this.viewer.sectionBox.planes
    })
    // Thank you prettier
    ;(<SpeckleLineMaterial>mat).color = new Color(materialData.color)
    ;(<SpeckleLineMaterial>mat).linewidth =
      materialData.lineWeigth > 0 ? materialData.lineWeigth : 1
    ;(<SpeckleLineMaterial>mat).worldUnits = materialData.lineWeigth > 0 ? true : false
    ;(<SpeckleLineMaterial>mat).pixelThreshold = 0.5
    ;(<SpeckleLineMaterial>mat).resolution = new Vector2(1281, 1306)

    return mat
  }

  public updateMaterialMap(
    hash: number,
    material: RenderMaterial | DisplayStyle,
    type: GeometryType
  ): Material {
    if (this.materialMap[hash]) {
      console.warn(`Duplicate material hash found: ${hash}`)
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
      }
    }
    return this.materialMap[hash]
  }
}
