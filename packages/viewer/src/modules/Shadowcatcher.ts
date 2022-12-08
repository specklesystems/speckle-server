import {
  Box3,
  DoubleSide,
  Float32BufferAttribute,
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

export interface ShadowcatcherConfig {
  planeSubdivision: number
  sampleCount: number
  textureSize: number
  blurRadius: number
}

export const DefaultShadowcatcherConfig: ShadowcatcherConfig = {
  planeSubdivision: 10,
  sampleCount: 100,
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
      this.planeMesh.material = this.displayMaterial
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
        new Vector3(boxCenter.x, boxCenter.y, boxCenter.z - boxSize.z * 0.5 - 0.01)
      )

    this.planeSize.set(boxSize.x, boxSize.y)
    this.shadowcatcherPass.setLayers([layer])
  }

  public updatePlaneMeshGeometry(size: Vector2, origin: Vector3) {
    if (this.planeMesh.geometry) {
      this.planeMesh.geometry.dispose()
    }
    const aspect = size.x / size.y
    const groundPlaneGeometry = new PlaneGeometry(
      size.x,
      size.y,
      this._config.planeSubdivision,
      this._config.planeSubdivision / aspect
    )
    const colors = new Float32Array(groundPlaneGeometry.attributes.position.count * 3)
    groundPlaneGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    const mat = new Matrix4().makeTranslation(origin.x, origin.y, origin.z)
    groundPlaneGeometry.applyMatrix4(mat)
    this.planeMesh.geometry = groundPlaneGeometry
  }

  private trace(batches: MeshBatch[]) {
    const start = performance.now()
    const sampleCount = this._config.sampleCount
    const maxDist = 2
    const vertices = this.planeMesh.geometry.attributes.position.array
    const colors = this.planeMesh.geometry.attributes.color.array as number[]
    colors.fill(0)
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
          const res = batches[i].boundsTree.raycastFirst(ray, DoubleSide)
          if (res && res.distance < maxDist) {
            const contribution = (1 - res.distance / maxDist) / sampleCount
            colors[k] += contribution
            colors[k + 1] += contribution
            colors[k + 2] += contribution
          }
        }
      }
    }
    this.planeMesh.geometry.attributes.color.needsUpdate = true

    console.warn('Time -> ', performance.now() - start)
  }
}
