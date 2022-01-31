<template>
  <v-app
    id="speckle-auth"
    :class="`${$vuetify.theme.dark ? 'background-dark' : 'background-light'}`"
  >
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
import Blurb from '@/cleanup/components/auth/Blurb'

export default {
  components: { Blurb },
  data() {
    return {}
  },
  computed: {
    showBlurb() {
      // return true
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
<style scoped>
.background-light {
  background: #8e9eab;
  background: -webkit-linear-gradient(to top right, #eeeeee, #c8e8ff);
  background: linear-gradient(to top right, #ffffff, #c8e8ff);
}

.background-dark {
  background: #141e30;
  background: -webkit-linear-gradient(to top left, #243b55, #141e30);
  background: linear-gradient(to top left, #243b55, #141e30);
}
</style>
