<template>
  <div class="mt-3">
    <portal to="filter-actions">
      <v-list-item-action class="pa-0 ma-0">
        <v-btn
          v-tooltip="'Set colors automatically based on each property'"
          small
          icon
          @click.stop="toggleColors()"
        >
          <v-icon small :class="`${colorBy ? 'primary--text' : ''}`">
            mdi-palette
          </v-icon>
        </v-btn>
      </v-list-item-action>
    </portal>
    <v-row
      v-for="type in typeMap"
      :key="type.fullName"
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
        {{ type.count }}
      </v-col>
      <v-col
        v-tooltip="type.fullName"
        cols="7"
        :class="`caption text-truncate px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
        style="line-height: 24px"
      >
        {{ type.name }}
      </v-col>
      <v-col
        cols="4"
        :class="`caption text-truncate text-right px-1 ${
          $vuetify.theme.dark ? 'grey--text' : ''
        }`"
        style="line-height: 24px"
      >
        <div
          v-if="colorBy"
          class="d-inline-block rounded mr-3 mt-1 elevation-3"
          :style="`width: 8px; height: 8px; background:${
            viewerState.colorLegend[type.fullName]
          };`"
        ></div>
        <v-btn
          v-tooltip="'Toggle visibility'"
          x-small
          icon
          class="mr-1"
          @click="toggleVisibility(type.fullName)"
        >
          <v-icon class="grey--text" style="font-size: 11px">
            {{
              viewerState.hideCategoryValues.indexOf(type.fullName) === -1
                ? 'mdi-eye'
                : 'mdi-eye-off'
            }}
          </v-icon>
        </v-btn>
        <v-btn
          v-tooltip="'Isolate objects'"
          x-small
          icon
          class="mr-1"
          @click="toggleFilter(type.fullName)"
        >
          <v-icon
            :class="`${
              viewerState.isolateCategoryValues.indexOf(type.fullName) !== -1
                ? 'primary--text'
                : 'grey--text'
            }`"
            style="font-size: 11px"
          >
            {{
              !viewerState.isolateCategoryValues.indexOf(type.fullName) !== -1
                ? 'mdi-filter'
                : 'mdi-filter'
            }}
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
  hideCategoryToggle,
  isolateCategoryToggle,
  resetFilter,
  toggleColorByCategory
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
          colorLegend
          hideCategoryValues
          isolateCategoryValues
          appliedFilter
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
      appliedFilter: {},
      legend: {}
    }
  },
  computed: {
    colorBy() {
      return this.viewerState.appliedFilter?.colorBy
    }
  },
  watch: {
    filter(newVal) {
      this.generateTypeMap(newVal)
    }
  },
  mounted() {
    this.generateTypeMap(this.filter)
  },
  beforeDestroy() {
    resetFilter()
  },
  methods: {
    mashColorLegend(colorLegend) {
      // just adds to our colors
      if (!colorLegend) return
      const keys = Object.keys(colorLegend)
      for (const key of keys) {
        if (!this.legend[key]) this.$set(this.legend, key, colorLegend[key])
      }
    },
    async toggleColors() {
      toggleColorByCategory({ filterKey: this.filter.targetKey })
    },
    async toggleFilter(type) {
      isolateCategoryToggle({
        colorBy: this.colorBy,
        filterKey: this.filter.targetKey,
        filterValue: type,
        allValues: this.typeMap.map((t) => t.fullName)
      })
    },
    async toggleVisibility(type) {
      hideCategoryToggle({
        colorBy: this.colorBy,
        filterKey: this.filter.targetKey,
        filterValue: type
      })
    },
    generateTypeMap(filter) {
      if (filter.data.type !== 'string') return []
      const typeMap = []
      for (const key of Object.keys(filter.data.uniqueValues)) {
        const shortName = key.split('.').reverse()[0]
        typeMap.push({
          name: shortName,
          fullName: key,
          count: filter.data.uniqueValues[key]
        })
      }
      this.typeMap.splice(0, this.typeMap.length)
      this.typeMap.push(...typeMap)
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
