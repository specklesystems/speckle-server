import { speckleTextVert } from './shaders/speckle-text-vert.js'
import { speckleTextFrag } from './shaders/speckle-text-frag.js'
import { Vector2, Material, Texture, NearestFilter } from 'three'

import { type Uniforms } from './SpeckleMaterial.js'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { createDerivedMaterial } from 'troika-three-utils'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { createTextDerivedMaterial } from 'troika-three-text'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { uniformToVarying } from 'troika-three-text/src/BatchedText.js'
import SpeckleBasicMaterial from './SpeckleBasicMaterial.js'

class SpeckleTextMaterial extends SpeckleBasicMaterial {
  public setMatrixTexture: (texture: Texture) => void

  protected get vertexProgram(): string {
    return speckleTextVert
  }

  protected get fragmentProgram(): string {
    return speckleTextFrag
  }

  protected get uniformsDef(): Uniforms {
    return { ...super.uniformsDef, gradientRamp: null }
  }

  /** We need a unique key per program */
  public customProgramCacheKey() {
    return this.constructor.name
  }

  protected copyCustomUniforms(material: Material) {
    /** We rebind the uniforms */
    for (const k in this.userData) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      material.uniforms[k] = this.userData[k]
    }
  }
  public getDerivedMaterial() {
    const derived = createTextDerivedMaterial(this)
    this.copyCustomUniforms(derived)
    return derived
  }

  /*
  Data texture packing strategy:

  # Common:
  0-15: matrix
  16-19: uTroikaTotalBounds
  20-23: uTroikaClipRect
  24: diffuse (color/outlineColor)
  25: uTroikaFillOpacity (fillOpacity/outlineOpacity)
  26: uTroikaCurveRadius
  27: <blank>

  # Main:
  28: uTroikaStrokeWidth
  29: uTroikaStrokeColor
  30: uTroikaStrokeOpacity

  # Outline:
  28-29: uTroikaPositionOffset
  30: uTroikaEdgeOffset
  31: uTroikaBlurRadius
  */
  /** Sadly, troika does not export this for no good reason so we neee to copy it over */
  public getDerivedBatchedMaterial() {
    const texUniformName = 'uTroikaMatricesTexture'
    const texSizeUniformName = 'uTroikaMatricesTextureSize'
    const memberIndexAttrName = 'aTroikaTextBatchMemberIndex'
    const floatsPerMember = 32
    // Due to how vertexTransform gets injected, the matrix transforms must happen
    // in the base material of TextDerivedMaterial, but other transforms to its
    // shader must come after, so we sandwich it between two derivations.

    // Transform the vertex position
    let batchMaterial = createDerivedMaterial(this, {
      chained: true,
      uniforms: {
        [texSizeUniformName]: { value: new Vector2() },
        [texUniformName]: { value: null }
      },
      // language=GLSL
      vertexDefs: `
      uniform highp sampler2D ${texUniformName};
      uniform vec2 ${texSizeUniformName};
      attribute float ${memberIndexAttrName};

      vec4 troikaBatchTexel(float offset) {
        offset += ${memberIndexAttrName} * ${floatsPerMember.toFixed(1)} / 4.0;
        float w = ${texSizeUniformName}.x;
        vec2 uv = (vec2(mod(offset, w), floor(offset / w)) + 0.5) / ${texSizeUniformName};
        return texture2D(${texUniformName}, uv);
      }
    `,
      // language=GLSL prefix="void main() {" suffix="}"
      vertexTransform: `
      /** We don't need this. We're transforming ourselves in our shader to allow for RTE*/
      // mat4 matrix = mat4(
      //   troikaBatchTexel(0.0),
      //   troikaBatchTexel(1.0),
      //   troikaBatchTexel(2.0),
      //   troikaBatchTexel(3.0)
      // );
      // position.xyz = (matrix * vec4(position, 1.0)).xyz;
    `
    })

    // Add the text shaders
    batchMaterial = createTextDerivedMaterial(batchMaterial)

    // Now make other changes to the derived text shader code
    batchMaterial = createDerivedMaterial(batchMaterial, {
      chained: true,
      uniforms: {
        uTroikaIsOutline: { value: false }
      },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      customRewriter(shaders) {
        // Convert some text shader uniforms to varyings
        const varyingUniforms = [
          'uTroikaTotalBounds',
          'uTroikaClipRect',
          'uTroikaPositionOffset',
          'uTroikaEdgeOffset',
          'uTroikaBlurRadius',
          'uTroikaStrokeWidth',
          'uTroikaStrokeColor',
          'uTroikaStrokeOpacity',
          'uTroikaFillOpacity',
          'uTroikaCurveRadius',
          'diffuse'
        ]
        varyingUniforms.forEach((uniformName) => {
          shaders = uniformToVarying(shaders, uniformName)
        })
        return shaders
      },
      // language=GLSL
      vertexDefs: `
      uniform bool uTroikaIsOutline;
      vec3 troikaFloatToColor(float v) {
        return mod(floor(vec3(v / 65536.0, v / 256.0, v)), 256.0) / 256.0;
      }
    `,
      // language=GLSL prefix="void main() {" suffix="}"
      vertexTransform: `
      uTroikaTotalBounds = troikaBatchTexel(4.0);
      uTroikaClipRect = troikaBatchTexel(5.0);
      
      vec4 data = troikaBatchTexel(6.0);
      diffuse = troikaFloatToColor(data.x);
      uTroikaFillOpacity = data.y;
      uTroikaCurveRadius = data.z;
      
      data = troikaBatchTexel(7.0);
      if (uTroikaIsOutline) {
        if (data == vec4(0.0)) { // degenerate if zero outline
          position = vec3(0.0);
        } else {
          uTroikaPositionOffset = data.xy;
          uTroikaEdgeOffset = data.z;
          uTroikaBlurRadius = data.w;
        }
      } else {
        uTroikaStrokeWidth = data.x;
        uTroikaStrokeColor = troikaFloatToColor(data.y);
        uTroikaStrokeOpacity = data.z;
      }
    `
    })

    batchMaterial.setMatrixTexture = (texture: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      image: { width: any; height: any }
    }) => {
      batchMaterial.uniforms[texUniformName].value = texture
      batchMaterial.uniforms[texSizeUniformName].value.set(
        texture.image.width,
        texture.image.height
      )
    }
    this.copyCustomUniforms(batchMaterial)
    ;(batchMaterial.defines ??= {})['BATCHED_TEXT'] = ' '
    return batchMaterial
  }

  public fastCopy(from: Material, to: Material) {
    super.fastCopy(from, to)
    to.userData.gradientRamp.value = from.userData.gradientRamp.value
  }

  public setGradientTexture(texture: Texture) {
    this.userData.gradientRamp.value = texture
    this.userData.gradientRamp.value.generateMipmaps = false
    this.userData.gradientRamp.value.minFilter = NearestFilter
    this.userData.gradientRamp.value.magFilter = NearestFilter
    this.needsUpdate = true
  }
}

