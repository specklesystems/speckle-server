import { Box3, Mesh, Object3D, Quaternion, Scene, Vector3 } from 'three'
import * as CANNON from 'cannon-es'
import { generateUUID } from 'three/src/math/MathUtils'
import { Body, Vec3 } from 'cannon-es'
import { Geometry, GeometryAttributes, GeometryData } from './converter/Geometry'

export class World {
  private readonly boxes: Array<Box3> = new Array<Box3>()
  public readonly worldBox: Box3 = new Box3()
  private static cannonWorld = new CANNON.World()
  private static cannonBodyMapping: Record<number, CANNON.Body> = {}
  static cameraBody: Body
  private lastTime: number

  private _worldOrigin: Vector3 = new Vector3()
  static lastTime: number
  public get worldSize() {
    this.worldBox.getCenter(this._worldOrigin)
    const size = new Vector3().subVectors(this.worldBox.max, this.worldBox.min)
    return {
      x: size.x,
      y: size.y,
      z: size.z
    }
  }

  public get worldOrigin() {
    return this._worldOrigin
  }

  public expandWorld(box: Box3) {
    this.boxes.push(box)
    this.updateWorld()
  }

  public reduceWorld(box: Box3) {
    this.boxes.splice(this.boxes.indexOf(box), 1)
    this.updateWorld()
  }

  public updateWorld() {
    this.worldBox.makeEmpty()
    for (let k = 0; k < this.boxes.length; k++) {
      this.worldBox.union(this.boxes[k])
    }
  }

  public resetWorld() {
    this.worldBox.makeEmpty()
    this.boxes.length = 0
  }

  public static createCannonWorld() {
    this.cannonWorld = new CANNON.World()
    // Tweak contact properties.
    // Contact stiffness - use to make softer/harder contacts
    // this.cannonWorld.defaultContactMaterial.contactEquationStiffness = 1e9

    // // Stabilization time in number of timesteps
    // this.cannonWorld.defaultContactMaterial.contactEquationRelaxation = 4

    // const solver = new CANNON.GSSolver()
    // solver.iterations = 7
    // solver.tolerance = 0.1
    // this.cannonWorld.solver = new CANNON.SplitSolver(solver)
    // use this to test non-split solver
    // world.solver = solver

    this.cannonWorld.gravity.set(0, 0, -20)
  }

  public static getCannonWorld() {
    return this.cannonWorld
  }

  public static addPlaneCannonPrimitive(fromMesh: Mesh) {
    const uid = fromMesh.id
    const planeShape = new CANNON.Plane()
    const planeBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: planeShape })
    planeBody.addShape(planeShape)
    World.cannonBodyMapping[uid] = planeBody
    this.cannonWorld.addBody(planeBody)
    World.updateCannonBody(fromMesh)
  }

  public static addBoxCannonPrimitive(fromMesh: Mesh) {
    const uid = fromMesh.id
    fromMesh.geometry.computeBoundingBox()
    const size = fromMesh.geometry.boundingBox
      .getSize(new Vector3())
      .multiplyScalar(0.5)
    const cubeShape = new CANNON.Box(new Vec3(size.x, size.y, size.z))
    const cubeBody = new CANNON.Body({ mass: 1 })
    cubeBody.addShape(cubeShape)
    World.cannonBodyMapping[uid] = cubeBody
    this.cannonWorld.addBody(cubeBody)
    World.updateCannonBody(fromMesh)
    cubeBody.applyForce(new Vec3(0, 0, 0))
  }

  public static addBoxCannonPrimitiveBatched(aabb: Box3) {
    const size = aabb.getSize(new Vector3()).multiplyScalar(0.5)
    const center = aabb.getCenter(new Vector3())
    const shapeSize = new Vec3(size.x, size.y, size.z)
    const cubeShape = new CANNON.Box(shapeSize)
    const cubeBody = new CANNON.Body({ type: CANNON.Body.STATIC, mass: 0 })
    cubeBody.position.x = center.x
    cubeBody.position.y = center.y
    cubeBody.position.z = center.z
    cubeBody.addShape(cubeShape)
    this.cannonWorld.addBody(cubeBody)
  }

  public static addMeshCannon(geometry: GeometryData) {
    if(!geometry.attributes[GeometryAttributes.POSITION] || !geometry.attributes[GeometryAttributes.INDEX])
    return
    const trimeshShape = new CANNON.Trimesh(geometry.attributes[GeometryAttributes.POSITION], geometry.attributes[GeometryAttributes.INDEX])
    const cubeBody = new CANNON.Body({ type: CANNON.Body.STATIC, mass: 0 })
    cubeBody.addShape(trimeshShape)
    this.cannonWorld.addBody(cubeBody)
  }

  public static addCameraSphere() {
    const sphereShape = new CANNON.Sphere(0.1)
    this.cameraBody = new CANNON.Body({ mass: 1 })
    this.cameraBody.addShape(sphereShape)
    this.cameraBody.position.set(0, 0, 40)
    this.cannonWorld.addBody(this.cameraBody)
  }

  public static updateCannonBody(fromMesh: Object3D) {
    const body = World.cannonBodyMapping[fromMesh.id]
    body.quaternion.set(
      fromMesh.quaternion.x,
      fromMesh.quaternion.y,
      fromMesh.quaternion.z,
      fromMesh.quaternion.w
    )
    body.position.set(fromMesh.position.x, fromMesh.position.y, fromMesh.position.z)
  }

  public static updateCannonWorld(deltaTime: number, scene: Scene) {
    const now = performance.now() / 1000
    const delta = now - this.lastTime
    
    this.cannonWorld.fixedStep()

    this.lastTime = now

    for (const k in World.cannonBodyMapping) {
      const model = scene.getObjectById(Number.parseInt(k))
      const body = World.cannonBodyMapping[k]
      model.position.copy(body.position as unknown as Vector3)
      model.quaternion.copy(body.quaternion as unknown as Quaternion)
      // console.log(body.position)
    }
  }

  public static getCameraPosition() {
    // console.log(this.cameraBody.position)
    return new Vector3(
      this.cameraBody.position.x,
      this.cameraBody.position.y,
      this.cameraBody.position.z + 2.5
    )
  }

  public static applyCameraMovement(dir: Vec3) {
    this.cameraBody.applyForce(dir)
  }
}
