declare module 'vue/types/vue' {
  export interface Vue {
    $mixpanel: import('mixpanel-browser').OverridedMixpanel
  }
}

export {}
