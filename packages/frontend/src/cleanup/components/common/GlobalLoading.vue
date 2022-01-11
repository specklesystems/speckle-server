<template>
  <div style="position: fixed; top: 0; width: 100%; z-index: 1000">
    <v-progress-linear v-if="show" indeterminate></v-progress-linear>
  </div>
</template>
<script>
export default {
  data() {
    return {
      show: false
    }
  },
  watch: {},
  mounted() {
    this.$eventHub.$on('page-load', (status) => {
      this.show = status
    })
  }
}
</script>
