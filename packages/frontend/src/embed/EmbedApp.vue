<template lang="html">
  <router-view />
</template>
<script>
export default {
  components: {},
  mounted() {
    this.$matomo.trackPageView('embed/view')
  }
}
</script>
