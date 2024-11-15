export const speckleTemporalSupersamplingFrag = /* glsl */ `
    uniform float height;
    uniform float width;
    uniform sampler2D tDiffuse;
    uniform sampler2D tLastFrame;
    varying vec2 Uv;

    #define LuminanceEncodeApprox vec3(0.2126, 0.7152, 0.0722)
    float getLuminance(vec3 color) {
        return clamp(dot(color, LuminanceEncodeApprox), 0., 1.);
    }
    
    void main() {
        vec4 texel = texture2D(tDiffuse, Uv);
        vec2 oldPixelUv = Uv;
        vec4 oldTexel = texture2D(tLastFrame, oldPixelUv);

        // Use simple neighbor clamping
        vec4 maxNeighbor = vec4(0.0, 0.0, 0.0, 1.0);
        vec4 minNeighbor = vec4(1.0);
        vec4 average = vec4(0.0);
        for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
                vec2 neighborUv = Uv + vec2(float(x) / width, float(y) / height);
                vec4 neighborTexel = texture2D(tDiffuse, neighborUv);
                maxNeighbor = max(maxNeighbor, neighborTexel);
                minNeighbor = min(minNeighbor, neighborTexel);
                average += neighborTexel / 9.0;
            }
        }
        float lum0 = getLuminance(texel.rgb);
        float lum1 = getLuminance(oldTexel.rgb);

        float unbiased_diff = abs(lum0 - lum1) / max(lum0, max(lum1, 0.2));
        float unbiased_weight = 1.0 - unbiased_diff;
        float unbiased_weight_sqr = unbiased_weight * unbiased_weight;
        float k_feedback = mix(0.8800, 0.9700, unbiased_weight_sqr);
        
        // UE Method to get rid of flickering. Weight frame mixing amount
        // based on local contrast.
        float contrast = distance(average, texel);
        float weight = 0.05 * contrast;

        float blendFactor = mix(1. - weight, k_feedback, 1.);
        vec4 compositeColor = mix(texel, oldTexel, blendFactor);
    
        gl_FragColor = compositeColor;
    }`
