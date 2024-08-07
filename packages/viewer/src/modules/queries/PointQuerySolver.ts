import { Vector3 } from 'three'
import SpeckleRenderer from '../SpeckleRenderer.js'
import type { PointQuery, PointQueryResult } from './Query.js'
import Logger from '../utils/Logger.js'

export class PointQuerySolver {
  private renderer!: SpeckleRenderer

  public setContext(renderer: SpeckleRenderer) {
    this.renderer = renderer
  }

  public solve(query: PointQuery): PointQueryResult | null {
    switch (query.operation) {
      case 'Project':
        return this.solveProjection(query)
      case 'Unproject':
        return this.solveUnprojection(query)
      default:
        Logger.error('Malformed query')
        return null
    }
  }

  private solveProjection(query: PointQuery): PointQueryResult {
    // WORLD
    const projected = new Vector3(query.point.x, query.point.y, query.point.z)
    if (this.renderer.renderingCamera) projected.project(this.renderer.renderingCamera)
    else Logger.error('Could not run query. Camera is null')

    return {
      // NDC
      x: projected.x,
      y: projected.y,
      z: projected.z
    }
  }

  private solveUnprojection(query: PointQuery): PointQueryResult {
    // NDC
    const unprojected = new Vector3(query.point.x, query.point.y, query.point.z)
    if (this.renderer.renderingCamera)
      unprojected.unproject(this.renderer.renderingCamera)
    else Logger.error('Could not run query. Camera is null')
    return {
      // WORLD
      x: unprojected.x,
      y: unprojected.y,
      z: unprojected.z
    }
  }
}
