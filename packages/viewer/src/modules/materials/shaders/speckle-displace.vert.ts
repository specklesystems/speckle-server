export const speckleDisplaceVert = /* glsl */ `
#include <common>
#ifdef USE_RTE
    // The high component is stored as the default 'position' attribute buffer
    attribute vec3 position_low;
    uniform vec3 uViewer_high;
    uniform vec3 uViewer_low;
#endif
uniform vec2 size;
uniform float displacement;
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

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
        vec4 mvPosition = computeRelativePositionSeparate(position_low.xyz, position.xyz, uViewer_low, uViewer_high);
    #else
        vec4 mvPosition = vec4( transformed, 1.0 );
    #endif
    
    #ifdef USE_INSTANCING

        mvPosition = instanceMatrix * mvPosition;

    #endif
    mvPosition = modelViewMatrix * mvPosition;

    gl_Position = projectionMatrix * mvPosition;
    
    // Transform normal vector from object space to clip space.
    vec3 normalHCS = mat3(projectionMatrix) * normalMatrix * normal;

    // Move vertex along normal vector in clip space.
    gl_Position.xy += normalize(normalHCS.xy) / size * gl_Position.w * displacement * 2.;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}
`
