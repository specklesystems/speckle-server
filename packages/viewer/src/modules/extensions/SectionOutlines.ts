import {
  Box3,
  Color,
  DynamicDrawUsage,
  Group,
  InterleavedBufferAttribute,
  Line3,
  Material,
  Plane,
  Vector2,
  Vector3
} from 'three'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { Geometry } from '../converter/Geometry.js'
import SpeckleGhostMaterial from '../materials/SpeckleGhostMaterial.js'
import SpeckleLineMaterial from '../materials/SpeckleLineMaterial.js'
import { Extension } from './Extension.js'
import { type IViewer } from '../../index.js'
import { SectionTool, SectionToolEvent } from './SectionTool.js'
import { GeometryType } from '../batching/Batch.js'
import { ObjectLayers } from '../../IViewer.js'
import { MeshBatch } from '../batching/MeshBatch.js'
import Logger from '../utils/Logger.js'

export enum PlaneId {
  POSITIVE_X = 'POSITIVE_X',
  POSITIVE_Y = 'POSITIVE_Y',
  POSITIVE_Z = 'POSITIVE_Z',
  NEGATIVE_X = 'NEGATIVE_X',
  NEGATIVE_Y = 'NEGATIVE_Y',
  NEGATIVE_Z = 'NEGATIVE_Z'
}

export interface PlaneOutline {
  renderable: LineSegments2
}

export class SectionOutlines extends Extension {
  public get inject() {
    return [SectionTool]
  }
  private static readonly OUTLINE_Z_OFFSET = 0.0001
  private static readonly INITIAL_BUFFER_SIZE = 60000 // Must be a multiple of 6

  private tmpVec: Vector3 = new Vector3()
  private up: Vector3 = new Vector3(0, 1, 0)
  private down: Vector3 = new Vector3(0, -1, 0)
  private left: Vector3 = new Vector3(-1, 0, 0)
  private right: Vector3 = new Vector3(1, 0, 0)
  private forward: Vector3 = new Vector3(0, 0, 1)
  private back: Vector3 = new Vector3(0, 0, -1)

  private planeOutlines: Record<string, PlaneOutline> = {}
  private lastSectionPlanes: Plane[] = []
  private sectionPlanesChanged: Plane[] = []

  public constructor(viewer: IViewer, protected sectionProvider: SectionTool) {
    super(viewer)
    this.planeOutlines[PlaneId.POSITIVE_X] = this.createPlaneOutline(PlaneId.POSITIVE_X)
    this.planeOutlines[PlaneId.NEGATIVE_X] = this.createPlaneOutline(PlaneId.NEGATIVE_X)
    this.planeOutlines[PlaneId.POSITIVE_Y] = this.createPlaneOutline(PlaneId.POSITIVE_Y)
    this.planeOutlines[PlaneId.NEGATIVE_Y] = this.createPlaneOutline(PlaneId.NEGATIVE_Y)
    this.planeOutlines[PlaneId.NEGATIVE_Z] = this.createPlaneOutline(PlaneId.NEGATIVE_Z)
    this.planeOutlines[PlaneId.POSITIVE_Z] = this.createPlaneOutline(PlaneId.POSITIVE_Z)

    const sectionOutlinesGroup = new Group()
    sectionOutlinesGroup.name = 'SectionBoxOutlines'
    this.viewer.getRenderer().scene.add(sectionOutlinesGroup)
    sectionOutlinesGroup.add(this.getPlaneOutline(PlaneId.NEGATIVE_Z).renderable)
    sectionOutlinesGroup.add(this.getPlaneOutline(PlaneId.POSITIVE_Z).renderable)
    sectionOutlinesGroup.add(this.getPlaneOutline(PlaneId.POSITIVE_X).renderable)
    sectionOutlinesGroup.add(this.getPlaneOutline(PlaneId.NEGATIVE_X).renderable)
    sectionOutlinesGroup.add(this.getPlaneOutline(PlaneId.POSITIVE_Y).renderable)
    sectionOutlinesGroup.add(this.getPlaneOutline(PlaneId.NEGATIVE_Y).renderable)

    this.lastSectionPlanes.push(
      new Plane(),
      new Plane(),
      new Plane(),
      new Plane(),
      new Plane(),
      new Plane()
    )

    this.sectionProvider.on(
      SectionToolEvent.DragStart,
      this.onSectionBoxDragStart.bind(this)
    )
    this.sectionProvider.on(
      SectionToolEvent.DragEnd,
      this.onSectionBoxDragEnd.bind(this)
    )
    this.sectionProvider.on(SectionToolEvent.Updated, this.sectionUpdated.bind(this))
  }

