import Logger from 'js-logger'
import { FrontSide, Intersection, Matrix4, Ray, Vector2, Vector3 } from 'three'
import SpeckleMesh from '../objects/SpeckleMesh'
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
    const dir = new Vector3().copy(this.renderer.camera.position).sub(target)
    dir.normalize()
    const ray = new Ray(this.renderer.camera.position, dir)
    const invMat = new Matrix4()
    let visible = true
    this.renderer.scene.getObjectByName('ContentGroup').traverse((object) => {
      if (!(object instanceof SpeckleMesh)) return
      if (!visible) return

      invMat.copy(object.matrixWorld).invert()
      const objRay = new Ray().copy(ray)
      objRay.applyMatrix4(invMat)

      visible &&= object.BVH.raycastFirst(objRay, FrontSide) ? false : true
    })

    return { visible }
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
