<template>
  <div style="position: fixed; top: 0; width: 100%; z-index: 1000">
    <v-progress-linear v-if="show" indeterminate></v-progress-linear>
  </div>
</template>
<script>
export default {
  data() {
    return {
      show: false,
      snack: false,
      text: null,
      actionName: null,
      to: null
    }
  },
  watch: {},
  mounted() {
    this.$eventHub.$on('page-load', (status) => {
      this.show = status
    })
    // this.$eventHub.$on('notification', (args) => {
    //   this.snack = true
    //   this.text = args.text
    //   this.actionName = args.action ? args.action.name : null
    //   this.to = args.action ? args.action.to : null
    // })
  }
}
</script>
