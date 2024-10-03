/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import {
  AlwaysStencilFunc,
  type IUniform,
  Material,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshNormalMaterial,
  MeshStandardMaterial,
  PointsMaterial,
  ReplaceStencilOp,
  UniformsUtils,
  type Shader,
  MeshMatcapMaterial
} from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { StencilOutlineType } from '../../IViewer.js'
import { type MaterialOptions } from './MaterialOptions.js'

class SpeckleUserData {
  [k: string]: unknown
  toJSON() {
    return {}
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Uniforms = Record<string, any>

export class SpeckleMaterial {
  protected _internalUniforms!: Shader
  protected _stencilOutline: StencilOutlineType = StencilOutlineType.NONE
  public needsCopy: boolean = false

  protected get speckleUserData(): SpeckleUserData {
    return (this as unknown as Material).userData
  }

  protected set speckleUserData(value: SpeckleUserData) {
    ;(this as unknown as Material).userData = value
  }

  protected get speckleDefines(): Record<string, unknown> | undefined {
    return (this as unknown as Material).defines
  }

  protected set speckleDefines(value: Record<string, unknown> | undefined) {
    ;(this as unknown as Material).defines = value
  }

  protected get vertexProgram(): string {
    return ''
  }

  protected get fragmentProgram(): string {
    return ''
  }

  protected get uniformsDef(): Uniforms {
    return {
      empty: 'empty'
    }
  }

  protected get baseUniforms(): { [uniform: string]: IUniform } {
    return {
      emptyBase: { value: 'emptyBase' }
    }
  }

  protected set stencilOutline(value: StencilOutlineType) {
    this._stencilOutline = value
    const thisAsMaterial: Material = this as unknown as Material
    thisAsMaterial.stencilWrite = value === StencilOutlineType.NONE ? false : true
    if (thisAsMaterial.stencilWrite) {
      thisAsMaterial.stencilWriteMask = 0xff
      thisAsMaterial.stencilRef = 0x00
      thisAsMaterial.stencilFunc = AlwaysStencilFunc
      thisAsMaterial.stencilZFail = ReplaceStencilOp
      thisAsMaterial.stencilZPass = ReplaceStencilOp
      thisAsMaterial.stencilFail = ReplaceStencilOp
      if (value === StencilOutlineType.OUTLINE_ONLY) {
        thisAsMaterial.colorWrite = false
        thisAsMaterial.depthWrite = false
        thisAsMaterial.stencilWrite = true
      }
    }
  }

  protected set pointSize(value: number) {
    ;(this as unknown as PointsMaterial).size = value
  }

  protected init(defines: Array<string> = []) {
    this.speckleUserData = new SpeckleUserData()
    this.setUniforms(this.uniformsDef)
    this.setDefines(defines)
    ;(this as unknown as Material)['onBeforeCompile'] = this.onCompile
  }

  protected setUniforms(def: Uniforms) {
    for (const k in def) {
      this.speckleUserData[k] = {
        value: def[k]
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this as any)['uniforms'] = UniformsUtils.merge([
      this.baseUniforms,
      this.speckleUserData
    ])
  }

  protected setDefines(defines: Array<string> = []) {
    if (defines) {
      this.speckleDefines = {}
      for (let k = 0; k < defines.length; k++) {
        this.speckleDefines[defines[k]] = ' '
      }
    }
  }

  protected copyUniforms(material: Material) {
    for (const k in material.userData) {
      if (this.speckleUserData[k] !== undefined)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.speckleUserData[k] as any).value = material.userData[k].value
    }
  }

  protected bindUniforms() {
    if (!this._internalUniforms) return

    for (const k in this.uniformsDef) {
      this._internalUniforms.uniforms[k] = this.speckleUserData[k] as IUniform
    }
  }

  protected copyFrom(source: Material) {
    this.speckleUserData = new SpeckleUserData()
    this.setUniforms(this.uniformsDef)
    this.copyUniforms(source)
    this.bindUniforms()
    Object.assign(this.speckleDefines as object, source.defines)
    if ((source as unknown as SpeckleMaterial).needsCopy)
      this.needsCopy = (source as unknown as SpeckleMaterial).needsCopy
  }

  protected onCompile(shader: Shader) {
    this._internalUniforms = shader
    this.bindUniforms()
    shader.vertexShader = this.vertexProgram
    shader.fragmentShader = this.fragmentProgram
  }

  public fastCopy(from: Material, to: Material) {
    to.alphaTest = from.alphaTest
    to.alphaToCoverage = from.alphaToCoverage
    to.blendDst = from.blendDst
    to.blendDstAlpha = from.blendDstAlpha
    to.blendEquation = from.blendEquation
    to.blendEquationAlpha = from.blendEquationAlpha
    to.blending = from.blending
    to.blendSrc = from.blendSrc
    to.blendSrcAlpha = from.blendSrcAlpha
    to.clipIntersection = from.clipIntersection
    to.clippingPlanes = from.clippingPlanes
    to.clipShadows = from.clipShadows
    to.colorWrite = from.colorWrite
    Object.assign(to.defines as object, from.defines)
    to.depthFunc = from.depthFunc
    to.depthTest = from.depthTest
    to.depthWrite = from.depthWrite
    to.stencilWrite = from.stencilWrite
    to.stencilFunc = from.stencilFunc
    to.stencilRef = from.stencilRef
    to.stencilWriteMask = from.stencilWriteMask
    to.stencilFuncMask = from.stencilFuncMask
    to.stencilFail = from.stencilFail
    to.stencilZFail = from.stencilZFail
    to.stencilZPass = from.stencilZPass
    to.opacity = from.opacity
    to.polygonOffset = from.polygonOffset
    to.polygonOffsetFactor = from.polygonOffsetFactor
    to.polygonOffsetUnits = from.polygonOffsetUnits
    to.premultipliedAlpha = from.premultipliedAlpha
    to.dithering = from.dithering
    to.side = from.side
    to.shadowSide = from.shadowSide
    to.toneMapped = from.toneMapped
    to.transparent = from.transparent
    to.vertexColors = from.vertexColors
    to.visible = from.visible
  }

  public setMaterialOptions(options: MaterialOptions) {
    this.stencilOutline = options.stencilOutlines || StencilOutlineType.NONE
    this.pointSize = options.pointSize || 1
  }
}

export class ExtendedMeshStandardMaterial extends MeshStandardMaterial {}
export class ExtendedMeshBasicMaterial extends MeshBasicMaterial {}
export class ExtendedMeshDepthMaterial extends MeshDepthMaterial {}
export class ExtendedMeshNormalMaterial extends MeshNormalMaterial {}
export class ExtendedMatcapMaterial extends MeshMatcapMaterial {}
export class ExtendedLineMaterial extends LineMaterial {}
export class ExtendedPointsMaterial extends PointsMaterial {}

export interface ExtendedMeshStandardMaterial extends SpeckleMaterial {}

export interface ExtendedMeshBasicMaterial extends SpeckleMaterial {}

export interface ExtendedMeshDepthMaterial extends SpeckleMaterial {}

export interface ExtendedMeshNormalMaterial extends SpeckleMaterial {}

export interface ExtendedMatcapMaterial extends SpeckleMaterial {}

export interface ExtendedLineMaterial extends SpeckleMaterial {}

export interface ExtendedPointsMaterial extends SpeckleMaterial {}

applyMixins(ExtendedMeshStandardMaterial, [SpeckleMaterial])
applyMixins(ExtendedMeshBasicMaterial, [SpeckleMaterial])
applyMixins(ExtendedMeshDepthMaterial, [SpeckleMaterial])
applyMixins(ExtendedMeshNormalMaterial, [SpeckleMaterial])
applyMixins(ExtendedMatcapMaterial, [SpeckleMaterial])
applyMixins(ExtendedLineMaterial, [SpeckleMaterial])
applyMixins(ExtendedPointsMaterial, [SpeckleMaterial])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
      )
    })
  })
}
