<template>
  <v-card>
    <div>
      <v-expansion-panels v-model="panel" accordion>
        <v-expansion-panel>
          <v-expansion-panel-header>Rotation</v-expansion-panel-header>
          <v-expansion-panel-content class="caption">
            Simply click and drag with your left mouse button.
            <v-img class="mt-4" src="@/assets/rotating.gif" max-height="350" contain />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header>Panning</v-expansion-panel-header>
          <v-expansion-panel-content class="caption">
            Simply click and drag with your right mouse button.
            <v-img class="mt-4" src="@/assets/panning.gif" max-height="350" contain />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header>Zooming</v-expansion-panel-header>
          <v-expansion-panel-content class="caption">
            Double click on an object to zoom to it.
            <br />
            Double click anywhere else to zoom to the entire scene.
            <br />
            Use your mouse's scroll wheel to zooom in and out.
            <v-img class="mt-4" src="@/assets/zooming.gif" max-height="350" contain />
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header>Sections</v-expansion-panel-header>
          <v-expansion-panel-content class="caption">
            The section box can be moved around as a whole. You can also move individual
            faces of the section box by clicking on them.
            <v-img
              class="mt-4"
              src="@/assets/sectionbox.gif"
              max-height="350"
              contain
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <!-- TODO: mobile help -->
    <!-- <div v-if="$vuetify.breakpoint.xs">
      <v-card-title>Rotation</v-card-title>
      <v-card-text>Simply tap and drag with your finger.</v-card-text>
      <v-card-title>Zooming</v-card-title>
      <v-card-text>Using a two finger pinch, you can zoom in and out.</v-card-text>
      <v-card-title>Panning</v-card-title>
      <v-card-text>Using a two fingers, drag the model on your screen.</v-card-text>
    </div> -->
  </v-card>
</template>
<script>
export default {
  data() {
    return {
      panel: 0
    }
  }
}
</script>
