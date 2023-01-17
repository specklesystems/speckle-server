export const speckleShadowcatcherFrag = /* glsl */ `
varying vec2 vUv;

uniform sampler2D tex0;
uniform sampler2D tex1;
uniform sampler2D tex2;
uniform sampler2D tex3;
uniform vec4 weights;
uniform float sigmoidRange;
uniform float sigmoidStrength;

void main() {
	float color0 = texture2D(tex0, vUv).r * weights.x;
	float color1 = texture2D(tex1, vUv).r * weights.y;
	float color2 = texture2D(tex2, vUv).r * weights.z;
	float color3 = texture2D(tex3, vUv).r * weights.w;

	// float c0 = mix(color0, 0., color1);
	// float c1 = mix(color1, 0., color0);
	// float c2 = mix(color3, 0., color0 * 0.5 + color1 * 0.5);
	// float sum = c0 + c1 + c2;

	float sum = color0 + color1 + color3 + color2;

	float a = sigmoidRange;//2.;
	float b = 0.03;
	float c = sigmoidStrength;//2.43;
	float d = 0.59;
	float e = 0.14;
	sum = clamp((sum*(a*sum+b))/(sum*(c*sum+d)+e), 0., 1.);

	vec2 sUv = vUv * 2. - 1.;
	sum *= 1. - pow(abs(sUv.x), 6.);
	sum *= 1. - pow(abs(sUv.y), 6.);

	gl_FragColor = vec4( vec3(sum), sum );
}
`
