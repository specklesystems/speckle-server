declare global {
  interface Window {
    rg4js?: import('raygun4js').RaygunV2
    DD_RUM?:
      | Pick<import('@datadog/browser-rum').RumGlobal, 'onReady'>
      | import('@datadog/browser-rum').RumGlobal
  }
}

export {}
