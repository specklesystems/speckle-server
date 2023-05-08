import { Box3, Matrix4 } from 'three'
import { GeometryConverter, SpeckleType } from '../converter/GeometryConverter'
import { TreeNode, WorldTree } from './WorldTree'
import Materials from '../materials/Materials'
import { NodeRenderData, NodeRenderView } from './NodeRenderView'
import { Geometry } from '../converter/Geometry'
import Logger from 'js-logger'

export class RenderTree {
  private tree: WorldTree
  private root: TreeNode
  private _treeBounds: Box3 = new Box3()
  private cancel = false

  public get treeBounds(): Box3 {
    return this._treeBounds
  }

  public get id(): string {
    return this.root.model.id
  }

  public constructor(tree: WorldTree, subtreeRoot: TreeNode) {
    this.tree = tree
    this.root = subtreeRoot
  }

  public buildRenderTree() {
    this.tree.walk((node: TreeNode): boolean => {
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
    const p = this.tree.walkAsync(
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
    const ancestors = this.tree.getAncestors(node)
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
    const ancestors = this.tree.getAncestors(node)
    for (let k = 0; k < ancestors.length; k++) {
      if (ancestors[k].model.raw.displayStyle) {
        return ancestors[k]
      }
    }
  }

  public computeTransform(node: TreeNode): Matrix4 {
    const transform = new Matrix4()
    const ancestors = this.tree.getAncestors(node)
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
          node.model.renderView.hasGeometry &&
          types.includes(node.model.renderView.renderData.speckleType)
        )
      })
      .map((val: TreeNode) => val.model.renderView)
  }

  public getAtomicNodes(...types: SpeckleType[]): TreeNode[] {
    return this.root.all((node: TreeNode): boolean => {
      return (
        node.model.renderView !== null &&
        types.includes(node.model.renderView.renderData.speckleType) &&
        (node.model.atomic ||
          (node.parent.model.atomic && !node.parent.model.renderView?.hasGeometry))
      )
    })
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
    if (
      node.model.atomic &&
      node.model.renderView &&
      GeometryConverter.getSpeckleType(node.model) !== SpeckleType.RevitInstance &&
      GeometryConverter.getSpeckleType(node.model) !== SpeckleType.BlockInstance
    ) {
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
    return this.tree.getAncestors(node).find((node) => node.model.atomic)
  }

  public getRenderViewsForNodeId(id: string): NodeRenderView[] {
    const node = this.tree.findId(id)
    if (!node) {
      Logger.warn(`Id ${id} does not exist`)
      return null
    }
    return this.getRenderViewsForNode(node)
  }

  public getRenderViewForNodeId(id: string): NodeRenderView {
    const node = this.tree.findId(id)
    if (!node) {
      Logger.warn(`Id ${id} does not exist`)
      return null
    }
    return node.model.renderView
  }

  public purge() {
    this.tree = null
  }

  public cancelBuild(subtreeId: string) {
    this.cancel = true
    this.tree.purge(subtreeId)
    this.purge()
  }
}
