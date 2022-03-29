<template>
  <v-row
    no-gutters
    class="my-1 property-row rounded-lg"
    @click="$emit('active-toggle', filter)"
  >
    <v-col cols="1" class="text-center" style="line-height: 30px">
      <v-icon
        small
        style="font-size: 12px"
        :class="`${$vuetify.theme.dark ? 'grey--text' : ''}`"
      >
        {{ filter.data.type === 'number' ? 'mdi-numeric' : 'mdi-format-text' }}
      </v-icon>
    </v-col>
    <v-col
      cols="8"
      :class="`caption text-truncate px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
      style="line-height: 30px"
    >
      <span v-tooltip="filter.targetKey">{{ filter.name }}</span>
      <span v-tooltip="'Matching objects'" style="font-size: 10px">
        ({{ filter.data.objectCount }})
      </span>
    </v-col>
  </v-row>
</template>
<script>
export default {
  components: {},
  props: {
    filter: {
      type: Object,
      default: () => null
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
  background: rgba(120, 120, 120, 0.2);
  cursor: pointer;
}
</style>
