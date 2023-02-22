<template>
  <div
    class="overflow-hidden"
    :style="`width: ${
      $vuetify.breakpoint.xs ? '90%' : '300px'
    }; height: 100vh; position: absolute; padding-top: 72px`"
  >
    <div
      style="max-height: 100%; overflow-y: auto; pointer-events: auto"
      class="simple-scrollbar"
    >
      <div class="d-flex align-center" style="max-width: 99%">
        <span class="caption">Selection Info</span>
        <v-spacer />
        <v-btn
          v-show="objects.length > 1"
          v-tooltip="'Open selection in a new window'"
          small
          icon
          target="_blank"
          :href="getSelectionUrl()"
        >
          <v-icon x-small>mdi-open-in-new</v-icon>
        </v-btn>
        <v-btn
          v-tooltip="'Isolate selected objects'"
          :disabled="objects.length === 0 && !isolated"
          small
          icon
          @click.stop="isolateSelection()"
        >
          <v-icon x-small :class="`${!isolated ? 'primary--text' : ''}`">
            mdi-filter
          </v-icon>
        </v-btn>
        <v-btn
          v-show="$vuetify.breakpoint.xs"
          v-tooltip="'Isolate selected objects'"
          small
          icon
          @click.stop="$emit('clear-selection')"
        >
          <v-icon x-small>mdi-close</v-icon>
        </v-btn>
      </div>
      <div v-for="prop in props" :key="prop.value.id" style="width: 99%">
        <v-card
          class="transparent elevation-3 rounded-lg mb-3"
          style="pointer-events: auto"
        >
          <object-properties-row
            :prop="prop"
            :stream-id="streamId"
            :ref-id="prop.refId"
          />
        </v-card>
      </div>
      <div
        v-show="props.length === 1 && !$vuetify.breakpoint.xs"
        class="caption grey--text"
      >
        Hint: hold shift to select multiple objects.
      </div>
    </div>
  </div>
</template>
<script>
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'
import gql from 'graphql-tag'
import {
  clearSelectionDisplay,
  isolateObjects,
  unIsolateObjects
} from '@/main/lib/viewer/commit-object-viewer/stateManager'
export default {
  components: {
    ObjectPropertiesRow: () => import('@/main/components/viewer/ObjectPropertiesRow')
  },
  props: {
    streamId: {
      type: String,
      default: null
    }
  },
  setup() {
    const { result: viewerStateResult } = useQuery(gql`
      query {
        commitObjectViewerState @client {
          selectedObjects
          currentFilterState
          objectProperties
        }
      }
    `)
    const viewerState = computed(
      () => viewerStateResult.value?.commitObjectViewerState || {}
    )

    return { viewerState }
  },
  data() {
    return {
      expand: true
    }
  },
  computed: {
    objects() {
      return this.viewerState.selectedObjects || []
    },
    props() {
      return this.objects.map((obj) => {
        let key = obj?.id
        if (obj.speckle_type) key = obj.speckle_type.split('.').reverse()[0]
        if (obj.name) key = obj.name
        return {
          key,
          value: obj,
          type: 'object',
          extras: ['open'],
          refId: obj.id
        }
      })
    },
    isolated() {
      const ids = this.objects.map((o) => o.id)
      if (!this.viewerState.currentFilterState) return false
      if (!this.viewerState.currentFilterState.visibilityState) return false
      const stateName = this.viewerState.currentFilterState.visibilityState.name
      if (stateName !== 'isolateObjectsState') return false

      ids.forEach((val) => {
        if (this.viewerState.currentFilterState.visibilityState.ids.indexOf(val) === -1)
          return false
      })
      return true
    }
  },
  methods: {
    isolateSelection() {
      const ids = this.objects.map((o) => o.id)
      if (!this.isolated) {
        clearSelectionDisplay()
        isolateObjects(ids, 'ui-sel')
      } else {
        unIsolateObjects(ids, 'ui-sel')
      }
    },
    getSelectionUrl() {
      if (this.objects.length < 2) return ''
      const url = `/streams/${this.streamId}/objects/${
        this.objects[0].id
      }?overlay=${this.objects
        .slice(1)
        .map((o) => o.id)
        .join(',')}`
      return url
    }
  }
}
</script>
<style scoped>
.list-overlay-dark {
  background: rgba(40, 40, 40, 1);
  z-index: 5;
}
.list-overlay-light {
  background: rgba(235, 235, 235, 1);
  z-index: 5;
}
</style>
