<template>
  <v-card
    :class="`elevation-${elevation} rounded-lg overflow-hidden ${funky ? 'funky' : ''}`"
  >
    <v-toolbar
      v-show="hasHeaderSlot || hasActionsSlot || expandable"
      flat
      :dense="dense"
    >
      <v-toolbar-title class="text-subtitle-1">
        <slot name="header"></slot>
      </v-toolbar-title>
      <slot name="actions"></slot>
      <v-spacer v-if="expandable && !hasActionsSlot" />
      <v-btn v-if="expandable" icon @click="expandSelf = !expandSelf">
        <v-icon>{{ expandSelf ? 'mdi-minus' : 'mdi-plus' }}</v-icon>
      </v-btn>
    </v-toolbar>
    <v-divider v-show="!$vuetify.theme.dark && hasHeaderSlot" />
    <v-slide-y-transition>
      <div v-show="expandSelf">
        <slot></slot>
      </div>
    </v-slide-y-transition>
  </v-card>
</template>
<script>
export default {
  props: {
    expand: { type: Boolean, default: true },
    expandable: { type: Boolean, default: false },
    elevation: { type: Number, default: 2 },
    funky: { type: Boolean, default: false },
    dense: { type: Boolean, default: false }
  },
  data() {
    return {
      expandSelf: this.expand
    }
  },
  computed: {
    hasHeaderSlot() {
      return !!this.$slots.header
    },
    hasActionsSlot() {
      return !!this.$slots.actions
    }
  },
  watch: {},
  mounted() {}
}
</script>
<style scoped>
.funky {
  -webkit-box-shadow: 0px 0px 8px 0px rgba(0, 94, 255, 0.42) !important;
  -moz-box-shadow: 0px 0px 8px 0px rgba(0, 94, 255, 0.42) !important;
  box-shadow: 0px 0px 8px 0px rgba(0, 94, 255, 0.42) !important;
}
</style>
