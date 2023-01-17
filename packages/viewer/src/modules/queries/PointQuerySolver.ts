import Logger from 'js-logger'
import { Camera, FrontSide, Matrix4, Ray, Scene, Vector3 } from 'three'
import SpeckleMesh from '../objects/SpeckleMesh'
import { PointQuery, QueryResult } from './Query'

export class PointQuerySolver {
  private scene: Scene
  private camera: Camera

  public setContext(scene: Scene, camera: Camera) {
    this.scene = scene
    this.camera = camera
  }

  public solve(query: PointQuery): QueryResult {
    switch (query.operation) {
      case 'Occlusion':
        return this.solveOcclusion(query)
      case 'Project':
        return this.solveProjection(query)
      case 'Unproject':
        return this.solveUnprojection(query)
      default:
        Logger.error('Malformed query')
        break
    }
  }

  private solveOcclusion(query: PointQuery): QueryResult {
    const target = new Vector3(query.point.x, query.point.y, query.point.z)
    const dir = new Vector3().copy(this.camera.position).sub(target)
    dir.normalize()
    const ray = new Ray(this.camera.position, dir)
    const invMat = new Matrix4()
    let visible = true
    this.scene.getObjectByName('ContentGroup').traverse((object) => {
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
    projected.project(this.camera)

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
    unprojected.project(this.camera)

    return {
      // WORLD
      x: unprojected.x,
      y: unprojected.y,
      z: unprojected.z
    }
  }
}
