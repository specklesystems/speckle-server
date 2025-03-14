export const speckleEdgesGeneratorFrag = /* glsl */ `
#include <common>
varying vec2 vUv;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform sampler2D tId;
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

#define ID_GRADIENT_THRESHOLD 1e-4
#include <packing>


float getDepth( const in ivec2 screenPosition ) {
  #if __VERSION__ == 300
	  return unpackRGBAToDepth( texelFetch( tDepth, screenPosition, 0 ) );
  #else
    vec2 cUv = vec2(0.5/size.x, 0.5/size.y);
    return unpackRGBAToDepth( texture2D( tDepth, vec2(screenPosition)/size + cUv ) );
  #endif

}


vec3 SobelSample(sampler2D t, vec2 uv, vec3 offset){
	vec3 pixelCenter = texture2D(t, uv).rgb;
	vec3 pixelLeft   = texture2D(t, uv - offset.xz).rgb;
	vec3 pixelRight  = texture2D(t, uv + offset.xz).rgb;
	vec3 pixelUp     = texture2D(t, uv + offset.zy).rgb;
	vec3 pixelDown   = texture2D(t, uv - offset.zy).rgb;

	return abs(pixelLeft - pixelCenter)  +
			abs(pixelRight - pixelCenter) +
			abs(pixelUp - pixelCenter)    +
			abs(pixelDown - pixelCenter);
}


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

// Source: https://www.shadertoy.com/view/DslXz2
float DepthEdge(ivec2 fragCoord, float tolerance)
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

/** Alternative to NormalEdge. */
vec3 SobelSampleNormal(vec2 uv){
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



#ifdef TEXTURE_BACKGROUND
  uniform sampler2D tBackground;
  uniform float tBackgroundIntensity;
#endif


void main() {
	// Depth edge
  float depthEdge = DepthEdge(ivec2(gl_FragCoord), uDepthBias) * uDepthMultiplier; 
  // Normal edge
	float normalEdge = pow(NormalEdge(uOutlineThickness) * uNormalMultiplier, uNormalBias);
  // Id edge
	vec3 offset = vec3((1.0 / size.x), (1.0 / size.y), 0.0) * uOutlineThickness;
	vec3 sobelIdVec = abs(SobelSample(tId, vUv, offset));
  // This is the branchless equivalent of sobelIdVec.x + sobelIdVec.y + sobelIdVec.z > ID_GRADIENT_THRESHOLD ? 1. : 0.
	float sobelIdEdge = step(ID_GRADIENT_THRESHOLD, sobelIdVec.x + sobelIdVec.y + sobelIdVec.z);

  // Combine the three edges by taking the minimum
  float maxOutline = saturate(max(sobelIdEdge, max(depthEdge, normalEdge)));
  // Invert
	float sobelOutline = 1. - maxOutline * uOutlineDensity;

  vec4 background = vec4(1.);
  float backgroundIntensity = 1.;

  #ifdef TEXTURE_BACKGROUND
    background = texture2D(tBackground, vUv);
    backgroundIntensity = tBackgroundIntensity;
  #endif
  
  vec3 color = mix(vec3(sobelOutline), background.rgb * backgroundIntensity + (1. - backgroundIntensity), 1. - maxOutline);
	gl_FragColor = vec4(color, 1.);

}`
