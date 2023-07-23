/**
 * Defines the expected contract of the host application bound object.
 */
export type IRawBridge = {
  GetBindingsMethodNames: () => Promise<string[]>
  RunMethod: (methodName: string, args: string) => Promise<string>
  ShowDevTools: () => Promise<void>
  OpenUrl: (url: string) => Promise<void>
}
