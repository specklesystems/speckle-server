<template>
  <div
    class="overflow-hidden"
    :style="`width: ${
      $vuetify.breakpoint.xs ? '90%' : '300px'
    }; height: 100%; position: absolute; padding-top: 72px`"
  >
    <!-- <v-card class="px-2"> -->
    <perfect-scrollbar style="height: 100%" :options="{ suppressScrollX: true }">
      <div class="d-flex align-center" style="pointer-events: auto">
        <span class="caption">Selection Info</span>
        <v-spacer />
        <v-btn
          v-show="objects.length > 1"
          v-tooltip="'Open selection in a new window'"
          small
          icon
          target="_blank"
          :href="getSelectionUrl()"
        >
          <v-icon x-small>mdi-open-in-new</v-icon>
        </v-btn>
        <v-btn
          v-tooltip="'Isolate selected objects'"
          :disabled="objects.length === 0 && !isolated"
          small
          icon
          @click.stop="isolateSelection()"
        >
          <v-icon x-small :class="`${!isolated ? 'primary--text' : ''}`">mdi-filter</v-icon>
        </v-btn>
        <v-btn
          v-show="$vuetify.breakpoint.xs"
          v-tooltip="'Isolate selected objects'"
          small
          icon
          @click.stop="$emit('clear-selection')"
        >
          <v-icon x-small>mdi-close</v-icon>
        </v-btn>
      </div>
      <div v-for="prop in props" :key="prop.value.id" style="width: 99%">
        <v-card class="transparent elevation-3 rounded-lg mb-3" style="pointer-events: auto">
          <object-properties-row :prop="prop" :stream-id="streamId" :ref-id="prop.refId" />
        </v-card>
      </div>
      <div v-show="props.length === 1 && !$vuetify.breakpoint.xs" class="caption grey--text">
        Hint: hold shift to select multiple objects.
      </div>
    </perfect-scrollbar>
    <!-- </v-card> -->
  </div>
</template>
<script>
export default {
  components: {
    ObjectPropertiesRow: () => import('@/cleanup/components/viewer/ObjectPropertiesRow')
  },
  props: {
    objects: {
      type: Array,
      default: () => []
    },
    streamId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      expand: true
    }
  },
  computed: {
    props() {
      return this.objects.map((obj) => {
        let key = obj?.id
        if (obj.speckle_type) key = obj.speckle_type.split('.').reverse()[0]
        if (obj.name) key = obj.name
        return {
          key,
          value: obj,
          type: 'object',
          extras: ['open'],
          refId: obj.id
        }
      })
    },
    isolated() {
      let ids = this.objects.map((o) => o.id)
      ids.forEach((val) => {
        if (this.$store.state.isolateValues.indexOf(val) === -1) return false
      })
      return true
    }
  },
  methods: {
    isolateSelection() {
      let ids = this.objects.map((o) => o.id)
      if (!this.isolated)
        this.$store.commit('unisolateObjects', { filterKey: '__parents', filterValues: ids })
      else this.$store.commit('isolateObjects', { filterKey: '__parents', filterValues: ids })
    },
    getSelectionUrl() {
      if (this.objects.length < 2) return ''
      let url = `/streams/${this.streamId}/objects/${this.objects[0].id}?overlay=${this.objects
        .slice(1)
        .map((o) => o.id)
        .join(',')}`
      return url
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
</style>
