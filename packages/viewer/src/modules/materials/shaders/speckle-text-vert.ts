export const speckleTextVert = /* glsl */ `
#include <common>
#ifdef USE_RTE
    uniform vec3 uViewer_high;
    uniform vec3 uViewer_low;
#endif

#ifdef BILLBOARD
    uniform vec2 screenSize;
    uniform mat4 invProjection;
    #ifdef BILLBOARD_PIXEL_HEIGHT
        uniform float billboardPixelHeight;
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

// mat4 getTextTransform(){
//     #ifdef BATCHED_TEXT
//         return mat4(
//             troikaBatchTexel(0.0), 
//             troikaBatchTexel(1.0), 
//             troikaBatchTexel(2.0), 
//             troikaBatchTexel(3.0)
//         );
//     #else
//         return modelMatrix;
//     #endif
// }

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

    vec4 mvPosition;
    mat4 matrix;

    #ifdef BATCHED_TEXT
        matrix = mat4(
            troikaBatchTexel(0.0), 
            troikaBatchTexel(1.0), 
            troikaBatchTexel(2.0), 
            troikaBatchTexel(3.0)
        );
    #else
        matrix =  modelMatrix;
    #endif

    #ifdef USE_RTE
        /* We store the high part normally as the translation component */
        vec3 translationHigh = matrix[3].xyz;
        /** We store the low part of the translation in row4 ofthe matrix */
        vec3 translationLow = vec3(matrix[0][3], matrix[1][3], matrix[2][3]);
        highp vec4 rteTranslation = computeRelativePosition(translationLow, translationHigh, uViewer_low, uViewer_high);
        #if defined(BILLBOARD)
            mvPosition = (modelViewMatrix * rteTranslation + vec4(position.x, position.y, 0., 0.0));
        #else
             mvPosition = vec4(mat3(matrix) * transformed + rteTranslation.xyz, 1.);
             mvPosition = modelViewMatrix * mvPosition;
        #endif
    #else
        #if defined(BILLBOARD)
            vec3 billboardPosition = matrix[3].xyz;
            #if defined(BILLBOARD_FIXED)
                vec2 billboardPixelSize = troikaBatchTexel(9.0).y / screenSize;
                gl_Position = projectionMatrix * (viewMatrix * vec4(billboardPosition, 1.0));
                float div = gl_Position.w;
                gl_Position /= gl_Position.w;
                gl_Position.xy += position.xy * billboardPixelSize;
            #else
                mvPosition = (modelViewMatrix * vec4(billboardPosition, 1.) + vec4(position.x, position.y, 0., 0.0));
            #endif
        #else
             mvPosition = matrix * vec4(transformed, 1.);
             mvPosition = modelViewMatrix * mvPosition;
        #endif
    #endif

    gl_Position = projectionMatrix * mvPosition;

    // #if defined(BILLBOARD)
    //     float div = 1.;
    //     /* We store the high part normally as the translation component */
    //     vec3 translationHigh = matrix[3].xyz;
    //     /** We store the low part of the translation in row4 ofthe matrix */
    //     vec3 translationLow = vec3(matrix[0][3], matrix[1][3], matrix[2][3]);
    //     highp vec4 rteTranslation = computeRelativePosition(translationLow, translationHigh, uViewer_low, uViewer_high);
    //     gl_Position = projectionMatrix * (modelViewMatrix * rteTranslation + vec4(position.x, position.y, 0., 0.0));
    //     #if defined(BILLBOARD_FIXED)
    //         vec3 billboardPosition = matrix[3].xyz;
    //         vec2 billboardPixelSize = troikaBatchTexel(9.0).y / screenSize;
    //         gl_Position = projectionMatrix * (viewMatrix * vec4(billboardPosition, 1.0));
    //         float div = gl_Position.w;
    //         gl_Position /= gl_Position.w;
    //         gl_Position.xy += position.xy * billboardPixelSize;
    //     #endif
    // #else
    //     #ifdef USE_RTE
    //         /* We store the high part normally as the translation component */
    //         vec3 translationHigh = matrix[3].xyz;
    //         /** We store the low part of the translation in row4 ofthe matrix */
    //         vec3 translationLow = vec3(matrix[0][3], matrix[1][3], matrix[2][3]);
    //         highp vec4 rteTranslation = computeRelativePosition(translationLow, translationHigh, uViewer_low, uViewer_high);
    //         mvPosition = vec4(mat3(matrix) * transformed + rteTranslation.xyz, 1.);
    //     #else
    //         mvPosition = matrix * vec4(transformed, 1.);
    //     #endif
        
    //     mvPosition = modelViewMatrix * mvPosition;
    //     gl_Position = projectionMatrix * mvPosition;
    // #endif

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
