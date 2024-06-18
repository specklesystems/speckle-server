declare module 'http' {
  interface ServerResponse {
    vueLoggerBindings: Record<string, unknown>
  }
}

export {}
