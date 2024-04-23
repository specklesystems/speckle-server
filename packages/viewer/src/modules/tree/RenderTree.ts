import { Matrix4 } from 'three'
import { type TreeNode, WorldTree } from './WorldTree'
import Materials from '../materials/Materials'
import { type NodeRenderData, NodeRenderView } from './NodeRenderView'
import Logger from 'js-logger'
import { GeometryConverter, SpeckleType } from '../loaders/GeometryConverter'
import { Geometry } from '../converter/Geometry'

export class RenderTree {
  private tree: WorldTree
  private root: TreeNode
  private cancel = false

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
      } else if (node.model.renderView.hasMetadata) {
        node.model.renderView.renderData.geometry.bakeTransform.premultiply(transform)
      }
    }
  }

  private buildRenderNode(
    node: TreeNode,
    geometryConverter: GeometryConverter
  ): NodeRenderData | null {
    let ret: NodeRenderData | null = null
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

  private getRenderMaterialNode(node: TreeNode): TreeNode | null {
    if (node.model.raw.renderMaterial) {
      return node
    }
    const ancestors = this.tree.getAncestors(node)
    for (let k = 0; k < ancestors.length; k++) {
      if (ancestors[k].model.raw.renderMaterial) {
        return ancestors[k]
      }
    }
    return null
  }

  private getDisplayStyleNode(node: TreeNode): TreeNode | null {
    if (node.model.raw.displayStyle) {
      return node
    }
    const ancestors = this.tree.getAncestors(node)
    for (let k = 0; k < ancestors.length; k++) {
      if (ancestors[k].model.raw.displayStyle) {
        return ancestors[k]
      }
    }
    return null
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
        if (
          renderNode.speckleType === SpeckleType.Transform &&
          renderNode.geometry.transform
        ) {
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

  public getRenderViewsForNode(node: TreeNode): NodeRenderView[] {
    return this.getRenderViewNodesForNode(node).map(
      (val: TreeNode) => val.model.renderView
    )
  }

  public getRenderViewNodesForNode(node: TreeNode): TreeNode[] {
    if (
      node.model.atomic &&
      node.model.renderView
      /** This should not be needed anymore. */
      /*&&
      node.model.renderView.renderData.speckleType !== SpeckleType.RevitInstance &&
      node.model.renderView.renderData.speckleType !== SpeckleType.BlockInstance
      */
    ) {
      return [node]
    }

    return node.all((_node: TreeNode): boolean => {
      return (
        _node.model.renderView &&
        (_node.model.renderView.hasGeometry || _node.model.renderView.hasMetadata)
      )
    })
  }

  public getRenderViewsForNodeId(id: string): NodeRenderView[] | null {
    const nodes = this.tree.findId(id)
    if (!nodes) {
      Logger.warn(`Id ${id} does not exist`)
      return null
    }
    const ret: Array<NodeRenderView> = []
    nodes.forEach((node: TreeNode) => {
      ret.push(...this.getRenderViewsForNode(node))
    })
    return ret
  }

  public getAtomicParent(node: TreeNode): TreeNode {
    if (node.model.atomic) {
      return node
    }
    /** There will always the root of the tree as the atomic parent for all nodes */
    return this.tree.getAncestors(node).find((node) => node.model.atomic) as TreeNode
  }

  public purge() {}

  /** TO DO: Need to purge only if currently building */
  public cancelBuild(): void {
    this.cancel = true
    this.tree.purge(this.id)
    this.purge()
  }
}