export default SpeckleTextMaterial

// const matBuff: Matrix4 = new Matrix4()
// const vec2Buff: Vector2 = new Vector2()

// export interface SpeckleTextMaterialParameters extends MeshBasicMaterialParameters {
//   billboardPixelHeight?: number
// }

// export type BillboardingType = 'world' | 'screen'

// class SpeckleTextMaterial extends ExtendedMeshBasicMaterial {
//   private _billboardPixelHeight: number

//   protected get vertexProgram(): string {
//     return speckleTextVert
//   }

//   protected get fragmentProgram(): string {
//     return speckleTextFrag
//   }

//   protected get baseUniforms(): { [uniform: string]: IUniform } {
//     return ShaderLib.basic.uniforms
//   }

//   protected get uniformsDef(): Uniforms {
//     return {
//       uViewer_high: new Vector3(),
//       uViewer_low: new Vector3(),
//       invProjection: new Matrix4(),
//       billboardPixelHeight: 0,
//       screenSize: new Vector2(),
//       gradientRamp: null
//     }
//   }

//   public get billboardPixelHeight() {
//     return this._billboardPixelHeight
//   }

//   public set billboardPixelHeight(value: number) {
//     this._billboardPixelHeight = value
//   }

//   constructor(parameters: SpeckleTextMaterialParameters, defines: Array<string> = []) {
//     super(parameters)
//     this.init(defines)
//   }

