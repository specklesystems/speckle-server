<template lang="html">
  <router-view />
</template>
<script>
export default {
  components: {},
  mounted() {
    const mixpanelId = this.$mixpanelId()
    this.$mixpanel.register({
      // Unfortunately we can't replace this to camelCase, because that will break metrics
      // eslint-disable-next-line camelcase
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
