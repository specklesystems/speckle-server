export const speckle_standard_vert = /* glsl */ `
#define STANDARD
attribute vec3 position_high;
attribute vec3 position_low;

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

uniform vec3 uViewer_high;
uniform vec3 uViewer_low;

void main() {

    #include <uv_vertex>
    #include <uv2_vertex>
    #include <color_vertex>

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
    vec3 highDifference = vec3(position_high.xyz - uViewer_high);
    vec3 lowDifference = vec3(position_low.xyz - uViewer_low);
    vec4 mvPosition = vec4(highDifference.xyz + lowDifference.xyz , 1.);//vec4( transformed - uViewer, 1.0 );
    
    #ifdef USE_INSTANCING

        mvPosition = instanceMatrix * mvPosition;

    #endif
    mvPosition = modelViewMatrix * mvPosition;

    gl_Position = projectionMatrix * mvPosition;


    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>

    vViewPosition = - mvPosition.xyz;

    #include <worldpos_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>

#ifdef USE_TRANSMISSION

    vWorldPosition = worldPosition.xyz;

#endif
}
`
