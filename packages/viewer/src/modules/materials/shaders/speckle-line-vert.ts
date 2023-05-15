export const speckleLineVert = /* glsl */ `
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;
		uniform float pixelThreshold;

		varying float vAlpha;

		#define SEARCH_STEPS 10

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec4 instanceColorStart;
		attribute vec4 instanceColorEnd;
		// varying vec3 debugColor;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;
			varying float correctedLineWidth;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

        #ifdef USE_RTE
			attribute vec3 instanceStartLow;
			attribute vec3 instanceEndLow;
            uniform vec3 uViewer_high;
            uniform vec3 uViewer_low;
        #endif

		void trimSegment( const in vec4 start, inout vec4 end ) {

			// trim end segment so it terminates between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
			float nearEstimate = - 0.5 * b / a;

			float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

			end.xyz = mix( start.xyz, end.xyz, alpha );

		}

		float screenSpaceDistance(vec4 p0, vec4 p1) {
			p0 = projectionMatrix * p0;
			p0 /= p0.w;
			p1 = projectionMatrix * p1;
			p1 /= p1.w;
			return length(p1.xy - p0.xy);
		}

		vec4 computeRelativePositionSeparate(in vec3 position_low, in vec3 position_high, in vec3 relativeTo_low, in vec3 relativeTo_high){
			/* 
			Vector calculation for the high and low differences works on everything 
			*BESIDES* Apple Silicon (or whatever they call it) GPUs

			It would seem that when this code gets compiled, vector types get a lower precision(?)
			which completely brakes the 2 float -> double reconstructio. Doing it separately for each 
			vector component using floats works fine.
			*/
			vec3 highDifference;
			vec3 lowDifference;
			float t1 = position_low.x - relativeTo_low.x;
			float e = t1 - position_low.x;
			float t2 = ((-relativeTo_low.x - e) + (position_low.x - (t1 - e))) + position_high.x - relativeTo_high.x;
			highDifference.x = t1 + t2;
			lowDifference.x = t2 - (highDifference.x - t1);

			t1 = position_low.y - relativeTo_low.y;
			e = t1 - position_low.y;
			t2 = ((-relativeTo_low.y - e) + (position_low.y - (t1 - e))) + position_high.y - relativeTo_high.y;
			highDifference.y = t1 + t2;
			lowDifference.y = t2 - (highDifference.y - t1);

			t1 = position_low.z - relativeTo_low.z;
			e = t1 - position_low.z;
			t2 = ((-relativeTo_low.z - e) + (position_low.z - (t1 - e))) + position_high.z - relativeTo_high.z;
			highDifference.z = t1 + t2;
			lowDifference.z = t2 - (highDifference.z - t1);

			vec3 position = highDifference.xyz + lowDifference.xyz;
			return vec4(position, 1.);
		}

		vec4 computeRelativePosition(in vec3 position_low, in vec3 position_high, in vec3 relativeTo_low, in vec3 relativeTo_high){
			/* 
			Source https://github.com/virtualglobebook/OpenGlobe/blob/master/Source/Examples/Chapter05/Jitter/GPURelativeToEyeDSFUN90/Shaders/VS.glsl 
			Note here, we're storing the high part of the position encoding inside three's default 'position' attribute buffer so we avoid redundancy 
			*/
			vec3 t1 = position_low.xyz - relativeTo_low;
			vec3 e = t1 - position_low.xyz;
			vec3 t2 = ((-relativeTo_low - e) + (position_low.xyz - (t1 - e))) + position_high.xyz - relativeTo_high;
			vec3 highDifference = t1 + t2;
			vec3 lowDifference = t2 - (highDifference - t1);
			
			vec3 position = highDifference.xyz + lowDifference.xyz;
			return vec4(position, 1.);
		}

		void main() {
			if(instanceColorStart.w == 0.) {
				gl_Position = vec4(0.);
				return;
			}
			
			vAlpha = instanceColorStart.w;

            vec3 computedPosition = position;
			#ifdef USE_COLOR

				vColor.xyz = ( computedPosition.y < 0.5 ) ? instanceColorStart.xyz : instanceColorEnd.xyz;

			#endif

			#ifdef USE_DASH

				vLineDistance = ( computedPosition.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
				vUv = uv;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
            #ifdef USE_RTE
			/** Source https://github.com/virtualglobebook/OpenGlobe/blob/master/Source/Examples/Chapter05/Jitter/GPURelativeToEyeDSFUN90/Shaders/VS.glsl */
				// vec3 t1 = instanceStartLow.xyz - uViewer_low;
				// vec3 e = t1 - instanceStartLow.xyz;
				// vec3 t2 = ((-uViewer_low - e) + (instanceStartLow.xyz - (t1 - e))) + instanceStart.xyz - uViewer_high;
				// vec3 highDifference = t1 + t2;
				// vec3 lowDifference = t2 - (highDifference - t1);
				// vec4 start = modelViewMatrix * vec4(highDifference.xyz + lowDifference.xyz , 1.);
				vec4 start = modelViewMatrix * computeRelativePositionSeparate(instanceStartLow.xyz, instanceStart.xyz, uViewer_low, uViewer_high);
				
				// t1 = instanceEndLow.xyz - uViewer_low;
				// e = t1 - instanceEndLow.xyz;
				// t2 = ((-uViewer_low - e) + (instanceEndLow.xyz - (t1 - e))) + instanceEnd.xyz - uViewer_high;
				// highDifference = t1 + t2;
				// lowDifference = t2 - (highDifference - t1);
				// vec4 end = modelViewMatrix * vec4(highDifference.xyz + lowDifference.xyz , 1.);
				vec4 end = modelViewMatrix * computeRelativePositionSeparate(instanceEndLow.xyz, instanceEnd.xyz, uViewer_low, uViewer_high);
            #else
                vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
                vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );
            #endif

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					trimSegment( start, end );

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					trimSegment( end, start );

				}

			}

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				// get the offset direction as perpendicular to the view vector
				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 offset;
				if ( computedPosition.y < 0.5 ) {

					offset = normalize( cross( start.xyz, worldDir ) );

				} else {

					offset = normalize( cross( end.xyz, worldDir ) );

				}

				// sign flip
				if ( computedPosition.x < 0.0 ) offset *= - 1.0;

				float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// extend the line bounds to encompass  endcaps
					start.xyz += - worldDir * linewidth * 0.5;
					end.xyz += worldDir * linewidth * 0.5;

					// shift the position of the quad so it hugs the forward edge of the line
					offset.xy -= dir * forwardOffset;
					offset.z += 0.5;

				#endif

				// endcaps
				if ( computedPosition.y > 1.0 || computedPosition.y < 0.0 ) {

					offset.xy += dir * 2.0 * forwardOffset;

				}

				// debugColor = vec3(0., 0., 1.);
				correctedLineWidth = linewidth;
				vec3 cOffset = offset;
				
				// adjust for linewidth
				offset *= linewidth * 0.5;

				// set the world position
				worldPos = ( computedPosition.y < 0.5 ) ? start : end;

				/*
				Not great, not terrible
				*/
				float pixelSize = length(vec2(pixelThreshold/resolution.x + pixelThreshold/resolution.y));
				float offsetStep = linewidth;
				float d = screenSpaceDistance(worldPos, worldPos + vec4(cOffset * offsetStep, 0.));
				/* We're trying to start off with a step closer to the initial difference between SS distance and the pixel size we want
				*/
				// offsetStep += pixelSize - d;
				vec3 move = offset;
				
				for(int i = 0; i < SEARCH_STEPS; i++){
					move = cOffset * offsetStep;
					d = screenSpaceDistance(worldPos, worldPos + vec4(move, 0.));
					if(d > pixelSize) {
						correctedLineWidth = offsetStep;
						break;
					}
					offsetStep += offsetStep;
				}

				worldPos.xyz += move;

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( computedPosition.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( computedPosition.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( computedPosition.y < 0.0 ) {

					offset += - dir;

				} else if ( computedPosition.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( computedPosition.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( computedPosition.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`
