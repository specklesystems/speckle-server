import { TreeNode } from '../converter/WorldTree'
import { DisplayStyle, RenderMaterial } from '../NodeRenderView'

export default class Materials {
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
}
