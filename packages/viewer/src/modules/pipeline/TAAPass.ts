import {
  LinearFilter,
  NoBlending,
  ShaderMaterial,
  Texture,
  UniformsUtils,
  WebGLRenderTarget,
  WebGLRenderer
} from 'three'
import { BaseSpecklePass, type SpecklePass } from './SpecklePass.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

export class TAAPass extends BaseSpecklePass implements SpecklePass {
  private inputTex: Texture
  private reprojectionRT0: WebGLRenderTarget
  private reprojectionRT1: WebGLRenderTarget
  private renderTarget: WebGLRenderTarget
  private fsQuad: FullScreenQuad

  private materialCopy: ShaderMaterial
  private reprojectionMaterial: ShaderMaterial

  public firstRun: boolean = true
  public onBeforeRender: (() => void) | undefined = undefined
  public onAfterRender: (() => void) | undefined = undefined

  constructor() {
    super()

    this.renderTarget = new WebGLRenderTarget(256, 256, {
      minFilter: LinearFilter,
      magFilter: LinearFilter
    })
    this.reprojectionRT0 = new WebGLRenderTarget(256, 256, {
      minFilter: LinearFilter,
      magFilter: LinearFilter
    })
    this.reprojectionRT1 = new WebGLRenderTarget(256, 256, {
      minFilter: LinearFilter,
      magFilter: LinearFilter
    })

    this.materialCopy = new ShaderMaterial({
      uniforms: UniformsUtils.clone(CopyShader.uniforms),
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader,
      blending: NoBlending
    })

    this.materialCopy.needsUpdate = true

    this.reprojectionMaterial = new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tLastFrame: { value: null },
        width: { value: 0 },
        height: { value: 0 }
      },
      transparent: true,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,

      vertexShader: `
                varying vec2 Uv;
                void main() {
                    Uv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }`,

      fragmentShader: `
                uniform float height;
                uniform float width;
                uniform sampler2D tDiffuse;
                // uniform sampler2D tMotion;
                uniform sampler2D tLastFrame;
                varying vec2 Uv;

                #define LuminanceEncodeApprox vec3(0.2126, 0.7152, 0.0722)
                float getLuminance(vec3 color) {
                    return clamp(dot(color, LuminanceEncodeApprox), 0., 1.);
                }
                

                void main() {
                    vec4 texel = texture2D(tDiffuse, Uv);
                    // vec4 pixelMovement = texture2D(tMotion, Uv);
                    vec2 oldPixelUv = Uv;// - ((pixelMovement.xy * 2.0) - 1.0);
                    vec4 oldTexel = texture2D(tLastFrame, oldPixelUv);
                    // Use simple neighbor clamping
                    vec4 maxNeighbor = vec4(0.0, 0.0, 0.0, 1.0);
                    vec4 minNeighbor = vec4(1.0);
                    vec4 average = vec4(0.0);
                    for (int x = -1; x <= 1; x++) {
                        for (int y = -1; y <= 1; y++) {
                            vec2 neighborUv = Uv + vec2(float(x) / width, float(y) / height);
                            vec4 neighborTexel = texture2D(tDiffuse, neighborUv);
                            maxNeighbor = max(maxNeighbor, neighborTexel);
                            minNeighbor = min(minNeighbor, neighborTexel);
                            average += neighborTexel / 9.0;
                        }
                    }
                float lum0 = getLuminance(texel.rgb);
                float lum1 = getLuminance(oldTexel.rgb);
            
                float unbiased_diff = abs(lum0 - lum1) / max(lum0, max(lum1, 0.2));
                float unbiased_weight = 1.0 - unbiased_diff;
                float unbiased_weight_sqr = unbiased_weight * unbiased_weight;
                float k_feedback = mix(0.8800, 0.9700, unbiased_weight_sqr);
                
                // UE Method to get rid of flickering. Weight frame mixing amount
                // based on local contrast.
                float contrast = distance(average, texel);
                float weight = 0.05 * contrast;
            
                // float combineMotionBlend = max(motionSample.w, motionBlendFactor);
                float blendFactor = mix(1. - weight, k_feedback, 1.);
                vec4 compositeColor = mix(texel, oldTexel, blendFactor);
                
                 gl_FragColor = compositeColor;
                }`
    })
    this.reprojectionMaterial.needsUpdate = true

    this.fsQuad = new FullScreenQuad()
  }

  public get displayName(): string {
    return 'TAA'
  }

  public set inputTexture(texture: Texture) {
    this.inputTex = texture
  }

  public get outputTexture(): Texture {
    return this.reprojectionRT1.texture
  }

  render(renderer: WebGLRenderer) {
    if (this.firstRun) {
      renderer.setRenderTarget(this.reprojectionRT1)
      renderer.clear()
      this.materialCopy.uniforms['tDiffuse'].value = this.inputTex
      this.materialCopy.needsUpdate = true
      this.fsQuad.material = this.materialCopy
      this.fsQuad.render(renderer)
      this.firstRun = false
    }

    // renderer.setClearColor(0xffffff)
    renderer.setRenderTarget(this.reprojectionRT0)
    renderer.clear()
    this.reprojectionMaterial.uniforms['tLastFrame'].value =
      this.reprojectionRT1.texture
    this.reprojectionMaterial.uniforms['tDiffuse'].value = this.inputTex
    this.reprojectionMaterial.needsUpdate = true
    this.fsQuad.material = this.reprojectionMaterial
    this.fsQuad.render(renderer)

    renderer.setRenderTarget(this.reprojectionRT1)
    renderer.clear()
    this.materialCopy.uniforms['tDiffuse'].value = this.reprojectionRT0.texture
    this.materialCopy.needsUpdate = true
    this.fsQuad.material = this.materialCopy
    this.fsQuad.render(renderer)
  }

  public setSize(width: number, height: number) {
    this.renderTarget.setSize(width, height)
    this.reprojectionRT0.setSize(width, height)
    this.reprojectionRT1.setSize(width, height)
    this.reprojectionMaterial.uniforms['width'].value = width
    this.reprojectionMaterial.uniforms['height'].value = height
  }

  /**
   * Generate a number in the Halton Sequence at a given index. This is
   * shamelessly stolen from the pseudocode on the Wikipedia page
   *
   * @param base the base to use for the Halton Sequence
   * @param index the index into the sequence
   */
  haltonNumber(base: number, index: number) {
    let result = 0
    let f = 1
    while (index > 0) {
      f /= base
      result += f * (index % base)
      index = Math.floor(index / base)
    }

    return result
  }

  generateHaltonJiters(length: number) {
    const jitters = []

    for (let i = 1; i <= length; i++)
      jitters.push([
        (this.haltonNumber(2, i) - 0.5) * 2,
        (this.haltonNumber(3, i) - 0.5) * 2
      ])

    return jitters
  }
}
