export const speckleBasicVert = /* glsl */ `
#include <common>
#ifdef USE_RTE
    // The high component is stored as the default 'position' attribute buffer
    attribute vec3 position_low;
    uniform vec3 uViewer_high;
    uniform vec3 uViewer_low;
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
		/* 
        Source https://github.com/virtualglobebook/OpenGlobe/blob/master/Source/Examples/Chapter05/Jitter/GPURelativeToEyeDSFUN90/Shaders/VS.glsl 
        Note here, we're storing the high part of the position encoding inside three's default 'position' attribute buffer so we avoid redundancy 
        */
        vec3 t1 = position_low.xyz - uViewer_low;
        vec3 e = t1 - position_low.xyz;
        vec3 t2 = ((-uViewer_low - e) + (position_low.xyz - (t1 - e))) + position.xyz - uViewer_high;
        vec3 highDifference = t1 + t2;
        vec3 lowDifference = t2 - (highDifference - t1);
        vec4 mvPosition = vec4(highDifference.xyz + lowDifference.xyz , 1.);
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
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}
`
