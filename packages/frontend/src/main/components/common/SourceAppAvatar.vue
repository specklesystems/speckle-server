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
  data: () => ({
    apps: [
      { name: 'dynamo', color: 'purple', short: 'DYN' },
      { name: 'revit', color: 'blue darken-1', short: 'RVT' },
      { name: 'autocad', color: 'red lighten-1', short: 'ACAD' },
      { name: 'civil', color: 'cyan', short: 'C3D' },
      { name: 'blender', color: 'orange  darken-1', short: 'BLEND' },
      { name: 'rhino', color: 'black', short: 'RH' },
      { name: 'grasshopper', color: 'green darken-2', short: 'GH' },
      { name: 'excel', color: 'green lighten-1', short: 'XLSX' },
      { name: 'unity', color: 'teal', short: 'UNITY' },
      { name: 'unreal', color: 'brown', short: 'UE' },
      { name: 'python', color: 'yellow darken-1', short: 'PY' },
      { name: '.net', color: 'purple darken-2', short: '.NET' },
      { name: 'ifc', color: 'red darken-4', short: 'IFC' },
      { name: 'qgis', color: 'light-green accent-4', short: 'QGIS' },
      { name: 'arcgis', color: 'blue accent-4', short: 'AGIS' },
      { name: 'etabs', color: 'grey darken-2', short: 'ETABS' },
      { name: 'powerbi', color: 'yellow accent-1', short: 'PBI' },
      { name: 'sketchup', color: 'blue accent-1', short: 'SKP' },
      { name: 'sap', color: 'grey darken-2', short: 'SAP' },
      { name: 'csibridge', color: 'grey darken-2', short: 'CSIB' },
      { name: 'safe', color: 'grey darken-2', short: 'SAFE' },
      { name: 'archicad', color: 'blue darken-1', short: 'ARCHI' },
      { name: 'teklastructures', color: 'blue accent-4', short: 'TEKLAS' },
      { name: 'openroads', color: 'brown accent-4', short: 'OROAD' },
      { name: 'openrail', color: 'brown accent-4', short: 'ORAIL' },
      { name: 'openbuildings', color: 'brown accent-4', short: 'OBUILD' },
      { name: 'microstation', color: 'brown accent-4', short: 'MICRO' },
      { name: 'navisworks', color: 'green darken-3', short: 'NAVIS' }
    ]
  }),
  computed: {
    // adding new colors?
    // this can help: https://codepen.io/teocomi/pen/vYxvREG?editors=1010
    color() {
      if (!this.applicationName) return 'grey'

      const appname = this.applicationName.toLowerCase()

      for (const app of this.apps) {
        if (appname.includes(app.name)) return app.color
      }
      return 'grey'
    },
    shortName() {
      if (!this.applicationName) return '?'

      const appname = this.applicationName.toLowerCase()

      for (const app of this.apps) {
        if (appname.includes(app.name)) return app.short
      }
      return appname
    }
  }
}
</script>
