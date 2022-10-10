<template>
  <v-row
    no-gutters
    :class="`my-1 py-1 property-row rounded-lg ${
      $vuetify.theme.dark ? 'black-bg' : 'white-bg'
    } ${
      prop.type === 'object' || prop.type === 'array'
        ? expanded
          ? 'border-blue'
          : 'border'
        : ''
    } ${
      prop.type === 'object' || prop.type === 'array'
        ? 'hover-cursor property-row-hover'
        : 'normal-cursor'
    }`"
    @click.stop="
      prop.type === 'object' || prop.type === 'array' ? (expanded = !expanded) : null
    "
    @mouseenter.stop="toggleHighlight(true)"
    @mouseleave.stop="toggleHighlight(false)"
  >
    <v-col cols="1" class="text-center">
      <v-icon
        small
        style="font-size: 12px"
        :class="`${$vuetify.theme.dark ? 'grey--text' : ''}`"
      >
        {{ icon }}
      </v-icon>
    </v-col>
    <v-col
      v-tooltip="prop.originalKey"
      cols="5"
      :class="`caption ${
        prop.type === 'object' || prop.type === 'array' ? 'hover-cursor' : ''
      } text-truncate px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
      style="line-height: 24px"
    >
      <span :class="`${expanded ? 'font-weight-bold' : ''}`">
        {{ prop.key.startsWith('@') ? prop.key.substring(1) : prop.key }}
      </span>
    </v-col>
    <v-col
      v-if="prop.type !== 'object' && prop.type !== 'array'"
      v-tooltip="prop.value.toString()"
      cols="6"
      class="caption text-truncate px-1"
      style="line-height: 24px"
    >
      {{ prop.value }}
      <v-icon
        v-if="prop.value === null"
        small
        style="font-size: 12px"
        :class="`${$vuetify.theme.dark ? 'grey--text' : ''}`"
      >
        mdi-circle-off-outline
      </v-icon>
    </v-col>
    <v-col v-else cols="6" class="caption text-truncate px-1 text-right">
      <span v-if="prop.length" class="grey--text mr-1" style="font-size: 10px">
        ({{ prop.length }})
      </span>
      <v-btn
        v-if="prop.extras.includes('open')"
        v-tooltip="'Open object in a new window'"
        x-small
        icon
        class="mr-1"
        target="_blank"
        :href="`/streams/${streamId}/objects/${refId}`"
      >
        <v-icon class="grey--text" style="font-size: 12px">mdi-open-in-new</v-icon>
      </v-btn>
      <v-btn
        v-if="prop.extras.includes('visibility')"
        v-tooltip="'Toggle visibility'"
        x-small
        icon
        class="mr-1"
        @click.stop="toggleVisibility()"
      >
        <v-icon class="grey--text" style="font-size: 12px">
          {{ visible ? 'mdi-eye' : 'mdi-eye-off' }}
        </v-icon>
      </v-btn>
      <v-btn
        v-if="prop.extras.includes('visibility')"
        v-tooltip="'Isolate objects'"
        x-small
        icon
        class="mr-1"
        @click.stop="toggleFilter()"
      >
        <v-icon
          :class="`${isolated ? 'primary--text' : 'grey--text'}`"
          style="font-size: 12px"
        >
          {{ !isolated ? 'mdi-filter' : 'mdi-filter' }}
        </v-icon>
      </v-btn>
      <v-btn
        v-tooltip="'Expand/collapse property'"
        x-small
        icon
        @click.stop="expanded = !expanded"
      >
        <v-icon
          :class="`${expanded ? 'grey--text' : 'primary--text'}`"
          style="font-size: 12px"
        >
          {{ expanded ? 'mdi-minus' : 'mdi-plus' }}
        </v-icon>
      </v-btn>
    </v-col>
    <v-scroll-y-transition>
      <v-col
        v-if="expanded && (prop.type === 'object' || prop.type === 'array')"
        cols="12"
      >
        <object-properties :obj="prop.value" :stream-id="streamId" />
      </v-col>
    </v-scroll-y-transition>
  </v-row>
