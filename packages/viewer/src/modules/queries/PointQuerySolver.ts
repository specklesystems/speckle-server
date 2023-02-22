import Logger from 'js-logger'
import { Vector3 } from 'three'
import SpeckleRenderer from '../SpeckleRenderer'
import { PointQuery, PointQueryResult } from './Query'

export class PointQuerySolver {
  private renderer: SpeckleRenderer

  public setContext(renderer: SpeckleRenderer) {
    this.renderer = renderer
  }

  public solve(query: PointQuery): PointQueryResult {
    switch (query.operation) {
      case 'Project':
        return this.solveProjection(query)
      case 'Unproject':
        return this.solveUnprojection(query)
      default:
        Logger.error('Malformed query')
        break
    }
  }

  private solveProjection(query: PointQuery): PointQueryResult {
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

  private solveUnprojection(query: PointQuery): PointQueryResult {
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
}
