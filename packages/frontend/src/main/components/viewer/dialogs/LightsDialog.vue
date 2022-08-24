<template>
  <v-card>
    <v-card-title>Lights Settings</v-card-title>
    <v-card-text>
      <br />
      <v-switch inset :label="`sun`"></v-switch>
      <v-slider max="50" min="-50" :thumb-size="24" label="sun intensity" />
      <v-slider max="50" min="-50" :thumb-size="24" label="sun elevation" />
      <v-slider max="50" min="-50" :thumb-size="24" label="sun azimuth" />
      <br />
      <v-slider max="50" min="-50" :thumb-size="24" label="indirect light" />
    </v-card-text>
  </v-card>
</template>
<script>
import { computed, ref } from 'vue'
export default {
  setup() {},
  data() {
    return {
      slider: 0
    }
  }
}
</script>
