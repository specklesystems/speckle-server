export const specklePointVert = /* glsl */ `
uniform float size;
uniform float scale;

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef USE_RTE
    // The high component is stored as the default 'position' attribute buffer
    attribute vec3 position_low;
    uniform vec3 uViewer_high;
    uniform vec3 uViewer_low;
#endif

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

#ifdef USE_GRADIENT_RAMP
    attribute float gradientIndex;
    varying float vGradientIndex;
#endif

void main() {

	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	// #include <project_vertex> COMMENTED CHUNK
	#ifdef USE_RTE
        vec4 mvPosition = computeRelativePosition(position_low.xyz, position.xyz, uViewer_low, uViewer_high);
    #else
        vec4 mvPosition = vec4( transformed, 1.0 );
    #endif
    
    #ifdef USE_INSTANCING

        mvPosition = instanceMatrix * mvPosition;

    #endif
    mvPosition = modelViewMatrix * mvPosition;

    #ifdef USE_GRADIENT_RAMP
        vGradientIndex = gradientIndex;
    #endif

    gl_Position = projectionMatrix * mvPosition;

	gl_PointSize = size;

	#ifdef USE_SIZEATTENUATION

		bool isPerspective = isPerspectiveMatrix( projectionMatrix );

		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );

	#endif

	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>

}
`
