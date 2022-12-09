import {
  Box3,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Ray,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer
} from 'three'
import MeshBatch from './batching/MeshBatch'
import SpeckleBasicMaterial from './materials/SpeckleBasicMaterial'
import { ShadowcatcherPass } from './pipeline/ShadowcatcherPass'
import { ObjectLayers } from './SpeckleRenderer'

export interface ShadowcatcherConfig {
  planeSubdivision: number
  sampleCount: number
  maxDist: number
  textureSize: number
  blurRadius: number
}

export const DefaultShadowcatcherConfig: ShadowcatcherConfig = {
  planeSubdivision: 10,
  sampleCount: 100,
  maxDist: 2,
  textureSize: 64,
  blurRadius: 16
}

export class Shadowcatcher {
  public static readonly MESH_NAME = 'Shadowcatcher'

  private planeMesh: Mesh = null
  private planeSize: Vector2 = new Vector2()
  private generateMaterial: MeshBasicMaterial = null
  private displayMaterial: SpeckleBasicMaterial = null
  public shadowcatcherPass: ShadowcatcherPass = null
  private _config: ShadowcatcherConfig = DefaultShadowcatcherConfig
  private _debugRawAO = false
  public debugLines: LineSegments = null

  public get shadowcatcherMesh() {
    return this.planeMesh
  }

  public set configuration(config: ShadowcatcherConfig) {
    if (this._config.planeSubdivision !== config.planeSubdivision)
      console.warn('Subdivision changed, shadowcatcher mesh needs rebuild!')
    this._config = JSON.parse(JSON.stringify(config))
  }

  public constructor() {
    this.shadowcatcherPass = new ShadowcatcherPass()

    /** Material used to render the per-vertex ao values to texture */
    if (!this.generateMaterial) {
      this.generateMaterial = new MeshBasicMaterial({ color: 0xffffff })
      this.generateMaterial.vertexColors = true
      this.generateMaterial.toneMapped = false
    }

    /** Material used to display the plane using the rendered texture */
    if (!this.displayMaterial) {
      this.displayMaterial = new SpeckleBasicMaterial({ color: 0xffffff }, ['USE_RTE'])
      this.displayMaterial.vertexColors = false
      this.displayMaterial.map = this.shadowcatcherPass.outputTexture
      this.displayMaterial.transparent = true
      this.displayMaterial.toneMapped = false
    }

    this.shadowcatcherPass.onBeforeRender = () => {
      this.planeMesh.material = this.generateMaterial
    }
    this.shadowcatcherPass.onAfterRender = () => {
      this.planeMesh.material = this._debugRawAO
        ? this.generateMaterial
        : this.displayMaterial
    }
  }

  public update(scene: Scene) {
    this.shadowcatcherPass.blurRadius = this._config.blurRadius
    const aspect = this.planeSize.x / this.planeSize.y
    this.shadowcatcherPass.setOutputSize(
      this._config.textureSize,
      this._config.textureSize / aspect
    )
    this.shadowcatcherPass.update(scene)
  }

  public render(renderer: WebGLRenderer) {
    this.shadowcatcherPass.render(renderer, null, null)
  }

  public bake(batches: MeshBatch[]) {
    this.trace(batches)
    this.shadowcatcherPass.needsUpdate = true
  }

  public updatePlaneMesh(box: Box3, layer: number, force?: boolean) {
    const boxSize = box.getSize(new Vector3())
    const boxCenter = box.getCenter(new Vector3())
    const needsRebuild =
      new Vector2(boxSize.x, boxSize.y).distanceTo(this.planeSize) > 0.001

    if (!this.planeMesh) {
      this.planeMesh = new Mesh()
      this.planeMesh.material = this.displayMaterial
      this.planeMesh.layers.set(layer)
      this.planeMesh.name = Shadowcatcher.MESH_NAME
      this.planeMesh.frustumCulled = false
    }
    if (needsRebuild || force)
      this.updatePlaneMeshGeometry(
        new Vector2(boxSize.x * 2, boxSize.y * 2),
        new Vector3(boxCenter.x, boxCenter.y, boxCenter.z - boxSize.z * 0.5 - 0.001)
      )

    this.planeSize.set(boxSize.x, boxSize.y)
    this.shadowcatcherPass.setLayers([layer])
  }

