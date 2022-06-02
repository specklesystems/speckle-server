import Three from 'three'

declare module 'three' {
  interface Object3D {
    // TODO: @alex - does this really exist? it's not on the three.js type
    material: unknown
  }
}
