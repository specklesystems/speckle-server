<template>
  <div class="mt-3">
    <v-row no-gutters class="my-1 property-row rounded-lg">
      <v-col
        cols="1"
        :class="`text-center text-truncate px-1 ${
          $vuetify.theme.dark ? 'grey--text' : ''
        }`"
        style="line-height: 24px; font-size: 9px"
      >
        <v-icon
          small
          style="font-size: 12px"
          :class="`${$vuetify.theme.dark ? 'grey--text' : ''}`"
        >
          mdi-information-outline
        </v-icon>
      </v-col>
      <v-col
        cols="11"
        :class="`caption text-truncatexxx px-1 ${
          $vuetify.theme.dark ? 'grey--text' : ''
        }`"
        style="line-height: 24px"
      >
        {{ filter.objectCount }} elements; min:
        {{ Math.round(filter.min, 2) | prettynum }}; max:
        {{ Math.round(filter.max, 2) | prettynum }}
      </v-col>
      <v-col
        v-if="filter.max === filter.min"
        cols="12"
        :class="`caption text-truncatexxx px-1 ${
          $vuetify.theme.dark ? 'grey--text' : ''
        }`"
        style="line-height: 24px"
      >
        Invalid values (min value equals to max value).
      </v-col>
      <v-col v-else ref="parent" cols="12" class="px-3 py-3">
        <histogram-slider
          ref="histogramSlider"
          :key="width"
          :width="width"
          :bar-height="100"
          :data="filter.valueGroups.map((vg) => vg.value)"
          :bar-width="4"
          :bar-gap="6"
          :handle-size="18"
          :max="filter.max"
          :min="filter.min"
          :step="filter.min / 10"
          force-edges
          :keyboard="false"
          :bar-radius="2"
          :prettify="prettify"
          :colors="['#3F5EFB', '#FC466B']"
          :clip="true"
          :font-size="10"
          grid-text-color="grey"
          drag-interval
          @finish="setFilterHistogram"
        />
      </v-col>
      <!-- TODO: set up manual entry for ranges -->
      <!-- <v-col class="d-flex px-2 mt-2">
        <v-text-field
          v-model="userMin"
          :min="filter.data.min"
          :max="filter.data.max"
          type="number"
          class="px-1"
          label="min"
          @input="setMin"
        />
        <v-text-field
          v-model="userMax"
          :min="filter.data.min"
          :max="filter.data.max"
          type="number"
          class="px-1"
          label="max"
          @input="setMax"
        />
      </v-col> -->
    </v-row>
  </div>
</template>
<script>
import 'vue-histogram-slider/dist/histogram-slider.css'
import HistogramSlider from 'vue-histogram-slider'

import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { computed } from 'vue'

import { setColorFilter } from '@/main/lib/viewer/commit-object-viewer/stateManager'

export default {
  components: {
    HistogramSlider
  },
  props: {
    filter: {
      type: Object,
      default: () => null
    },
    active: { type: Boolean, default: false },
    preventFirstSet: { type: Boolean, default: false }
  },
  setup() {
    const { result: viewerStateResult } = useQuery(gql`
      query {
        commitObjectViewerState @client {
          currentFilterState
          objectProperties
          localFilterPropKey
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
      width: 300,
      preventFirstSetInternal: this.preventFirstSet,
      userMin: 0,
      userMax: 1,
      error: false,
      errorMessages: []
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.userMin = this.viewerState?.currentFilterState?.passMin || this.filter.min
      this.userMax = this.viewerState?.currentFilterState?.passMax || this.filter.max
      this.$refs.histogramSlider.update({ from: this.userMin, to: this.userMax })
    })

    this.width = this.$refs.parent ? this.$refs.parent.clientWidth - 24 : 300
    this.$eventHub.$on('resize-viewer', () => {
      this.width = this.$refs.parent ? this.$refs.parent.clientWidth - 24 : 300
    })
  },
  methods: {
    async setFilterHistogram(e) {
      if (this.preventFirstSetInternal) {
        this.preventFirstSetInternal = false
        return
      }

      const propInfo = { ...this.filter }
      propInfo.passMin = e.from
      propInfo.passMax = e.to
      setColorFilter(propInfo)
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
  background: -webkit-linear-gradient(
    to left,
    #fc466b,
    #3f5efb
  ); /* Chrome 10-25, Safari 5.1-6 */
}
</style>
