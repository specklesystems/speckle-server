<template>
  <v-row>
    <v-col cols="12" sm="12">
      <v-card class="pa-0" elevation="0" rounded="lg" color="transparent" style="height: 50vh">
        <renderer :object-url="commitObjectUrl" @selection="handleSelection" />
      </v-card>
      <v-card class="pa-4 mt-3" elevation="0" rounded="lg">
        <v-expand-transition>
          <v-sheet v-show="selectionData.length !== 0" class="pa-0" color="transparent">
            <v-card-title class="mr-8">
              <v-badge inline :content="selectionData.length">
                <v-icon class="mr-2">mdi-cube</v-icon>
                Selection
              </v-badge>
            </v-card-title>
            <div v-if="selectionData.length !== 0">
              <object-simple-viewer
                v-for="(obj, ind) in selectionData"
                :key="obj.id + ind"
                :value="obj"
                :stream-id="$route.params.streamId"
                :key-name="`Selected Object ${ind + 1}`"
                force-show-open-in-new
                force-expand
              />
            </div>
          </v-sheet>
        </v-expand-transition>
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
import ObjectSimpleViewer from '../components/ObjectSimpleViewer'
import Renderer from '../components/Renderer'

export default {
  name: 'ObjectViewer',
  components: { ObjectSimpleViewer, ObjectSpeckleViewer, Renderer },
  data() {
    return {
      selectionData: []
    }
  },
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
  },
  methods: {
    handleSelection(selectionData) {
      this.selectionData.splice(0, this.selectionData.length)
      this.selectionData.push(...selectionData)
    }
  }
}
</script>