  private getPlaneOutline(planeId: PlaneId) {
    return this.planeOutlines[planeId]
  }

  public get enabled(): boolean {
    return this._enabled
  }

  public set enabled(value: boolean) {
    this._enabled = value
    for (const k in this.planeOutlines) {
      this.planeOutlines[k].renderable.visible = value
    }
  }

  public sectionUpdated(planes: Plane[]) {
    if (!this.sectionProvider.enabled) this.enabled = false
    for (const plane in this.planeOutlines) {
      const clippingPlanes = planes.filter((value) => this.getPlaneId(value) !== plane)
      this.planeOutlines[plane].renderable.material.clippingPlanes = clippingPlanes
    }
  }

  public requestUpdate() {
    this.setSectionPlaneChanged(this.viewer.getRenderer().clippingPlanes)
    this.updateOutlines(this.sectionPlanesChanged)
  }

  private updatePlaneOutline(
    batches: MeshBatch[],
    _plane: Plane,
    outlineOffset: number
  ) {
    const tempVector = new Vector3()
    const tempVector1 = new Vector3()
    const tempVector2 = new Vector3()
    const tempVector3 = new Vector3()
    const tempVector4 = new Vector3()
    const tempLine = new Line3()
    const planeId = this.getPlaneId(_plane)
    if (!planeId) {
      Logger.error(`Invalid plane! Aborting section outline update`)
      return
    }
    const clipOutline = this.planeOutlines[planeId].renderable
    let index = 0
    let posAttr = (
      clipOutline.geometry.attributes['instanceStart'] as InterleavedBufferAttribute
    ).data
    /** Not a fan of this, but we have no choice. We can't know beforehand the resulting number of intersection points */
    const scratchBuffer = new Array<number>()
    for (let b = 0; b < batches.length; b++) {
      const plane = new Plane().copy(_plane)
      batches[b].mesh.TAS.shapecast({
        intersectsTAS: (
          box: Box3
          // isLeaf: boolean,
          // score: number | undefined,
          // depth: number,
          // nodeIndex: number
        ) => {
          const localPlane = plane
          return localPlane.intersectsBox(box)
        },

        intersectsBounds: (box) => {
          const localPlane = plane
          return localPlane.intersectsBox(box)
        },
        intersectsTriangle(tri, _i, _contained, _depth, batchObject) {
          /** Catering to typescript */
          /** We're intersecting the AS for meshes. There will always be a batchObject */
          if (!batchObject) {
            throw new Error('Null batch object in AS intersection!')
          }
          // check each triangle edge to see if it intersects with the plane. If so then
          // add it to the list of segments.
          const material = batches[b].mesh.getBatchObjectMaterial(
            batchObject
          ) as Material
          if (
            material instanceof SpeckleGhostMaterial ||
            material.visible === false ||
            material === null
          )
            return

          const localPlane = plane
          let count = 0
          tempLine.start.copy(tri.a)
          tempLine.end.copy(tri.b)
          if (localPlane.intersectLine(tempLine, tempVector)) {
            tempVector.add(
              tempVector4.copy(plane.normal).multiplyScalar(-outlineOffset)
            )
            scratchBuffer[index * 3] = tempVector.x
            scratchBuffer[index * 3 + 1] = tempVector.y
            scratchBuffer[index * 3 + 2] = tempVector.z
            index++
            count++
          }
          tempLine.start.copy(tri.b)
          tempLine.end.copy(tri.c)
          if (localPlane.intersectLine(tempLine, tempVector)) {
            tempVector.add(
              tempVector4.copy(plane.normal).multiplyScalar(-outlineOffset)
            )
            scratchBuffer[index * 3] = tempVector.x
            scratchBuffer[index * 3 + 1] = tempVector.y
            scratchBuffer[index * 3 + 2] = tempVector.z
            count++
            index++
          }
          tempLine.start.copy(tri.c)
          tempLine.end.copy(tri.a)
          if (localPlane.intersectLine(tempLine, tempVector)) {
            tempVector.add(
              tempVector4.copy(plane.normal).multiplyScalar(-outlineOffset)
            )
            scratchBuffer[index * 3] = tempVector.x
            scratchBuffer[index * 3 + 1] = tempVector.y
            scratchBuffer[index * 3 + 2] = tempVector.z
            count++
            index++
          }
          // When the plane passes through a vertex and one of the edges of the triangle, there will be three intersections, two of which must be repeated
          if (count === 3) {
            tempVector1.set(
              scratchBuffer[(index - 3) * 3],
              scratchBuffer[(index - 3) * 3 + 1],
              scratchBuffer[(index - 3) * 3 + 2]
            )
            tempVector2.set(
              scratchBuffer[(index - 2) * 3],
              scratchBuffer[(index - 2) * 3 + 1],
              scratchBuffer[(index - 2) * 3 + 2]
            )
            tempVector3.set(
              scratchBuffer[(index - 1) * 3],
              scratchBuffer[(index - 1) * 3 + 1],
              scratchBuffer[(index - 1) * 3 + 2]
            )
            // If the last point is a duplicate intersection
            if (tempVector3.equals(tempVector1) || tempVector3.equals(tempVector2)) {
              count--
              index--
            } else if (tempVector1.equals(tempVector2)) {
              // If the last point is not a duplicate intersection
              // Set the penultimate point as a distinct point and delete the last point
              tempVector3.set(tempVector.x, tempVector.y, tempVector.z)
              tempVector3.add(
                tempVector4.copy(plane.normal).multiplyScalar(-outlineOffset)
              )
              scratchBuffer[(index - 2) * 3] = tempVector3.x
              scratchBuffer[(index - 2) * 3 + 1] = tempVector3.y
              scratchBuffer[(index - 2) * 3 + 2] = tempVector3.z
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
    }
    if (scratchBuffer.length > posAttr.array.length) {
      this.resizeGeometryBuffer(this.planeOutlines[planeId], scratchBuffer.length)
      console.warn(
        `Resized outline buffer from ${posAttr.array.length} to ${
          scratchBuffer.length
        }. ${scratchBuffer.length / 6} instance count`
      )
    }
    posAttr = (
      clipOutline.geometry.attributes['instanceStart'] as InterleavedBufferAttribute
    ).data
    const posAttrLow = (
      clipOutline.geometry.attributes['instanceStartLow'] as InterleavedBufferAttribute
    ).data
    Geometry.DoubleToHighLowBuffer(
      scratchBuffer,
      posAttrLow.array as Float32Array,
      posAttr.array as Float32Array
    )
    // posAttr.set(scratchBuffer, 0)
    posAttr.needsUpdate = true
    posAttr.updateRange = { offset: 0, count: index * 3 }
    posAttrLow.needsUpdate = true
    posAttrLow.updateRange = { offset: 0, count: index * 3 }
    clipOutline.visible = true
    clipOutline.geometry.instanceCount = index / 2
    clipOutline.geometry.attributes['instanceStart'].needsUpdate = true
    clipOutline.geometry.attributes['instanceEnd'].needsUpdate = true
    clipOutline.geometry.attributes['instanceStartLow'].needsUpdate = true
    clipOutline.geometry.attributes['instanceEndLow'].needsUpdate = true
    clipOutline.geometry.computeBoundingBox()
    clipOutline.geometry.computeBoundingSphere()
  }

  private createPlaneOutline(planeId: string): PlaneOutline {
    const buffer = new Float64Array(SectionOutlines.INITIAL_BUFFER_SIZE)
    const lineGeometry = new LineSegmentsGeometry()
    lineGeometry.setPositions(new Float32Array(buffer))
    ;(
      lineGeometry.attributes['instanceStart'] as InterleavedBufferAttribute
    ).data.setUsage(DynamicDrawUsage)

    Geometry.updateRTEGeometry(lineGeometry, buffer)
    const material = new SpeckleLineMaterial(
      {
        color: 0x047efb,
        linewidth: 2,
        worldUnits: false,
        vertexColors: false,
        alphaToCoverage: false,
        resolution: new Vector2(919, 848)
      },
      ['USE_RTE']
    )
    material.color = new Color(0x047efb)
    material.color.convertSRGBToLinear()
    material.linewidth = 2
    material.worldUnits = false
    material.resolution = new Vector2(1513, 1306)

    const clipOutline = new LineSegments2(lineGeometry, material)
    clipOutline.name = `${planeId}-outline`
    clipOutline.frustumCulled = false
    clipOutline.renderOrder = 1
    clipOutline.layers.set(ObjectLayers.PROPS)

    return {
      renderable: clipOutline
    }
  }

  private onSectionBoxDragStart() {
    this.enabled = false
  }

  private onSectionBoxDragEnd() {
    const generate = () => {
      this.setSectionPlaneChanged(this.viewer.getRenderer().clippingPlanes)
      this.updateOutlines(this.sectionPlanesChanged)
      this.sectionProvider.removeListener(SectionToolEvent.Updated, generate)
    }
    this.sectionProvider.on(SectionToolEvent.Updated, generate)
  }

  private setSectionPlaneChanged(planes: Plane[]) {
    this.sectionPlanesChanged.length = 0
    for (let k = 0; k < planes.length; k++) {
      if (Math.abs(this.lastSectionPlanes[k].constant - planes[k].constant) > 0.0001)
        this.sectionPlanesChanged.push(planes[k])
      this.lastSectionPlanes[k].copy(planes[k])
    }
  }

  private updateOutlines(planes: Plane[]) {
    const start = performance.now()
    const outlineOffset = this.viewer.World.getRelativeOffset(
      SectionOutlines.OUTLINE_Z_OFFSET
    )
    for (let k = 0; k < planes.length; k++) {
      this.updatePlaneOutline(
        this.viewer.getRenderer().batcher.getBatches(undefined, GeometryType.MESH),
        planes[k],
        outlineOffset
      )
    }
    this.enabled = this.sectionProvider.enabled
    Logger.warn('Outline time: ', performance.now() - start)
  }

  private resizeGeometryBuffer(outline: PlaneOutline, size: number) {
    outline.renderable.geometry.dispose()

    const buffer = new Float32Array(size)
    outline.renderable.geometry = new LineSegmentsGeometry()
    outline.renderable.geometry.setPositions(new Float32Array(buffer))
    ;(
      outline.renderable.geometry.attributes[
        'instanceStart'
      ] as InterleavedBufferAttribute
    ).data.setUsage(DynamicDrawUsage)
    Geometry.updateRTEGeometry(outline.renderable.geometry, buffer)
  }

  private getPlaneId(plane: Plane): PlaneId | undefined {
    this.tmpVec.set(
      Math.round(plane.normal.x),
      Math.round(plane.normal.y),
      Math.round(plane.normal.z)
    )
    if (this.tmpVec.equals(this.right)) return PlaneId.POSITIVE_X
    if (this.tmpVec.equals(this.left)) return PlaneId.NEGATIVE_X
    if (this.tmpVec.equals(this.up)) return PlaneId.POSITIVE_Y
    if (this.tmpVec.equals(this.down)) return PlaneId.NEGATIVE_Y
    if (this.tmpVec.equals(this.back)) return PlaneId.NEGATIVE_Z
    if (this.tmpVec.equals(this.forward)) return PlaneId.POSITIVE_Z

    return undefined
  }
}
