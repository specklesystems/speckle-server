import { Box3, Matrix4 } from 'three'
import { TreeNode, WorldTree } from './WorldTree'
import Materials from '../materials/Materials'
import { NodeRenderData, NodeRenderView } from './NodeRenderView'
import Logger from 'js-logger'
import { GeometryConverter, SpeckleType } from '../loaders/GeometryConverter'
import { Geometry } from '../converter/Geometry'

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

  public buildRenderTree(geometryConverter: GeometryConverter): Promise<boolean> {
    const p = this.tree.walkAsync((node: TreeNode): boolean => {
      const rendeNode = this.buildRenderNode(node, geometryConverter)
      node.model.renderView = rendeNode ? new NodeRenderView(rendeNode) : null
      this.applyTransforms(node)
      if (!node.model.instanced) geometryConverter.disposeNodeGeometryData(node.model)
      return !this.cancel
    }, this.root)
    return p
  }

  private applyTransforms(node: TreeNode) {
    if (node.model.renderView) {
      const transform = this.computeTransform(node)
      if (node.model.renderView.hasGeometry) {
        if (node.model.renderView.renderData.geometry.bakeTransform) {
          transform.multiply(node.model.renderView.renderData.geometry.bakeTransform)
        }
        if (
          node.model.instanced &&
          node.model.renderView.speckleType === SpeckleType.Mesh
        )
          node.model.renderView.renderData.geometry.transform = transform
        else {
          Geometry.transformGeometryData(
            node.model.renderView.renderData.geometry,
            transform
          )
        }
        node.model.renderView.computeAABB()
        this._treeBounds.union(node.model.renderView.aabb)
      } else if (node.model.renderView.hasMetadata) {
        node.model.renderView.renderData.geometry.bakeTransform.premultiply(transform)
      }
    }
  }

  private buildRenderNode(
    node: TreeNode,
    geometryConverter: GeometryConverter
  ): NodeRenderData {
    let ret: NodeRenderData = null
    const geometryData = geometryConverter.convertNodeToGeometryData(node.model)
    if (geometryData) {
      const renderMaterialNode = this.getRenderMaterialNode(node)
      const displayStyleNode = this.getDisplayStyleNode(node)
      ret = {
        id: node.model.id,
        subtreeId: node.model.subtreeId,
        speckleType: geometryConverter.getSpeckleType(node.model),
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
    /** We don't stack transforms nodes with each other */
    if (node.model.renderView.speckleType === SpeckleType.Transform)
      return node.model.renderView.renderData.transform

    const transform = new Matrix4()
    const ancestors = this.tree.getAncestors(node)
    for (let k = 0; k < ancestors.length; k++) {
      if (ancestors[k].model.renderView) {
        const renderNode: NodeRenderData = ancestors[k].model.renderView.renderData
        if (renderNode.speckleType === SpeckleType.Transform) {
          transform.premultiply(renderNode.geometry.transform)
        }
      }
    }
    return transform
  }

  public getInstances() {
    return this.tree.getInstances(this.root.model.subtreeId)
  }

  public getRenderableRenderViews(...types: SpeckleType[]): NodeRenderView[] {
    return this.getRenderableNodes(...types).map(
      (val: TreeNode) => val.model.renderView
    )
  }

  public getRenderableNodes(...types: SpeckleType[]): TreeNode[] {
    return this.root.all((node: TreeNode): boolean => {
      return (
        node.model.renderView &&
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
      node.model.renderView.renderData.speckleType !== SpeckleType.RevitInstance &&
      node.model.renderView.renderData.speckleType !== SpeckleType.BlockInstance
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
      node.model.renderView.renderData.speckleType !== SpeckleType.RevitInstance &&
      node.model.renderView.renderData.speckleType !== SpeckleType.BlockInstance
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
    const nodes = this.tree.findId(id)
    if (!nodes) {
      Logger.warn(`Id ${id} does not exist`)
      return null
    }
    const ret = []
    nodes.forEach((node: TreeNode) => {
      ret.push(...this.getRenderViewsForNode(node, node))
    })
    return ret
  }

  public getRenderViewForNodeId(id: string): NodeRenderView {
    const nodes = this.tree.findId(id)
    if (!nodes) {
      Logger.warn(`Id ${id} does not exist`)
      return null
    }
    if (nodes.length > 1) {
      Logger.warn(`Multiple nodes with ${id} found. Returning first only`)
    }
    return nodes[0].model.renderView
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
