<template>
  <v-row no-gutters class="my-1 property-row rounded-lg">
    <v-col cols="1" class="text-center">
      <v-icon small style="font-size: 12px" :class="`${$vuetify.theme.dark ? 'grey--text' : ''}`">
        {{ icon }}
      </v-icon>
    </v-col>
    <v-col
      v-tooltip="prop.key"
      cols="5"
      :class="`caption text-truncate px-1 ${$vuetify.theme.dark ? 'grey--text' : ''}`"
      style="line-height: 24px"
    >
      {{ prop.key.startsWith('@') ? prop.key.substring(1) : prop.key }}
    </v-col>
    <v-col
      v-if="prop.type !== 'object' && prop.type !== 'array'"
      v-tooltip="prop.value.toString()"
      cols="6"
      class="caption text-truncate px-1"
      style="line-height: 24px"
    >
      {{ prop.value }}
      <v-icon
        v-if="prop.value === null"
        small
        style="font-size: 12px"
        :class="`${$vuetify.theme.dark ? 'grey--text' : ''}`"
      >
        mdi-circle-off-outline
      </v-icon>
    </v-col>
    <v-col v-else cols="6" class="caption text-truncate px-1 text-right">
      <span v-if="prop.length" class="grey--text mr-1" style="font-size: 10px">
        ({{ prop.length }})
      </span>
      <v-btn
        v-if="prop.extras.includes('open')"
        v-tooltip="'Open object in a new window'"
        x-small
        icon
        class="mr-1"
        target="_blank"
        :href="`/streams/${streamId}/objects/${refId}`"
        @xxxxclick="toggleVisibility()"
      >
        <v-icon class="grey--text" style="font-size: 11px">mdi-open-in-new</v-icon>
      </v-btn>
      <v-btn
        v-if="prop.extras.includes('visibility')"
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
      <v-btn
        v-if="prop.extras.includes('visibility')"
        v-tooltip="'Isolate objects'"
        x-small
        icon
        class="mr-1"
        @click="toggleFilter()"
      >
        <v-icon :class="`${filtered ? 'primary--text' : 'grey--text'}`" style="font-size: 11px">
          {{ !filtered ? 'mdi-filter' : 'mdi-filter' }}
        </v-icon>
      </v-btn>
      <v-btn v-tooltip="'Expand/collapse property'" x-small icon @click="expanded = !expanded">
        <v-icon :class="`${expanded ? 'primary--text' : 'grey--text'}`" style="font-size: 11px">
          {{ expanded ? 'mdi-minus-box' : 'mdi-plus-box' }}
        </v-icon>
      </v-btn>
    </v-col>
    <v-scroll-y-transition>
      <v-col v-if="expanded" cols="12">
        <object-properties :obj="prop.value" :stream-id="streamId" />
      </v-col>
    </v-scroll-y-transition>
  </v-row>
</template>
<script>
import { v4 as uuidv4 } from 'uuid'

export default {
  components: {
    ObjectProperties: () => import('@/cleanup/components/viewer/ObjectProperties')
  },
  props: ['prop', 'streamId', 'parent', 'refId'],
  data() {
    return {
      expanded: false,
      visible: true,
      filtered: false,
      id: uuidv4()
    }
  },
  computed: {
    icon() {
      switch (this.prop.type) {
        case 'object':
          return 'mdi-code-braces'
        case 'array':
          return 'mdi-code-brackets'
        case 'string':
          return 'mdi-format-text'
        default:
          return 'mdi-numeric'
      }
    }
  },
  mounted() {
    this.$eventHub.$on('filter-reset', () => {
      this.filtered = false
    })
    this.$eventHub.$on('vis-reset', () => {
      this.visible = true
    })
  },
  methods: {
    toggleVisibility() {
      this.visible = !this.visible
      if (this.filtered && !this.visible) this.filtered = false
      let targetIds
      if (this.prop.type === 'object') targetIds = [this.prop.value.referencedId]
      if (this.prop.type === 'array') {
        targetIds = this.prop.value.map((o) => o.referencedId)
      }

      if (!this.visible) this.$eventHub.$emit('hide-objects', targetIds)
      else this.$eventHub.$emit('show-objects', targetIds)
      this.$eventHub.$emit('filter-reset')
    },
    toggleFilter() {
      this.filtered = !this.filtered
      if (this.filtered && !this.visible) {
        this.visible = true
        // TODO: remove visibility filter
      }

      let targetIds
      if (this.prop.type === 'object') targetIds = [this.prop.value.referencedId]
      if (this.prop.type === 'array') {
        targetIds = this.prop.value.map((o) => o.referencedId)
      }
      if (this.filtered) this.$eventHub.$emit('isolate-objects', targetIds)
      else this.$eventHub.$emit('unisolate-objects', targetIds)
      this.$eventHub.$emit('vis-reset')
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
