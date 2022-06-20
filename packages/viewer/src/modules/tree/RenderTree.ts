import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'
import { GeometryConverter, SpeckleType } from '../converter/GeometryConverter'
import ObjectWrapper from '../converter/ObjectWrapper'
import { TreeNode, WorldTree } from './WorldTree'
import Materials from '../materials/Materials'
import { NodeRenderData, NodeRenderView } from './NodeRenderView'

export class RenderTree {
  private root: TreeNode
  public constructor(root: TreeNode) {
    this.root = root
  }

  public buildRenderTree() {
    this.root.walk((node: TreeNode): boolean => {
      const rendeNode = this.buildRenderNode(node)
      node.model.renderView = rendeNode ? new NodeRenderView(rendeNode) : null
      if (node.model.renderView && node.model.renderView.hasGeometry) {
        const transform = this.computeTransform(node)
        if (rendeNode.geometry.bakeTransform) {
          transform.premultiply(rendeNode.geometry.bakeTransform)
        }
        Geometry.transformGeometryData(rendeNode.geometry, transform)
      }
      return true
    })
  }

  private buildRenderNode(node: TreeNode): NodeRenderData {
    let ret: NodeRenderData = null
    const geometryData = GeometryConverter.convertNodeToGeometryData(node.model)
    if (geometryData) {
      const renderMaterialNode = this.getRenderMaterialNode(node)
      const displayStyleNode = this.getDisplayStyleNode(node)
      ret = {
        id: node.model.id,
        speckleType: GeometryConverter.getSpeckleType(node.model),
        geometry: geometryData,
        renderMaterial: Materials.renderMaterialFromNode(
          renderMaterialNode || displayStyleNode
        ),
        /** Line-type geometry can also use a renderMaterial*/
        displayStyle: Materials.displayStyleFromNode(
          displayStyleNode || renderMaterialNode
        )
      }
    }
    return ret
  }

  private getRenderMaterialNode(node: TreeNode): TreeNode {
    if (node.model.raw.renderMaterial) {
      return node
    }
    const ancestors = WorldTree.getInstance().getAncestors(node)
    for (let k = 0; k < ancestors.length; k++) {
      if (ancestors[k].model.raw.renderMaterial) {
        return ancestors[k]
      }
    }
  }

  private getDisplayStyleNode(node: TreeNode): TreeNode {
    if (node.model.raw.displayStyle) {
      return node
    }
    const ancestors = WorldTree.getInstance().getAncestors(node)
    for (let k = 0; k < ancestors.length; k++) {
      if (ancestors[k].model.raw.displayStyle) {
        return ancestors[k]
      }
    }
  }

  public computeTransform(node: TreeNode): Matrix4 {
    const transform = new Matrix4()
    const ancestors = WorldTree.getInstance().getAncestors(node)
    for (let k = 0; k < ancestors.length; k++) {
      if (ancestors[k].model.renderView) {
        const renderNode: NodeRenderData = ancestors[k].model.renderView.renderData
        if (renderNode.speckleType === SpeckleType.BlockInstance) {
          transform.premultiply(renderNode.geometry.transform)
        }
      }
    }
    return transform
  }

  public getAtomicRenderViews(...types: SpeckleType[]): NodeRenderView[] {
    return this.root
      .all((node: TreeNode): boolean => {
        return (
          node.model.renderView !== null &&
          types.includes(node.model.renderView.renderData.speckleType) &&
          (node.model.atomic ||
            (node.parent.model.atomic && !node.parent.model.renderView?.hasGeometry))
        )
      })
      .map((val: TreeNode) => val.model.renderView)
  }

  public getRenderViewsForNode(node: TreeNode): NodeRenderView[] {
    if (node.model.atomic) {
      return [node.model.renderView]
    }

    return node.parent
      .all((_node: TreeNode): boolean => {
        return _node.model.renderView !== null && _node.model.renderView.hasGeometry
      })
      .map((val: TreeNode) => val.model.renderView)
  }

  public getAtomicParent(node: TreeNode) {
    if (node.model.atomic) {
      return node.model.renderView
    }
    return WorldTree.getInstance()
      .getAncestors(node)
      .find((node) => node.model.atomic)
  }

  /**
   * TEMPORARY!!!
   */
  public getObjectWrappers() {
    const objectWrappers = []
    this.root.walk((node: TreeNode): boolean => {
      const renderView: NodeRenderView = node.model.renderView
      if (renderView) {
        const renderData = renderView.renderData
        if (renderData.speckleType === SpeckleType.BlockInstance) return true
        // Geometry.transformGeometryData(renderData.geometry, this.computeTransform(node))
        let geometry = null
        let wrapperType = ''
        /** ULTA-TEMPORARY */
        const metaObj = node.model.raw
        metaObj.renderMaterial = metaObj.renderMaterial
          ? metaObj.renderMaterial
          : node.parent.model.raw.renderMaterial
        metaObj.displayStyle = metaObj.displayStyle
          ? metaObj.displayStyle
          : node.parent.model.raw.displayStyle
        switch (renderData.speckleType) {
          case SpeckleType.Pointcloud:
            geometry = Geometry.makePointCloudGeometry(renderData.geometry)
            wrapperType = 'pointcloud'
            break
          case SpeckleType.Brep:
            geometry = Geometry.makeMeshGeometry(renderData.geometry)
            break
          case SpeckleType.Mesh:
            geometry = Geometry.makeMeshGeometry(renderData.geometry)
            break
          case SpeckleType.Point:
            geometry = Geometry.makePointGeometry(renderData.geometry)
            wrapperType = 'point'
            break
          case SpeckleType.Line:
            geometry = Geometry.makeLineGeometry(renderData.geometry)
            wrapperType = 'line'
            break
          case SpeckleType.Polyline:
            geometry = Geometry.makeLineGeometry(renderData.geometry)
            wrapperType = 'line'
            break
          case SpeckleType.Box:
            geometry = Geometry.makeMeshGeometry(renderData.geometry)
            break
          case SpeckleType.Polycurve:
            geometry = Geometry.makeLineGeometry(renderData.geometry)
            wrapperType = 'line'
            break
          case SpeckleType.Curve:
            geometry = Geometry.makeLineGeometry(renderData.geometry)
            wrapperType = 'line'
            break
          case SpeckleType.Circle:
            geometry = Geometry.makeLineGeometry(renderData.geometry)
            wrapperType = 'line'
            break
          case SpeckleType.Arc:
            geometry = Geometry.makeLineGeometry(renderData.geometry)
            wrapperType = 'line'
            break
          case SpeckleType.Ellipse:
            geometry = Geometry.makeLineGeometry(renderData.geometry)
            wrapperType = 'line'
            break
          default:
            // console.warn(`Skipping geometry conversion for ${renderData.speckleType}`)
            return null
        }
        if (geometry) {
          objectWrappers.push(new ObjectWrapper(geometry, metaObj, wrapperType))
        }
      }
      return true
    })
    return objectWrappers
  }
}
