/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleStandardVert } from './shaders/speckle-standard-vert'
import { speckleStandardFrag } from './shaders/speckle-standard-frag'
import {
  UniformsUtils,
  ShaderLib,
  Vector3,
  MeshStandardMaterial,
  Material,
  IUniform,
  Euler
} from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'
import SpeckleMesh from '../objects/SpeckleMesh'
import { ExtendedMeshStandardMaterial, Uniforms } from './SpeckleMaterial'
import Materials from './Materials'

class SpeckleStandardMaterial extends ExtendedMeshStandardMaterial {
  protected static readonly matBuff: Matrix4 = new Matrix4()
  protected static readonly vecBuff0: Vector3 = new Vector3()
  protected static readonly vecBuff1: Vector3 = new Vector3()
  protected static readonly vecBuff2: Vector3 = new Vector3()

  protected get vertexShader(): string {
    return speckleStandardVert
  }

  protected get fragmentShader(): string {
    return speckleStandardFrag
  }

  protected get baseUniforms(): { [uniform: string]: IUniform } {
    return ShaderLib.standard.uniforms
  }

  protected get uniformsDef(): Uniforms {
    return {
      uViewer_high: new Vector3(),
      uViewer_low: new Vector3(),
      rteShadowMatrix: new Matrix4(),
      uShadowViewer_high: new Vector3(),
      uShadowViewer_low: new Vector3(),
      uTransforms: [new Matrix4()],
      tTransforms: null,
      objCount: 1
    }
  }

  constructor(parameters, defines = []) {
    super(parameters)
    this.init(defines)
  }

  /** We need a unique key per program */
  public customProgramCacheKey() {
    return this.constructor.name
  }

  public copy(source) {
    super.copy(source)
    this.copyFrom(source)
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
    toStandard.refractionRatio = fromStandard.refractionRatio

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

  /** Called by three.js render loop */
  public onBeforeRender(_this, scene, camera, geometry, object, group) {
    SpeckleStandardMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleStandardMaterial.matBuff.elements[12] = 0
    SpeckleStandardMaterial.matBuff.elements[13] = 0
    SpeckleStandardMaterial.matBuff.elements[14] = 0
    object.modelViewMatrix.copy(SpeckleStandardMaterial.matBuff)

    SpeckleStandardMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleStandardMaterial.vecBuff0,
      SpeckleStandardMaterial.vecBuff1,
      SpeckleStandardMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpeckleStandardMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleStandardMaterial.vecBuff2)

    if (object instanceof SpeckleMesh)
      (object as SpeckleMesh).updateMaterialTransformsUniform(this)

    this.needsUpdate = true
  }
}

export default SpeckleStandardMaterial
