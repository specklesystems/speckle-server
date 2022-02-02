<template lang="html">
  <router-view />
</template>
<script>
export default {
  components: {},
  mounted() {
    let mixpanelId = this.$mixpanelId()
    if (mixpanelId !== null) {
      this.$mixpanel.identify(mixpanelId)
      this.$mixpanel.people.set('Theme Web', this.$vuetify.theme.dark ? 'dark' : 'light')
    }
    this.$mixpanel.track('Visit Embed App')
    this.$mixpanel.register({ server_id: this.$mixpanelServerId, hostApp: 'web-embed' })
  }
}
</script>
