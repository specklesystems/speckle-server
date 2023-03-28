/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
import { speckleDepthVert } from './shaders/speckle-depth-vert'
import { speckleDepthFrag } from './shaders/speckle-depth-frag'
import { UniformsUtils, ShaderLib, Vector3, MeshDepthMaterial, Material } from 'three'
import { Matrix4 } from 'three'
import { Geometry } from '../converter/Geometry'
import SpeckleMesh from '../objects/SpeckleMesh'
import { Uniforms } from './SpeckleStandardMaterial'

class SpeckleDepthMaterial extends MeshDepthMaterial {
  private static readonly matBuff: Matrix4 = new Matrix4()
  private static readonly vecBuff0: Vector3 = new Vector3()
  private static readonly vecBuff1: Vector3 = new Vector3()
  private static readonly vecBuff2: Vector3 = new Vector3()
  private _internalUniforms = null

  protected get vertexShader(): string {
    return speckleDepthVert
  }

  protected get fragmentShader(): string {
    return speckleDepthFrag
  }

  protected get uniformsDef(): Uniforms {
    return {
      uViewer_high: new Vector3(),
      uViewer_low: new Vector3(),
      rteModelViewMatrix: new Matrix4(),
      near: 0,
      far: 0,
      uTransforms: [new Matrix4()],
      tTransforms: null,
      objCount: 1
    }
  }

  constructor(parameters, defines = []) {
    super(parameters)

    this.setUniforms(this.uniformsDef)

    if (defines) {
      this.defines = {}
      for (let k = 0; k < defines.length; k++) {
        this.defines[defines[k]] = ' '
      }
    }

    this.onBeforeCompile = this.onCompile
  }

  protected setUniforms(def: Uniforms) {
    for (const k in def) {
      this.userData[k] = {
        value: def[k]
      }
    }
    this['uniforms'] = UniformsUtils.merge([ShaderLib.depth.uniforms, this.userData])
  }

  protected copyUniforms(material: Material) {
    for (const k in material.userData) {
      if (this.userData[k] !== undefined)
        this.userData[k].value = material.userData[k].value
    }
  }

  protected bindUniforms() {
    if (!this._internalUniforms) return

    for (const k in this.uniformsDef) {
      this._internalUniforms.uniforms[k] = this.userData[k]
    }
  }

  protected onCompile(shader, renderer) {
    this._internalUniforms = shader

    this.bindUniforms()
    shader.vertexShader = this.vertexShader
    shader.fragmentShader = this.fragmentShader
  }

  /** We need a unique key per program */
  public customProgramCacheKey() {
    /** Bruh... */
    // return this.onBeforeCompile.toString()
    return this.constructor.name
  }

  public copy(source) {
    super.copy(source)
    this.copyUniforms(source)

    this.defines = {}
    Object.assign(this.defines, source.defines)
    /** We need to bind the uniforms here, otherwise three.js fucks up and sporadically doesn't update our uniforms! */
    this.bindUniforms()

    return this
  }

  /** Another note here, this will NOT get called by three when rendering shadowmaps. We update the uniforms manually
   * inside SpeckleRenderer for shadowmaps
   */
  onBeforeRender(_this, scene, camera, geometry, object, group) {
    SpeckleDepthMaterial.matBuff.copy(camera.matrixWorldInverse)
    SpeckleDepthMaterial.matBuff.elements[12] = 0
    SpeckleDepthMaterial.matBuff.elements[13] = 0
    SpeckleDepthMaterial.matBuff.elements[14] = 0
    SpeckleDepthMaterial.matBuff.multiply(object.matrixWorld)
    object.modelViewMatrix.copy(SpeckleDepthMaterial.matBuff)

    SpeckleDepthMaterial.vecBuff0.set(
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[13],
      camera.matrixWorld.elements[14]
    )

    Geometry.DoubleToHighLowVector(
      SpeckleDepthMaterial.vecBuff0,
      SpeckleDepthMaterial.vecBuff1,
      SpeckleDepthMaterial.vecBuff2
    )

    this.userData.uViewer_low.value.copy(SpeckleDepthMaterial.vecBuff1)
    this.userData.uViewer_high.value.copy(SpeckleDepthMaterial.vecBuff2)
    this.userData.rteModelViewMatrix.value.copy(object.modelViewMatrix)
    if (object instanceof SpeckleMesh) {
      ;(object as SpeckleMesh).updateMaterialTransformsUniform(this)
    }

    // console.log(this.userData.rteModelViewMatrix.value)

    /** Not a big fan of this, but otherwise three.js won't update
     *  our uniforms when the material is used the scene's override
     */
    // if (scene.overrideMaterial === this) {
    //   const materialProperties = _this.properties.get(this)
    //   const program = materialProperties.currentProgram
    //   if (program) {
    //     // _this.getContext().useProgram(program.program)
    //     const p_uniforms = program.getUniforms()
    //     _this
    //       .getContext()
    //       .uniformMatrix4fv(
    //         p_uniforms.map['rteModelViewMatrix'].addr,
    //         false,
    //         this.userData.rteModelViewMatrix.value.elements
    //       )

    //     if (p_uniforms.map['objCount'])
    //       _this
    //         .getContext()
    //         .uniform1f(p_uniforms.map['objCount'].addr, this.userData.objCount.value)

    //     const textureProperties = _this.properties.get(this.userData.tTransforms.value)
    //     const gl = _this.getContext()

    //     gl.uniform1i(
    //       p_uniforms.map['tTransforms'].addr,
    //       p_uniforms.map['tTransforms'].cache
    //     )
    //     // gl.activeTexture(p_uniforms.map['tTransforms'].cache)
    //     gl.bindTexture(gl.TEXTURE_2D, textureProperties.__webglTexture)
    //   }
    // }

    this.needsUpdate = true
  }
}

export default SpeckleDepthMaterial
