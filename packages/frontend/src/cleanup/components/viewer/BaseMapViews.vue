<template>
  <v-menu
    open-on-hover
    top
    offset-y
    rounded="lg"
    origin="center"
    nudge-top="10"
    close-delay="400"
    nudge-left="10"
  >
    <template #activator="{ on, attrs }">
      <v-btn :small="small" rounded class="mr-2" v-bind="attrs" v-on="on">
        <v-icon small>mdi-map-legend</v-icon>
      </v-btn>
    </template>
    <v-list dense nav>
      <v-list-item v-for="(item, index) in items" :key="index" @click="setSurroundings(item.index)">
        <v-list-item-title>
          <v-icon small>mdi-map</v-icon>
          {{ item.title }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<script>
export default {
  props: {
    small: { type: Boolean, default: false },
    lat: { type: Number, default: 0 },
    lon: { type: Number, default: 0 },
    north: { type: Number, default: 0 },
    api: { type: String, default: '' }
  },
  data() {
    return {
      items: [
        { index: 0, title: 'No map' },
        { index: 1, title: 'Mapbox Streets' },
        { index: 2, title: 'Mapbox Monochrome' },
        { index: 3, title: 'Mapbox Satellite' },
        { index: 4, title: 'Mapbox Streets 3D Buildings' },
        { index: 5, title: 'Mapbox Monochrome 3D Buildings' },
        { index: 6, title: 'Mapbox Satellite 3D Buildings' }
      ]
    }
  },
  methods: {
    setSurroundings(index) {
      window.__viewer.addMapAndBuild(index, this.lat, this.lon, this.north, this.api)
    }
  }
}
</script>
<style scoped>
.test {
  position: absolute;
  top: 0;
}
</style>
