export const speckleGhostVert = /* glsl */ `
#include <common>
#ifdef USE_RTE
    // The high component is stored as the default 'position' attribute buffer
    attribute vec3 position_low;
    uniform vec3 uViewer_high;
    uniform vec3 uViewer_low;
#endif

attribute float objIndex;

#if TRANSFORM_STORAGE == 0
    uniform sampler2D tTransforms;
    const vec2 cUv = vec2(0.5/float(OBJ_COUNT * 3), 0.5);
    const vec2 dUv = vec2(1./float(OBJ_COUNT * 3), 0.);
#elif TRANSFORM_STORAGE == 1
    uniform mat4 uTransforms[OBJ_COUNT];
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

mat4 objectTransform(){
    #if TRANSFORM_STORAGE == 0
        #if __VERSION__ == 300
            ivec2 uv = ivec2(int(objIndex)*3, 0); 
            vec4 r0 = texelFetch( tTransforms, uv, 0 );
            vec4 r1 = texelFetch( tTransforms, uv + ivec2(1, 0), 0);
            vec4 r2 = texelFetch( tTransforms, uv + ivec2(2, 0), 0);
            return mat4(
                r0.x, r1.x, r2.x, 0.,
                r0.y, r1.y, r2.y, 0.,
                r0.z, r1.z, r2.z, 0.,
                r0.w, r1.w, r2.w, 1.
            );
        #elif
            float size = float(OBJ_COUNT * 3);
            vec2 uv = vec2((objIndex * 3.)/size + cUv.x, cUv.y);
            vec4 r0 = texture2D( tTransforms, uv);
            vec4 r1 = texture2D( tTransforms, uv + dUv);
            vec4 r2 = texture2D( tTransforms, uv + 2. * dUv);
             return mat4(
                r0.x, r1.x, r2.x, 0.,
                r0.y, r1.y, r2.y, 0.,
                r0.z, r1.z, r2.z, 0.,
                r0.w, r1.w, r2.w, 1.
            );
        #endif
    #elif TRANSFORM_STORAGE == 1
        return uTransforms[int(objIndex)];
    #endif
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
    #ifdef USE_RTE
        vec4 mvPosition = objectTransform() * computeRelativePositionSeparate(position_low.xyz, position.xyz, uViewer_low, uViewer_high);
    #else
        vec4 mvPosition = objectTransform() * vec4( transformed, 1.0 );
    #endif
    
    #ifdef USE_INSTANCING

        mvPosition = instanceMatrix * mvPosition;

    #endif
    mvPosition = modelViewMatrix * mvPosition;

    gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}
`
