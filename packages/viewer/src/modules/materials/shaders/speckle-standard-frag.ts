export const speckleStandardFrag = /* glsl */ `
#define STANDARD

#ifdef PHYSICAL
    #define IOR
    #define SPECULAR
#endif

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;

#ifdef IOR
    uniform float ior;
#endif

#ifdef SPECULAR
    uniform float specularIntensity;
    uniform vec3 specularColor;

    #ifdef USE_SPECULARINTENSITYMAP
        uniform sampler2D specularIntensityMap;
    #endif

    #ifdef USE_SPECULARCOLORMAP
        uniform sampler2D specularColorMap;
    #endif
#endif

#ifdef USE_CLEARCOAT
    uniform float clearcoat;
    uniform float clearcoatRoughness;
#endif

#ifdef USE_SHEEN
    uniform vec3 sheenColor;
    uniform float sheenRoughness;

    #ifdef USE_SHEENCOLORMAP
        uniform sampler2D sheenColorMap;
    #endif

    #ifdef USE_SHEENROUGHNESSMAP
        uniform sampler2D sheenRoughnessMap;
    #endif
#endif

varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
/** We're disabling color grading for now until we want to properly offer it to the users */
//#define CUSTOM_TONEMAPPING 

#ifdef CUSTOM_TONEMAPPING

	uniform float contrast;
	uniform float saturation;
	uniform float whitescale;
	vec3 EvalLogContrastFunc(vec3 col, float eps, float logMidpoint, float contrastFactor)
	{
		vec3 x = max(vec3(0.), col);
		vec3 logX = log2(x+vec3(eps));
		vec3 adjX = vec3(logMidpoint) + (logX - vec3(logMidpoint)) * contrastFactor;
		vec3 ret = max(vec3(0.0), exp2(adjX) - vec3(eps));
		return ret;
	}

	vec3 evalSaturation(vec3 rgbVal, float saturationFactor){
		vec3 lumaWeights = vec3(.25,.50,.25);
		vec3 grey = vec3(dot(lumaWeights,rgbVal));
		return grey + saturationFactor*(rgbVal-grey);
	}

	vec3 evalExposure(vec3 rgbVal, float exposureFactor){
		return rgbVal * exp2(exposureFactor);
	}

	vec3 filmicTonemap(vec3 x) {
		float A = 0.15;
		float B = 0.50;
		float C = 0.10;
		float D = 0.20;
		float E = 0.02;
		float F = 0.30;
		float W = 11.2;
		return ((x*(A*x+C*B)+D*E) / (x*(A*x+B)+D*F))- E / F;
	}


	vec3 applyFilmicToneMap( vec3 color) 
	{
		color = 2.0 * filmicTonemap( color);
		vec3 whiteScale = 1.0 / filmicTonemap(vec3(11.2));
		color *= whiteScale;
		return color;
	}

	vec3 postProcess(in vec3 _color, float exposureFactor, float contrastFactor, float saturationFactor){
		vec3 color = _color;

		// color.rgb *= exposureFactor;
		color.rgb = evalSaturation(color.rgb, saturationFactor);
		color = EvalLogContrastFunc(color, 0.0001, 0.18, contrastFactor);
		color.rgb = ACESFilmicToneMapping( color );//applyFilmicToneMap(color.rgb);
		return color;
	}
#endif

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <bsdfs>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

const float TERR_HEIGHT = 26.0;
const vec3 COLOR_SNOW = vec3(1.0,1.0,1.1) * 2.2;
const vec3 COLOR_ROCK = vec3(0.0,0.0,0.1);

vec3 terr_color(in vec3 p, in vec3 n, in vec3 underColor) {
    float slope = 1.0-dot(n,vec3(0.,0.,1.));     
    vec3 ret = mix(COLOR_SNOW,underColor,smoothstep(0.0,0.2,slope*slope));
    ret = mix(ret,COLOR_SNOW,saturate(smoothstep(0.6,0.8,slope+(p.z-TERR_HEIGHT*0.5)*0.05)));
    return ret;
}

void main() {

    #include <clipping_planes_fragment>
    vec4 diffuseColor = vec4( diffuse, opacity );
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    vec3 totalEmissiveRadiance = emissive;

    #include <normal_fragment_begin>
    #ifdef OBJECTSPACE_NORMALMAP

        normal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

        #ifdef FLIP_SIDED

            normal = - normal;

        #endif

        #ifdef DOUBLE_SIDED

            normal = normal * faceDirection;

        #endif

        normal = normalize( normalMatrix * normal );

    #elif defined( TANGENTSPACE_NORMALMAP )

        vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
        mapN.xy *= normalScale;

        #ifdef USE_TANGENT

            normal = normalize( vTBN * mapN );

        #else

            normal = perturbNormal2Arb( - vViewPosition, normal, mapN, faceDirection );

        #endif

    #elif defined( USE_BUMPMAP )

        normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );

    #endif
    vec3 snowColor = terr_color(vWorldPosition, inverseTransformDirection(normal, viewMatrix), diffuseColor.rgb);
    float snowAmount = step(0.9, snowColor.x);
    normal = mix(normal, vec3(0.5,0.5,1), snowAmount);
    diffuseColor.rgb = snowColor;

    #include <logdepthbuf_fragment>
    #include <map_fragment>
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <roughnessmap_fragment>
    #include <metalnessmap_fragment>
    // #include <normal_fragment_begin>
    // #include <normal_fragment_maps>
    
    #include <clearcoat_normal_fragment_begin>
    #include <clearcoat_normal_fragment_maps>
    #include <emissivemap_fragment>

    
    // accumulation
    #include <lights_physical_fragment>
    #include <lights_fragment_begin>
    #include <lights_fragment_maps>
    #include <lights_fragment_end>

    // modulation
    #include <aomap_fragment>

    vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
    vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;

    #include <transmission_fragment>

    vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;

    #ifdef USE_SHEEN

        // Sheen energy compensation approximation calculation can be found at the end of
        // https://drive.google.com/file/d/1T0D1VSyR4AllqIJTQAraEIzjlb5h4FKH/view?usp=sharing
        float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );

        outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecular;

    #endif

    #ifdef USE_CLEARCOAT

        float dotNVcc = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );

        vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );

        outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + clearcoatSpecular * material.clearcoat;

    #endif

    // #include <output_fragment> COMMENTED CHUNK
    #ifdef OPAQUE
        diffuseColor.a = 1.0;
    #endif

    // https://github.com/mrdoob/three.js/pull/22425
    #ifdef USE_TRANSMISSION
        diffuseColor.a *= transmissionAlpha + 0.1;
    #endif

    gl_FragColor = vec4( normal, diffuseColor.a );
    // #include <tonemapping_fragment> // COMMENTED OUT
    #ifdef TONE_MAPPING
		#ifdef CUSTOM_TONEMAPPING
			gl_FragColor.rgb = postProcess(gl_FragColor.rgb, toneMappingExposure, contrast, saturation);
		#else
			gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
		#endif
	#endif
    #include <encodings_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <dithering_fragment>

}
`
