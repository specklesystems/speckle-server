declare global {
  interface Window {
    DD_RUM?:
      | Pick<import('@datadog/browser-rum').RumGlobal, 'onReady'>
      | import('@datadog/browser-rum').RumGlobal
    /**
     * Start a new DD RUM view. Function is idempotent and can be safely called multiple times.
     */
    DD_RUM_START_VIEW?: (path: string, name: string) => void

    // Debug keys, don't need to type properly cause we only use them manually from dev tools
    VIEWER?: any
    VIEWER_STATE?: any
    VIEWER_SERIALIZED_STATE?: any
    APPLY_VIEWER_STATE?: any
    APPLY_VIEWER_DD_EVENT?: any
  }
}

export {}
