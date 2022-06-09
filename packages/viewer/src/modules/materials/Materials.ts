import { DoubleSide, Material, MeshStandardMaterial } from 'three'
import { TreeNode } from '../converter/WorldTree'
import { DisplayStyle, RenderMaterial } from '../NodeRenderView'

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

  public updateMaterialMap(hash: number, renderMaterial: RenderMaterial): Material {
    if (this.materialMap[hash]) {
      console.warn(`Duplicate material hash found: ${hash}, overwritting`)
    }

    if (renderMaterial) {
      this.materialMap[hash] = new MeshStandardMaterial({
        color: renderMaterial.color,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        side: DoubleSide // TBD
        // clippingPlanes: this.viewer.sectionBox.planes
      })
    } else {
      this.materialMap[hash] = new MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        side: DoubleSide // TBD
        // clippingPlanes: this.viewer.sectionBox.planes
      })
    }
    return this.materialMap[hash]
  }
}
