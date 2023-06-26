/* eslint-disable camelcase */
import {
  IUniform,
  Material,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshNormalMaterial,
  MeshStandardMaterial,
  UniformsUtils
} from 'three'

class SpeckleUserData {
  toJSON() {
    return {}
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Uniforms = Record<string, any>

export class SpeckleMaterial {
  protected _internalUniforms

  protected get vertexShader(): string {
    return ''
  }

  protected get fragmentShader(): string {
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

  protected init(defines = []) {
    this['userData'] = new SpeckleUserData()
    this.setUniforms(this.uniformsDef)
    this.setDefines(defines)
    this['onBeforeCompile'] = this.onCompile
  }

  protected setUniforms(def: Uniforms) {
    for (const k in def) {
      this['userData'][k] = {
        value: def[k]
      }
    }
    this['uniforms'] = UniformsUtils.merge([this.baseUniforms, this['userData']])
  }

  protected setDefines(defines = []) {
    if (defines) {
      this['defines'] = {}
      for (let k = 0; k < defines.length; k++) {
        this['defines'][defines[k]] = ' '
      }
    }
  }

  protected copyUniforms(material: Material) {
    for (const k in material.userData) {
      if (this['userData'][k] !== undefined)
        this['userData'][k].value = material.userData[k].value
    }
  }

  protected bindUniforms() {
    if (!this._internalUniforms) return

    for (const k in this.uniformsDef) {
      this._internalUniforms.uniforms[k] = this['userData'][k]
    }
  }

  protected copyFrom(source) {
    this['userData'] = new SpeckleUserData()
    this.setUniforms(this.uniformsDef)
    this.copyUniforms(source)
    this.bindUniforms()
    Object.assign(this['defines'], source.defines)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onCompile(shader, renderer) {
    this._internalUniforms = shader
    this.bindUniforms()
    shader.vertexShader = this.vertexShader
    shader.fragmentShader = this.fragmentShader
  }
}

export class ExtendedMeshStandardMaterial extends MeshStandardMaterial {}
export class ExtendedMeshBasicMaterial extends MeshBasicMaterial {}
export class ExtendedMeshDepthMaterial extends MeshDepthMaterial {}
export class ExtendedMeshNormalMaterial extends MeshNormalMaterial {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtendedMeshStandardMaterial extends SpeckleMaterial {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtendedMeshBasicMaterial extends SpeckleMaterial {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtendedMeshDepthMaterial extends SpeckleMaterial {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtendedMeshNormalMaterial extends SpeckleMaterial {}

applyMixins(ExtendedMeshStandardMaterial, [SpeckleMaterial])
applyMixins(ExtendedMeshBasicMaterial, [SpeckleMaterial])
applyMixins(ExtendedMeshDepthMaterial, [SpeckleMaterial])
applyMixins(ExtendedMeshNormalMaterial, [SpeckleMaterial])

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
