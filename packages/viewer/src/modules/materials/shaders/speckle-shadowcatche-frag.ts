export const speckleShadowcatcherFrag = /* glsl */ `
uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <map_fragment>
	vec3 color = vec3(1.) - diffuseColor.rgb;
	float alpha = diffuseColor.r;
	gl_FragColor = vec4( color, alpha );
	#include <encodings_fragment>
}
`
