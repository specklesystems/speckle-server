declare module 'nuxt/dist/pages/runtime' {
  interface PageMeta {
    /**
     * Optinal tags to be sent to Raygun
     */
    raygunTags?: string[]
  }
}

export {}
