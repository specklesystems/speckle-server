declare global {
  interface Window {
    LUX: {
      /**
       * This variable tells RUM whether to gather the initial performance metrics as part of window.onload. The default is true and that value works in most cases for SPAs. But in some cases even the initial page view is handled by the SPA code and can occur after the onload event. If this is the case for your site, you would set LUX.auto = false and make sure to call LUX.markLoadTime() and/or LUX.send() when that initial page view is complete.
       */
      auto: boolean

      /**
       * Call this function at the beginning of the SPA page transition (but not on the initial page load). For example, if the user clicked a button that causes a SPA transition, you would call LUX.init() immediately after the button is clicked.
       *
       */
      init: () => void

      /**
       * Call this function at the end of the SPA page transition. For example, you would call LUX.markLoadTime() after all JSON responses have been received and the DOM has been updated. If you don't call this function, the load time will be recorded as the time when LUX.send() is called. This function is therefore optional, but recommended.
       */
      markLoadTime: () => void

      /**
       * Call this function when you are ready to send the data that has been collected for the current page view.
       * Call as late in the page lifecycle as possible to maximize data collection. This can even be called directly before init()
       */
      send: () => void

      /**
       * Set to true to reduce data loss due to page abandonment.
       */
      sendBeaconOnPageHidden: boolean

      /**
       * Change to 30000 if 60 seconds results in noisy data
       */
      maxMeasureTime: number

      /**
       * Force a sample, even if you have set a sample rate. Useful for troubleshooting & local development
       */
      forceSample: () => void
    }
  }
}

export {}
