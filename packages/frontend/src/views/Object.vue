<template>
  <v-row>
    <v-col cols="12" sm="12">
      <v-card class="pa-0" elevation="0" rounded="lg" color="transparent" style="height: 50vh">
        <renderer :object-url="commitObjectUrl" />
      </v-card>
      <v-card class="pa-4 mt-3" elevation="0" rounded="lg">
        <v-card-title class="mr-8">
          <v-icon class="mr-2">mdi-database</v-icon>
          Object {{ $route.params.objectId }}
        </v-card-title>
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
</template>
<script>
import ObjectSpeckleViewer from '../components/ObjectSpeckleViewer'
import Renderer from '../components/Renderer'

export default {
  name: 'ObjectViewer',
  components: { ObjectSpeckleViewer, Renderer },
  computed: {
    commitObject() {
      return {
        // eslint-disable-next-line camelcase
        speckle_type: 'reference',
        referencedId: this.$route.params.objectId
      }
    },
    commitObjectUrl() {
      return `${window.location.origin}/streams/${this.$route.params.streamId}/objects/${this.$route.params.objectId}`
    }
  }
}
</script>
