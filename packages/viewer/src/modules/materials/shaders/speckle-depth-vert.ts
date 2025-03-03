export const speckleDepthVert = /* glsl */ `
#include <common>
#ifdef USE_RTE
    // The high component is stored as the default 'position' attribute buffer
    attribute vec3 position_low;
    uniform vec3 uViewer_high;
    uniform vec3 uViewer_low;
    uniform mat4 rteModelViewMatrix;
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

#ifdef LINEAR_DEPTH
    varying vec4 vViewPosition;
#endif

#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
// This is used for computing an equivalent of gl_FragCoord.z that is as high precision as possible.
// Some platforms compute gl_FragCoord at a lower precision which makes the manually computed value better for
// depth-based postprocessing effects. Reproduced on iPad with A10 processor / iPadOS 13.3.1.
varying vec2 vHighPrecisionZW;

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

    highp vec3 rotate_vertex_position_delta(highp vec4 v0, highp vec4 v1, highp vec4 quat)
    {
        /** !!! WORKAROUND FOR Intel IrisXe CARDS !!! */
        /** The code below will not produce correct results in intel IrisXE integrated GPUs. 
         *  The geometry will turn mangled, albeit stable
         *  I can't know for sure what is going on, but rotating the difference seems to 
         *  force the result into a lower precision?
         */
        // highp vec4 position = v0 - v1;
        // return position.xyz + 2.0 * cross(quat.xyz, cross(quat.xyz, position.xyz) + quat.w * position.xyz);

        /** Subtracting the rotated vectors works. */
        return rotate_vertex_position(v0.xyz, quat) - rotate_vertex_position(v1.xyz, quat);

        /** An alternate workaround is
         * highp vec3 position = (v0.xyz * (1. + 1e-7)) - (v1.xyz * (1. _ 1e-7));
           return position + 2.0 * cross(quat.xyz, cross(quat.xyz, position) + quat.w * position);

           However I'm not such a fan of the (1. + 1e-7) part
         */
    }

    
#endif

#ifdef USE_RTE
    highp vec4 computeRelativePosition(in highp vec3 position_low, in highp vec3 position_high, in highp vec3 relativeTo_low, in highp vec3 relativeTo_high){
        /* 
        Source https://github.com/virtualglobebook/OpenGlobe/blob/master/Source/Examples/Chapter05/Jitter/GPURelativeToEyeDSFUN90/Shaders/VS.glsl 
        Note here, we're storing the high part of the position encoding inside three's default 'position' attribute buffer so we avoid redundancy 
        */
        highp vec3 t1 = position_low.xyz - relativeTo_low.xyz;
        highp vec3 e = t1 - position_low.xyz;
        /** This is redunant, but necessary as a workaround for Apple platforms */
        highp float x = position_high.x - relativeTo_high.x;
        highp float y = position_high.y - relativeTo_high.y;
        highp float z = position_high.z - relativeTo_high.z;
        highp vec3 v = vec3(x, y, z);
        /** End of redundant part */
        highp vec3 t2 = ((-relativeTo_low - e) + (position_low.xyz - (t1 - e))) + v;
        highp vec3 highDifference = t1 + t2;
        highp vec3 lowDifference = t2 - (highDifference.xyz - t1.xyz);
        
        highp vec3 position = highDifference.xyz + lowDifference.xyz;
        return vec4(position, 1.);
    }
#endif


void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
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

        vec4 rteLocalPosition = computeRelativePosition(position_lowT.xyz, position_highT.xyz, uViewer_low, uViewer_high);
        #ifdef TRANSFORM_STORAGE
            vec4 rtePivot = computeRelativePosition(tPivotLow.xyz, tPivotHigh.xyz, uViewer_low, uViewer_high);
            rteLocalPosition.xyz = rotate_vertex_position_delta(rteLocalPosition, rtePivot, tQuaternion) * tScale.xyz + rtePivot.xyz + tTranslation.xyz;
        #endif
        #ifdef USE_INSTANCING
            vec4 instancePivot = computeRelativePosition(ZERO3, ZERO3, uViewer_low, uViewer_high);
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
   
    #ifdef USE_RTE
        mvPosition = rteModelViewMatrix * mvPosition;
    #else
        mvPosition = modelViewMatrix * mvPosition;
    #endif
    
    #ifdef LINEAR_DEPTH
        vViewPosition = mvPosition;
    #endif 
    
    gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	// #include <clipping_planes_vertex>
    #if NUM_CLIPPING_PLANES > 0
	    vClipPosition = - mvPosition.xyz;
    #endif
	vHighPrecisionZW = gl_Position.zw;
}
`
