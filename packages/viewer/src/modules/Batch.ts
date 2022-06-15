import {
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  Material,
  Mesh,
  Uint16BufferAttribute,
  Uint32BufferAttribute
} from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry'
import { Geometry } from './converter/Geometry'
import SpeckleLineMaterial from './materials/SpeckleLineMaterial'
import { NodeRenderView } from './NodeRenderView'
import { World } from './World'

export enum GeometryType {
  MESH,
  LINE
}

export default class Batch {
  private id: string
  private renderViews: NodeRenderView[]
  private geometry: BufferGeometry | LineSegmentsGeometry
  public batchMaterial: Material
  public mesh: Mesh | Line | Line2

  public constructor(id: string, renderViews: NodeRenderView[]) {
    this.id = id
    this.renderViews = renderViews
  }

  public setBatchMaterial(material: Material) {
    this.batchMaterial = material
  }

  public setMaterial(material: Material | Material[]) {
    this.mesh.material = material
  }

  public addDrawGroup(start: number, count: number, materialIndex: number) {
    this.geometry.addGroup(start, count, materialIndex)
  }

  public clearDrawGroups() {
    this.geometry.clearGroups()
  }

  public buildBatch(type: GeometryType) {
    switch (type) {
      case GeometryType.MESH:
        this.buildMeshBatch()
        break
      case GeometryType.LINE:
        this.buildLineBatch()
        break
    }
    this.mesh.uuid = this.id
  }

  public getRenderView(index: number): NodeRenderView {
    for (let k = 0; k < this.renderViews.length; k++) {
      if (
        index * 3 >= this.renderViews[k].batchStart &&
        index * 3 < this.renderViews[k].batchEnd
      ) {
        return this.renderViews[k]
      }
    }
  }

  private buildMeshBatch() {
    const indicesCount = this.renderViews.flatMap(
      (val: NodeRenderView) => val.renderData.geometry.attributes.INDEX
    ).length
    const attributeCount = this.renderViews.flatMap(
      (val: NodeRenderView) => val.renderData.geometry.attributes.POSITION
    ).length
    const indices = new Uint32Array(indicesCount)
    const position = new Float32Array(attributeCount)
    let offset = 0
    let arrayOffset = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      indices.set(
        geometry.attributes.INDEX.map((val) => val + offset / 3),
        arrayOffset
      )
      position.set(geometry.attributes.POSITION, offset)
      this.renderViews[k].setBatchData(
        this.id,
        arrayOffset,
        geometry.attributes.INDEX.length
      )

      offset += geometry.attributes.POSITION.length
      arrayOffset += geometry.attributes.INDEX.length
    }
    this.makeMeshGeometry(indices, position)
    this.mesh = new Mesh(this.geometry, this.batchMaterial)
  }

  private buildLineBatch() {
    let attributeCount = 0
    this.renderViews.forEach(
      (val: NodeRenderView) =>
        (attributeCount += val.needsSegmentConversion
          ? (val.renderData.geometry.attributes.POSITION.length - 3) * 2
          : val.renderData.geometry.attributes.POSITION.length)
    )
    const position = new Float32Array(attributeCount)
    let offset = 0
    for (let k = 0; k < this.renderViews.length; k++) {
      const geometry = this.renderViews[k].renderData.geometry
      let points = null
      /** We need to make sure the line geometry has a layout of :
       *  start(x,y,z), end(x,y,z), start(x,y,z), end(x,y,z)... etc
       *  Some geometries have that inherent form, some don't
       */
      if (this.renderViews[k].needsSegmentConversion) {
        const length = geometry.attributes.POSITION.length - 3
        points = new Array(2 * length)

        for (let i = 0; i < length; i += 3) {
          points[2 * i] = geometry.attributes.POSITION[i]
          points[2 * i + 1] = geometry.attributes.POSITION[i + 1]
          points[2 * i + 2] = geometry.attributes.POSITION[i + 2]

          points[2 * i + 3] = geometry.attributes.POSITION[i + 3]
          points[2 * i + 4] = geometry.attributes.POSITION[i + 4]
          points[2 * i + 5] = geometry.attributes.POSITION[i + 5]
        }
      } else {
        points = geometry.attributes.POSITION
      }

      position.set(points, offset)
      this.renderViews[k].setBatchData(this.id, offset, points.length)

      offset += points.length
    }
    this.makeLineGeometry(position)
    if (Geometry.THICK_LINES) {
      this.mesh = new LineSegments2(
        this.geometry as LineSegmentsGeometry,
        this.batchMaterial as SpeckleLineMaterial
      )
      ;(this.mesh as LineSegments2).computeLineDistances()
      this.mesh.scale.set(1, 1, 1)
    } else {
      this.mesh = new Line(this.geometry, this.batchMaterial)
    }
  }

  /**
   * DUPLICATE from Geometry. Will unify in the future
   */
  private makeMeshGeometry(
    indices: Uint32Array | Uint16Array,
    position: Float32Array
  ): BufferGeometry {
    this.geometry = new BufferGeometry()
    if (position.length >= 65535 || indices.length >= 65535) {
      this.geometry.setIndex(new Uint32BufferAttribute(indices, 1))
    } else {
      this.geometry.setIndex(new Uint16BufferAttribute(indices, 1))
    }

    if (position) {
      this.geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    }

    // if (geometryData.attributes.COLOR) {
    //   this.bufferGeometry.setAttribute(
    //     'color',
    //     new Float32BufferAttribute(geometryData.attributes.COLOR, 3)
    //   )
    // }

    this.geometry.computeVertexNormals()
    this.geometry.computeBoundingSphere()
    this.geometry.computeBoundingBox()

    World.expandWorld(this.geometry.boundingBox)

    if (Geometry.USE_RTE) {
      Geometry.updateRTEGeometry(this.geometry)
    }

    return this.geometry
  }

  private makeLineGeometry(position: Float32Array) {
    if (Geometry.THICK_LINES) {
      this.geometry = this.makeLineGeometryTriangle(position)
    } else {
      this.geometry = this.makeLineGeometryLine(position)
    }
    if (Geometry.USE_RTE) {
      Geometry.updateRTEGeometry(this.geometry)
    }
    World.expandWorld(this.geometry.boundingBox)
  }

  private makeLineGeometryLine(position: Float32Array): BufferGeometry {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    geometry.computeBoundingBox()
    return geometry
  }

  private makeLineGeometryTriangle(position: Float32Array): LineSegmentsGeometry {
    const geometry = new LineSegmentsGeometry()
    geometry.setPositions(position)
    // if (geometryData.attributes.COLOR) geometry.setColors(geometryData.attributes.COLOR)
    geometry.computeBoundingBox()
    return geometry
  }
}
