export const speckleTextVert = /* glsl */ `
#include <common>
#ifdef USE_RTE
    // The high component is stored as the default 'position' attribute buffer
    attribute vec3 position_low;
    uniform vec3 uViewer_high;
    uniform vec3 uViewer_low;
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

#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

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

#if defined(BILLBOARD) || defined(BILLBOARD_FIXED)
    uniform vec3 billboardPos;
    uniform mat4 invProjection;
#endif
#ifdef BILLBOARD_FIXED
    uniform vec2 billboardSize;
#endif

void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	// #include <project_vertex> COMMENTED CHUNK
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
    
    #if defined(BILLBOARD)
        float div = 1.;
        gl_Position = projectionMatrix * (viewMatrix * vec4(billboardPos, 1.0) + vec4(position.x, position.y, 0., 0.0));
    #elif defined(BILLBOARD_FIXED)
        gl_Position = projectionMatrix * (viewMatrix * vec4(billboardPos, 1.0));
        float div = gl_Position.w;
        gl_Position /= gl_Position.w;
        gl_Position.xy += position.xy * billboardSize;
    #else
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
    #endif
	#include <logdepthbuf_vertex>
	// #include <clipping_planes_vertex> COMMENTED CHUNK
    #if NUM_CLIPPING_PLANES > 0
        #if defined(BILLBOARD) || defined(BILLBOARD_FIXED)
            vec4 movelViewProjection = gl_Position * div;
            vClipPosition = - (invProjection * movelViewProjection).xyz;
        #else
	        vClipPosition = - mvPosition.xyz;
        #endif
    #endif
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}
`
