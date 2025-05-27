/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { speckleTextVert } from './shaders/speckle-text-vert.js'
import { speckleTextFrag } from './shaders/speckle-text-frag.js'
import {
  ShaderLib,
  Vector3,
  type IUniform,
  Vector2,
  Material,
  type MeshBasicMaterialParameters,
  Scene,
  Camera,
  BufferGeometry,
  Object3D
} from 'three'
import { Matrix4 } from 'three'

import { ExtendedMeshBasicMaterial, type Uniforms } from './SpeckleMaterial.js'
import type { SpeckleWebGLRenderer } from '../objects/SpeckleWebGLRenderer.js'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { createDerivedMaterial } from 'troika-three-utils'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { createTextDerivedMaterial } from 'troika-three-text'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import { uniformToVarying } from 'troika-three-text/src/BatchedText.js'

class SpeckleTextMaterial extends ExtendedMeshBasicMaterial {
  protected static readonly matBuff: Matrix4 = new Matrix4()
  protected static readonly vecBuff: Vector2 = new Vector2()

  private _billboardPixelHeight: number

  protected get vertexProgram(): string {
    return speckleTextVert
  }

  protected get fragmentProgram(): string {
    return speckleTextFrag
  }

  protected get baseUniforms(): { [uniform: string]: IUniform } {
    return ShaderLib.basic.uniforms
  }

  protected get uniformsDef(): Uniforms {
    return {
      uViewer_high: new Vector3(),
      uViewer_low: new Vector3(),
      uTransforms: [new Matrix4()],
      tTransforms: null,
      objCount: 1,
      billboardPos: new Vector3(),
      billboardSize: new Vector2(),
      invProjection: new Matrix4()
    }
  }

  public set billboardPixelHeight(value: number) {
    this._billboardPixelHeight = value
  }

  public get billboardPixelHeight() {
    return this._billboardPixelHeight
  }

  constructor(parameters: MeshBasicMaterialParameters, defines: Array<string> = []) {
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
    return this
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
      mat4 matrix = mat4(
        troikaBatchTexel(0.0),
        troikaBatchTexel(1.0),
        troikaBatchTexel(2.0),
        troikaBatchTexel(3.0)
      );
      position.xyz = (matrix * vec4(position, 1.0)).xyz;
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
    return batchMaterial
  }

  public fastCopy(from: Material, to: Material) {
    super.fastCopy(from, to)
    const toStandard = to as SpeckleTextMaterial
    const fromStandard = from as SpeckleTextMaterial
    toStandard.color.copy(fromStandard.color)
    toStandard.refractionRatio = fromStandard.refractionRatio
    to.userData.billboardPos.value.copy(from.userData.billboardPos.value)
  }

  /** Called by three.js render loop */
  public onBeforeRender(
    _this: SpeckleWebGLRenderer,
    _scene: Scene,
    camera: Camera,
    _geometry: BufferGeometry,
    _object: Object3D
  ) {
    if (this.defines && this.defines['BILLBOARD_FIXED']) {
      const resolution = _this.getDrawingBufferSize(SpeckleTextMaterial.vecBuff)
      SpeckleTextMaterial.vecBuff.set(
        (this._billboardPixelHeight / resolution.x) * 2,
        (this._billboardPixelHeight / resolution.y) * 2
      )
      this.userData.billboardSize.value.copy(SpeckleTextMaterial.vecBuff)
      SpeckleTextMaterial.matBuff.copy(camera.projectionMatrix).invert()
      this.userData.invProjection.value.copy(SpeckleTextMaterial.matBuff)
    }
    /** TO ENABLE */
    // object.modelViewMatrix.copy(_this.RTEBuffers.rteViewModelMatrix)
    // this.userData.uViewer_low.value.copy(_this.RTEBuffers.viewerLow)
    // this.userData.uViewer_high.value.copy(_this.RTEBuffers.viewerHigh)
    this.needsUpdate = true
  }
}

export default SpeckleTextMaterial
