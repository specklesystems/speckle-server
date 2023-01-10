export const speckleDepthFrag = /* glsl */ `
#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#ifdef LINEAR_DEPTH
    varying vec4 vViewPosition;
	uniform float near;
	uniform float far;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;

void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	// #include <alphatest_fragment>
	#ifdef USE_ALPHATEST
		if ( diffuseColor.a < alphaTest ) discard;
		/** This is a workaround for rejecting shadows for certain materials, since three.js gave me no choice*/
		#ifdef ALPHATEST_REJECTION
			if (alphaTest > 0. ) discard;
		#endif
	#endif
	#include <logdepthbuf_fragment>
	// Higher precision equivalent of gl_FragCoord.z. This assumes depthRange has been left to its default values.
	#ifdef LINEAR_DEPTH
		/** View z is negative moving away from the camera */
		gl_FragColor = packDepthToRGBA((vViewPosition.z + near) / (near - far));
	#else
		float fragCoordZ = (0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5);
		#if DEPTH_PACKING == 3200
			gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
		#elif DEPTH_PACKING == 3201
			gl_FragColor = packDepthToRGBA( fragCoordZ );
		#endif
	#endif
}
`
