import Logger from 'js-logger'
import { Intersection, Ray, Vector2, Vector3 } from 'three'
import SpeckleRenderer from '../SpeckleRenderer'
import { PointQuery, QueryResult } from './Query'

export class PointQuerySolver {
  private renderer: SpeckleRenderer

  public setContext(renderer: SpeckleRenderer) {
    this.renderer = renderer
  }

  public solve(query: PointQuery): QueryResult {
    switch (query.operation) {
      case 'Occlusion':
        return this.solveOcclusion(query)
      case 'Project':
        return this.solveProjection(query)
      case 'Unproject':
        return this.solveUnprojection(query)
      case 'Pick':
        return this.solvePick(query)
      default:
        Logger.error('Malformed query')
        break
    }
  }

  private solveOcclusion(query: PointQuery): QueryResult {
    const target = new Vector3(query.point.x, query.point.y, query.point.z)
    const dir = new Vector3().copy(target).sub(this.renderer.camera.position)
    dir.normalize()
    const ray = new Ray(this.renderer.camera.position, dir)
    const results: Array<Intersection> = this.renderer.intersections.intersectRay(
      this.renderer.scene,
      this.renderer.camera,
      ray,
      true,
      this.renderer.currentSectionBox
    )
    if (!results || results.length === 0) return { occluder: null }
    const hits = this.renderer.queryHits(results)
    if (!hits) return { occluder: null }
    let targetDistance = this.renderer.camera.position.distanceTo(target)
    targetDistance -= query.tolerance
    if (targetDistance < results[0].distance) {
      return { occluder: null }
    } else {
      return { occluder: hits[0].node.model }
    }
  }

  private solveProjection(query: PointQuery): QueryResult {
    // WORLD
    const projected = new Vector3(query.point.x, query.point.y, query.point.z)
    projected.project(this.renderer.camera)

    return {
      // NDC
      x: projected.x,
      y: projected.y,
      z: projected.z
    }
  }

  private solveUnprojection(query: PointQuery): QueryResult {
    // NDC
    const unprojected = new Vector3(query.point.x, query.point.y, query.point.z)
    unprojected.unproject(this.renderer.camera)

    return {
      // WORLD
      x: unprojected.x,
      y: unprojected.y,
      z: unprojected.z
    }
  }

  private solvePick(query: PointQuery): QueryResult {
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
      hits: hits.map((value) => {
        return {
          guid: value.node.model.id,
          object: value.node.model.raw,
          point: value.point
        }
      })
    }
  }
}
