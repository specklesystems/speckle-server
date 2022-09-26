<template>
  <v-chip
    v-tooltip="`Source Application: ${applicationName ? applicationName : 'unknown'}`"
    small
    class="ma-1 caption white--text no-hover"
    :color="color"
  >
    {{ shortName }}
  </v-chip>
</template>
<script>
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
      if (!this.applicationName) return 'grey'

      const appname = this.applicationName.toLowerCase()

      if (appname.includes('dynamo')) return 'purple'
      if (appname.includes('revit')) return 'blue darken-3'
      if (appname.includes('autocad')) return 'red lighten-1'
      if (appname.includes('civil')) return 'blue lighten-1'
      if (appname.includes('blender')) return 'orange darken-1'
      if (appname.includes('rhino')) return 'black'
      if (appname.includes('grasshopper')) return 'green darken-2'
      if (appname.includes('excel')) return 'green lighten-1'
      if (appname.includes('unity')) return 'teal'
      if (appname.includes('unreal')) return 'brown'
      if (appname.includes('python')) return 'yellow darken-1'
      if (appname.includes('.net')) return 'purple darken-2'
      if (appname.includes('ifc')) return 'red darken-4'
      if (appname.includes('qgis')) return 'light-green accent-4'
      if (appname.includes('arcgis')) return 'blue accent-4'
      return 'grey'
    },
    shortName() {
      if (!this.applicationName) return '?'

      const appname = this.applicationName.toLowerCase()

      if (appname.includes('dynamo')) return 'DYN'
      if (appname.includes('revit')) return 'RVT'
      if (appname.includes('autocad')) return 'ACAD'
      if (appname.includes('civil')) return 'C3D'
      if (appname.includes('blender')) return 'BLNDR'
      if (appname.includes('rhino')) return 'RH'
      if (appname.includes('grasshopper')) return 'GH'
      if (appname.includes('excel')) return 'XLSX'
      if (appname.includes('unity')) return 'UNITY'
      if (appname.includes('unreal')) return 'UE'
      if (appname.includes('python')) return 'PY'
      if (appname.includes('.net')) return '.NET'
      if (appname.includes('ifc')) return 'IFC'
      if (appname.includes('qgis')) return 'QGIS'
      if (appname.includes('arcgis')) return 'AGIS'
      return appname
    }
  }
}
</script>
