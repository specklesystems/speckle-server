declare global {
  interface Window {
    rg4js?: import('raygun4js').RaygunV2
    DD_RUM?: import('@datadog/browser-rum').RumGlobal
  }
}

export {}
