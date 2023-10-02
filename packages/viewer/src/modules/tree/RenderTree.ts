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
    this.root.walk((node: TreeNode): boolean => {
      const rendeNode = this.buildRenderNode(node)
      node.model.renderView = rendeNode ? new NodeRenderView(rendeNode) : null
      this.applyTransforms(node)
      return true
    })
  }

  public buildRenderTreeAsync(priority: number): Promise<boolean> {
    const p = this.tree.walkAsync(
      (node: TreeNode): boolean => {
        const rendeNode = this.buildRenderNode(node)
        node.model.renderView = rendeNode ? new NodeRenderView(rendeNode) : null
        this.applyTransforms(node)
        return !this.cancel
      },
      this.root,
      priority
    )
    return p
  }

  private applyTransforms(node: TreeNode) {
    if (node.model.renderView) {
      const transform = this.computeTransform(node)
      if (node.model.renderView.hasGeometry) {
        if (node.model.renderView.renderData.geometry.bakeTransform) {
          transform.multiply(node.model.renderView.renderData.geometry.bakeTransform)
        }
        Geometry.transformGeometryData(
          node.model.renderView.renderData.geometry,
          transform
        )
        node.model.renderView.computeAABB()
        this._treeBounds.union(node.model.renderView.aabb)

        if (!GeometryConverter.keepGeometryData) {
          GeometryConverter.disposeNodeGeometryData(node.model)
        }
      } else if (node.model.renderView.hasMetadata) {
        node.model.renderView.renderData.geometry.bakeTransform.premultiply(transform)
      }
    }
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
          renderMaterialNode || displayStyleNode,
          node
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
        if (
          renderNode.speckleType === SpeckleType.RevitInstance ||
          renderNode.speckleType === SpeckleType.BlockInstance
        ) {
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

  public getRenderableRenderViews(...types: SpeckleType[]): NodeRenderView[] {
    return this.root
      .all((node: TreeNode): boolean => {
        return (
          node.model.renderView !== null &&
          (node.model.renderView.hasGeometry || node.model.renderView.hasMetadata) &&
          types.includes(node.model.renderView.renderData.speckleType)
        )
      })
      .map((val: TreeNode) => val.model.renderView)
  }

  public getRenderableNodes(...types: SpeckleType[]): TreeNode[] {
    return this.root.all((node: TreeNode): boolean => {
      return (
        node.model.renderView !== null &&
        (node.model.renderView.hasGeometry || node.model.renderView.hasMetadata) &&
        types.includes(node.model.renderView.renderData.speckleType)
      )
    })
  }

  /** This gets the render views for a particular node/id.
   *  Currently it doesn't treat Blocks in a special way, but
   *  we might want to.
   */
  public getRenderViewsForNode(node: TreeNode, parent?: TreeNode): NodeRenderView[] {
    if (
      node.model.atomic &&
      node.model.renderView &&
      GeometryConverter.getSpeckleType(node.model) !== SpeckleType.RevitInstance &&
      GeometryConverter.getSpeckleType(node.model) !== SpeckleType.BlockInstance
    ) {
      return [node.model.renderView]
    }

    return (parent ? parent : node.parent)
      .all((_node: TreeNode): boolean => {
        return (
          _node.model.renderView &&
          (_node.model.renderView.hasGeometry || _node.model.renderView.hasMetadata)
        )
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
      return (
        _node.model.renderView &&
        (_node.model.renderView.hasGeometry || _node.model.renderView.hasMetadata)
      )
    })
  }

  public getAtomicParent(node: TreeNode) {
    if (node.model.atomic) {
      return node
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
