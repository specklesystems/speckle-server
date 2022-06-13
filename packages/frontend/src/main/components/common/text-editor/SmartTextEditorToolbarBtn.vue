<template>
  <v-btn x-small tile elevation="0" :input-value="value" @click="onClick">
    <slot />
  </v-btn>
</template>
<script>
export default {
  name: 'SmartTextEditorToolbarBtn',
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    onClick(e) {
      this.$emit('input', !this.value)
      this.$emit('click', e)
    }
  }
}
</script>
