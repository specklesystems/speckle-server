<template lang="html">
  <router-view />
</template>
<script>
export default {
  components: {},
  mounted() {
    let mixpanelId = this.$mixpanelId()
    this.$mixpanel.register({
      server_id: this.$mixpanelServerId(),
      hostApp: 'web-embed'
    })
    if (mixpanelId !== null) {
      this.$mixpanel.identify(mixpanelId)
    }
    this.$mixpanel.track('Visit Embed App')
  }
}
</script>
