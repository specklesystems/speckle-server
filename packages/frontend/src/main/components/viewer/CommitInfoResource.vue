<template>
  <div @mouseenter="hovered = true" @mouseleave="hovered = false">
    <v-card
      class="mx-2 rounded-lg"
      :elevation="`${hovered ? 10 : 2}`"
      style="transition: all 0.2s ease"
    >
      <v-toolbar
        v-ripple
        class="transparent"
        flat
        style="cursor: pointer"
        @click.stop="expanded = !expanded"
      >
        <v-app-bar-nav-icon>
          <user-avatar
            :id="commit.authorId"
            :avatar="commit.authorAvatar"
            :name="commit.authorName"
          />
        </v-app-bar-nav-icon>
        <source-app-avatar :application-name="commit.sourceApplication" />
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
      </v-toolbar>
      <div
        class="caption my-2 px-2 pb-2"
        style="cursor: pointer"
        @click.stop="expanded = !expanded"
      >
        {{ commit.message }}
        <v-divider class="my-2" />
        <timeago :datetime="commit.createdAt"></timeago>
        ,
        {{ new Date(commit.createdAt).toLocaleString() }}
        <v-btn block depressed x-small class="mt-4" @click.stop="expanded = !expanded">
          {{ expanded ? 'Hide' : 'Expand' }} Data View
        </v-btn>
      </div>
      <v-expand-transition>
        <div v-show="expanded" class="px-1 pb-2">
          <object-properties
            :obj="{
              referencedId:
                resource.type === 'commit'
                  ? resource.data.commit.referencedObject
                  : resource.data.object.id
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
import gql from 'graphql-tag'
import { computed } from 'vue'
import {
  hideObjects,
  showObjects,
  isolateObjects,
  unIsolateObjects,
  useCommitObjectViewerParams
} from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { Ripple } from 'vuetify/lib/directives'

export default {
  components: {
    SourceAppAvatar: () => import('@/main/components/common/SourceAppAvatar'),
    UserAvatar: () => import('@/main/components/common/UserAvatar'),
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
      expanded: false,
      hovered: false
    }
  },
  computed: {
    commit() {
      return this.resource.data.commit
    },
    isolated() {
      if (!this.viewerState.currentFilterState?.isolatedObjects) return false

      return this.viewerState.currentFilterState?.isolatedObjects?.includes(
        this.resource.data.commit.referencedObject
      )
    },
    visible() {
      if (!this.viewerState.currentFilterState?.hiddenObjects) return true

      return !this.viewerState.currentFilterState?.hiddenObjects?.includes(
        this.resource.data.commit.referencedObject
      )
    }
  },
  methods: {
    isolate() {
      const id = this.resource.data.commit.referencedObject
      if (this.isolated) {
        unIsolateObjects([id], 'ui-iso', true)
      } else {
        isolateObjects([id], 'ui-iso', true)
      }
    },
    toggleVisibility() {
      const id = this.resource.data.commit.referencedObject
      if (this.visible) {
        hideObjects([id], 'ui-vis', true)
      } else {
        showObjects([id], 'ui-vis', true)
      }
    }
  }
}
</script>
