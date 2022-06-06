import { Matrix4 } from 'three'
import { Geometry } from './converter/Geometry'
import { GeometryConverter, SpeckleType } from './converter/GeometryConverter'
import ObjectWrapper from './converter/ObjectWrapper'
import { TreeNode, WorldTree } from './converter/WorldTree'
import { NodeRenderData, NodeRenderView } from './NodeRenderView'

export class RenderTree {
  private root: TreeNode
  public constructor(root: TreeNode) {
    this.root = root
  }

  public buildRenderTree() {
    this.root.walk((node: TreeNode): boolean => {
      let renderView = null
      let renderNode: { [id: string]: NodeRenderData } = this.buildRenderNode(node)
      // console.log(node.model.raw.displayValue)
      if (node.model.raw.displayValue) {
        for (let k = 0; k < node.model.raw.displayValue.length; k++) {
          const nestedRenderNode = this.buildRenderNode(node.model.raw.displayValue[k])
          if (nestedRenderNode) {
            renderNode = { ...renderNode, ...nestedRenderNode }
          }
        }
      }
      if (Object.keys(renderNode).length > 0) {
        renderView = new NodeRenderView()
        for (const k in renderNode) renderView.setData(k, renderNode[k])
      }
      node.model.renderView = renderView
      return true
    })
  }

  private buildRenderNode(node: TreeNode): { [id: string]: NodeRenderData } {
    const ret: { [id: string]: NodeRenderData } = {}
    const geometryData = GeometryConverter.convertNodeToGeometryData(node.model)
    if (geometryData) {
      const renderData: NodeRenderData = {
        speckleType: GeometryConverter.getSpeckleType(node.model),
        geometry: geometryData,
        batchId: 'n/a',
        batchIndexStart: 0,
        batchIndexCount: 0
      }
      ret[node.model.id] = renderData
    }
    return ret
  }

  public computeTransform(node: TreeNode): Matrix4 {
    const transform = new Matrix4()
    const ancestors = WorldTree.getInstance().getAncestors(node)
    for (let k = 0; k < ancestors.length; k++) {
      if (ancestors[k].model.renderView) {
        const renderNode: NodeRenderData = ancestors[k].model.renderView.getFirst()
        if (renderNode.speckleType === SpeckleType.BlockInstance) {
          transform.premultiply(renderNode.geometry.transform)
        }
      }
    }
    return transform
  }

  /** TEMPORARY, MIGHT NOT BE NEEDED */
  private getMetaForRenderNode(parentNode: TreeNode, id: string) {
    if (!parentNode) {
      // TODO (if required)
      return null
    }

    if (parentNode.model.id === id) {
      return parentNode.model.raw
    }

    if (parentNode.model.raw.displayValue) {
      if (Array.isArray(parentNode.model.raw.displayValue)) {
        for (const k in parentNode.model.raw.displayValue) {
          if (parentNode.model.raw.displayValue[k].model.id === id) {
            return parentNode.model.raw.displayValue[k].model.raw
          }
        }
      } else {
        return parentNode.model.raw.displayValue.model.raw
      }
    }

    console.warn(`Could not find ${id} in parent node ${parentNode.model.id}`)
    return null
  }
  /**
   * TEMPORARY!!!
   */
  public getObjectWrappers() {
    const objectWrappers = []
    this.root.walk((node: TreeNode): boolean => {
      const renderView: NodeRenderView = node.model.renderView
      if (renderView) {
        for (const key in renderView.renderData) {
          const renderData = renderView.renderData[key]
          if (renderData.speckleType === SpeckleType.BlockInstance) continue
          Geometry.transformGeometryData(
            renderData.geometry,
            this.computeTransform(node)
          )
          let geometry = null
          let wrapperType = ''
          const metaObj = this.getMetaForRenderNode(node, key)
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
      }
      return true
    })
    return objectWrappers
  }
}
