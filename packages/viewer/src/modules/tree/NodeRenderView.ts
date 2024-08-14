import { Box3 } from 'three'
import { GeometryType } from '../batching/Batch.js'
import { GeometryAttributes, type GeometryData } from '../converter/Geometry.js'
import Materials, {
  MinimalMaterial,
  type DisplayStyle,
  type RenderMaterial
} from '../materials/Materials.js'
import { SpeckleType } from '../loaders/GeometryConverter.js'

export interface NodeRenderData {
  id: string
  subtreeId: number
  speckleType: SpeckleType
  geometry: GeometryData
  renderMaterial: RenderMaterial | null
  displayStyle: DisplayStyle | null
  colorMaterial: MinimalMaterial | null
}

export class NodeRenderView {
  private _batchId: string
  private _batchIndexStart: number
  private _batchIndexCount: number
  private _batchVertexStart: number
  private _batchVertexEnd: number

  private readonly _renderData: NodeRenderData
  private _materialHash: number
  private _geometryType: GeometryType
  private _guid: string | null = null

  private _aabb: Box3

  /** TO DO: Not sure if we should store it */
  public get guid(): string {
    if (!this._guid) {
      this._guid = this._renderData.subtreeId + this._renderData.id
    }
    return this._guid
  }

  public get renderData(): NodeRenderData {
    return this._renderData
  }

  public get renderMaterialHash(): number {
    return this._materialHash
  }

  public get hasGeometry() {
    return this._renderData.geometry && this._renderData.geometry.attributes
  }

  public get hasMetadata() {
    return this._renderData.geometry && this._renderData.geometry.metaData
  }

  public get speckleType(): SpeckleType {
    return this._renderData.speckleType
  }

  public get geometryType(): GeometryType {
    return this._geometryType
  }

  public get batchStart(): number {
    return this._batchIndexStart
  }

  public get batchEnd() {
    return this._batchIndexStart + this._batchIndexCount
  }

  public get batchCount(): number {
    return this._batchIndexCount
  }

  public get batchId(): string {
    return this._batchId
  }

  public get aabb(): Box3 {
    return this._aabb
  }

  public get transparent(): boolean {
    return (
      (this._renderData.renderMaterial &&
        this._renderData.renderMaterial.opacity < 1) ||
      false
    )
  }

  public get vertStart(): number {
    return this._batchVertexStart
  }

  public get vertEnd(): number {
    return this._batchVertexEnd
  }

  public get needsSegmentConversion(): boolean {
    return (
      this._renderData.speckleType === SpeckleType.Curve ||
      this._renderData.speckleType === SpeckleType.Polyline ||
      this._renderData.speckleType === SpeckleType.Polycurve ||
      this.renderData.speckleType === SpeckleType.Arc ||
      this.renderData.speckleType === SpeckleType.Circle ||
      this.renderData.speckleType === SpeckleType.Ellipse
    )
  }

  public get validGeometry(): boolean {
    return (
      (this._renderData.geometry.attributes &&
        this._renderData.geometry.attributes.POSITION &&
        this._renderData.geometry.attributes.POSITION.length > 0 &&
        (this._geometryType === GeometryType.MESH
          ? this._renderData.geometry.attributes.INDEX &&
            this._renderData.geometry.attributes.INDEX.length > 0
          : true)) ||
      false
    )
  }

  public constructor(data: NodeRenderData) {
    this._renderData = data
    this._geometryType = this.getGeometryType()
    this._materialHash = Materials.getMaterialHash(this)

    this._batchId = ''
    this._batchIndexCount = 0
    this._batchIndexStart = -1
    this._batchVertexStart = -1
    this._batchVertexEnd = -1
  }

  public setBatchData(
    id: string,
    start: number,
    count: number,
    vertStart?: number,
    vertEnd?: number
  ) {
    this._batchId = id
    this._batchIndexStart = start
    this._batchIndexCount = count
    if (vertStart !== undefined) this._batchVertexStart = vertStart
    if (vertEnd !== undefined) this._batchVertexEnd = vertEnd
  }

  public computeAABB() {
    this._aabb = new Box3()
    if (this._renderData.geometry.attributes)
      this._aabb.setFromArray(this._renderData.geometry.attributes.POSITION)
  }

  private getGeometryType(): GeometryType {
    switch (this._renderData.speckleType) {
      case SpeckleType.Mesh:
        return GeometryType.MESH
      case SpeckleType.Brep:
        return GeometryType.MESH
      case SpeckleType.Point:
        return GeometryType.POINT
      case SpeckleType.Pointcloud:
        return GeometryType.POINT_CLOUD
      case SpeckleType.Text:
        return GeometryType.TEXT

      default:
        return GeometryType.LINE
    }
  }

  public disposeGeometry() {
    for (const attr in this._renderData.geometry.attributes) {
      this._renderData.geometry.attributes[attr as GeometryAttributes] = []
    }
  }
}
