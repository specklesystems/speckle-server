import {
  Color,
  DynamicDrawUsage,
  InterleavedBufferAttribute,
  Line3,
  Plane,
  Vector2,
  Vector3
} from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry'
import MeshBatch from './batching/MeshBatch'
import { ObjectLayers } from './SpeckleRenderer'

export enum PlaneId {
  POSITIVE_X = 'POSITIVE_X',
  POSITIVE_Y = 'POSITIVE_Y',
  POSITIVE_Z = 'POSITIVE_Z',
  NEGATIVE_X = 'NEGATIVE_X',
  NEGATIVE_Y = 'NEGATIVE_Y',
  NEGATIVE_Z = 'NEGATIVE_Z'
}

export interface PlaneOutline {
  buffer: Float64Array
  renderable: LineSegments2
}

export class SectionBoxCapper {
  private static readonly INITIAL_BUFFER_SIZE = 60000

  private planeOutlines: Record<string, PlaneOutline> = {}

  public constructor() {
    this.planeOutlines[PlaneId.NEGATIVE_Z] = this.createPlaneOutline(PlaneId.NEGATIVE_Z)
  }

  public getPlaneOutline(planeId: PlaneId) {
    return this.planeOutlines[planeId]
  }

  public updatePlaneOutline(batches: MeshBatch[], plane: Plane) {
    const tempVector = new Vector3()
    const tempVector1 = new Vector3()
    const tempVector2 = new Vector3()
    const tempVector3 = new Vector3()
    const tempLine = new Line3()
    const clipOutline = this.planeOutlines[this.getPlaneId(plane)].renderable
    let index = 0
    for (let b = 0; b < batches.length; b++) {
      const posAttr = (
        clipOutline.geometry.attributes['instanceStart'] as InterleavedBufferAttribute
      ).data
      posAttr.setUsage(DynamicDrawUsage)
      const posArray = posAttr.array as number[]
      batches[b].boundsTree.shapecast({
        intersectsBounds: (box) => {
          const localPlane = plane
          return localPlane.intersectsBox(box)
        },

        intersectsTriangle: (tri) => {
          // check each triangle edge to see if it intersects with the plane. If so then
          // add it to the list of segments.
          const localPlane = plane
          let count = 0

          tempLine.start.copy(tri.a)
          tempLine.end.copy(tri.b)
          if (localPlane.intersectLine(tempLine, tempVector)) {
            posArray[index * 3] = tempVector.x
            posArray[index * 3 + 1] = tempVector.y
            posArray[index * 3 + 2] = tempVector.z
            index++
            count++
          }

          tempLine.start.copy(tri.b)
          tempLine.end.copy(tri.c)
          if (localPlane.intersectLine(tempLine, tempVector)) {
            posArray[index * 3] = tempVector.x
            posArray[index * 3 + 1] = tempVector.y
            posArray[index * 3 + 2] = tempVector.z
            count++
            index++
          }

          tempLine.start.copy(tri.c)
          tempLine.end.copy(tri.a)
          if (localPlane.intersectLine(tempLine, tempVector)) {
            posArray[index * 3] = tempVector.x
            posArray[index * 3 + 1] = tempVector.y
            posArray[index * 3 + 2] = tempVector.z
            count++
            index++
          }

          // When the plane passes through a vertex and one of the edges of the triangle, there will be three intersections, two of which must be repeated
          if (count === 3) {
            tempVector1.set(
              posArray[(index - 3) * 3],
              posArray[(index - 3) * 3 + 1],
              posArray[(index - 3) * 3 + 2]
            )
            tempVector2.set(
              posArray[(index - 2) * 3],
              posArray[(index - 2) * 3 + 1],
              posArray[(index - 2) * 3 + 2]
            )
            tempVector3.set(
              posArray[(index - 1) * 3],
              posArray[(index - 1) * 3 + 1],
              posArray[(index - 1) * 3 + 2]
            )
            // If the last point is a duplicate intersection
            if (tempVector3.equals(tempVector1) || tempVector3.equals(tempVector2)) {
              count--
              index--
            } else if (tempVector1.equals(tempVector2)) {
              // If the last point is not a duplicate intersection
              // Set the penultimate point as a distinct point and delete the last point
              posArray[(index - 2) * 3] = tempVector.x
              posArray[(index - 2) * 3 + 1] = tempVector.y
              posArray[(index - 2) * 3 + 2] = tempVector.z
              count--
              index--
            }
          }

          // If we only intersected with one or three sides then just remove it. This could be handled
          // more gracefully.
          if (count !== 2) {
            index -= count
          }
        }
      })
      posAttr.needsUpdate = true
      posAttr.updateRange = { offset: 0, count: index * 3 }
    }
    clipOutline.visible = true
    clipOutline.geometry.instanceCount = index / 2
    clipOutline.geometry.attributes['instanceStart'].needsUpdate = true
    clipOutline.geometry.attributes['instanceEnd'].needsUpdate = true
    clipOutline.geometry.computeBoundingBox()
    clipOutline.geometry.computeBoundingSphere()
  }

  private createPlaneOutline(planeId: string): PlaneOutline {
    const buffer = new Float64Array(SectionBoxCapper.INITIAL_BUFFER_SIZE)
    const lineGeometry = new LineSegmentsGeometry()
    lineGeometry.setPositions(new Float32Array(buffer))
    const material = new LineMaterial({
      color: 0x047efb,
      linewidth: 2,
      worldUnits: false,
      vertexColors: false,
      alphaToCoverage: false,
      resolution: new Vector2(919, 848)
    })
    material.color = new Color(0x047efb)
    material.color.convertSRGBToLinear()
    material.linewidth = 2
    // material.clipIntersection = true
    material.worldUnits = false

    const clipOutline = new LineSegments2(lineGeometry, material)
    clipOutline.name = `${planeId}-outline`
    clipOutline.frustumCulled = false
    clipOutline.renderOrder = 1
    clipOutline.layers.set(ObjectLayers.PROPS)

    return {
      buffer,
      renderable: clipOutline
    }
  }

  private getPlaneId(plane: Plane) {
    if (plane.normal.equals(new Vector3(0, 0, -1))) return PlaneId.NEGATIVE_Z
  }
}
