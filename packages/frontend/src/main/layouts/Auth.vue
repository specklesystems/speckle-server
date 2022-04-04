<template>
  <v-app :class="`${$vuetify.theme.dark ? 'background-dark' : 'background-light'}`">
    <v-container fill-height fluid>
      <v-row align="center" justify="center">
        <v-col v-if="showBlurb" cols="12" md="6" lg="6" xl="4" class="hidden-sm-and-down">
          <blurb :server-info="serverInfo" />
        </v-col>
        <v-col cols="11" sm="8" md="6" lg="4" xl="3">
          <router-view></router-view>
          <p v-if="serverInfo" class="caption text-center mt-2">
            <a
              v-if="termsOfServiceUrl"
              :href="termsOfServiceUrl"
              target="_blank"
              class="text-decoration-none"
            >
              Terms of Service
            </a>
            <template v-else>
              {{ serverInfo.termsOfService }}
            </template>
          </p>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>
<script>
import gql from 'graphql-tag'
import Blurb from '@/main/components/auth/Blurb'

export default {
  components: { Blurb },
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
      query: gql`
        query {
          serverInfo {
            name
            company
            description
            adminContact
            termsOfService
            inviteOnly
          }
        }
      `
    }
  },
  mounted() {
    this.$mixpanel.register({ server_id: this.$mixpanelServerId(), hostApp: 'web' })
  }
}
</script>
