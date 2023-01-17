import {
  AddEquation,
  Box3,
  CustomBlending,
  DstAlphaFactor,
  Matrix4,
  MaxEquation,
  Mesh,
  OneFactor,
  Plane,
  PlaneGeometry,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  ZeroFactor
} from 'three'
import { Geometry } from './converter/Geometry'
import SpeckleBasicMaterial from './materials/SpeckleBasicMaterial'
import { ShadowcatcherPass } from './pipeline/ShadowcatcherPass'
import { ObjectLayers } from './SpeckleRenderer'

export interface ShadowcatcherConfig {
  textureSize: number
  weights: { x: number; y: number; z: number; w: number }
  blurRadius: number
  stdDeviation: number
  sigmoidRange: number
  sigmoidStrength: number
}

export const DefaultShadowcatcherConfig: ShadowcatcherConfig = {
  textureSize: 512,
  weights: { x: 1, y: 1, z: 0, w: 1 },
  blurRadius: 16,
  stdDeviation: 4,
  sigmoidRange: 2,
  sigmoidStrength: 2.43
}

export class Shadowcatcher {
  public static readonly MESH_NAME = 'Shadowcatcher'
  public static readonly PLANE_SUBD = 2
  private planeMesh: Mesh = null
  private planeSize: Vector2 = new Vector2()
  private displayMaterial: SpeckleBasicMaterial = null
  public shadowcatcherPass: ShadowcatcherPass = null
  private _config: ShadowcatcherConfig = DefaultShadowcatcherConfig

  public get shadowcatcherMesh() {
    return this.planeMesh
  }

  public set configuration(config: ShadowcatcherConfig) {
    this._config = JSON.parse(JSON.stringify(config))
  }

  public constructor(layer: ObjectLayers, renderlayers: Array<ObjectLayers>) {
    this.shadowcatcherPass = new ShadowcatcherPass()
    this.shadowcatcherPass.setLayers(renderlayers)

    this.displayMaterial = new SpeckleBasicMaterial({ color: 0xffffff }, ['USE_RTE'])
    this.displayMaterial.toneMapped = false
    this.displayMaterial.map = this.shadowcatcherPass.outputTexture
    // this.displayMaterial.map.wrapS = RepeatWrapping
    // this.displayMaterial.map.repeat.x = -1
    this.displayMaterial.map.needsUpdate = true
    this.displayMaterial.toneMapped = false
    this.displayMaterial.transparent = true
    this.displayMaterial.blending = CustomBlending
    this.displayMaterial.blendEquation = AddEquation
    this.displayMaterial.blendEquationAlpha = MaxEquation
    this.displayMaterial.blendSrc = ZeroFactor
    this.displayMaterial.blendSrcAlpha = OneFactor
    this.displayMaterial.blendDst = DstAlphaFactor
    this.displayMaterial.blendDstAlpha = OneFactor
    this.displayMaterial.alphaTest = 0.001

    this.planeMesh = new Mesh()
    this.planeMesh.material = this.displayMaterial
    this.planeMesh.layers.set(layer)
    this.planeMesh.name = Shadowcatcher.MESH_NAME
    this.planeMesh.frustumCulled = false
    // this.planeMesh.renderOrder = layer
  }

  public update(scene: Scene) {
    this.shadowcatcherPass.updateConfig(this._config)
    this.shadowcatcherPass.update(scene)
  }

  public render(renderer: WebGLRenderer) {
    this.shadowcatcherPass.render(renderer, null, null)
  }

  public bake(worldBox: Box3, force?: boolean) {
    this.updatePlaneMesh(worldBox, force)
    const aspect = this.planeSize.x / this.planeSize.y
    const size = new Vector2()
    size.x = Math.trunc(this._config.textureSize)
    size.y = Math.trunc(this._config.textureSize / aspect)
    const planeBox = new Box3().setFromObject(this.planeMesh)
    const worldHeight = worldBox.getSize(new Vector3()).z
    this.shadowcatcherPass.updateCamera(planeBox, 0.001, worldHeight)
    this.shadowcatcherPass.setOutputSize(size.x, size.y)
    this.shadowcatcherPass.setWeights(this._config.weights)
    this.shadowcatcherPass.needsUpdate = true
  }

  public updateClippingPlanes(planes: Plane[]) {
    this.displayMaterial.clippingPlanes = planes
    this.displayMaterial.needsUpdate = true
    this.shadowcatcherPass.updateClippingPlanes(planes)
  }

  private updatePlaneMesh(box: Box3, force?: boolean) {
    const boxSize = box.getSize(new Vector3())
    const boxCenter = box.getCenter(new Vector3())
    const needsRebuild =
      new Vector2(boxSize.x, boxSize.y).distanceTo(this.planeSize) > 0.001

    if (needsRebuild || force)
      this.updatePlaneMeshGeometry(
        new Vector2(boxSize.x * 2, boxSize.y * 2),
        new Vector3(boxCenter.x, boxCenter.y, boxCenter.z - boxSize.z * 0.5 - 0.001)
      )

    this.planeSize.set(boxSize.x, boxSize.y)
  }

  private updatePlaneMeshGeometry(size: Vector2, origin: Vector3) {
    if (this.planeMesh.geometry) {
      this.planeMesh.geometry.dispose()
    }

    const groundPlaneGeometry = new PlaneGeometry(
      size.x,
      size.y,
      Shadowcatcher.PLANE_SUBD,
      Shadowcatcher.PLANE_SUBD
    )
    const mat = new Matrix4().makeTranslation(origin.x, origin.y, origin.z)
    groundPlaneGeometry.applyMatrix4(mat)
    const doublePositions = new Float64Array(
      groundPlaneGeometry.attributes.position.array
    )
    Geometry.updateRTEGeometry(groundPlaneGeometry, doublePositions)
    this.planeMesh.geometry = groundPlaneGeometry
    this.planeMesh.geometry.computeBoundingBox()
  }
}
