<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="12">
        <v-card
          class="pa-4 mt-4"
          elevation="0"
          rounded="lg"
          color="background2"
        >
          <v-card-title class="mr-8">
            <v-icon class="mr-2">mdi-database</v-icon>
            Object {{ $route.params.objectId }}
          </v-card-title>
          <v-card-text>
            <router-link :to="`/streams/${$route.params.streamId}`">Go back to stream</router-link>
          </v-card-text>
          <v-card-text class="pa-0">
            <object-speckle-viewer
              class="mt-4"
              :stream-id="$route.params.streamId"
              :value="commitObject"
              :expand="true"
            ></object-speckle-viewer>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import ObjectSpeckleViewer from "../components/ObjectSpeckleViewer"

export default {
  name: "ObjectViewer",
  components: { ObjectSpeckleViewer },
  computed: {
    commitObject() {
      return {
        // eslint-disable-next-line camelcase
        speckle_type: "reference",
        referencedId: this.$route.params.objectId
      }
    }
  }
}
</script>
