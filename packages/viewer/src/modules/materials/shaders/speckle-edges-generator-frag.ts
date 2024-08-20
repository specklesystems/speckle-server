export const speckleEdgesGeneratorFrag = /* glsl */ `
#include <common>
varying vec2 vUv;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform vec2 size;

uniform float cameraNear;
uniform float cameraFar;
uniform mat4 cameraProjectionMatrix;
uniform mat4 cameraInverseProjectionMatrix;

#define NORMALS_TYPE 0

// RGBA depth
#include <packing>
vec4 getDefaultColor( const in vec2 screenPosition ) {
	return vec4( 1.0 );
}

float getLinearDepth( const in vec2 screenPosition ) {
	return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
}

float getPerspectiveDepth(const in vec2 coords) {
	float linearDepth = unpackRGBAToDepth( texture2D( tDepth, coords ) );
	#if PERSPECTIVE_CAMERA == 1
		float viewZ = orthographicDepthToViewZ(linearDepth, cameraNear, cameraFar);
		float centerDepth = viewZToPerspectiveDepth(viewZ, cameraNear, cameraFar);
		return centerDepth;
	#else
		return linearDepth;
	#endif
}

float getViewDepth(const in float linearDepth) {
	return orthographicDepthToViewZ(linearDepth, cameraNear, cameraFar);
}

float getViewZ( const in float depth ) {
	#if PERSPECTIVE_CAMERA == 1
	return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
	#else
	return orthographicDepthToViewZ( depth, cameraNear, cameraFar );
	#endif
}

vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {
	float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];
	vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );
	clipPosition *= clipW; // unprojection.
	return ( cameraInverseProjectionMatrix * clipPosition ).xyz;
}

//https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/
vec3 viewNormalImproved(in vec2 uv, in vec3 origin)
{	
	highp vec2 dd = abs(vec2(1./size.x, 1./size.y));
	highp vec2 ddx = vec2(dd.x, 0.);
	highp vec2 ddy = vec2(0., dd.y);

	float sampleDepth = getPerspectiveDepth( uv - ddy );
	float sampleViewZ = getViewZ( sampleDepth );
	highp vec3 top = getViewPosition( uv - ddy, sampleDepth, sampleViewZ );

	sampleDepth = getPerspectiveDepth( uv + ddy );
	sampleViewZ = getViewZ( sampleDepth );
	highp vec3 bottom = getViewPosition( uv + ddy, sampleDepth, sampleViewZ );

	highp vec3 center = origin;
	
	sampleDepth = getPerspectiveDepth( uv - ddx );
	sampleViewZ = getViewZ( sampleDepth );
	highp vec3 left = getViewPosition( uv - ddx, sampleDepth, sampleViewZ );

	sampleDepth = getPerspectiveDepth( uv + ddx );
	sampleViewZ = getViewZ( sampleDepth );
	highp vec3 right = getViewPosition( uv + ddx, sampleDepth, sampleViewZ );

		// get the difference between the current and each offset position
	vec3 l = center - left;
	vec3 r = right - center;
	vec3 d = center - top;
	vec3 u = bottom - center;

	// pick horizontal and vertical diff with the smallest z difference
	vec3 hDeriv = abs(l.z) < abs(r.z) ? l : r;
	vec3 vDeriv = abs(d.z) < abs(u.z) ? d : u;

	// get view space normal from the cross product of the two smallest offsets
	vec3 viewNormal = normalize(cross(hDeriv, vDeriv));

	return viewNormal;
}

vec3 viewNormalAccurate(in vec2 uv, in vec3 origin, in float centerDepth) {
	highp vec2 dd = abs(vec2(1./size.x, 1./size.y));
	highp vec2 ddx = vec2(dd.x, 0.);
	highp vec2 ddy = vec2(0., dd.y);

	float sampleDepth = getPerspectiveDepth( uv - ddy );
	float sampleViewZ = getViewZ( sampleDepth );
	highp vec3 top = getViewPosition( uv - ddy, sampleDepth, sampleViewZ );

	sampleDepth = getPerspectiveDepth( uv + ddy );
	sampleViewZ = getViewZ( sampleDepth );
	highp vec3 bottom = getViewPosition( uv + ddy, sampleDepth, sampleViewZ );

	highp vec3 center = origin;
	
	sampleDepth = getPerspectiveDepth( uv - ddx );
	sampleViewZ = getViewZ( sampleDepth );
	highp vec3 left = getViewPosition( uv - ddx, sampleDepth, sampleViewZ );

	sampleDepth = getPerspectiveDepth( uv + ddx );
	sampleViewZ = getViewZ( sampleDepth );
	highp vec3 right = getViewPosition( uv + ddx, sampleDepth, sampleViewZ );

		// get the difference between the current and each offset position
	vec3 l = center - left;
	vec3 r = right - center;
	vec3 d = center - top;
	vec3 u = bottom - center;

	// get depth values at 1 & 2 pixels offsets from current along the horizontal axis
	vec4 H = vec4(
		getLinearDepth(uv - ddx),
		getLinearDepth(uv + ddx),
		getLinearDepth(uv - 2. * ddx),
		getLinearDepth(uv + 2. * ddx)
	);

	// get depth values at 1 & 2 pixels offsets from current along the vertical axis
	vec4 V = vec4(
		getLinearDepth(uv - ddy),
		getLinearDepth(uv + ddy),
		getLinearDepth(uv - 2. * ddy),
		getLinearDepth(uv + 2. * ddy)
	);

	// current pixel's depth difference from slope of offset depth samples
	// differs from original article because we're using non-linear depth values
	// see article's comments
	vec2 he = abs((2. * H.xy - H.zw) - centerDepth);
	vec2 ve = abs((2. * V.xy - V.zw) - centerDepth);

	// pick horizontal and vertical diff with the smallest depth difference from slopes
	vec3 hDeriv = he.x < he.y ? l : r;
	vec3 vDeriv = ve.x < ve.y ? d : u;

	// get view space normal from the cross product of the best derivatives
	vec3 viewNormal = normalize(cross(hDeriv, vDeriv));

	return viewNormal;

}

vec3 getViewNormal( const in vec3 viewPosition, const in vec2 screenPosition, in float centerDepth ) {
	#if NORMALS_TYPE == 0
		return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );
	#elif NORMALS_TYPE == 1
		return viewNormalImproved(screenPosition, viewPosition);
	#elif NORMALS_TYPE == 2
		return viewNormalAccurate(screenPosition, viewPosition, centerDepth);
	#else
		return normalize( cross( dFdx( viewPosition ), dFdy( viewPosition ) ) );
	#endif
}


vec3 SobelSampleNormal(sampler2D t, vec2 uv, vec3 offset){
	vec3 pixelCenter = unpackRGBToNormal(texture2D(t, uv).rgb);
	vec3 pixelLeft   = unpackRGBToNormal(texture2D(t, uv - offset.xz).rgb);
	vec3 pixelRight  = unpackRGBToNormal(texture2D(t, uv + offset.xz).rgb);
	vec3 pixelUp     = unpackRGBToNormal(texture2D(t, uv + offset.zy).rgb);
	vec3 pixelDown   = unpackRGBToNormal(texture2D(t, uv - offset.zy).rgb);

	return abs(pixelLeft - pixelCenter)  +
			abs(pixelRight - pixelCenter) +
			abs(pixelUp - pixelCenter)    +
			abs(pixelDown - pixelCenter);
}

vec3 SobelSampleNormal2(vec2 uv){
	float w = 1.0 / size.x;
	float h = 1.0 / size.y;
	vec3 n[9];
	n[0] = unpackRGBToNormal(texture2D(tNormal, uv + vec2( -w, -h)).rgb);
	n[1] = unpackRGBToNormal(texture2D(tNormal, uv + vec2(0.0, -h)).rgb);
	n[2] = unpackRGBToNormal(texture2D(tNormal, uv + vec2(  w, -h)).rgb);
	n[3] = unpackRGBToNormal(texture2D(tNormal, uv + vec2( -w, 0.0)).rgb);
	n[4] = unpackRGBToNormal(texture2D(tNormal, uv).rgb);
	n[5] = unpackRGBToNormal(texture2D(tNormal, uv + vec2(  w, 0.0)).rgb);
	n[6] = unpackRGBToNormal(texture2D(tNormal, uv + vec2( -w, h)).rgb);
	n[7] = unpackRGBToNormal(texture2D(tNormal, uv + vec2(0.0, h)).rgb);
	n[8] = unpackRGBToNormal(texture2D(tNormal, uv + vec2(  w, h)).rgb);

	vec3 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
  	vec3 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
	vec3 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
	return sobel;
}

float SobelSampleDepth(vec2 uv, vec3 offset){
	float pixelCenter = orthographicDepthToViewZ(getLinearDepth(uv), cameraNear, cameraFar);
	float pixelLeft   = orthographicDepthToViewZ(getLinearDepth( uv - offset.xz), cameraNear, cameraFar);
	float pixelRight  = orthographicDepthToViewZ(getLinearDepth( uv + offset.xz), cameraNear, cameraFar);
	float pixelUp     = orthographicDepthToViewZ(getLinearDepth( uv + offset.zy), cameraNear, cameraFar);
	float pixelDown   = orthographicDepthToViewZ(getLinearDepth( uv - offset.zy), cameraNear, cameraFar);

	return abs(pixelLeft - pixelCenter)  +
			abs(pixelRight - pixelCenter) +
			abs(pixelUp - pixelCenter)    +
			abs(pixelDown - pixelCenter);
}

float SobelSampleDepth2(vec2 uv){
	float w = 1.0 / size.x;
	float h = 1.0 / size.y;
	float n[9];
	n[0] = getLinearDepth( uv + vec2( -w, -h));
	n[1] = getLinearDepth( uv + vec2(0.0, -h));
	n[2] = getLinearDepth( uv + vec2(  w, -h));
	n[3] = getLinearDepth( uv + vec2( -w, 0.0));
	n[4] = getLinearDepth( uv);
	n[5] = getLinearDepth( uv + vec2(  w, 0.0));
	n[6] = getLinearDepth( uv + vec2( -w, h));
	n[7] = getLinearDepth( uv + vec2(0.0, h));
	n[8] = getLinearDepth( uv + vec2(  w, h));

	float sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
  	float sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
	float sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
	return sobel;
}

void main() {
	float _OutlineThickness = 1.;
	float _OutlineDepthMultiplier = 1.;
	float _OutlineDepthBias = 1.;
	vec3 offset = vec3((1.0 / size.x), (1.0 / size.y), 0.0) * _OutlineThickness;
	// float sobel = SobelSampleDepth(vUv, offset);
	// sobel = 1. - pow(abs(saturate(sobel) * _OutlineDepthMultiplier), _OutlineDepthBias);
	float sobelDepth = SobelSampleDepth2(vUv);
	sobelDepth = pow(abs(saturate(sobelDepth) * _OutlineDepthMultiplier), _OutlineDepthBias);
	// gl_FragColor = vec4(sobel, sobel, sobel, 1.);
	
	vec3 sobelNormalVec = abs(SobelSampleNormal2(vUv));
	float sobelNormal = sobelNormalVec.x + sobelNormalVec.y + sobelNormalVec.z;
	sobelNormal = pow(abs(sobelNormal * _OutlineDepthMultiplier), _OutlineDepthBias);

	float sobelOutline = saturate(max(sobelDepth, sobelNormal));
	gl_FragColor = vec4(sobelOutline, sobelOutline, sobelOutline, 1.);
}`