</template>
<script>
import { v4 as uuidv4 } from 'uuid'
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'
import gql from 'graphql-tag'
import {
  hideObjects,
  showObjects,
  isolateObjects,
  unIsolateObjects,
  highlightObjects,
  removeHighlights
} from '@/main/lib/viewer/commit-object-viewer/stateManager'
import { useInjectedViewer } from '@/main/lib/viewer/core/composables/viewer'
export default {
  components: {
    ObjectProperties: () => import('@/main/components/viewer/ObjectProperties')
  },
  props: {
    prop: {
      type: [Object, Array],
      default: () => null
    },
    parent: {
      type: [Object, Array],
      default: () => null
    },
    refId: {
      type: String,
      default: () => null
    },
    streamId: {
      type: String,
      default: () => null
    }
  },
  setup() {
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

    const { viewer } = useInjectedViewer()

    return { viewerState, viewer }
  },
  data() {
    return {
      expanded: false,
      id: uuidv4()
    }
  },
  computed: {
    icon() {
      switch (this.prop.type) {
        case 'object':
          return 'mdi-code-braces'
        case 'array':
          return 'mdi-code-brackets'
        case 'string':
          return 'mdi-format-text'
        default:
          return 'mdi-numeric'
      }
    },
    visible() {
      if (!this.viewerState.currentFilterState?.hiddenObjects) return true
      if (this.prop.type === 'object') {
        return !this.viewerState.currentFilterState?.hiddenObjects?.includes(
          this.prop.value.referencedId
        )
      }
      if (this.prop.type === 'array') {
        const ids = this.prop.value.map((o) => o.referencedId)
        const targetIds = this.viewerState.currentFilterState?.hiddenObjects?.filter(
          (val) => ids.indexOf(val) !== -1
        )
        if (targetIds.length === 0) return true
        else return false // Note: could return "partial" or "full", depending on state
      }
      return true
    },
    isolated() {
      if (!this.viewerState.currentFilterState?.isolatedObjects) return false

      if (this.prop.type === 'object') {
        return this.viewerState.currentFilterState?.isolatedObjects?.includes(
          this.prop.value.referencedId
        )
      }
      if (this.prop.type === 'array') {
        const ids = this.prop.value.map((o) => o.referencedId)
        const targetIds = this.viewerState.currentFilterState?.isolatedObjects?.filter(
          (val) => ids.indexOf(val) !== -1
        )
        if (targetIds.length === 0) return false
        else return true // return "partial" or "full", depending on state
      }
      return false
    }
  },
  mounted() {},
  methods: {
    toggleHighlight(hovered) {
      if (this.prop.type === 'array') {
        const targetIds = this.prop.value.map((o) => o.referencedId)
        if (hovered) {
          highlightObjects(targetIds)
        } else {
          removeHighlights()
        }
        return
      }

      if (!this.prop.value.referencedId) return

      if (hovered) {
        highlightObjects([this.prop.value.referencedId])
      } else {
        removeHighlights()
      }
    },
    toggleVisibility() {
      if (this.prop.type === 'object') {
        if (this.visible) {
          hideObjects([this.prop.value.referencedId], 'ui-vis', true)
        } else {
          showObjects([this.prop.value.referencedId], 'ui-vis', true)
        }
      }
      if (this.prop.type === 'array') {
        const targetIds = this.prop.value.map((o) => o.referencedId)
        if (this.visible) {
          hideObjects(targetIds, 'ui-vis', true)
        } else {
          showObjects(targetIds, 'ui-vis', true)
        }
      }
    },
    toggleFilter() {
      if (this.prop.type === 'object') {
        if (this.isolated) {
          unIsolateObjects([this.prop.value.referencedId], 'ui-iso', true)
        } else {
          isolateObjects([this.prop.value.referencedId], 'ui-iso', true)
        }
      }
      if (this.prop.type === 'array') {
        const targetIds = this.prop.value.map((o) => o.referencedId)
        if (this.isolated) {
          unIsolateObjects(targetIds, 'ui-iso', true)
        } else {
          isolateObjects(targetIds, 'ui-iso', true)
        }
      }
    }
  }
}
</script>
<style scoped>
.hover-cursor:hover {
  cursor: pointer;
}
.normal-cursor:hover {
  cursor: auto !important;
}
.border-blue {
  border: solid rgba(131, 131, 131, 0.753);
  border-width: 0px 0px 0px 2px;
}
.border {
  border: solid #047ffb;
  /* border: solid #047efb; */
  border-width: 0px 0px 0px 2px;
}
.property-row {
  transition: all 0.3s ease;
  padding: 0 0px 0 4px;
}

.white-bg {
  background: white;
}
.black-bg {
  background: rgb(30, 30, 30);
}

.property-row-hover:hover {
  /* border: 1px solid rgba(120, 120, 120, 0.1); */
  background: rgba(120, 120, 120, 0.03);
}
</style>
