import { Matrix4 } from 'three'
import { Geometry } from './converter/Geometry'
import { GeometryConverter, SpeckleType } from './converter/GeometryConverter'
import ObjectWrapper from './converter/ObjectWrapper'
import { TreeNode, WorldTree } from './converter/WorldTree'
import Materials from './materials/Materials'
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
      return true
    })
  }

  private buildRenderNode(node: TreeNode): NodeRenderData {
    let ret: NodeRenderData = null
    const geometryData = GeometryConverter.convertNodeToGeometryData(node.model)
    if (geometryData) {
      ret = {
        id: node.model.id,
        speckleType: GeometryConverter.getSpeckleType(node.model),
        geometry: geometryData,
        renderMaterial:
          Materials.renderMaterialFromNode(node) ||
          Materials.renderMaterialFromNode(node.parent),
        displayStyle:
          Materials.displayStyleFromNode(node) ||
          Materials.displayStyleFromNode(node.parent),
        batchId: 'n/a',
        batchIndexStart: 0,
        batchIndexCount: 0
      }
    }
    return ret
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

  public getRenderViews(...types: SpeckleType[]): NodeRenderView[] {
    return this.root
      .all((node: TreeNode): boolean => {
        return (
          node.model.renderView !== null &&
          types.includes(node.model.renderView.renderData.speckleType)
        )
      })
      .map((val: TreeNode) => val.model.renderView)
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
        Geometry.transformGeometryData(renderData.geometry, this.computeTransform(node))
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
