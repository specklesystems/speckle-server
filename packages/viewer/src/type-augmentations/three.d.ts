declare module 'three' {
  interface Raycaster {
    firstHitOnly: boolean
  }

  interface Material {
    fog?: unknown
    format?: unknown
    refractionRatio?: unknown
  }
}

export {}
