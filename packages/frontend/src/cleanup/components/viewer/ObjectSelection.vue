<template>
  <v-list dense nav class="py-0 mb-3">
    <v-list-item
      :class="`px-2 list-overlay-${$vuetify.theme.dark ? 'dark' : 'light'} elevation-2`"
      style="position: sticky; top: 82px"
      @click="expand = !expand && props.length !== 0"
    >
      <v-list-item-action>
        <v-icon small :class="`${props.length !== 0 ? '' : 'grey--text'}`">mdi-mouse</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>
          Selection
          <span class="caption grey--text">({{ objects.length }})</span>
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-action class="pa-0 ma-0">
        <v-btn
          v-tooltip="'Open selection in a new window'"
          :disabled="objects.length === 0 && isolated"
          small
          icon
          target="_blank"
          :href="getSelectionUrl()"
        >
          <v-icon small>mdi-open-in-new</v-icon>
        </v-btn>
      </v-list-item-action>
      <v-list-item-action class="pa-0 ma-0">
        <v-btn
          v-tooltip="'Isolate selected objects'"
          :disabled="objects.length === 0 && !isolated"
          small
          icon
          @click.stop="isolateSelection()"
        >
          <v-icon small :class="`${!isolated ? 'primary--text' : ''}`">mdi-filter</v-icon>
        </v-btn>
      </v-list-item-action>
      <v-list-item-action class="pa-0 ma-0">
        <v-btn small icon :disabled="props.length === 0" @click.stop="expand = !expand">
          <v-icon>{{ expand ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>
    <v-expand-transition>
      <div v-show="expand" class="mt-3">
        <div v-for="prop in props" :key="prop.value.id">
          <object-properties-row :prop="prop" :stream-id="streamId" :ref-id="prop.refId" />
        </div>
        <v-subheader v-show="props.length === 1" class="caption grey--text">
          <v-icon
            small
            style="font-size: 12px"
            :class="`${$vuetify.theme.dark ? 'grey--text' : ''} ml-0 mr-2`"
          >
            mdi-help
          </v-icon>
          Hint: hold shift to select multiple objects.
        </v-subheader>
      </div>
    </v-expand-transition>
  </v-list>
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
