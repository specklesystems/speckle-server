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
  hideObjects2,
  hideTree,
  showTree,
  showObjects,
  showObjects2,
  isolateObjects,
  isolateObjects2,
  unisolateObjects,
  unIsolateObjects2,
  getInitializedViewer
} from '@/main/lib/viewer/commit-object-viewer/stateManager'

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
          isolateValues
          hideValues
          currentFilterState
        }
      }
    `)
    const viewerState = computed(
      () => viewerStateResult.value?.commitObjectViewerState || {}
    )

    const viewer = getInitializedViewer()

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
      if (this.prop.type === 'object') {
        if (!this.viewerState.currentFilterState) return true
        if (!this.viewerState.currentFilterState.visibilityState) return true
        const stateName = this.viewerState.currentFilterState.visibilityState.name
        if (stateName !== 'hiddenObjectState') return true

        return this.viewerState.currentFilterState?.visibilityState?.ids.includes(
          this.prop.value.referencedId
        ) && stateName === 'hiddenObjectState'
          ? false
          : true
      }
      if (this.prop.type === 'array') {
        if (!this.viewerState.currentFilterState) return true
        if (!this.viewerState.currentFilterState.visibilityState) return true
        const stateName = this.viewerState.currentFilterState.visibilityState.name
        if (stateName !== 'hiddenObjectState') return true

        const ids = this.prop.value.map((o) => o.referencedId)
        const targetIds =
          this.viewerState.currentFilterState?.visibilityState?.ids.filter(
            (val) => ids.indexOf(val) !== -1
          )
        if (targetIds.length === 0 && stateName === 'hiddenObjectState') return true
        else return false // TODO: return "partial" or "full", depending on state
      }
      return true
    },
    isolated() {
      if (this.prop.type === 'object') {
        return (
          this.viewerState.isolateValues.indexOf(this.prop.value.referencedId) !== -1
        )
      }
      if (this.prop.type === 'array') {
        if (!this.viewerState.currentFilterState) return false
        if (!this.viewerState.currentFilterState.visibilityState) return false
        const stateName = this.viewerState.currentFilterState.visibilityState.name
        if (stateName !== 'isolateObjectsState') return false

        const ids = this.prop.value.map((o) => o.referencedId)
        const targetIds =
          this.viewerState.currentFilterState?.visibilityState?.ids.filter(
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
    toggleVisibility() {
      if (this.prop.type === 'object') {
        if (this.visible) {
          hideTree(this.prop.value.referencedId, 'ui-vis')
        } else {
          showTree(this.prop.value.referencedId, 'ui-vis')
        }
      }
      if (this.prop.type === 'array') {
        const targetIds = this.prop.value.map((o) => o.referencedId)
        if (this.visible) {
          hideObjects2(targetIds, 'ui-vis')
        } else {
          showObjects2(targetIds, 'ui-vis')
        }
      }
    },
    toggleFilter() {
      if (this.prop.type === 'object') {
        // TODO: isolateTree?
        if (this.isolated) {
          // TODO
        } else {
          // TODO
        }
      }
      if (this.prop.type === 'array') {
        const targetIds = this.prop.value.map((o) => o.referencedId)
        // TODO: isolateObjects?
        if (this.isolated) {
          // TODO
          unIsolateObjects2(targetIds, 'ui-iso')
        } else {
          // TODO
          isolateObjects2(targetIds, 'ui-iso')
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
