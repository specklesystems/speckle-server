export const speckleTemporalSupersamplingVert = /* glsl */ `
    varying vec2 Uv;
    
    void main() {
        Uv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`
