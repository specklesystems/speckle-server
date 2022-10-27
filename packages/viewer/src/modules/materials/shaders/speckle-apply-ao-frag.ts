export const speckleApplyAoFrag = `
		uniform float opacity;
		uniform sampler2D tDiffuse;
        uniform sampler2D tDiffuseInterp;
		varying vec2 vUv;
        #if ACCUMULATE == 1
            uniform float frameIndex;
        #endif

		void main() {
            vec3 currentSample = texture2D( tDiffuse, vUv ).rgb;
            
            #if ACCUMULATE == 1
                vec3 interpSample = texture2D( tDiffuseInterp, vUv ).rgb;
			    gl_FragColor.rgb = mix(interpSample, currentSample, frameIndex/float(NUM_FRAMES));
            #else
                gl_FragColor.rgb = currentSample;
            #endif
			gl_FragColor.a = 1.;
		}`
