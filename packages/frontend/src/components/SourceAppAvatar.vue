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
    color() {
      if (!this.applicationName) return 'grey'
      switch (this.applicationName.toLowerCase()) {
      case 'revit2020':
      case 'revit2021':
      case 'revit2022':
      case 'revit2023':
        return 'blue darken-1'
      case 'rhino':
        return 'black'
      case 'grasshopper':
        return 'green darken-2'
      case 'dynamo':
        return 'purple darken-1'
      default:
        return 'grey'
      }
    },
    shortName() {
      if (!this.applicationName) return '?'
      switch (this.applicationName.toLowerCase()) {
      case 'revit2020':
      case 'revit2021':
      case 'revit2022':
      case 'revit2023':
        return 'RVT'
      case 'rhino':
        return 'RH'
      case 'grasshopper':
        return 'GH'
      case 'dynamo':
        return 'DYN'
      default:
        return '?'
      }
    }
  }
}
</script>
