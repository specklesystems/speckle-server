<template>
  <v-list dense nav class="mt-0 py-0">
    <v-list-item :class="`px-2 list-overlay`" active @click="expand = !expand">
      <v-list-item-action>
        <v-icon small>mdi-filter-variant</v-icon>
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Filters</v-list-item-title>
      </v-list-item-content>
      <v-list-item-action class="pa-0 ma-0">
        <v-btn small icon @click.stop="expand = !expand">
          <v-icon>{{ expand ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>
    <v-expand-transition>
      <div v-show="expand">
        <v-subheader>Suggested Filters</v-subheader>
        <div class="px-2">Todo</div>
        <v-subheader>All filters</v-subheader>
        <div class="px-1">
          <v-text-field
            solo
            dense
            placeholder="Search filters"
            append-icon="mdi-magnify"
            hide-details
          />
        </div>
      </div>
    </v-expand-transition>
  </v-list>
</template>
<script>
export default {
  props: {
    views: {
      type: Array,
      default: () => []
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
.list-overlay {
  background: rgba(120, 120, 120, 0.09);
}
</style>
