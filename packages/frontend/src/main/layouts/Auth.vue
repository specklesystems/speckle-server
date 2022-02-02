<template>
  <v-app :class="`${$vuetify.theme.dark ? 'background-dark' : 'background-light'}`">
    <v-container fill-height fluid>
      <v-row align="center" justify="center">
        <v-col v-if="showBlurb" cols="12" md="6" lg="6" xl="4" class="hidden-sm-and-down">
          <blurb :server-info="serverInfo" />
        </v-col>
        <v-col cols="11" sm="8" md="6" lg="4" xl="3">
          <router-view></router-view>
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
  }
}
</script>
