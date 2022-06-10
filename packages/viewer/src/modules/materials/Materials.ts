import { Color, DoubleSide, Material, Vector2 } from 'three'
import { BatchType } from '../Batch'
import { TreeNode } from '../converter/WorldTree'
import { DisplayStyle, RenderMaterial } from '../NodeRenderView'
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
        color: node.model.raw.renderMaterial.diffuse
      }
    }
    return renderMaterial
  }

  public static displayStyleFromNode(node: TreeNode): DisplayStyle {
    if (!node) return null
    let displayStyle: DisplayStyle = null
    if (node.model.raw.displayStyle) {
      displayStyle = {
        id: node.model.raw.displayStyle.id,
        color: node.model.raw.displayStyle.diffuse
      }
    }
    return displayStyle
  }

  public updateMaterialMap(
    hash: number,
    material: RenderMaterial | DisplayStyle,
    type: BatchType
  ): Material {
    if (this.materialMap[hash]) {
      console.warn(`Duplicate material hash found: ${hash}, overwritting`)
    }

    if (material) {
      switch (type) {
        case BatchType.MESH:
          this.materialMap[hash] = new SpeckleStandardMaterial(
            {
              color: material.color,
              emissive: 0x0,
              roughness: 1,
              metalness: 0,
              side: DoubleSide // TBD
              // clippingPlanes: this.viewer.sectionBox.planes
            },
            ['USE_RTE']
          )
          break
        case BatchType.LINE:
          this.materialMap[hash] = new SpeckleLineMaterial({
            color: material.color,
            linewidth: 0.01, // in world units with size attenuation, pixels otherwise
            worldUnits: true,
            vertexColors: false,
            alphaToCoverage: false,
            resolution: new Vector2(1281, 1306)
            // clippingPlanes: this.viewer.sectionBox.planes
          })
          ;(<SpeckleLineMaterial>this.materialMap[hash]).color = new Color(0xff00ff)
          ;(<SpeckleLineMaterial>this.materialMap[hash]).linewidth = 0.01
          ;(<SpeckleLineMaterial>this.materialMap[hash]).worldUnits = true
          ;(<SpeckleLineMaterial>this.materialMap[hash]).pixelThreshold = 0.5
          ;(<SpeckleLineMaterial>this.materialMap[hash]).resolution = new Vector2(
            1281,
            1306
          )
          break
      }
    } else {
      switch (type) {
        case BatchType.MESH:
          this.materialMap[hash] = new SpeckleStandardMaterial(
            {
              color: 0xff00ff,
              emissive: 0x0,
              roughness: 1,
              metalness: 0,
              side: DoubleSide // TBD
              // clippingPlanes: this.viewer.sectionBox.planes
            },
            ['USE_RTE']
          )
          break
        case BatchType.LINE:
          this.materialMap[hash] = new SpeckleLineMaterial({
            color: 0xff00ff,
            linewidth: 0.01, // in world units with size attenuation, pixels otherwise
            worldUnits: true,
            vertexColors: false,
            alphaToCoverage: false,
            resolution: new Vector2(1281, 1306)
            // clippingPlanes: this.viewer.sectionBox.planes
          })
          ;(<SpeckleLineMaterial>this.materialMap[hash]).color = new Color(0xff00ff)
          ;(<SpeckleLineMaterial>this.materialMap[hash]).linewidth = 0.01
          ;(<SpeckleLineMaterial>this.materialMap[hash]).worldUnits = true
          ;(<SpeckleLineMaterial>this.materialMap[hash]).pixelThreshold = 0.5
          ;(<SpeckleLineMaterial>this.materialMap[hash]).resolution = new Vector2(
            1281,
            1306
          )

          break
      }
    }
    return this.materialMap[hash]
  }
}
