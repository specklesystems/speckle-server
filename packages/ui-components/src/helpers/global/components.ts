export type InfiniteLoaderState = {
  /**
   * Informs the component that this loading has been successful
   */
  loaded: () => void
  /**
   * Informs the component that all of the data has been loaded successfully
   */
  complete: () => void
  /**
   * Inform the component that this loading failed, the content of the `error` slot will be displayed
   */
  error: () => void
}
