/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  BufferAttribute,
  BufferGeometry,
  CubeUVReflectionMapping,
  FloatType,
  LinearEncoding,
  LinearFilter,
  Matrix4,
  NoBlending,
  PMREMGenerator,
  RGBAFormat,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
  WebGLRenderTargetOptions
} from 'three'

const MAX_SAMPLES = 20
const LOD_MIN = 4
const EXTRA_LOD_SIGMA = [0.125, 0.215, 0.35, 0.446, 0.526, 0.582]

export class RotatablePMREMGenerator extends PMREMGenerator {
  constructor(renderer: WebGLRenderer) {
    super(renderer)
  }

  _allocateTargets() {
    //@ts-ignore
    const width = 3 * Math.max(this._cubeSize, 16 * 7)
    //@ts-ignore
    const height = 4 * this._cubeSize

    const params = {
      magFilter: LinearFilter,
      minFilter: LinearFilter,
      generateMipmaps: false,
      type: FloatType,
      format: RGBAFormat,
      encoding: LinearEncoding,
      depthBuffer: false
    }
    //@ts-ignore
    const cubeUVRenderTarget = this._createRenderTarget(width, height, params)

    if (
      //@ts-ignore
      this._pingPongRenderTarget === null ||
      //@ts-ignore
      this._pingPongRenderTarget.width !== width
    ) {
      //@ts-ignore
      if (this._pingPongRenderTarget !== null) {
        //@ts-ignore
        this._dispose()
      }
      //@ts-ignore
      this._pingPongRenderTarget = this._createRenderTarget(width, height, params)
      //@ts-ignore
      const { _lodMax } = this
      ;({
        //@ts-ignore
        sizeLods: this._sizeLods,
        //@ts-ignore
        lodPlanes: this._lodPlanes,
        //@ts-ignore
        sigmas: this._sigmas
        //@ts-ignore
      } = this._createPlanes(_lodMax))
      //@ts-ignore
      this._blurMaterial = this._getBlurShader(_lodMax, width, height)
    }

    return cubeUVRenderTarget
  }

  public _createRenderTarget(
    width: number,
    height: number,
    params: WebGLRenderTargetOptions
  ) {
    const cubeUVRenderTarget = new WebGLRenderTarget(width, height, params)
    cubeUVRenderTarget.texture.mapping = CubeUVReflectionMapping
    cubeUVRenderTarget.texture.name = 'PMREM.cubeUv'
    cubeUVRenderTarget.scissorTest = true
    return cubeUVRenderTarget
  }

