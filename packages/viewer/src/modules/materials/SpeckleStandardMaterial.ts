/* eslint-disable camelcase */
import { speckleStandardVert } from './shaders/speckle-standard-vert.js'
import { speckleStandardFrag } from './shaders/speckle-standard-frag.js'
import {
  ShaderLib,
  Vector3,
  Material,
  type IUniform,
  type MeshStandardMaterialParameters,
  Scene,
  Camera,
  BufferGeometry,
  Object3D,
  Box3
} from 'three'
import { Matrix4 } from 'three'
import { ExtendedMeshStandardMaterial, type Uniforms } from './SpeckleMaterial.js'
import { SpeckleWebGLRenderer } from '../objects/SpeckleWebGLRenderer.js'

class SpeckleStandardMaterial extends ExtendedMeshStandardMaterial {
  protected originalRoughness: number | undefined
  protected artificialRoughness: number | undefined

  protected get vertexProgram(): string {
    return speckleStandardVert
  }

  protected get fragmentProgram(): string {
    return speckleStandardFrag
  }

  protected get baseUniforms(): { [uniform: string]: IUniform } {
    return ShaderLib.standard.uniforms
  }

  private minSnowValue = 0
  private maxSnowValue = 0
  private time = 0
  private lastFrameTime = 0
  private increaseFactor = 500000

  protected get uniformsDef(): Uniforms {
    return {
      uViewer_high: new Vector3(),
      uViewer_low: new Vector3(),
      rteShadowMatrix: new Matrix4(),
      uShadowViewer_high: new Vector3(),
      uShadowViewer_low: new Vector3(),
      uTransforms: [new Matrix4()],
      tTransforms: null,
      objCount: 1,
      height: 1,
      minSnow: this.minSnowValue,
      maxSnow: this.maxSnowValue
    }
  }

  constructor(parameters: MeshStandardMaterialParameters, defines = ['USE_RTE']) {
    super(parameters)
    this.init(defines)
  }

  /** We need a unique key per program */
  public customProgramCacheKey() {
    return this.constructor.name
  }

  public copy(source: Material) {
    super.copy(source)
    this.copyFrom(source)
    if (source instanceof SpeckleStandardMaterial) {
      this.originalRoughness = source.originalRoughness
      this.artificialRoughness = source.artificialRoughness
    }
    return this
  }

  public fastCopy(from: Material, to: Material) {
    super.fastCopy(from, to)
    const toStandard = to as SpeckleStandardMaterial
    const fromStandard = from as SpeckleStandardMaterial
    toStandard.color.copy(fromStandard.color)
    toStandard.roughness = fromStandard.roughness
    toStandard.metalness = fromStandard.metalness
    toStandard.emissive.copy(fromStandard.emissive)
    toStandard.emissiveIntensity = fromStandard.emissiveIntensity
    toStandard.envMap = fromStandard.envMap
    toStandard.envMapIntensity = fromStandard.envMapIntensity
    toStandard.originalRoughness = fromStandard.originalRoughness
    toStandard.artificialRoughness = fromStandard.artificialRoughness

    /** Leaving textures out for now */
    // toStandard.map = fromStandard.map
    // toStandard.lightMap = fromStandard.lightMap
    // toStandard.lightMapIntensity = fromStandard.lightMapIntensity
    // toStandard.aoMap = fromStandard.aoMap
    // toStandard.aoMapIntensity = fromStandard.aoMapIntensity
    // toStandard.emissiveMap = fromStandard.emissiveMap
    // toStandard.bumpMap = fromStandard.bumpMap
    // toStandard.bumpScale = fromStandard.bumpScale
    // toStandard.normalMap = fromStandard.normalMap
    // toStandard.normalMapType = fromStandard.normalMapType
    // toStandard.normalScale = fromStandard.normalScale
    // toStandard.displacementMap = fromStandard.displacementMap
    // toStandard.displacementScale = fromStandard.displacementScale
    // toStandard.displacementBias = fromStandard.displacementBias
    // toStandard.roughnessMap = fromStandard.roughnessMap
    // toStandard.metalnessMap = fromStandard.metalnessMap
    // toStandard.alphaMap = fromStandard.alphaMap
  }

  public updateArtificialRoughness(artificialRougness?: number) {
    if (artificialRougness) {
      if (this.originalRoughness === undefined) this.originalRoughness = this.roughness
      this.artificialRoughness = artificialRougness
    }
    if (this.originalRoughness === undefined || this.artificialRoughness === undefined)
      return

    const applyRoughness =
      artificialRougness !== undefined
        ? Math.min(this.originalRoughness, this.artificialRoughness)
        : this.originalRoughness

    this.roughness = applyRoughness
    this.needsCopy = true
  }

  /** Called by three.js render loop */
  public onBeforeRender(
    _this: SpeckleWebGLRenderer,
    _scene: Scene,
    _camera: Camera,
    _geometry: BufferGeometry,
    object: Object3D
  ) {
    if (this.defines['USE_RTE']) {
      object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
      this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
      this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)

      this.userData.rteShadowMatrix.value.copy(_this.RTEBuffers.rteShadowMatrix)
      this.userData.uShadowViewer_low.value.copy(_this.RTEBuffers.shadowViewerLow)
      this.userData.uShadowViewer_high.value.copy(_this.RTEBuffers.shadowViewerHigh)
      const sceneHeight = new Box3().setFromObject(_scene).getSize(new Vector3())
      this.userData.height.value = sceneHeight.y

      const now = performance.now()
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = now
        return
      }
      const delta = now - this.lastFrameTime
      this.lastFrameTime = now

      this.minSnowValue += 1 / (this.increaseFactor + delta) + 1 / this.increaseFactor
      this.maxSnowValue +=
        1 / (this.increaseFactor * 0.5 + delta) + 1 / (this.increaseFactor * 0.5)

      this.userData.minSnow.value = Math.min(this.minSnowValue, 0.8)
      this.userData.maxSnow.value = Math.min(this.maxSnowValue, 0.9)

      this.increaseFactor -= 1000 - this.increaseFactor / 1000
      this.increaseFactor = Math.max(this.increaseFactor, 5000)
      // console.log(this.minSnowValue, this.maxSnowValue)
      // console.log(this.increaseFactor)
    }

    this.needsUpdate = true
  }
}

export default SpeckleStandardMaterial
