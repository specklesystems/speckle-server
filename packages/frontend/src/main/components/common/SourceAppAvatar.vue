<template>
  <v-chip
    v-tooltip="`Source Application: ${applicationName ? applicationName : 'unknown'}`"
    small
    class="ma-1 caption white--text no-hover"
    :style="{ backgroundColor: color }"
  >
    {{ shortName }}
  </v-chip>
</template>
<script>
import { SourceApps } from '@speckle/shared'

export default {
  props: {
    applicationName: {
      type: String,
      default: '?'
    }
  },
  computed: {
    // adding new colors?
    // this can help: https://codepen.io/teocomi/pen/vYxvREG?editors=1010
    color() {
      const grey = '#a6a6a6'
      if (!this.applicationName) return grey

      const appname = this.applicationName.toLowerCase()

      for (const app of SourceApps) {
        if (appname.includes(app.searchKey)) return app.bgColor
      }
      return grey
    },
    shortName() {
      if (!this.applicationName) return '?'

      const appname = this.applicationName.toLowerCase()

      for (const app of SourceApps) {
        if (appname.includes(app.searchKey)) return app.short
      }
      return appname
    }
  }
}
</script>
