/**
 * Basic interface scaffolding two standard method.
 */
export interface IBinding<T> {
  /**
   * Events sent over from the host application.
   */
  on: <E extends keyof T>(event: E, callback: T[E]) => void
  /**
   * If possible, opens up dev tools from the embedded browser window.
   * Currently needed for CefSharp, as right click inspect doesn't exist.
   */
  showDevTools: () => Promise<void>
  /**
   * Opens an url in the OS's default browser.
   */
  openUrl: (url: string) => Promise<void>
}
