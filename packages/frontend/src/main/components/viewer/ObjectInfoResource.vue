<template>
  <div>
    <v-card class="mx-2 rounded-lg">
      <v-toolbar
        v-ripple
        class="transparent"
        flat
        style="cursor: pointer"
        @click.stop="expanded = !expanded"
      >
        <v-app-bar-nav-icon style="pointer-events: none">
          <v-icon large>mdi-cube-outline</v-icon>
        </v-app-bar-nav-icon>
        <v-chip small class="ma-1 caption grey white--text no-hover">Object</v-chip>
        <v-spacer />
        <v-btn
          v-if="resourceId !== resource.id"
          v-tooltip="'Remove'"
          small
          icon
          @click.stop="$emit('remove', resource)"
        >
          <v-icon x-small>mdi-close</v-icon>
        </v-btn>
        <v-btn
          v-tooltip="'Toggle visibility'"
          small
          icon
          @click.stop="toggleVisibility()"
        >
          <v-icon class="grey--text" style="font-size: 12px">
            {{ visible ? 'mdi-eye' : 'mdi-eye-off' }}
          </v-icon>
        </v-btn>
        <v-btn v-tooltip="'Isolate objects'" small icon @click.stop="isolate()">
          <v-icon x-small :class="`${isolated ? 'primary--text' : ''}`">
            mdi-filter
          </v-icon>
        </v-btn>
        <v-btn small icon @click.stop="expanded = !expanded">
          <v-icon x-small>{{ expanded ? 'mdi-minus' : 'mdi-plus' }}</v-icon>
        </v-btn>
      </v-toolbar>
      <v-expand-transition>
        <div v-show="expanded" class="px-1">
          <object-properties
            :obj="{
              referencedId: resource.data.object.id
            }"
            :stream-id="resource.data.id"
          />
        </div>
      </v-expand-transition>
    </v-card>
  </div>
</template>
<script>
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'
import gql from 'graphql-tag'
import {
  isolateObjects,
  unIsolateObjects,
  hideObjects,
  showObjects,
  useCommitObjectViewerParams
} from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { Ripple } from 'vuetify/lib/directives'

export default {
  components: {
    ObjectProperties: () => import('@/main/components/viewer/ObjectProperties')
  },
  directives: {
    Ripple
  },
  props: {
    resource: {
      type: Object,
      default: () => null
    }
  },
  setup() {
    const { streamId, resourceId } = useCommitObjectViewerParams()
    const { result: viewerStateResult } = useQuery(gql`
      query {
        commitObjectViewerState @client {
          currentFilterState
        }
      }
    `)
    const viewerState = computed(
      () => viewerStateResult.value?.commitObjectViewerState || {}
    )

    return { viewerState, streamId, resourceId }
  },
  data() {
    return {
      expanded: false
    }
  },
  computed: {
    isolated() {
      if (!this.viewerState.currentFilterState?.isolatedObjects) return false

      return this.viewerState.currentFilterState?.isolatedObjects?.includes(
        this.resource.data.object.id
      )
    },
    visible() {
      if (!this.viewerState.currentFilterState?.hiddenObjects) return true

      return !this.viewerState.currentFilterState?.hiddenObjects?.includes(
        this.resource.data.object.id
      )
    }
  },
  methods: {
    isolate() {
      const id = this.resource.data.object.id
      if (this.isolated) unIsolateObjects([id], 'ui-res', true)
      else isolateObjects([id], 'ui-res', true)
    },
    toggleVisibility() {
      const id = this.resource.data.object.id
      if (this.visible) hideObjects([id], 'ui-res', true)
      else showObjects([id], 'ui-res', true)
    }
  }
}
</script>
