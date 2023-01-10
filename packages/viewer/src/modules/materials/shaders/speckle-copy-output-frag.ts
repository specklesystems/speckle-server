export const speckleCopyOutputFrag = `
    uniform float opacity;
    uniform sampler2D tDiffuse;
    varying vec2 vUv;

    const float UnpackDownscale = 255. / 256.;
    const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
    const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

    float unpackRGBAToDepth( const in vec4 v ) {
        return dot( v, UnpackFactors );
    }

    vec3 unpackRGBToNormal( const in vec3 rgb ) {
        return 2.0 * rgb.xyz - 1.0;
    }

    void main() {
        vec4 inSample = texture2D( tDiffuse, vUv );
        vec3 outSample = inSample.rgb;
        #if OUTPUT_TYPE == 1
            outSample.rgb = vec3(unpackRGBAToDepth(inSample));
        #endif
        // #if OUTPUT_TYPE == 3
        //     outSample.rgb = unpackRGBToNormal(inSample.rgb);
        // #endif

        gl_FragColor.rgb = outSample;
        gl_FragColor.a = 1.;
    }`
