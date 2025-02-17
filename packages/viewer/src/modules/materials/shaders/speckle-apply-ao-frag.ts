export const speckleApplyAoFrag = `

        #if BLEND_AO == 1
		    uniform sampler2D tAo;
        #endif
        #if BLEND_EDGES == 1
            uniform sampler2D tEdges;
        #endif
		varying vec2 vUv;

        #define ONE3 vec3(1.,1.,1.)

		void main() {
            vec3 ao = ONE3;
            vec3 edges = ONE3;
            
            #if BLEND_AO == 1
                ao = texture2D( tAo, vUv ).rgb;
            #endif

            #if BLEND_EDGES == 1
                edges = texture2D (tEdges, vUv).rgb;
            #endif
             
            gl_FragColor.rgb = min(ao, edges);
			gl_FragColor.a = 1.;
		}`
