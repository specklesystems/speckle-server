<template>
  <div class="mt-3">
    <portal to="filter-actions">
      <v-list-item-action class="pa-0 ma-0">
        <v-btn v-tooltip="''" small icon @click.stop="colorBy = !colorBy">
          <v-icon small :class="`${colorBy ? 'primary--text' : ''}`">mdi-palette</v-icon>
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
        :class="`text-center text-truncate px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
        style="line-height: 24px; font-size: 9px"
      >
        {{ type.count }}
      </v-col>
      <v-col
        v-tooltip="type.fullName"
        cols="8"
        :class="`caption text-truncate px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
        style="line-height: 24px"
      >
        {{ type.name }}
      </v-col>
      <v-col
        cols="3"
        :class="`caption text-truncate text-right px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
        style="line-height: 24px"
      >
        <div
          v-if="colorBy"
          class="d-inline-block rounded"
          :style="`width: 10px; height: 10px`"
        ></div>
        <v-btn
          v-tooltip="'Toggle visibility'"
          x-small
          icon
          class="mr-1"
          @click="toggleVisibility(type.fullName)"
        >
          <v-icon class="grey--text" style="font-size: 11px">
            {{ hidden.indexOf(type.fullName) === -1 ? 'mdi-eye' : 'mdi-eye-off' }}
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
            :class="`${filtered.indexOf(type.fullName) !== -1 ? 'primary--text' : 'grey--text'}`"
            style="font-size: 11px"
          >
            {{ !filtered.indexOf(type.fullName) !== -1 ? 'mdi-filter' : 'mdi-filter' }}
          </v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>
<script>
export default {
  components: {},
  props: {
    filter: {
      type: Object,
      default: () => null
    },
    active: { type: Boolean, default: false }
  },
  data() {
    return {
      hidden: [],
      filtered: [],
      typeMap: [],
      colorBy: false,
      appliedFilter: {},
      legend: null
    }
  },
  watch: {
    filter(newVal) {
      this.generateTypeMap(newVal)
    },
    async colorBy(newVal) {
      this.appliedFilter.colorBy = newVal
        ? { type: 'category', property: this.filter.targetKey }
        : null
      let res = await window.__viewer.applyFilter(this.appliedFilter)
      console.log(res)
      this.mashColorLegend(res.colorLegend)
    }
  },
  mounted() {
    this.generateTypeMap(this.filter)
  },
  beforeDestroy() {
    window.__viewer.applyFilter(null)
  },
  methods: {
    mashColorLegend(thanksCristi) {
      if (!thanksCristi) return
      // TODO
    },
    async toggleFilter(type) {
      let indx = this.filtered.indexOf(type)
      if (indx === -1) this.filtered.push(type)
      else this.filtered.splice(indx, 1)
      this.hidden.splice(0, this.hidden.length)
      if (this.filtered.length === 0) {
        window.__viewer.applyFilter(
          this.colorBy ? { colorBy: { type: 'category', property: this.filter.targetKey } } : null
        )
        this.appliedFilter = {}
      } else {
        let filterObj = {
          filterBy: {},
          colorBy: this.colorBy ? { type: 'category', property: this.filter.targetKey } : null,
          ghostOthers: true
        }
        filterObj.filterBy[this.filter.targetKey] = this.filtered
        let res = await window.__viewer.applyFilter(filterObj)
        this.mashColorLegend(res.colorLegend)
        this.appliedFilter = filterObj
      }
    },
    async toggleVisibility(type) {
      let indx = this.hidden.indexOf(type)
      if (indx === -1) this.hidden.push(type)
      else this.hidden.splice(indx, 1)
      this.filtered.splice(0, this.filtered.length)
      if (this.hidden.length === 0) {
        window.__viewer.applyFilter(
          this.colorBy ? { colorBy: { type: 'category', property: this.filter.targetKey } } : null
        )
        this.appliedFilter = {}
      } else {
        let filterObj = {
          filterBy: {},
          colorBy: this.colorBy ? { type: 'category', property: this.filter.targetKey } : null,
          ghostOthers: false
        }
        filterObj.filterBy[this.filter.targetKey] = { not: this.hidden }
        let res = await window.__viewer.applyFilter(filterObj)
        this.mashColorLegend(res.colorLegend)
        this.appliedFilter = filterObj
      }
    },
    generateTypeMap(filter) {
      if (filter.data.type !== 'string') return []
      let typeMap = []
      for (let key of Object.keys(filter.data.uniqueValues)) {
        let shortName = key.split('.').reverse()[0]
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
