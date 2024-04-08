declare module 'nuxt/dist/pages/runtime' {
  interface PageMeta {
    /**
     * Optional tags to be sent to Raygun
     */
    raygunTags?: string[]
    /**
     * Optional view name to override the default one
     */
    datadogName?: string
  }
}

export {}
