import { Geometry } from './converter/Geometry'
import { GeometryConverter, SpeckleType } from './converter/GeometryConverter'
import ObjectWrapper from './converter/ObjectWrapper'
import { TreeNode } from './converter/WorldTree'
import { NodeRenderData, NodeRenderView } from './NodeRenderView'

export class RenderTree {
  private root: TreeNode
  public constructor(root: TreeNode) {
    this.root = root
  }

  public buildRenderTree() {
    this.root.walk((node: TreeNode): boolean => {
      let renderView = null
      const geometryData = GeometryConverter.convertNodeToGeometryData(node.model)
      if (geometryData) {
        const renderData: NodeRenderData = {
          speckleType: GeometryConverter.getSpeckleType(node.model),
          geometry: geometryData,
          batchId: 'n/a',
          batchIndexStart: 0,
          batchIndexCount: 0
        }
        renderView = new NodeRenderView()
        renderView.setData(node.model.id, renderData)
      }

      node.model.renderView = renderView
      return true
    })
  }

  /**
   * TEMPORARY
   */
  public getObjectWrappers() {
    const objectWrappers = []
    this.root.walk((node: TreeNode): boolean => {
      const renderView: NodeRenderView = node.model.renderView
      if (renderView) {
        const plm = Object.keys(renderView.renderData)
        const renderData: NodeRenderData = renderView.renderData[plm[0]]
        switch (renderData.speckleType) {
          case SpeckleType.Pointcloud:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makePointCloudGeometry(renderData.geometry),
                node.model.raw,
                'pointcloud'
              )
            )
            break
          case SpeckleType.Brep:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makeMeshGeometry(renderData.geometry),
                node.model.raw
              )
            )
            break
          case SpeckleType.Mesh:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makeMeshGeometry(renderData.geometry),
                node.model.raw
              )
            )
            break
          case SpeckleType.Point:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makePointGeometry(renderData.geometry),
                node.model.raw,
                'point'
              )
            )
            break
          case SpeckleType.Line:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makeLineGeometry(renderData.geometry),
                node.model.raw,
                'line'
              )
            )
            break
          case SpeckleType.Polyline:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makeLineGeometry(renderData.geometry),
                node.model.raw,
                'line'
              )
            )
            break
          case SpeckleType.Box:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makeMeshGeometry(renderData.geometry),
                node.model.raw
              )
            )
            break
          case SpeckleType.Polycurve:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makeLineGeometry(renderData.geometry),
                node.model.raw,
                'line'
              )
            )
            break
          case SpeckleType.Curve:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makeLineGeometry(renderData.geometry),
                node.model.raw,
                'line'
              )
            )
            break
          case SpeckleType.Circle:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makeLineGeometry(renderData.geometry),
                node.model.raw,
                'line'
              )
            )
            break
          case SpeckleType.Arc:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makeLineGeometry(renderData.geometry),
                node.model.raw,
                'line'
              )
            )
            break
          case SpeckleType.Ellipse:
            objectWrappers.push(
              new ObjectWrapper(
                Geometry.makeLineGeometry(renderData.geometry),
                node.model.raw,
                'line'
              )
            )
            break
          default:
            console.warn(`Skipping geometry conversion for ${renderData.speckleType}`)
            return null
        }
      }
      return true
    })
    return objectWrappers
  }
}
