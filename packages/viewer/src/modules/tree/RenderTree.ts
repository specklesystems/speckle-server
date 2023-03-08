import { Box3, Matrix4 } from 'three'
import { GeometryConverter, SpeckleType } from '../converter/GeometryConverter'
import { TreeNode, WorldTree } from './WorldTree'
import Materials from '../materials/Materials'
import { NodeRenderData, NodeRenderView } from './NodeRenderView'
import { Geometry } from '../converter/Geometry'
import Logger from 'js-logger'

export class RenderTree {
  private root: TreeNode
  private _treeBounds: Box3 = new Box3()
  private cancel = false

  public get treeBounds(): Box3 {
    return this._treeBounds
  }

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
          transform.multiply(rendeNode.geometry.bakeTransform)
        }
        Geometry.transformGeometryData(rendeNode.geometry, transform)
        node.model.renderView.computeAABB()
        this._treeBounds.union(node.model.renderView.aabb)

        if (!GeometryConverter.keepGeometryData) {
          GeometryConverter.disposeNodeGeometryData(node.model)
        }
      }

      return true
    })
  }

  public buildRenderTreeAsync(priority: number): Promise<boolean> {
    const p = WorldTree.getInstance().walkAsync(
      (node: TreeNode): boolean => {
        const rendeNode = this.buildRenderNode(node)
        node.model.renderView = rendeNode ? new NodeRenderView(rendeNode) : null
        if (node.model.renderView && node.model.renderView.hasGeometry) {
          const transform = this.computeTransform(node)
          if (rendeNode.geometry.bakeTransform) {
            transform.multiply(rendeNode.geometry.bakeTransform)
          }
          Geometry.transformGeometryData(rendeNode.geometry, transform)
          node.model.renderView.computeAABB()
          this._treeBounds.union(node.model.renderView.aabb)

          if (!GeometryConverter.keepGeometryData) {
            GeometryConverter.disposeNodeGeometryData(node.model)
          }
        }
        return !this.cancel
      },
      this.root,
      priority
    )
    return p
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
        } else if (renderNode.speckleType === SpeckleType.RevitInstance) {
          /** Revit Instances *hosted* on other instances do not stack the host's transform */
          if (k > 0) {
            const curentAncestorId = ancestors[k].model.raw.id
            if (ancestors[k - 1].model.raw.host === curentAncestorId) continue
          }
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

  /** This gets the render views for a particular node/id.
   *  Currently it doesn't treat Blocks in a special way, but
   *  we might want to.
   */
  public getRenderViewsForNode(node: TreeNode, parent?: TreeNode): NodeRenderView[] {
    if (node.model.atomic && node.model.renderView) {
      return [node.model.renderView]
    }

    return (parent ? parent : node.parent)
      .all((_node: TreeNode): boolean => {
        return _node.model.renderView && _node.model.renderView.hasGeometry
      })
      .map((val: TreeNode) => val.model.renderView)
  }

  public getRenderViewNodesForNode(node: TreeNode, parent?: TreeNode): TreeNode[] {
    if (node.model.atomic && node.model.renderView) {
      return [node]
    }

    return (parent ? parent : node.parent).all((_node: TreeNode): boolean => {
      return _node.model.renderView && _node.model.renderView.hasGeometry
    })
  }

  public getAtomicParent(node: TreeNode) {
    if (node.model.atomic) {
      return node.model.renderView
    }
    return WorldTree.getInstance()
      .getAncestors(node)
      .find((node) => node.model.atomic)
  }

  public getRenderViewsForNodeId(id: string): NodeRenderView[] {
    const node = WorldTree.getInstance().findId(id)
    if (!node) {
      Logger.warn(`Id ${id} does not exist`)
      return null
    }
    return this.getRenderViewsForNode(node)
  }

  public getRenderViewForNodeId(id: string): NodeRenderView {
    const node = WorldTree.getInstance().findId(id)
    if (!node) {
      Logger.warn(`Id ${id} does not exist`)
      return null
    }
    return node.model.renderView
  }

  public purge() {
    this.root = null
  }

  public cancelBuild(id: string) {
    this.cancel = true
    WorldTree.getInstance().purge(id)
    this.purge()
  }
}
