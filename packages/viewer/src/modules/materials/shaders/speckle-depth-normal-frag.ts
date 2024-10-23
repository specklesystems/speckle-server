export const speckleDepthNormalFrag = /* glsl */ `
#if __VERSION__ == 100
    #extension GL_EXT_draw_buffers : require
#endif

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
varying vec3 vNormal;

#if __VERSION__ == 300
    layout(location = 1) out vec4 gNormal;
#endif

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
    vec3 normal = normalize( vNormal );

    /** Output view space normals*/
    
    vec4 outNormal = vec4( packNormalToRGB( normal ), 1.0 );
    vec4 outDepth;
	// Higher precision equivalent of gl_FragCoord.z. This assumes depthRange has been left to its default values.
	#ifdef LINEAR_DEPTH
		/** View z is negative moving away from the camera */
		outDepth = packDepthToRGBA((vViewPosition.z + near) / (near - far));
	#else
		float fragCoordZ = (0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5);
		#if DEPTH_PACKING == 3200
			outDepth = vec4( vec3( 1.0 - fragCoordZ ), opacity );
		#elif DEPTH_PACKING == 3201
			outDepth = packDepthToRGBA( fragCoordZ );
		#endif
	#endif
    #if __VERSION__ == 300
        pc_fragColor = outDepth;
        gNormal = outNormal;
    #else
        gl_FragData[0] = outDepth;
        gl_FragData[1] = outNormal;
    #endif
}
`