//   /** We need a unique key per program */
//   public customProgramCacheKey() {
//     return this.constructor.name
//   }

//   public copy(source: Material) {
//     super.copy(source)
//     this.copyFrom(source)
//     return this
//   }

//   protected copyCustomUniforms(material: Material) {
//     /** We rebind the uniforms */
//     for (const k in this.userData) {
//       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//       //@ts-ignore
//       material.uniforms[k] = this.userData[k]
//     }
//   }
//   public getDerivedMaterial() {
//     const derived = createTextDerivedMaterial(this)
//     this.copyCustomUniforms(derived)
//     return derived
//   }

//   /*
//   Data texture packing strategy:

//   # Common:
//   0-15: matrix
//   16-19: uTroikaTotalBounds
//   20-23: uTroikaClipRect
//   24: diffuse (color/outlineColor)
//   25: uTroikaFillOpacity (fillOpacity/outlineOpacity)
//   26: uTroikaCurveRadius
//   27: <blank>

//   # Main:
//   28: uTroikaStrokeWidth
//   29: uTroikaStrokeColor
//   30: uTroikaStrokeOpacity

//   # Outline:
//   28-29: uTroikaPositionOffset
//   30: uTroikaEdgeOffset
//   31: uTroikaBlurRadius
//   */
//   /** Sadly, troika does not export this for no good reason so we neee to copy it over */
//   public getDerivedBatchedMaterial() {
//     const texUniformName = 'uTroikaMatricesTexture'
//     const texSizeUniformName = 'uTroikaMatricesTextureSize'
//     const memberIndexAttrName = 'aTroikaTextBatchMemberIndex'
//     const floatsPerMember = 32
//     // Due to how vertexTransform gets injected, the matrix transforms must happen
//     // in the base material of TextDerivedMaterial, but other transforms to its
//     // shader must come after, so we sandwich it between two derivations.

//     // Transform the vertex position
//     let batchMaterial = createDerivedMaterial(this, {
//       chained: true,
//       uniforms: {
//         [texSizeUniformName]: { value: new Vector2() },
//         [texUniformName]: { value: null }
//       },
//       // language=GLSL
//       vertexDefs: `
//       uniform highp sampler2D ${texUniformName};
//       uniform vec2 ${texSizeUniformName};
//       attribute float ${memberIndexAttrName};

//       vec4 troikaBatchTexel(float offset) {
//         offset += ${memberIndexAttrName} * ${floatsPerMember.toFixed(1)} / 4.0;
//         float w = ${texSizeUniformName}.x;
//         vec2 uv = (vec2(mod(offset, w), floor(offset / w)) + 0.5) / ${texSizeUniformName};
//         return texture2D(${texUniformName}, uv);
//       }
//     `,
//       // language=GLSL prefix="void main() {" suffix="}"
//       vertexTransform: `
//       /** We don't need this. We're transforming ourselves in our shader to allow for RTE*/
//       // mat4 matrix = mat4(
//       //   troikaBatchTexel(0.0),
//       //   troikaBatchTexel(1.0),
//       //   troikaBatchTexel(2.0),
//       //   troikaBatchTexel(3.0)
//       // );
//       // position.xyz = (matrix * vec4(position, 1.0)).xyz;
//     `
//     })

//     // Add the text shaders
//     batchMaterial = createTextDerivedMaterial(batchMaterial)

//     // Now make other changes to the derived text shader code
//     batchMaterial = createDerivedMaterial(batchMaterial, {
//       chained: true,
//       uniforms: {
//         uTroikaIsOutline: { value: false }
//       },
//       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//       //@ts-ignore
//       customRewriter(shaders) {
//         // Convert some text shader uniforms to varyings
//         const varyingUniforms = [
//           'uTroikaTotalBounds',
//           'uTroikaClipRect',
//           'uTroikaPositionOffset',
//           'uTroikaEdgeOffset',
//           'uTroikaBlurRadius',
//           'uTroikaStrokeWidth',
//           'uTroikaStrokeColor',
//           'uTroikaStrokeOpacity',
//           'uTroikaFillOpacity',
//           'uTroikaCurveRadius',
//           'diffuse'
//         ]
//         varyingUniforms.forEach((uniformName) => {
//           shaders = uniformToVarying(shaders, uniformName)
//         })
//         return shaders
//       },
//       // language=GLSL
//       vertexDefs: `
//       uniform bool uTroikaIsOutline;
//       vec3 troikaFloatToColor(float v) {
//         return mod(floor(vec3(v / 65536.0, v / 256.0, v)), 256.0) / 256.0;
//       }
//     `,
//       // language=GLSL prefix="void main() {" suffix="}"
//       vertexTransform: `
//       uTroikaTotalBounds = troikaBatchTexel(4.0);
//       uTroikaClipRect = troikaBatchTexel(5.0);

