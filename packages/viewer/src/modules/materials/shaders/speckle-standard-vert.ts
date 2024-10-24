export const speckleStandardVert = /* glsl */ `
#define STANDARD
#ifdef USE_RTE
    // The high component is stored as the default 'position' attribute buffer
    attribute vec3 position_low;
    uniform vec3 uViewer_high;
    uniform vec3 uViewer_low;
    uniform mat4 rteShadowMatrix;
    uniform vec3 uShadowViewer_high;
    uniform vec3 uShadowViewer_low;
#endif

#ifdef TRANSFORM_STORAGE
    attribute float objIndex;

    #if TRANSFORM_STORAGE == 0
        #if __VERSION__ == 300
            #define TRANSFORM_STRIDE 4
        #else
            #define TRANSFORM_STRIDE 4.
        #endif
        uniform sampler2D tTransforms;
        uniform float objCount;
    #elif TRANSFORM_STORAGE == 1
        uniform mat4 uTransforms[OBJ_COUNT];
    #endif
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

#ifdef TRANSFORM_STORAGE
    void objectTransform(out vec4 quaternion, out vec4 pivotLow, out vec4 pivotHigh, out vec4 translation, out vec4 scale){
        #if TRANSFORM_STORAGE == 0
            #if __VERSION__ == 300
                ivec2 uv = ivec2(int(objIndex) * TRANSFORM_STRIDE, 0); 
                vec4 v0 = texelFetch( tTransforms, uv, 0 );
                vec4 v1 = texelFetch( tTransforms, uv + ivec2(1, 0), 0);
                vec4 v2 = texelFetch( tTransforms, uv + ivec2(2, 0), 0);
                vec4 v3 = texelFetch( tTransforms, uv + ivec2(3, 0), 0);
                quaternion = v0;
                pivotLow = vec4(v1.xyz, 1.);
                pivotHigh = vec4(v2.xyz, 1.);
                translation = vec4(v3.xyz, 1.);
                scale = vec4(v1.w, v2.w, v3.w, 1.);
            #else
                float size = objCount * TRANSFORM_STRIDE;
                vec2 cUv = vec2(0.5/size, 0.5);
                vec2 dUv = vec2(1./size, 0.);
                
                vec2 uv = vec2((objIndex * TRANSFORM_STRIDE)/size + cUv.x, cUv.y);
                vec4 v0 = texture2D( tTransforms, uv);
                vec4 v1 = texture2D( tTransforms, uv + dUv);
                vec4 v2 = texture2D( tTransforms, uv + 2. * dUv);
                vec4 v3 = texture2D( tTransforms, uv + 3. * dUv);
                quaternion = v0;
                pivotLow = vec4(v1.xyz, 1.);
                pivotHigh = vec4(v2.xyz, 1.);
                translation = vec4(v3.xyz, 1.);
                scale = vec4(v1.w, v2.w, v3.w, 1.);
            #endif
        #elif TRANSFORM_STORAGE == 1
            mat4 tMatrix = uTransforms[int(objIndex)];
            quaternion = tMatrix[0];
            pivotLow = vec4(tMatrix[1].xyz, 1.);
            pivotHigh = vec4(tMatrix[2].xyz, 1.);
            translation = vec4(tMatrix[3].xyz, 1.);
            scale = vec4(tMatrix[1][3], tMatrix[2][3], tMatrix[3][3], 1.);
        #endif
    }

    vec3 rotate_vertex_position(vec3 position, vec4 quat)
    { 
        return position + 2.0 * cross(quat.xyz, cross(quat.xyz, position) + quat.w * position);
    }
#endif

#ifdef USE_RTE
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
#endif



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
    
    #ifdef TRANSFORM_STORAGE
        vec4 tQuaternion, tPivotLow, tPivotHigh, tTranslation, tScale;
        objectTransform(tQuaternion, tPivotLow, tPivotHigh, tTranslation, tScale);
    #endif
    #ifdef USE_RTE
        vec4 position_lowT = vec4(position_low, 1.);
        vec4 position_highT = vec4(position, 1.);
        const vec3 ZERO3 = vec3(0., 0., 0.);

        vec4 rteLocalPosition = computeRelativePositionSeparate(position_lowT.xyz, position_highT.xyz, uViewer_low, uViewer_high);
        #ifdef TRANSFORM_STORAGE
            vec4 rtePivot = computeRelativePositionSeparate(tPivotLow.xyz, tPivotHigh.xyz, uViewer_low, uViewer_high);
            rteLocalPosition.xyz = rotate_vertex_position((rteLocalPosition - rtePivot).xyz, tQuaternion) * tScale.xyz + rtePivot.xyz + tTranslation.xyz;
        #endif
        #ifdef USE_INSTANCING
            vec4 instancePivot = computeRelativePositionSeparate(ZERO3, ZERO3, uViewer_low, uViewer_high);
            rteLocalPosition.xyz = (mat3(instanceMatrix) * (rteLocalPosition - instancePivot).xyz) + instancePivot.xyz + instanceMatrix[3].xyz;
        #endif
    #endif

    #ifdef USE_RTE
        vec4 mvPosition = rteLocalPosition;
    #else
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
            mvPosition = instanceMatrix * mvPosition;
        #endif
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
        vec4 shadowPosition = vec4(transformed, 1.0);
        mat4 shadowMatrix = directionalShadowMatrix[ i ];

        #ifdef USE_RTE
            shadowPosition = computeRelativePositionSeparate(position_low.xyz, position.xyz, uShadowViewer_low, uShadowViewer_high);
            shadowMatrix = rteShadowMatrix;
        #endif
        #ifdef TRANSFORM_STORAGE
            vec4 rtePivotShadow = computeRelativePositionSeparate(tPivotLow.xyz, tPivotHigh.xyz, uShadowViewer_low, uShadowViewer_high);
            shadowPosition.xyz = rotate_vertex_position((shadowPosition - rtePivotShadow).xyz, tQuaternion) * tScale.xyz + rtePivotShadow.xyz + tTranslation.xyz;
        #endif
        #ifdef USE_INSTANCING
            vec4 rtePivotShadow = computeRelativePositionSeparate(ZERO3, ZERO3, uShadowViewer_low, uShadowViewer_high);
            shadowPosition.xyz = (mat3(instanceMatrix) * (shadowPosition - rtePivotShadow).xyz) + rtePivotShadow.xyz + instanceMatrix[3].xyz;
        #endif
        shadowWorldPosition = modelMatrix * shadowPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
        vDirectionalShadowCoord[ i ] = shadowMatrix * shadowWorldPosition;
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
