<template>
  <!-- eslint-disable vue/no-v-html -->
  <v-app :class="`${$vuetify.theme.dark ? 'background-dark' : 'background-light'}`">
    <v-container fill-height fluid>
      <v-row align="center" justify="center">
        <v-col
          v-if="showBlurb"
          cols="12"
          md="6"
          lg="6"
          xl="4"
          class="hidden-sm-and-down"
        >
          <login-blurb :server-info="serverInfo" />
        </v-col>
        <v-col cols="11" sm="8" md="6" lg="4" xl="3">
          <router-view></router-view>
          <!-- Temporary revert of our no v-html policy: -->
          <p
            v-if="serverInfo"
            class="caption text-center mt-2"
            v-html="serverInfo.termsOfService"
          ></p>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>
<script>
import LoginBlurb from '@/main/components/auth/LoginBlurb.vue'
import { mainServerInfoQuery } from '@/graphql/server'

// TODO: Need to fix the v-html usage ASAP

export default {
  name: 'TheAuth',
  components: { LoginBlurb },
  data() {
    return {}
  },
  computed: {
    showBlurb() {
      return this.$route.name === 'Login' || this.$route.name === 'Register'
    },
    termsOfServiceUrl() {
      if (!this.serverInfo?.termsOfService) return null

      let url
      try {
        url = new URL(this.serverInfo.termsOfService)
      } catch (e) {
        return null // Invalid URL
      }

      return url.toString()
    }
  },
  apollo: {
    serverInfo: {
      query: mainServerInfoQuery
    }
  },
  mounted() {
    // eslint-disable-next-line camelcase
    this.$mixpanel.register({ server_id: this.$mixpanelServerId(), hostApp: 'web' })
  }
}
</script>
