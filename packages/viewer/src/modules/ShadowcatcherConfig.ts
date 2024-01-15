export interface ShadowcatcherConfig {
  textureSize: number
  weights: { x: number; y: number; z: number; w: number }
  blurRadius: number
  stdDeviation: number
  sigmoidRange: number
  sigmoidStrength: number
}

export const DefaultShadowcatcherConfig: ShadowcatcherConfig = {
  textureSize: 512,
  weights: { x: 1, y: 1, z: 0, w: 1 },
  blurRadius: 16,
  stdDeviation: 4,
  sigmoidRange: 1.1,
  sigmoidStrength: 2
}
