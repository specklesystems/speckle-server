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
      <v-btn :disabled="mapActive" :small="small" rounded class="mr-2" v-bind="attrs" v-on="on">
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
      <v-switch
        v-model="switch1"
        inset
        :label="`3D`"
        class="ml-2 pa-1"
        @click="setBuildings()"
      ></v-switch>
    </v-list>
  </v-menu>
</template>
<script>
export default {
  props: {
    small: { type: Boolean, default: false },
    lat: { type: Number, default: null },
    lon: { type: Number, default: null },
    north: { type: Number, default: null },
    api: { type: String, default: '' },
    mapActive: { type: Boolean, default: true }
  },
  data() {
    return {
      items: [
        { index: 0, title: 'No map' },
        { index: 1, title: 'Mapbox Light' },
        { index: 2, title: 'Mapbox Dark' }
      ],
      switch1: false
    }
  },
  methods: {
    setSurroundings(index) {
      window.__viewer.addMapAndBuild(index, this.lat, this.lon, this.north, this.api, this.switch1)
    },
    setBuildings() {
      if (this.switch1 == false) window.__viewer.hideBuild()
      if (this.switch1 == true) window.__viewer.showBuild()
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
