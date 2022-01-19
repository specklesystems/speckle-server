<template>
  <div class="mt-3">
    <portal to="filter-actions">
      <v-list-item-action class="pa-0 ma-0">
        <v-btn
          v-tooltip="'Set colors automatically based on each property'"
          small
          icon
          @click.stop="colorBy = !colorBy"
        >
          <v-icon small :class="`${colorBy ? 'primary--text' : ''}`">mdi-palette</v-icon>
        </v-btn>
      </v-list-item-action>
    </portal>
    <v-row no-gutters class="my-1 property-row rounded-lg">
      <v-col
        cols="1"
        :class="`text-center text-truncate px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
        style="line-height: 24px; font-size: 9px"
      >
        <v-icon small style="font-size: 12px" :class="`${$vuetify.theme.dark ? 'grey--text' : ''}`">
          mdi-information-outline
        </v-icon>
      </v-col>
      <v-col
        cols="11"
        :class="`caption text-truncatexxx px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
        style="line-height: 24px"
      >
        {{ filter.data.objectCount }} elements; min:
        {{ Math.round(filter.data.minValue, 2) | prettynum }}; max:
        {{ Math.round(filter.data.maxValue, 2) | prettynum }}
        <v-btn
          v-show="range[0] !== filter.data.minValue || range[1] !== filter.data.maxValue"
          v-tooltip="'Reset'"
          x-small
          icon
          class="mr-1 float-right"
          @click="
            $set(range, 0, filter.data.minValue)
            $set(range, 1, filter.data.maxValue)
            setFilter()
          "
        >
          <v-icon class="grey--text mt-1" style="font-size: 12px">mdi-refresh</v-icon>
        </v-btn>
      </v-col>
      <v-col
        v-if="filter.data.maxValue === filter.data.minValue"
        cols="12"
        :class="`caption text-truncatexxx px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
        style="line-height: 24px"
      >
        Invalid values (min value equals to max value).
      </v-col>
      <!-- <v-col v-else cols="12" class="mt-5 py-5 px-5">
        <v-range-slider
          v-model="range"
          dense
          hide-details
          thumb-label="always"
          color="primary"
          :step="0.01"
          :max="filter.data.maxValue"
          :min="filter.data.minValue"
          :class="`${colorBy ? 'super-slider' : ''}`"
          @change="setFilter()"
        >
          <template #thumb-label="{ value }">{{ value | prettynum }}</template>
        </v-range-slider>
      </v-col> -->
      <v-col ref="parent" cols="12" class="px-3 py-3">
        <HistogramSlider
          :key="width"
          :width="width"
          :bar-height="100"
          :data="filter.data.allValues"
          :bar-width="4"
          :bar-gap="6"
          :handle-size="18"
          :max="filter.data.maxValue"
          :min="filter.data.minValue"
          force-edges
          :keyboard="false"
          :bar-radius="2"
          :prettify="prettify"
          :colors="['#3F5EFB', '#FC466B']"
          :clip="false"
          :font-size="10"
          grid-text-color="grey"
          drag-interval
          @finish="setFilterHistogram"
        />
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
      range: [0, 1],
      colorBy: true,
      width: 300
    }
  },
  watch: {
    filter(newVal) {
      this.$set(this.range, 0, newVal.data.minValue)
      this.$set(this.range, 1, newVal.data.maxValue)
    },
    colorBy() {
      this.setFilter()
    }
  },
  mounted() {
    this.$set(this.range, 0, this.filter.data.minValue)
    this.$set(this.range, 1, this.filter.data.maxValue)
    this.setFilter()
    this.width = this.$refs.parent.clientWidth - 24
    this.$eventHub.$on('resize-viewer', () => {
      this.width = this.$refs.parent.clientWidth - 24
    })
  },
  beforeDestroy() {
    this.$store.commit('resetFilter')
  },
  methods: {
    async setFilterHistogram(e) {
      this.$store.commit('setNumericFilter', {
        filterKey: this.filter.targetKey,
        minValue: e.from,
        maxValue: e.to
      })
    },
    async setFilter() {
      this.$store.commit('setNumericFilter', {
        filterKey: this.filter.targetKey,
        minValue: this.range[0],
        maxValue: this.range[1]
      })
    },
    prettify(num) {
      return this.$options.filters.prettynum(num)
    }
  }
}
</script>
<style>
.property-row {
  transition: all 0.3s ease;
  background: rgba(120, 120, 120, 0.05);
}
.property-row:hover {
  background: rgba(120, 120, 120, 0.09);
}
.super-slider .v-slider__track-fill {
  background: linear-gradient(to left, #fc466b, #3f5efb) !important;
  background: -webkit-linear-gradient(to left, #fc466b, #3f5efb); /* Chrome 10-25, Safari 5.1-6 */
}
</style>
