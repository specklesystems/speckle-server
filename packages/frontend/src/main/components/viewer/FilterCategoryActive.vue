<template>
  <div class="mt-3">
    <v-row
      v-for="valueGroup in filter.valueGroups"
      :key="valueGroup.value"
      no-gutters
      class="my-1 property-row rounded-lg"
    >
      <v-col
        cols="1"
        :class="`text-center text-truncate px-1 ${
          $vuetify.theme.dark ? 'grey--text' : ''
        }`"
        style="line-height: 24px; font-size: 9px"
      >
        {{ valueGroup.ids.length }}
      </v-col>
      <v-col
        v-tooltip="valueGroup.value"
        cols="7"
        :class="`caption text-truncate px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
        style="line-height: 24px"
      >
        {{
          valueGroup.value.split('.').reverse()[0] !== ''
            ? valueGroup.value.split('.').reverse()[0]
            : valueGroup.value
        }}
      </v-col>
      <v-col
        cols="4"
        :class="`caption text-truncate text-right px-1 ${
          $vuetify.theme.dark ? 'grey--text' : ''
        }`"
        style="line-height: 24px"
      >
        <div
          class="d-inline-block rounded mr-3 mt-1 elevation-3"
          :style="`width: 8px; height: 8px; background:${
            colorLegend[valueGroup.value]
          };`"
        ></div>
        <v-btn
          v-tooltip="'Toggle visibility'"
          x-small
          icon
          class="mr-1"
          @click="toggleVisibility(valueGroup)"
        >
          <v-icon class="grey--text" style="font-size: 11px">
            {{ visibleLegend[valueGroup.value] ? 'mdi-eye' : 'mdi-eye-off' }}
          </v-icon>
        </v-btn>
        <v-btn
          v-tooltip="'Isolate objects'"
          x-small
          icon
          class="mr-1"
          @click="toggleFilter(valueGroup)"
        >
          <v-icon
            :class="`${
              isolatedLegend[valueGroup.value] ? 'primary--text' : 'grey--text'
            }`"
            style="font-size: 11px"
          >
            mdi-filter
          </v-icon>
        </v-btn>
      </v-col>
    </v-row>
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
  unIsolateObjects
} from '@/main/lib/viewer/commit-object-viewer/stateManager'
export default {
  components: {},
  props: {
    filter: {
      type: Object,
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

    return {
      viewerState
    }
  },
  data() {
    return {
      hidden: [],
      filtered: [],
      typeMap: [],
      legend: {},
      colorLegend: {},
      visibleLegend: {},
      isolatedLegend: {}
    }
  },
  watch: {
    viewerState: {
      deep: true,
      handler() {
        this.updateLegend()
      }
    }
  },
  mounted() {
    this.updateLegend()
  },
  methods: {
    updateLegend() {
      if (!this.viewerState.currentFilterState?.colorGroups) {
        return
      }
      const colorLegend = {}
      const visibleLegend = {}
      const isolatedLegend = {}
      for (const vgc of this.viewerState.currentFilterState.colorGroups) {
        colorLegend[vgc.value] = '#' + vgc.color.toString(16)

        visibleLegend[vgc.value] = this.isVisible(vgc.ids)
        isolatedLegend[vgc.value] = this.isIsolated(vgc.ids)
      }
      this.colorLegend = colorLegend
      this.visibleLegend = visibleLegend
      this.isolatedLegend = isolatedLegend
    },
    async toggleFilter(prop) {
      if (this.isolatedLegend[prop.value]) {
        unIsolateObjects(prop.ids, 'ui-filters')
      } else {
        isolateObjects(prop.ids, 'ui-filters')
      }
    },
    async toggleVisibility(prop) {
      if (this.visibleLegend[prop.value]) {
        hideObjects(prop.ids, 'ui-filters')
      } else {
        showObjects(prop.ids, 'ui-filters')
      }
    },
    isVisible(ids) {
      if (!this.viewerState.currentFilterState) return true
      if (!this.viewerState.currentFilterState?.hiddenObjects) return true

      const targetIds = this.viewerState.currentFilterState?.hiddenObjects?.filter(
        (val) => ids.indexOf(val) !== -1
      )
      if (targetIds.length === 0) return true
      else return false
    },
    isIsolated(ids) {
      if (!this.viewerState.currentFilterState) return false
      if (!this.viewerState.currentFilterState?.isolatedObjects) return false

      const targetIds = this.viewerState.currentFilterState?.isolatedObjects?.filter(
        (val) => ids.indexOf(val) !== -1
      )
      if (targetIds.length === 0) return false
      else return true
    }
  }
}
</script>
<style scoped>
.property-row {
  transition: all 0.3s ease;
  background: rgba(120, 120, 120, 0.05);
}
.property-row:hover {
  background: rgba(120, 120, 120, 0.09);
}
</style>
