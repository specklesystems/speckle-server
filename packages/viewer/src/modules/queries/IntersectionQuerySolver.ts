import Logger from 'js-logger'
import { Intersection, Ray, Vector2, Vector3 } from 'three'
import SpeckleRenderer, { ObjectLayers } from '../SpeckleRenderer'
import { IntersectionQuery, IntersectionQueryResult } from './Query'

export class IntersectionQuerySolver {
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
    const target = new Vector3(query.point.x, query.point.y, query.point.z)
    const dir = new Vector3().copy(target).sub(this.renderer.camera.position)
    dir.normalize()
    const ray = new Ray(this.renderer.camera.position, dir)
    const results: Array<Intersection> = this.renderer.intersections.intersectRay(
      this.renderer.scene,
      this.renderer.camera,
      ray,
      true,
      this.renderer.currentSectionBox,
      [ObjectLayers.STREAM_CONTENT_MESH]
    )
    if (!results || results.length === 0) return { objects: null }
    const hits = this.renderer.queryHitIds(results)
    if (!hits) return { objects: null }
    let targetDistance = this.renderer.camera.position.distanceTo(target)
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
      this.renderer.camera,
      new Vector2(query.point.x, query.point.y),
      true,
      this.renderer.currentSectionBox
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
