import {
  Matrix4,
  NoBlending,
  PMREMGenerator,
  ShaderMaterial,
  WebGLRenderer
} from 'three'

export class RotatablePMREMGenerator extends PMREMGenerator {
  constructor(renderer: WebGLRenderer) {
    super(renderer)
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

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this._equirectMaterial = fixedEnvFlip()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this._compileMaterial(this._equirectMaterial)
  }
}
