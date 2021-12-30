<template>
  <v-list dense nav class="mt-0 py-0 mb-3">
    <v-list-item
      :class="`px-2 list-overlay-${$vuetify.theme.dark ? 'dark' : 'light'} elevation-2`"
      style="position: sticky; top: 64px"
      @click="expand = !expand"
    >
      <v-list-item-action>
        <v-icon small>mdi-filter-variant</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>
          <span v-if="activeFilter === null">
            Filters
            <span class="caption grey--text">({{ allFilters.length }})</span>
          </span>
          <span v-else>{{ activeFilter.name }}</span>
        </v-list-item-title>
      </v-list-item-content>
      <portal-target name="filter-actions"></portal-target>
      <v-list-item-action v-if="activeFilter" class="pa-0 ma-0">
        <v-btn
          v-tooltip="'Remove filter'"
          small
          icon
          @click.stop="
            activeFilter = null
            filterSearch = null
          "
        >
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </v-list-item-action>
      <v-list-item-action class="pa-0 ma-0">
        <v-btn small icon @click.stop="expand = !expand">
          <v-icon>{{ expand ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>
    <v-scroll-y-transition>
      <div v-show="expand">
        <div v-if="activeFilter" class="px-0">
          <filter-active :filter="activeFilter" />
        </div>
        <div v-show="activeFilter === null">
          <v-subheader>TODO: reccommended filters</v-subheader>
          <div class="">
            <v-text-field
              v-model="filterSearch"
              solo
              dense
              placeholder="Search filters"
              append-icon="mdi-magnify"
              hide-details
              class="my-2"
              style="position: sticky; top: 110px; z-index: 6"
            />
            <div v-for="filter in matchingFilters" :key="filter.targetKey">
              <filter-single :filter="filter" @active-toggle="(e) => (activeFilter = e)" />
            </div>
          </div>
        </div>
      </div>
    </v-scroll-y-transition>
  </v-list>
</template>
<script>
export default {
  components: {
    FilterSingle: () => import('@/cleanup/components/viewer/FilterSingle'),
    FilterActive: () => import('@/cleanup/components/viewer/FilterActive')
  },
  props: {
    props: {
      type: Object,
      default: () => {}
    },
    sourceApplication: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      expand: true,
      defaultFilters: [{ targetKey: 'speckle_type', name: 'Speckle Type' }],
      revitFilters: ['type', 'family', 'level'],
      allFilters: [],
      activeFilter: null,
      filterSearch: null
    }
  },
  computed: {
    matchingFilters() {
      if (this.filterSearch === null) return this.allFilters
      else {
        return this.allFilters.filter(
          (f) =>
            f.name.toLowerCase().includes(this.filterSearch.toLowerCase()) ||
            f.targetKey.toLowerCase().includes(this.filterSearch.toLowerCase())
        )
      }
    }
  },
  watch: {
    props(newVal) {
      if (newVal) this.parseAndSetFilters()
    }
  },
  mounted() {
    if (this.props) {
      this.parseAndSetFilters()
    }
  },
  methods: {
    parseAndSetFilters() {
      let keys = Object.keys(this.props)
      let filters = []
      for (let key of keys) {
        let filter = {}
        // Handle revit params
        if (key.startsWith('parameters.')) {
          if (key.endsWith('.value')) {
            filter.name = this.props[key.replace('.value', '.name')].allValues[0]
            filter.targetKey = key
            filter.data = this.props[key]
            filters.push(filter)
            continue
          } else {
            continue
          }
        }
        // Beautify level name
        if (key === 'level.name') {
          filter.name = 'Level'
          filter.targetKey = key
          filter.data = this.props[key]
          filters.push(filter)
          continue
        }
        // Beautify speckle type
        if (key === 'speckle_type') {
          filter.name = 'Object Type'
          filter.targetKey = key
          filter.data = this.props[key]
          filters.push(filter)
          continue
        }
        // Skip some
        if (
          key.endsWith('.units') ||
          key.endsWith('.speckle_type') ||
          key.includes('.parameters.') ||
          key.includes('level.') ||
          key.includes('renderMaterial') ||
          key.includes('.domain') ||
          key.includes('plane.') ||
          key.includes('baseLine') ||
          key.includes('referenceLine') ||
          key.includes('end.') ||
          key.includes('start.') ||
          key.includes('endPoint.') ||
          key.includes('midPoint.') ||
          key.includes('startPoint.') ||
          key.includes('startPoint.') ||
          key.includes('displayStyle') ||
          key.includes('displayValue') ||
          key.includes('displayMesh')
        ) {
          continue
        }

        filter.name = key
        filter.targetKey = key
        filter.data = this.props[key]
        filters.push(filter)
      }
      console.log(filters)
      this.allFilters = filters
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
.ps {
  height: 50vh;
}
</style>
