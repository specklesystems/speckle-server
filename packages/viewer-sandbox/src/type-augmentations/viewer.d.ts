/**
 * In the future we can integrate these types into the actual viewer package
 */

declare module '@speckle/viewer' {
  declare class Viewer {
    constructor(params: {
      container: Node
      postprocessing?: boolean = false
      reflections?: boolean = true
      showStats?: boolean = false
    })

    async loadObject(url: string, token?: string, enableCaching? = true): Promise<void>
    onWindowResize(): void
    on<A1 = unknown, A2 = unknown, A3 = unknown>(
      event: string,
      callback: (arg1: A1, arg2: A2, arg3: A3) => void
    )
  }
  export { Viewer }
}
