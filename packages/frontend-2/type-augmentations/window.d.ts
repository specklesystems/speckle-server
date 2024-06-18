declare global {
  interface Window {
    DD_RUM?:
      | Pick<import('@datadog/browser-rum').RumGlobal, 'onReady'>
      | import('@datadog/browser-rum').RumGlobal
    /**
     * Start a new DD RUM view. Function is idempotent and can be safely called multiple times.
     */
    DD_RUM_START_VIEW?: (path: string, name: string) => void
  }
}

export {}
