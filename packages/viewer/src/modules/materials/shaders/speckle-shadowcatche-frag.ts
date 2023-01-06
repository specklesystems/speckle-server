export const speckleShadowcatcherFrag = /* glsl */ `
varying vec2 vUv;

uniform sampler2D tex0;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
uniform vec4 weights;
uniform sampler2D depth;
uniform vec2 size;
#include <packing>

float getDepth( const in vec2 screenPosition ) {
	// return unpackRGBAToDepth( texture2D( depth, screenPosition ) );
	return  texture2D( depth, screenPosition ).x;
}

float averageDepth() {
	float du = 1./size.x;
	float dv = 1./size.y;

	float d = getDepth(vUv + vec2(-2. * du, 2. * dv));
	d += getDepth(vUv + vec2(-1. * du, 2. * dv));
	d += getDepth(vUv + vec2(0., 2. * dv));
	d += getDepth(vUv + vec2(1. * du, 2. * dv));
	d += getDepth(vUv + vec2(2. * du, 2. * dv));

	d += getDepth(vUv + vec2(-2. * du, 1. * dv));
	d += getDepth(vUv + vec2(-1. * du, 1. * dv));
	d += getDepth(vUv + vec2(0., 1. * dv));
	d += getDepth(vUv + vec2(1. * du, 1. * dv));
	d += getDepth(vUv + vec2(2. * du, 1. * dv));

	d += getDepth(vUv + vec2(-2. * du, 0.));
	d += getDepth(vUv + vec2(-1. * du, 0.));
	d += getDepth(vUv + vec2(0., 0.));
	d += getDepth(vUv + vec2(1. * du, 0.));
	d += getDepth(vUv + vec2(2. * du, 0.));

	d += getDepth(vUv + vec2(-2. * du, -1. * dv));
	d += getDepth(vUv + vec2(-1. * du, -1. * dv));
	d += getDepth(vUv + vec2(0., -1. * dv));
	d += getDepth(vUv + vec2(1. * du, -1. * dv));
	d += getDepth(vUv + vec2(2. * du, -1. * dv));

	d += getDepth(vUv + vec2(-2. * du, -2. * dv));
	d += getDepth(vUv + vec2(-1. * du, -2. * dv));
	d += getDepth(vUv + vec2(0., -2. * dv));
	d += getDepth(vUv + vec2(1. * du, -2. * dv));
	d += getDepth(vUv + vec2(2. * du, -2. * dv));

	return d/25.;
}

void main() {
	float color0 = texture2D(tex0, vUv).r * weights.x;
	float color1 = texture2D(tex1, vUv).r * weights.y;
	float color2 = texture2D(tex2, vUv).r * weights.z;
	float color3 = texture2D(tex3, vUv).r * weights.w;
	// float val = 0.;
	// float c0 = color0 * color0 + color1 * (1.-color0);
	// float c1 = color0 * color0 + color2 * (1.-color0);
	// float c2 = color0 * color0 + color3 * (1.-color0);

	// float c3 = color1 * color1 + color0 * (1.-color1);
	// float c4 = color1 * color1 + color2 * (1.-color1);
	// float c5 = color1 * color1 + color3 * (1.-color1);

	// float c6 = color2 * color2 + color0 * (1.-color2);
	// float c7 = color2 * color2 + color1 * (1.-color2);
	// float c8 = color2 * color2 + color3 * (1.-color2);

	// float c9 = color3 * color3 + color0 * (1.-color3);
	// float c10 = color3 * color3 + color1 * (1.-color3);
	// float c11 = color3 * color3 + color2 * (1.-color3);
	float d = averageDepth();//getDepth(vUv);

	float c0 = color0 + color1 + color2;
	float c1 = mix(color3, 0., c0);
	float sum = c0 + c1;
	gl_FragColor = vec4( vec3(sum), sum );
}
`
