import { DoubleSide, Material } from 'three'
import { TreeNode } from '../converter/WorldTree'
import { DisplayStyle, RenderMaterial } from '../NodeRenderView'
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

  public updateMaterialMap(hash: number, renderMaterial: RenderMaterial) {
    if (this.materialMap[hash]) {
      console.warn(`Duplicate material hash found: ${hash}, overwritting`)
    }

    this.materialMap[hash] = new SpeckleStandardMaterial({
      color: renderMaterial.color,
      emissive: 0x0,
      roughness: 1,
      metalness: 0,
      side: DoubleSide // TBD
      // clippingPlanes: this.viewer.sectionBox.planes
    })
  }
}
