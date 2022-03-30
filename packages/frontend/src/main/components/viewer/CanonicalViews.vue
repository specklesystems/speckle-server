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
      <v-btn :small="small" rounded icon class="mr-2" v-bind="attrs" v-on="on">
        <v-icon small>mdi-camera-outline</v-icon>
      </v-btn>
    </template>
    <v-list dense nav>
      <v-list-item
        v-for="(item, index) in items"
        :key="index"
        @click="setView(item.title)"
      >
        <v-list-item-title>
          <v-icon small>mdi-camera-control</v-icon>
          {{ item.title }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<script>
export default {
  props: ['small'],
  data() {
    return {
      items: [
        { title: 'Top' },
        { title: 'Front' },
        { title: 'Left' },
        { title: 'Back' },
        { title: 'Right' }
      ]
    }
  },
  methods: {
    setView(view) {
      window.__viewer.interactions.rotateTo(view.toLowerCase())
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
