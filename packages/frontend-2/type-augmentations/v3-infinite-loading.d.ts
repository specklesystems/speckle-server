declare module 'v3-infinite-loading' {
  declare const InfiniteLoading: import('vue').DefineComponent<
    {
      /**
       * This property is used to specify the scrollable element, it can be any valid css selector.
       * Default: window
       */
      target?: string
      /**
       * The 'infinite' event will be fired if the scroll distance is less than this value.
       * Defaults to: 0
       */
      distance?: number
      /**
       * This property is used to set the load direction to top.
       * Defaults to: false
       */
      top?: boolean
      /**
       * The component will be reset if this value changes
       */
      identifier?: any
      /**
       * This property is used to specify weither you want the component to handle first load or not.
       * Defaults to: true
       */
      firstload?: boolean
    },
    {},
    {},
    {},
    {},
    {},
    {},
    {
      infinite: ($state: {
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
      }) => void
    }
  >
  export default InfiniteLoading
}
