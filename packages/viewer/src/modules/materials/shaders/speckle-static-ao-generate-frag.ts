export const speckleStaticAoGenerateFrag = /* glsl */ `
		#include <common>
		#define AO_ESTIMATOR 1
		#define NORMAL_TEXTURE 0
		#define IMPROVED_NORMAL_RECONSTRUCTION 0
		#define ACCURATE_NORMAL_RECONSTRUCTION 1

		varying vec2 vUv;
		uniform sampler2D tDepth;
		uniform sampler2D tNormal;
        uniform vec2 size;

		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraInverseProjectionMatrix;
		
		uniform float intensity;
		uniform float bias;
		uniform float kernelRadius;
		
		
		#if AO_ESTIMATOR == 0
			#define NUM_SAMPLES 16
        	#define SPIRAL_TURNS 2
			#define INV_NUM_SAMPLES 1.0 / float( NUM_SAMPLES )
        	#define offset PI2 / float(NUM_FRAMES)

			uniform float minResolution;
			uniform float frameIndex;
			uniform float scale;
		#endif

		#if AO_ESTIMATOR == 1
			uniform float tanFov;
			uniform sampler2D tNoise;
			uniform vec3 kernel[ KERNEL_SIZE ];
		#endif

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
			#if NORMAL_TEXTURE == 1
				return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );
			#elif IMPROVED_NORMAL_RECONSTRUCTION == 1
				return viewNormalImproved(screenPosition, viewPosition);
			#elif ACCURATE_NORMAL_RECONSTRUCTION == 1
				return viewNormalAccurate(screenPosition, viewPosition, centerDepth);
			#else
				return normalize( cross( dFdx( viewPosition ), dFdy( viewPosition ) ) );
			#endif
		}


		float scaleDividedByCameraFar;
		float minResolutionMultipliedByCameraFar;
        // moving costly divides into consts
		

		float computeKernelSize(float d, float r) {
			#if PERSPECTIVE_CAMERA == 1
				// Apparently this is wrong
				// return (r * tan(fov) * d) / (size.y * 0.5);
				// And this is correct
				float rp = r / (size.y * 0.5);
				return sqrt((rp*rp*tanFov*tanFov*d*d)/(1. + rp*rp*tanFov*tanFov));
			#else
				float twoOrthoSize = size.y / (2./ cameraProjectionMatrix[1][1]);
				return r / twoOrthoSize;
			#endif
		}

		float getAmbientOcclusion( const in vec3 centerViewPosition, in float centerDepth ) {
            #if AO_ESTIMATOR == 0
                // precompute some variables require in getOcclusion.
                scaleDividedByCameraFar = scale / cameraFar;
                minResolutionMultipliedByCameraFar = minResolution * cameraFar;
                vec3 centerViewNormal = getViewNormal( centerViewPosition, vUv, centerDepth );
                // jsfiddle that shows sample pattern: https://jsfiddle.net/TenHands/jun67k9y/7/
                float occlusionSum = 0.0;
                float weightSum = 0.0;
                for( int i = 0; i < NUM_SAMPLES; i ++ ) {
                    float alpha = ( float(i) + 1. ) / float(NUM_SAMPLES);
                    float angle = float(SPIRAL_TURNS)  * alpha;
                    vec2 radius = (kernelRadius / size) * pow( alpha, 1.1 );
                    vec2 sampleUv = vUv + vec2( cos( angle + frameIndex * offset ), sin( angle + frameIndex * offset ) ) * radius;

                    float sampleDepth = getPerspectiveDepth( sampleUv );
                    if( sampleDepth >= ( 1.0 - EPSILON ) ) {
                        continue;
                    }
                    float sampleViewZ = getViewZ( sampleDepth );
                    vec3 sampleViewPosition = getViewPosition( sampleUv, sampleDepth, sampleViewZ );

					/** McGuire Estimator*/
					vec3 v = sampleViewPosition - centerViewPosition;
					float vv = dot(v, v);
					float vn = dot(v, centerViewNormal) - bias;
					
					// Note large epsilon to avoid overdarkening within cracks
					float radius2 = 2.;//uSampleRadiusWS * uSampleRadiusWS
					float epsilon = 0.01;
					
					float f = max(radius2 - vv, 0.0) / radius2;
					occlusionSum += f * f * f * max(vn / (epsilon + vv), 0.0) / 4.;

					/** Three.js SAO Estimator*/
                    // vec3 viewDelta = sampleViewPosition - centerViewPosition;
                    // float viewDistance = length( viewDelta );
                    // float scaledScreenDistance = scaleDividedByCameraFar * viewDistance;
                    // occlusionSum += max(0.0, (dot(centerViewNormal, viewDelta) - minResolutionMultipliedByCameraFar) / scaledScreenDistance - bias) / (1.0 + pow2( scaledScreenDistance ) );
                    weightSum += 1.0;
                }
                if( weightSum == 0.0 ) discard;
                return occlusionSum * ( intensity / weightSum );
			#elif AO_ESTIMATOR == 1
				vec3 viewPosition = centerViewPosition;
				vec3 viewNormal = getViewNormal( centerViewPosition, vUv, centerDepth );
				vec2 noiseScale = vec2( size.x / 4.0, size.y / 4.0 );
				vec3 random = vec3( texture2D( tNoise, vUv * noiseScale ).r );
				// compute matrix used to reorient a kernel vector
				vec3 tangent = normalize( random - viewNormal * dot( random, viewNormal ) );
				vec3 bitangent = cross( viewNormal, tangent );
				mat3 kernelMatrix = mat3( tangent, bitangent, viewNormal );
				float occlusion = 0.0;
				float kernelSize_ws = computeKernelSize(-viewPosition.z, kernelRadius);
				float div = float( KERNEL_SIZE);
				float maxDist = kernelSize_ws / (cameraFar - cameraNear);
				for ( int i = 0; i < KERNEL_SIZE; i ++ ) {
					vec3 sampleVector = kernelMatrix * kernel[ i ]; // reorient sample vector in view space
					vec3 samplePoint = viewPosition + ( sampleVector * kernelSize_ws ); // calculate sample point
					vec4 samplePointNDC = cameraProjectionMatrix * vec4( samplePoint, 1.0 ); // project point and calculate NDC
					samplePointNDC /= samplePointNDC.w;
					vec2 samplePointUv = samplePointNDC.xy * 0.5 + 0.5; // compute uv coordinates
					float realDepth = getLinearDepth( samplePointUv ); // get linear depth from depth texture
					float sampleDepth = viewZToOrthographicDepth( samplePoint.z + bias, cameraNear, cameraFar ); // compute linear depth of the sample view Z value
					float delta = sampleDepth - realDepth;
					if ( delta > 0. && delta < maxDist ) { // if fragment is before sample point, increase occlusion
						occlusion += 1.0;
					}
				}
				return clamp( occlusion * intensity / div, 0.0, 1.0 );
			#endif
			}
		void main() {
			float linearDepth = unpackRGBAToDepth( texture2D( tDepth, vUv ) );
			float centerDepth = getPerspectiveDepth(vUv);
			if( centerDepth >= ( 1.0 - EPSILON ) ) {
				discard;
			}
			float centerViewZ = getViewDepth(linearDepth);
			vec3 viewPosition = getViewPosition( vUv, centerDepth, centerViewZ );
			vec3 viewNormal = getViewNormal(viewPosition, vUv, linearDepth);
			float ambientOcclusion = getAmbientOcclusion( viewPosition, centerDepth );
			gl_FragColor = getDefaultColor( vUv );
			gl_FragColor.xyz *=  ambientOcclusion;
			gl_FragColor.a = 1.;
		}`
