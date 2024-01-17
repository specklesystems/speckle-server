import Logger from 'js-logger'
import { Intersection, Ray, Vector2, Vector3 } from 'three'
import SpeckleRenderer from '../SpeckleRenderer'
import { IntersectionQuery, IntersectionQueryResult } from './Query'
import { ObjectLayers } from '../../IViewer'

export class IntersectionQuerySolver {
  private vecBuff0: Vector3 = new Vector3()
  private vecBuff1: Vector3 = new Vector3()

  private renderer: SpeckleRenderer

  public setContext(renderer: SpeckleRenderer) {
    this.renderer = renderer
  }

  public solve(query: IntersectionQuery): IntersectionQueryResult {
    switch (query.operation) {
      case 'Occlusion':
        return this.solveOcclusion(query)
      case 'Pick':
        return this.solvePick(query)
      default:
        Logger.error('Malformed query')
        break
    }
  }

  private solveOcclusion(query: IntersectionQuery): IntersectionQueryResult {
    const target = this.vecBuff0.set(query.point.x, query.point.y, query.point.z)
    const dir = this.vecBuff1.copy(target).sub(this.renderer.renderingCamera.position)
    dir.normalize()
    const ray = new Ray(this.renderer.renderingCamera.position, dir)
    const results: Array<Intersection> = this.renderer.intersections.intersectRay(
      this.renderer.scene,
      this.renderer.renderingCamera,
      ray,
      true,
      this.renderer.clippingVolume,
      [ObjectLayers.STREAM_CONTENT_MESH]
    )
    if (!results || results.length === 0) return { objects: null }
    const hits = this.renderer.queryHitIds(results)
    if (!hits) return { objects: null }
    let targetDistance = this.renderer.renderingCamera.position.distanceTo(target)
    targetDistance -= query.tolerance

    if (targetDistance < results[0].distance) {
      return { objects: null }
    } else {
      return {
        objects: [
          {
            guid: hits[0].nodeId,
            point: hits[0].point
          }
        ]
      }
    }
  }

  private solvePick(query: IntersectionQuery): IntersectionQueryResult {
    const results: Array<Intersection> = this.renderer.intersections.intersect(
      this.renderer.scene,
      this.renderer.renderingCamera,
      new Vector2(query.point.x, query.point.y),
      true,
      this.renderer.clippingVolume
    )
    if (!results) return null
    const hits = this.renderer.queryHits(results)
    return {
      objects: hits.map((value) => {
        return {
          guid: value.node.model.id,
          object: value.node.model.raw,
          point: value.point
        }
      })
    }
  }
}