  public _getBlurShader(lodMax: number, width: number, height: number) {
    const weights = new Float32Array(MAX_SAMPLES)
    const poleAxis = new Vector3(0, 1, 0)
    const shaderMaterial = new ShaderMaterial({
      name: 'SphericalGaussianBlur',

      defines: {
        n: MAX_SAMPLES,
        CUBEUV_TEXEL_WIDTH: 1.0 / width,
        CUBEUV_TEXEL_HEIGHT: 1.0 / height,
        CUBEUV_MAX_MIP: `${lodMax}.0`
      },

      uniforms: {
        envMap: { value: null },
        samples: { value: 1 },
        weights: { value: weights },
        latitudinal: { value: false },
        dTheta: { value: 0 },
        mipInt: { value: 0 },
        poleAxis: { value: poleAxis }
      },

      vertexShader: this._getCommonVertexShader(),

      fragmentShader: /* glsl */ `

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,

      blending: NoBlending,
      depthTest: false,
      depthWrite: false
    })

    return shaderMaterial
  }

  public _getCommonVertexShader() {
    return /* glsl */ `

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`
  }

  public _createPlanes(lodMax: number) {
    const lodPlanes = []
    const sizeLods = []
    const sigmas = []

    let lod = lodMax

    const totalLods = lodMax - LOD_MIN + 1 + EXTRA_LOD_SIGMA.length

    for (let i = 0; i < totalLods; i++) {
      const sizeLod = Math.pow(2, lod)
      sizeLods.push(sizeLod)
      let sigma = 1.0 / sizeLod

      if (i > lodMax - LOD_MIN) {
        sigma = EXTRA_LOD_SIGMA[i - lodMax + LOD_MIN - 1]
      } else if (i === 0) {
        sigma = 0
      }

      sigmas.push(sigma)

      const texelSize = 1.0 / (sizeLod - 2)
      const min = -texelSize
      const max = 1 + texelSize
      const uv1 = [min, min, max, min, max, max, min, min, max, max, min, max]

      const cubeFaces = 6
      const vertices = 6
      const positionSize = 3
      const uvSize = 2
      const faceIndexSize = 1

      const position = new Float32Array(positionSize * vertices * cubeFaces)
      const uv = new Float32Array(uvSize * vertices * cubeFaces)
      const faceIndex = new Float32Array(faceIndexSize * vertices * cubeFaces)

      for (let face = 0; face < cubeFaces; face++) {
        const x = ((face % 3) * 2) / 3 - 1
        const y = face > 2 ? 0 : -1
        const coordinates = [
          x,
          y,
          0,
          x + 2 / 3,
          y,
          0,
          x + 2 / 3,
          y + 1,
          0,
          x,
          y,
          0,
          x + 2 / 3,
          y + 1,
          0,
          x,
          y + 1,
          0
        ]
        position.set(coordinates, positionSize * vertices * face)
        uv.set(uv1, uvSize * vertices * face)
        const fill = [face, face, face, face, face, face]
        faceIndex.set(fill, faceIndexSize * vertices * face)
      }

      const planes = new BufferGeometry()
      planes.setAttribute('position', new BufferAttribute(position, positionSize))
      planes.setAttribute('uv', new BufferAttribute(uv, uvSize))
      planes.setAttribute('faceIndex', new BufferAttribute(faceIndex, faceIndexSize))
      lodPlanes.push(planes)

      if (lod > LOD_MIN) {
        lod--
      }
    }

    return { lodPlanes, sizeLods, sigmas }
  }

  public compileProperEquirectShader(rotationMatrix?: Matrix4) {
    const fixedEnvFlip = function _getEquirectMaterial() {
      return new ShaderMaterial({
        name: 'EquirectangularToCubeUV',

        uniforms: {
          envMap: { value: null },
          rotationMatrix: { value: rotationMatrix }
        },

        vertexShader: `
          precision mediump float;
          precision mediump int;
          attribute float faceIndex;
          varying vec3 vOutputDirection;
          // RH coordinate system; PMREM face-indexing convention
          vec3 getDirection( vec2 uv, float face ) {
            uv = 2.0 * uv - 1.0;
            vec3 direction = vec3( uv, 1.0 );
            if ( face == 0.0 ) {
              direction = direction.zyx; // ( 1, v, u ) pos x
            } else if ( face == 1.0 ) {
              direction = direction.xzy;
              direction.xz *= -1.0; // ( -u, 1, -v ) pos y
            } else if ( face == 2.0 ) {
              direction.x *= -1.0; // ( -u, v, 1 ) pos z
            } else if ( face == 3.0 ) {
              direction = direction.zyx;
              direction.xz *= -1.0; // ( -1, v, -u ) neg x
            } else if ( face == 4.0 ) {
              direction = direction.xzy;
              direction.xy *= -1.0; // ( -u, -1, v ) neg y
            } else if ( face == 5.0 ) {
              direction.z *= -1.0; // ( u, v, -1 ) neg z
            }
            return direction;
          }
          void main() {
            vOutputDirection = getDirection( uv, faceIndex );
            gl_Position = vec4( position, 1.0 );
          }
        `,

        fragmentShader: /* glsl */ `
          precision mediump float;
          precision mediump int;
          varying vec3 vOutputDirection;
          uniform sampler2D envMap;
          uniform mat4 rotationMatrix;
          #include <common>
          void main() {

            vec3 outputDirection = normalize( vOutputDirection );
            outputDirection = normalize((rotationMatrix * vec4(vOutputDirection, 0.)).xyz);
            vec2 uv = equirectUv( outputDirection );
            gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );
          }
        `,

        blending: NoBlending,
        depthTest: false,
        depthWrite: false
      })
    }

    // @ts-ignore
    this._equirectMaterial = fixedEnvFlip()

    // @ts-ignore
    this._compileMaterial(this._equirectMaterial)
  }
}
