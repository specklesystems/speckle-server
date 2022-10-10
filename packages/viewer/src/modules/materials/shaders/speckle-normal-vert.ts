export const speckleNormalVert = /* glsl */ `
#define NORMAL
#ifdef USE_RTE
    // The high component is stored as the default 'position' attribute buffer
    attribute vec3 position_low;
    uniform vec3 uViewer_high;
    uniform vec3 uViewer_low;
#endif
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

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
        vec4 mvPosition = computeRelativePosition(position_low.xyz, position.xyz, uViewer_low, uViewer_high);
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
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
	vViewPosition = - mvPosition.xyz;
#endif
}
`
