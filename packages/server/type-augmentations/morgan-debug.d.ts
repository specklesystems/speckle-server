declare module 'morgan-debug' {
  declare const func: (
    namespace: string,
    format: string,
    options: Record<string, unknown>
  ) => import('express').Handler

  export default func
}
