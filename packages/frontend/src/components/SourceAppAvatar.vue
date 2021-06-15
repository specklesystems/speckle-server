<template>
  <v-tooltip bottom>
    <template #activator="{ on, attrs }">
      <v-chip
        small
        class="ma-1 caption white--text"
        :color="color"
        :size="size"
        v-bind="attrs"
        v-on="on"
      >
        {{ shortName }}
      </v-chip>
    </template>
    <span>Source application: {{ applicationName ? applicationName : 'unknown' }}</span>
  </v-tooltip>
</template>
<script>
export default {
  props: {
    size: {
      type: Number,
      default: 30
    },
    applicationName: {
      type: String,
      default: '?'
    }
  },
  computed: {
    // adding new colors?
    // this can help: https://codepen.io/teocomi/pen/vYxvREG?editors=1010
    color() {
      if (!this.applicationName) return 'grey'

      let appname = this.applicationName.toLowerCase()

      if (appname.includes('dynamo')) return 'purple darken-1'
      if (appname.includes('revit')) return 'blue darken-1'
      if (appname.includes('autocad')) return 'red lighten-1'
      if (appname.includes('civil')) return 'blue lighten-1'
      if (appname.includes('blender')) return 'orange'
      if (appname.includes('rhino')) return 'black'
      if (appname.includes('grasshopper')) return 'green darken-2'
      if (appname.includes('excel')) return 'green lighten-1'
      if (appname.includes('unity')) return 'yellow darken-1'
      if (appname.includes('unreal')) return 'brown'
      return 'grey'
    },
    shortName() {
      if (!this.applicationName) return '?'

      let appname = this.applicationName.toLowerCase()

      if (appname.includes('dynamo')) return 'DYN'
      if (appname.includes('revit')) return 'RVT'
      if (appname.includes('autocad')) return 'ACAD'
      if (appname.includes('civil')) return 'C3D'
      if (appname.includes('blender')) return 'BLEND'
      if (appname.includes('rhino')) return 'RH'
      if (appname.includes('grasshopper')) return 'GH'
      if (appname.includes('excel')) return 'XLSX'
      if (appname.includes('unity')) return 'UNITY'
      if (appname.includes('unreal')) return 'UE'
      return appname
    }
  }
}
</script>
