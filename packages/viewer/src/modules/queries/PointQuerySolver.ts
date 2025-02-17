import { Frustum, Vector3 } from 'three'
import SpeckleRenderer from '../SpeckleRenderer.js'
import type { PointQuery, PointQueryResult } from './Query.js'
import Logger from '../utils/Logger.js'

const frustumBuf: Frustum = new Frustum()
const vec3Buff: Vector3 = new Vector3()

export class PointQuerySolver {
  private renderer: SpeckleRenderer

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
    let inFrustum = false

    if (this.renderer.renderingCamera) {
      /** We need to check frustum inclusion in view space. */
      vec3Buff.copy(projected)
      vec3Buff.applyMatrix4(this.renderer.renderingCamera.matrixWorldInverse)

      /** We check in-frustum *before* projection */
      inFrustum = frustumBuf
        .setFromProjectionMatrix(this.renderer.renderingCamera.projectionMatrix)
        .containsPoint(vec3Buff)
      projected.project(this.renderer.renderingCamera)
    } else Logger.error('Could not run query. Camera is null')

    return {
      // NDC
      x: projected.x,
      y: projected.y,
      z: projected.z,
      inFrustum
    }
  }

  private solveUnprojection(query: PointQuery): PointQueryResult {
    // NDC
    let inFrustum = false
    const unprojected = new Vector3(query.point.x, query.point.y, query.point.z)
    if (this.renderer.renderingCamera) {
      unprojected.unproject(this.renderer.renderingCamera)

      /** We need to check frustum inclusion in view space. */
      vec3Buff.copy(unprojected)
      vec3Buff.applyMatrix4(this.renderer.renderingCamera.matrixWorldInverse)

      /** We check in-frustum *after* projection */
      inFrustum = frustumBuf
        .setFromProjectionMatrix(this.renderer.renderingCamera.projectionMatrix)
        .containsPoint(vec3Buff)
    } else Logger.error('Could not run query. Camera is null')
    return {
      // WORLD
      x: unprojected.x,
      y: unprojected.y,
      z: unprojected.z,
      inFrustum
    }
  }
}
