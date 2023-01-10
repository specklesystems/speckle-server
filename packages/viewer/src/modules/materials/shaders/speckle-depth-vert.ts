export const speckleDepthVert = /* glsl */ `
#include <common>
#ifdef USE_RTE
    // The high component is stored as the default 'position' attribute buffer
    attribute vec3 position_low;
    uniform vec3 uViewer_high;
    uniform vec3 uViewer_low;
    uniform mat4 rteModelViewMatrix;
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
    
    mvPosition = rteModelViewMatrix * mvPosition;

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
