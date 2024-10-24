export const speckleEdgesGeneratorFrag = /* glsl */ `
#include <common>
varying vec2 vUv;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform float uDepthMultiplier;
uniform float uDepthBias;
uniform float uNormalMultiplier;
uniform float uNormalBias;
uniform float uOutlineThickness;
uniform float uOutlineDensity;
uniform vec2 size;

uniform float cameraNear;
uniform float cameraFar;
uniform mat4 cameraProjectionMatrix;
uniform mat4 cameraInverseProjectionMatrix;

#define NORMALS_TYPE 0
// RGBA depth
#include <packing>


float getDepth( const in ivec2 screenPosition ) {
  #if __VERSION__ == 300
	  return unpackRGBAToDepth( texelFetch( tDepth, screenPosition, 0 ) );
  #else
    vec2 cUv = vec2(0.5/size.x, 0.5/size.y);
    return unpackRGBAToDepth( texture2D( tDepth, vec2(screenPosition) + cUv ) );
  #endif

}

// float getPerspectiveDepth(const in vec2 coords) {
// 	float linearDepth = unpackRGBAToDepth( texture2D( tDepth, coords ) );
// 	#if PERSPECTIVE_CAMERA == 1
// 		float viewZ = orthographicDepthToViewZ(linearDepth, cameraNear, cameraFar);
// 		float centerDepth = viewZToPerspectiveDepth(viewZ, cameraNear, cameraFar);
// 		return centerDepth;
// 	#else
// 		return linearDepth;
// 	#endif
// }

// float getViewDepth(const in float linearDepth) {
// 	return orthographicDepthToViewZ(linearDepth, cameraNear, cameraFar);
// }

// float getViewZ( const in float depth ) {
// 	#if PERSPECTIVE_CAMERA == 1
// 	return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
// 	#else
// 	return orthographicDepthToViewZ( depth, cameraNear, cameraFar );
// 	#endif
// }

// vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {
// 	float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];
// 	vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );
// 	clipPosition *= clipW; // unprojection.
// 	return ( cameraInverseProjectionMatrix * clipPosition ).xyz;
// }

// //https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/
// vec3 viewNormalImproved(in vec2 uv, in vec3 origin)
// {	
// 	highp vec2 dd = abs(vec2(1./size.x, 1./size.y));
// 	highp vec2 ddx = vec2(dd.x, 0.);
// 	highp vec2 ddy = vec2(0., dd.y);

// 	float sampleDepth = getPerspectiveDepth( uv - ddy );
// 	float sampleViewZ = getViewZ( sampleDepth );
// 	highp vec3 top = getViewPosition( uv - ddy, sampleDepth, sampleViewZ );

// 	sampleDepth = getPerspectiveDepth( uv + ddy );
// 	sampleViewZ = getViewZ( sampleDepth );
// 	highp vec3 bottom = getViewPosition( uv + ddy, sampleDepth, sampleViewZ );

// 	highp vec3 center = origin;
	
// 	sampleDepth = getPerspectiveDepth( uv - ddx );
// 	sampleViewZ = getViewZ( sampleDepth );
// 	highp vec3 left = getViewPosition( uv - ddx, sampleDepth, sampleViewZ );

// 	sampleDepth = getPerspectiveDepth( uv + ddx );
// 	sampleViewZ = getViewZ( sampleDepth );
// 	highp vec3 right = getViewPosition( uv + ddx, sampleDepth, sampleViewZ );

// 		// get the difference between the current and each offset position
// 	vec3 l = center - left;
// 	vec3 r = right - center;
// 	vec3 d = center - top;
// 	vec3 u = bottom - center;

// 	// pick horizontal and vertical diff with the smallest z difference
// 	vec3 hDeriv = abs(l.z) < abs(r.z) ? l : r;
// 	vec3 vDeriv = abs(d.z) < abs(u.z) ? d : u;

// 	// get view space normal from the cross product of the two smallest offsets
// 	vec3 viewNormal = normalize(cross(hDeriv, vDeriv));

// 	return viewNormal;
// }

// vec3 viewNormalAccurate(in vec2 uv, in vec3 origin, in float centerDepth) {
// 	highp vec2 dd = abs(vec2(1./size.x, 1./size.y));
// 	highp vec2 ddx = vec2(dd.x, 0.);
// 	highp vec2 ddy = vec2(0., dd.y);

// 	float sampleDepth = getPerspectiveDepth( uv - ddy );
// 	float sampleViewZ = getViewZ( sampleDepth );
// 	highp vec3 top = getViewPosition( uv - ddy, sampleDepth, sampleViewZ );

// 	sampleDepth = getPerspectiveDepth( uv + ddy );
// 	sampleViewZ = getViewZ( sampleDepth );
// 	highp vec3 bottom = getViewPosition( uv + ddy, sampleDepth, sampleViewZ );

// 	highp vec3 center = origin;
	
// 	sampleDepth = getPerspectiveDepth( uv - ddx );
// 	sampleViewZ = getViewZ( sampleDepth );
// 	highp vec3 left = getViewPosition( uv - ddx, sampleDepth, sampleViewZ );

// 	sampleDepth = getPerspectiveDepth( uv + ddx );
// 	sampleViewZ = getViewZ( sampleDepth );
// 	highp vec3 right = getViewPosition( uv + ddx, sampleDepth, sampleViewZ );

// 		// get the difference between the current and each offset position
// 	vec3 l = center - left;
// 	vec3 r = right - center;
// 	vec3 d = center - top;
// 	vec3 u = bottom - center;

// 	// get depth values at 1 & 2 pixels offsets from current along the horizontal axis
// 	vec4 H = vec4(
// 		getLinearDepth(uv - ddx),
// 		getLinearDepth(uv + ddx),
// 		getLinearDepth(uv - 2. * ddx),
// 		getLinearDepth(uv + 2. * ddx)
// 	);

// 	// get depth values at 1 & 2 pixels offsets from current along the vertical axis
// 	vec4 V = vec4(
// 		getLinearDepth(uv - ddy),
// 		getLinearDepth(uv + ddy),
// 		getLinearDepth(uv - 2. * ddy),
// 		getLinearDepth(uv + 2. * ddy)
// 	);

// 	// current pixel's depth difference from slope of offset depth samples
// 	// differs from original article because we're using non-linear depth values
// 	// see article's comments
// 	vec2 he = abs((2. * H.xy - H.zw) - centerDepth);
// 	vec2 ve = abs((2. * V.xy - V.zw) - centerDepth);

// 	// pick horizontal and vertical diff with the smallest depth difference from slopes
// 	vec3 hDeriv = he.x < he.y ? l : r;
// 	vec3 vDeriv = ve.x < ve.y ? d : u;

// 	// get view space normal from the cross product of the best derivatives
// 	vec3 viewNormal = normalize(cross(hDeriv, vDeriv));

// 	return viewNormal;

// }

// vec3 getViewNormal( const in vec3 viewPosition, const in vec2 screenPosition, in float centerDepth ) {
// 	#if NORMALS_TYPE == 0
// 		return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );
// 	#elif NORMALS_TYPE == 1
// 		return viewNormalImproved(screenPosition, viewPosition);
// 	#elif NORMALS_TYPE == 2
// 		return viewNormalAccurate(screenPosition, viewPosition, centerDepth);
// 	#else
// 		return normalize( cross( dFdx( viewPosition ), dFdy( viewPosition ) ) );
// 	#endif
// }


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
	float pixelCenter = orthographicDepthToViewZ(getDepth(ivec2(uv*size)), cameraNear, cameraFar);
	float pixelLeft   = orthographicDepthToViewZ(getDepth(ivec2((uv - offset.xz) * size)), cameraNear, cameraFar);
	float pixelRight  = orthographicDepthToViewZ(getDepth(ivec2((uv + offset.xz) * size)), cameraNear, cameraFar);
	float pixelUp     = orthographicDepthToViewZ(getDepth(ivec2((uv + offset.zy) * size)), cameraNear, cameraFar);
	float pixelDown   = orthographicDepthToViewZ(getDepth(ivec2((uv - offset.zy) * size)), cameraNear, cameraFar);

	return abs(pixelLeft - pixelCenter)  +
			abs(pixelRight - pixelCenter) +
			abs(pixelUp - pixelCenter)    +
			abs(pixelDown - pixelCenter);
}

// float SobelSampleDepth2(vec2 uv){
// 	float w = 1.0 / size.x * uOutlineDensity;
// 	float h = 1.0 / size.y * uOutlineThickness;
// 	float n[9];
// 	n[0] = getLinearDepth( uv + vec2( -w, -h));
// 	n[1] = getLinearDepth( uv + vec2(0.0, -h));
// 	n[2] = getLinearDepth( uv + vec2(  w, -h));
// 	n[3] = getLinearDepth( uv + vec2( -w, 0.0));
// 	n[4] = getLinearDepth( uv);
// 	n[5] = getLinearDepth( uv + vec2(  w, 0.0));
// 	n[6] = getLinearDepth( uv + vec2( -w, h));
// 	n[7] = getLinearDepth( uv + vec2(0.0, h));
// 	n[8] = getLinearDepth( uv + vec2(  w, h));

// 	float sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
//   	float sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
// 	float sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
// 	return sobel;
// }

float GetTolerance(float d, float k)
{
    // -------------------------------------------
    // Find a tolerance for depth that is constant
    // in view space (k in view space).
    //
    // tol = k*ddx(ZtoDepth(z))
    // -------------------------------------------
    
    float A=-   (cameraFar+cameraNear)/(cameraFar - cameraNear);
    float B=-2.0*cameraFar*cameraNear /(cameraFar -cameraNear);
    
    d = d*2.0-1.0;
    
    return -k*(d+A)*(d+A)/B;   
}

float DetectSilho(ivec2 fragCoord, ivec2 dir, float tolerance)
{
    // -------------------------------------------
    //   x0 ___ x1----o 
    //          :\    : 
    //       r0 : \   : r1
    //          :  \  : 
    //          o---x2 ___ x3
    //
    // r0 and r1 are the differences between actual
    // and expected (as if x0..3 where on the same
    // plane) depth values.
    // -------------------------------------------
    
    float x0 = abs(getDepth(fragCoord + dir*-2));
    float x1 = abs(getDepth(fragCoord + dir*-1));
    float x2 = abs(getDepth(fragCoord + dir* 0));
    float x3 = abs(getDepth(fragCoord + dir* 1));
    
    float d0 = (x1-x0);
    float d1 = (x2-x3);
    
    float r0 = x1 + d0 - x2;
    float r1 = x2 + d1 - x1;
    
    float tol = GetTolerance(x2, tolerance);
    
    return smoothstep(0.0, tol*tol, max( - r0*r1, 0.0));

}

float DetectSilho(ivec2 fragCoord, float tolerance)
{
    return max(
        DetectSilho(fragCoord, ivec2(1,0), tolerance), // Horizontal
        DetectSilho(fragCoord, ivec2(0,1), tolerance)  // Vertical
        );
}

float NormalEdge(float scale)
{
	float halfScaleFloor = floor(scale * 0.5);
	float halfScaleCeil = ceil(scale * 0.5);

	vec2 pixelSize = vec2(1.0 / size.x, 1.0 / size.y);

	vec2 bottomLeftUV = vUv - pixelSize * halfScaleFloor;
	vec2 topRightUV = vUv + pixelSize * halfScaleCeil;  
	vec2 bottomRightUV = vUv + vec2(pixelSize.x * halfScaleCeil, -pixelSize.y * halfScaleFloor);
	vec2 topLeftUV = vUv + vec2(-pixelSize.x * halfScaleFloor, pixelSize.y * halfScaleCeil);

	vec3 centerNormal = unpackRGBToNormal(texture2D(tNormal, vUv).rgb);
	vec3 normal0 = unpackRGBToNormal(texture2D(tNormal, bottomLeftUV).rgb);
	vec3 normal1 = unpackRGBToNormal(texture2D(tNormal, topRightUV).rgb);
	vec3 normal2 = unpackRGBToNormal(texture2D(tNormal, bottomRightUV).rgb);
	vec3 normal3 = unpackRGBToNormal(texture2D(tNormal, topLeftUV).rgb);

	vec3 normalFiniteDifference0 = normal1 - normal0;
	vec3 normalFiniteDifference1 = normal3 - normal2;

	return sqrt(dot(normalFiniteDifference0, normalFiniteDifference0) + dot(normalFiniteDifference1, normalFiniteDifference1));
}

vec2 rotate2D(vec2 v, float rad) {
  float s = sin(rad);
  float c = cos(rad);
  return mat2(c, s, -s, c) * v;
}


/**
 * Return a vector with the same length as v
 * but its direction is rounded to the nearest
 * of 8 cardinal directions
 */
vec2 round2DVectorAngle(vec2 v) {
  float len = length(v);
  vec2 n = normalize(v);
  float maximum = -1.;
  float bestAngle;
  for (int i = 0; i < 8; i++) {
    float theta = (float(i) * 2. * PI) / 8.;
    vec2 u = rotate2D(vec2(1., 0.), theta);
    float scalarProduct = dot(u, n);
    if (scalarProduct > maximum) {
      bestAngle = theta;
      maximum = scalarProduct;
    }
  }
  return len * rotate2D(vec2(1., 0.), bestAngle);
}

/**
 * Apply a double threshold to each edge to classify each edge
 * as a weak edge or a strong edge
 */
float applyDoubleThreshold(
  vec2 gradient,
  float weakThreshold,
  float strongThreshold
) {
  float gradientLength = gradient.x;//length(gradient);
  if (gradientLength < weakThreshold) return 0.;
  if (gradientLength < strongThreshold) return .5;
  return 1.;
}

const mat3 X_COMPONENT_MATRIX = mat3(
  1., 0., -1.,
  2., 0., -2.,
  1., 0., -1.
);
const mat3 Y_COMPONENT_MATRIX = mat3(
  1., 2., 1.,
  0., 0., 0.,
  -1., -2., -1.
);

/**
 * 3x3 Matrix convolution
 */
float convoluteMatrices(mat3 A, mat3 B) {
  return dot(A[0], B[0]) + dot(A[1], B[1]) + dot(A[2], B[2]);
}


/**
 * Get the intensity of the color on a
 * texture after a guassian blur is applied
 */
float getTextureIntensity(
  sampler2D textureSampler,
  vec2 textureCoord,
  vec2 resolution
) {
  vec3 color = unpackRGBToNormal(texture2D(textureSampler, textureCoord).rgb);
  return pow(length(clamp(color, vec3(0.), vec3(1.))), 2.) / 3.;
}

/**
 * Get the gradient of the textures intensity
 * as a function of the texture coordinate
 */
vec2 getTextureIntensityGradient(
  sampler2D textureSampler,
  vec2 textureCoord,
  vec2 resolution
) {
//   vec2 gradientStep = vec2(1.) / resolution;

//   mat3 imgMat = mat3(0.);

//   for (int i = 0; i < 3; i++) {
//     for (int j = 0; j < 3; j++) {
//       vec2 ds = vec2(
//         -gradientStep.x + (float(i) * gradientStep.x),
//         -gradientStep.y + (float(j) * gradientStep.y));
//       imgMat[i][j] = getTextureIntensity(
//         textureSampler, clamp(textureCoord + ds, vec2(0.), vec2(1.)), resolution);
//     }
//   }

//   float gradX = convoluteMatrices(X_COMPONENT_MATRIX, imgMat);
//   float gradY = convoluteMatrices(Y_COMPONENT_MATRIX, imgMat);

//   return vec2(gradX, gradY);
	float edge = NormalEdge(uOutlineThickness);
	return vec2(edge, edge);
}

/**
 * Get the texture intensity gradient of an image
 * where the angle of the direction is rounded to
 * one of the 8 cardinal directions and gradients
 * that are not local extrema are zeroed out
 */
vec2 getSuppressedTextureIntensityGradient(
  sampler2D textureSampler,
  vec2 textureCoord,
  vec2 resolution
) {
  vec2 gradient = getTextureIntensityGradient(textureSampler, textureCoord, resolution);
//   gradient = round2DVectorAngle(gradient);
//   vec2 gradientStep = normalize(gradient) / resolution;
//   float gradientLength = length(gradient);
//   vec2 gradientPlusStep = getTextureIntensityGradient(
//     textureSampler, textureCoord + gradientStep, resolution);
//   if (length(gradientPlusStep) >= gradientLength) return vec2(0.);
//   vec2 gradientMinusStep = getTextureIntensityGradient(
//     textureSampler, textureCoord - gradientStep, resolution);
//   if (length(gradientMinusStep) >= gradientLength) return vec2(0.);
  return gradient;
}

float applyHysteresis(
  sampler2D textureSampler,
  vec2 textureCoord,
  vec2 resolution,
  float weakThreshold,
  float strongThreshold
) {
  float dx = 1. / resolution.x;
  float dy = 1. / resolution.y;
  for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
      vec2 ds = vec2(
        -dx + (float(i) * dx),
        -dy + (float(j) * dy));
      vec2 gradient = getSuppressedTextureIntensityGradient(
        textureSampler, clamp(textureCoord + ds, vec2(0.), vec2(1.)), resolution);
      float edge = applyDoubleThreshold(gradient, weakThreshold, strongThreshold);
      if (edge == 1.) return 1.;
    }
  }
  return 0.;
}

float cannyEdgeDetection(
  sampler2D textureSampler,
  vec2 textureCoord,
  vec2 resolution,
  float weakThreshold,
  float strongThreshold
) {
  vec2 gradient = getSuppressedTextureIntensityGradient(textureSampler, textureCoord, resolution);
  float edge = applyDoubleThreshold(gradient, weakThreshold, strongThreshold);
  if (edge == .5) {
    edge = applyHysteresis(
      textureSampler, textureCoord, resolution, weakThreshold, strongThreshold);
  }
  return edge;
}

#ifdef TEXTURE_BACKGROUND
  uniform sampler2D tBackground;
  uniform float tBackgroundIntensity;
#endif


void main() {
	// Silhouette-edge value
  float depthEdge = DetectSilho(ivec2(gl_FragCoord), uDepthBias) * uDepthMultiplier; 
	float normalEdge = pow(NormalEdge(uOutlineThickness) * uNormalMultiplier, uNormalBias);
	// vec3 offset = vec3((1.0 / size.x), (1.0 / size.y), 0.0) * uOutlineThickness;
	// float sobel = SobelSampleDepth(vUv, offset);
	// sobel = pow(abs(saturate(sobel) * uDepthMultiplier), uDepthBias);
	
	// vec3 sobelNormalVec = abs(SobelSampleNormal(tNormal, vUv, offset));
	// float sobelNormal = sobelNormalVec.x + sobelNormalVec.y + sobelNormalVec.z;
	// sobelNormal = pow(abs(sobelNormal * uNormalMultiplier), uNormalBias);
  float maxOutline = saturate(max(depthEdge, normalEdge));
	float sobelOutline = 1. - maxOutline * uOutlineDensity;
	// float canny = cannyEdgeDetection(tNormal, vUv, size, uDepthMultiplier, uDepthBias) * uOutlineDensity;

  vec4 background = vec4(1.);
  float backgroundIntensity = 1.;

  #ifdef TEXTURE_BACKGROUND
    background = texture2D(tBackground, vUv);
    backgroundIntensity = tBackgroundIntensity;
  #endif
  
  vec3 color = mix(vec3(sobelOutline), background.rgb * backgroundIntensity + (1. - backgroundIntensity), 1. - maxOutline);
	gl_FragColor = vec4(color, 1.);

}`
