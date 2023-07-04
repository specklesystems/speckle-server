export type WebviewBindings = {
  exec: (viewId: string | undefined, name: string, data?: object) => void
}
