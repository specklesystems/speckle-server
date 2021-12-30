<template>
  <v-row no-gutters class="my-1 property-row rounded-lg">
    <v-col cols="1" class="text-center" style="line-height: 30px">
      <v-icon small style="font-size: 12px" :class="`${$vuetify.theme.dark ? 'grey--text' : ''}`">
        {{ filter.data.type === 'number' ? 'mdi-numeric' : 'mdi-format-text' }}
      </v-icon>
    </v-col>
    <v-col
      v-tooltip="filter.targetKey"
      cols="8"
      :class="`caption text-truncate px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
      style="line-height: 30px"
    >
      {{ filter.name }}
    </v-col>
    <v-col class="text-right" style="line-height: 30px">
      <v-btn x-small @click="$emit('active-toggle', filter)">{{ active ? 'Remove' : 'Set' }}</v-btn>
    </v-col>
    <v-scroll-y-transition>
      <v-col v-if="active && filter.data.type === 'string'" cols="12">
        <!-- <div v-if="filter.data.type === 'string'"> -->
        <v-row
          v-for="type in typeMap"
          :key="type.fullName"
          no-gutters
          class="my-1 property-row rounded-lg"
        >
          <v-col
            cols="1"
            :class="`caption text-center text-truncate px-1 ${
              $vuetify.theme.dark ? 'grey--text' : ''
            }`"
            style="line-height: 24px; font-size: 10px"
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
            :class="`caption text-truncate text-right px-1 ${
              $vuetify.theme.dark ? 'grey--text' : ''
            }`"
            style="line-height: 24px"
          >
            <v-btn
              v-tooltip="'Toggle visibility'"
              x-small
              icon
              class="mr-1"
              @click="toggleVisibility()"
            >
              <v-icon class="grey--text" style="font-size: 11px">
                {{ visible ? 'mdi-eye' : 'mdi-eye-off' }}
              </v-icon>
            </v-btn>
            <v-btn v-tooltip="'Isolate objects'" x-small icon class="mr-1" @click="toggleFilter()">
              <v-icon
                :class="`${filtered ? 'primary--text' : 'grey--text'}`"
                style="font-size: 11px"
              >
                {{ !filtered ? 'mdi-filter' : 'mdi-filter' }}
              </v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <!-- </div> -->
      </v-col>
    </v-scroll-y-transition>
  </v-row>
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
      visible: true,
      filtered: false
    }
  },
  computed: {
    typeMap() {
      if (this.filter.data.type !== 'string') return []
      let typeMap = []
      for (let key of Object.keys(this.filter.data.uniqueValues)) {
        let shortName = key.split('.').reverse()[0]
        typeMap.push({
          name: shortName,
          fullName: key,
          count: this.filter.data.uniqueValues[key]
        })
      }
      return typeMap
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
