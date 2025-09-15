declare module 'nitropack/types' {
  interface NitroRouteConfig {
    appMiddleware?: string | string[] | Record<string, boolean>
  }
}
declare module 'nitropack' {
  interface NitroRouteConfig {
    appMiddleware?: string | string[] | Record<string, boolean>
  }
}
export {}