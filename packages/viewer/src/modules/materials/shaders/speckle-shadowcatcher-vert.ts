export const speckleShadowcatcherVert = /* glsl */ `
	varying vec2 vUv;
		void main() {
			vUv = vec2(1. - uv.x, uv.y);
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
`