  private updatePlaneMeshGeometry(size: Vector2, origin: Vector3) {
    if (this.planeMesh.geometry) {
      this.planeMesh.geometry.dispose()
    }
    let subX = 0
    let subY = 0
    const aspect = size.x / size.y
    if (size.x >= size.y) {
      subY = this._config.planeSubdivision
      subX = subY * aspect
    } else {
      subX = this._config.planeSubdivision
      subY = subX / aspect
    }

    const groundPlaneGeometry = new PlaneGeometry(size.x, size.y, subX, subY)
    const colors = new Float32Array(groundPlaneGeometry.attributes.position.count * 3)
    groundPlaneGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    const mat = new Matrix4().makeTranslation(origin.x, origin.y, origin.z)
    groundPlaneGeometry.applyMatrix4(mat)
    this.planeMesh.geometry = groundPlaneGeometry
  }

  private trace(batches: MeshBatch[]) {
    const start = performance.now()
    const sampleCount = this._config.sampleCount
    const maxDist = this._config.maxDist
    const vertices = this.planeMesh.geometry.attributes.position.array
    const colors = this.planeMesh.geometry.attributes.color.array as number[]
    colors.fill(0)
    if (this.debugLines) {
      this.debugLines.parent.remove(this.debugLines)
      this.debugLines.geometry.dispose()
    }
    const linePoints = []
    const lineColors = []
    for (let i = 0; i < batches.length; i++) {
      const invMat = new Matrix4().copy(batches[i].renderObject.matrixWorld)
      invMat.invert()
      for (let k = 0; k < vertices.length; k += 3) {
        for (let d = 0; d < sampleCount; d++) {
          const sample = new Vector3()
          sample.x = Math.random() * 2 - 1
          sample.y = Math.random() * 2 - 1
          sample.z = Math.random()

          sample.normalize()
          const ray = new Ray(
            new Vector3(vertices[k], vertices[k + 1], vertices[k + 2]),
            sample
          )
          ray.applyMatrix4(invMat)

          linePoints.push(new Vector3(vertices[k], vertices[k + 1], vertices[k + 2]))
          linePoints.push(
            new Vector3(vertices[k], vertices[k + 1], vertices[k + 2]).add(
              new Vector3().copy(ray.direction).multiplyScalar(this._config.maxDist)
            )
          )

          const res = batches[i].boundsTree.raycastFirst(ray, DoubleSide)
          if (res && res.distance < maxDist) {
            const contribution = (1 / sampleCount) * 1.5 //(1 - res.distance / maxDist) / sampleCount
            colors[k] += contribution
            colors[k + 1] += contribution
            colors[k + 2] += contribution
            lineColors.push(0, 1, 0, 0, 1, 0)
          } else {
            lineColors.push(1, 0, 0, 1, 0, 0)
          }
        }
      }
    }
    const material = new LineBasicMaterial({
      color: 0xffffff,
      vertexColors: true
    })
    const geometry = new BufferGeometry().setFromPoints(linePoints)
    // geometry.setFromPoints(linePoints)
    geometry.setAttribute('color', new Float32BufferAttribute(lineColors, 3))
    this.debugLines = new LineSegments(geometry, material)
    this.debugLines.layers.set(ObjectLayers.PROPS)
    this.debugLines.visible = false
    this.planeMesh.geometry.attributes.color.needsUpdate = true

    console.warn('Time -> ', performance.now() - start)
  }

  // eslint-disable-next-line camelcase
  public _debug_rawAO() {
    this._debugRawAO = !this._debugRawAO
    this.planeMesh.material = this._debugRawAO
      ? this.generateMaterial
      : this.displayMaterial
  }
}
