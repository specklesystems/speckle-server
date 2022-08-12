export const speckleStandardVert = /* glsl */ `
#define STANDARD
#ifdef USE_RTE
    // The high component is stored as the default 'position' attribute buffer
    attribute vec3 position_low;
    uniform vec3 uViewer_high;
    uniform vec3 uViewer_low;
    uniform mat4 rteShadowMatrix;
#endif

varying vec3 vViewPosition;

#ifdef USE_TRANSMISSION

    varying vec3 vWorldPosition;

#endif

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>



void main() {

    #include <uv_vertex>
    #include <uv2_vertex>
    #include <color_vertex>
    #include <morphcolor_vertex>
    #include <beginnormal_vertex>
    #include <morphnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
    #include <normal_vertex>

    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <displacementmap_vertex>
    //#include <project_vertex> // EDITED CHUNK
    #ifdef USE_RTE
        /* 
        Source https://github.com/virtualglobebook/OpenGlobe/blob/master/Source/Examples/Chapter05/Jitter/GPURelativeToEyeDSFUN90/Shaders/VS.glsl 
        Note here, we're storing the high part of the position encoding inside three's default 'position' attribute buffer so we avoid redundancy 
        */
        vec3 t1 = position_low.xyz - uViewer_low;
        vec3 e = t1 - position_low.xyz;
        vec3 t2 = ((-uViewer_low - e) + (position_low.xyz - (t1 - e))) + position.xyz - uViewer_high;
        vec3 highDifference = t1 + t2;
        vec3 lowDifference = t2 - (highDifference - t1);
        vec3 localPosition = highDifference.xyz + lowDifference.xyz;
        vec4 mvPosition = vec4(localPosition, 1.);
    #else
        vec4 mvPosition = vec4( transformed, 1.0 );
    #endif
    
    #ifdef USE_INSTANCING

        mvPosition = instanceMatrix * mvPosition;

    #endif
    mvPosition = modelViewMatrix * mvPosition;

    gl_Position = projectionMatrix * mvPosition;


    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>

    vViewPosition = - mvPosition.xyz;

    #include <worldpos_vertex>
    // #include <shadowmap_vertex> COMMENTED CHUNK!!!
    #ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SPOT_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0
		// Offsetting the position used for querying occlusion along the world normal can be used to reduce shadow acne.
		vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		vec4 shadowWorldPosition;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
        #ifdef USE_RTE
            shadowWorldPosition = vec4(localPosition, 1.) + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
            vDirectionalShadowCoord[ i ] = rteShadowMatrix * shadowWorldPosition;
        #else
            shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
            vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
        #endif
        
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias, 0 );
		vSpotShadowCoord[ i ] = spotShadowMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
		vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
	#endif
	/*
	#if NUM_RECT_AREA_LIGHTS > 0
		// TODO (abelnation): update vAreaShadowCoord with area light info
	#endif
	*/
    #endif

    #include <fog_vertex>

#ifdef USE_TRANSMISSION

    vWorldPosition = worldPosition.xyz;

#endif
}
`