//       vec4 data = troikaBatchTexel(6.0);
//       diffuse = troikaFloatToColor(data.x);
//       uTroikaFillOpacity = data.y;
//       uTroikaCurveRadius = data.z;

//       data = troikaBatchTexel(7.0);
//       if (uTroikaIsOutline) {
//         if (data == vec4(0.0)) { // degenerate if zero outline
//           position = vec3(0.0);
//         } else {
//           uTroikaPositionOffset = data.xy;
//           uTroikaEdgeOffset = data.z;
//           uTroikaBlurRadius = data.w;
//         }
//       } else {
//         uTroikaStrokeWidth = data.x;
//         uTroikaStrokeColor = troikaFloatToColor(data.y);
//         uTroikaStrokeOpacity = data.z;
//       }
//     `
//     })

//     batchMaterial.setMatrixTexture = (texture: {
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       image: { width: any; height: any }
//     }) => {
//       batchMaterial.uniforms[texUniformName].value = texture
//       batchMaterial.uniforms[texSizeUniformName].value.set(
//         texture.image.width,
//         texture.image.height
//       )
//     }
//     this.copyCustomUniforms(batchMaterial)
//     ;(batchMaterial.defines ??= {})['BATCHED_TEXT'] = ' '
//     return batchMaterial
//   }

//   public fastCopy(from: Material, to: Material) {
//     super.fastCopy(from, to)
//     const toStandard = to as SpeckleTextMaterial
//     const fromStandard = from as SpeckleTextMaterial
//     toStandard.color.copy(fromStandard.color)
//     toStandard.refractionRatio = fromStandard.refractionRatio
//     to.userData.gradientRamp.value = from.userData.gradientRamp.value
//   }

//   public setGradientTexture(texture: Texture) {
//     this.userData.gradientRamp.value = texture
//     this.userData.gradientRamp.value.generateMipmaps = false
//     this.userData.gradientRamp.value.minFilter = NearestFilter
//     this.userData.gradientRamp.value.magFilter = NearestFilter
//     this.needsUpdate = true
//   }

//   public setBillboarding(type: BillboardingType | null) {
//     /** Create the define object if not there */
//     if (!this.defines) this.defines = {}
//     /** Clear all billboarding defines */
//     delete this.defines['BILLBOARD_SCREEN']
//     delete this.defines['BILLBOARD']

//     if (!type) return

//     if (type === 'world') this.defines['BILLBOARD'] = ' '
//     if (type === 'screen') this.defines['BILLBOARD_SCREEN'] = ' '
//   }

//   /** Called by three.js render loop */
//   public onBeforeRender(
//     _this: SpeckleWebGLRenderer,
//     _scene: Scene,
//     camera: Camera,
//     _geometry: BufferGeometry,
//     _object: Object3D
//   ) {
//     if (
//       this.defines &&
//       (this.defines['BILLBOARD'] || this.defines['BILLBOARD_SCREEN'])
//     ) {
//       matBuff.copy(camera.projectionMatrix).invert()
//       this.userData.invProjection.value.copy(matBuff)
//       this.needsUpdate = true
//     }

//     if (this.defines && this.defines['BILLBOARD_SCREEN']) {
//       this.userData.billboardPixelHeight.value = this.billboardPixelHeight
//       this.userData.screenSize.value.copy(_this.getDrawingBufferSize(vec2Buff))
//       this.needsUpdate = true
//     }

//     if (this.defines && this.defines['USE_RTE']) {
//       _object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
//       this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
//       this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)
//       this.needsUpdate = true
//     }
//   }
// }

// export default SpeckleTextMaterial
