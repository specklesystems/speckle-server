<template>
  <v-list dense nav class="mt-0 py-0 mb-3">
    <v-list-item
      :class="`px-2 list-overlay-${$vuetify.theme.dark ? 'dark' : 'light'} elevation-2`"
      active
      style="position: sticky; top: 82px"
      @click="expand = !expand"
    >
      <v-list-item-action>
        <v-icon small>mdi-source-commit</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>
          {{ title }}
          <!-- <span class="caption grey--text">({{ objects.length }})</span> -->
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-action class="pa-0 ma-0">
        <!-- <v-btn v-tooltip="'Isolate objects'" small icon @click.stop="">
          <v-icon small>mdi-filter</v-icon>
        </v-btn> -->
      </v-list-item-action>
      <v-list-item-action class="pa-0 ma-0">
        <v-btn small icon @click.stop="expand = !expand">
          <v-icon>{{ expand ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>
    <v-expand-transition>
      <div v-show="expand" class="mt-3">
        <object-properties :obj="obj" :stream-id="streamId" />
      </div>
    </v-expand-transition>
  </v-list>
</template>
<script>
export default {
  components: {
    ObjectProperties: () => import('@/cleanup/components/viewer/ObjectProperties')
  },
  props: {
    obj: {
      type: Object,
      default: () => {}
    },
    title: {
      type: String,
      default: 'YOLO'
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
  computed: {}
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
