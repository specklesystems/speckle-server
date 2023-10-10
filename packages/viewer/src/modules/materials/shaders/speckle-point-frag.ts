export const specklePointFrag = /* glsl */ `
uniform vec3 diffuse;
uniform float opacity;

#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

#ifdef USE_GRADIENT_RAMP
	varying float vGradientIndex;
	uniform sampler2D gradientRamp;
#endif

void main() {

	#include <clipping_planes_fragment>

	vec3 outgoingLight = vec3( 0.0 );

	#ifdef USE_GRADIENT_RAMP
		vec4 diffuseColor = vec4( texture2D(gradientRamp, vec2(vGradientIndex, 0.)).rgb, opacity );
	#else
		vec4 diffuseColor = vec4( diffuse, opacity );
	#endif

	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>

	outgoingLight = diffuseColor.rgb;

	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>

}
`
