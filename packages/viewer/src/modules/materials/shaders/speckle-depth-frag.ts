export const speckleDepthFrag = /* glsl */ `
#if DEPTH_PACKING == 3200
	uniform float opacity;
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

highp vec4 encode32(highp float f) {
    highp float e =5.0;

    highp float F = abs(f); 
    highp float Sign = step(0.0,-f);
    highp float Exponent = floor(log2(F)); 
    highp float Mantissa = (exp2(- Exponent) * F);
    Exponent = floor(log2(F) + 127.0) + floor(log2(Mantissa));
    highp vec4 rgba;
    rgba[0] = 128.0 * Sign  + floor(Exponent*exp2(-1.0));
    rgba[1] = 128.0 * mod(Exponent,2.0) + mod(floor(Mantissa*128.0),128.0);  
    rgba[2] = floor(mod(floor(Mantissa*exp2(23.0 -8.0)),exp2(8.0)));
    rgba[3] = floor(exp2(23.0)*mod(Mantissa,exp2(-15.0)));
    return rgba / 255.;
}

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
	float fragCoordZ = (0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5);
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = encode32( fragCoordZ );
	#endif
}
`
