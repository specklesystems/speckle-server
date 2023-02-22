export const speckleStaticAoAccumulateFrag = /* glsl */ `
    uniform float opacity;
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    // #define NUM_FRAMES 16

    void main() {
        vec4 frameSample = texture2D( tDiffuse, vUv );
        gl_FragColor.xyz = frameSample.rgb * 1./float(NUM_FRAMES);
        gl_FragColor.a = 1.;//*= opacity;
    }`
