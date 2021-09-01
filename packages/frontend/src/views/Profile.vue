<template>
  <v-container :style="`${ !$vuetify.breakpoint.xsOnly ? 'padding-left: 56px;' : ''} max-width: 1024px;`" >
    <!-- <v-container :fluid="$vuetify.breakpoint.mdAndDown"> -->
    <v-row>
      <v-col
        cols="12"
        :style="`margin-top: ${$vuetify.breakpoint.smAndDown ? '0px' : '50px'}`"
        class="pa-3"
      >
        <user-info-card :user="user" @update="update"></user-info-card>
      </v-col>
      <v-col cols="12">
        <user-authorised-apps />
        <v-alert type="info" class="my-5 mt-10 mx-4">
          Heads up! The sections below are intended for developers.
        </v-alert>
        <v-card color="transparent" class="elevation-0 mt-3">
          <v-card-title>
            Trying to learn the api?
            <v-spacer />
            <v-btn href="/explorer" text color="primary" target="_blank">
              Checkout the GraphIQL explorer!
            </v-btn>
          </v-card-title>
        </v-card>
        <v-card color="transparent" flat>
          <v-card-text>
            <user-access-tokens />
          </v-card-text>
          <v-card-text>
            <user-apps />
            <user-delete-card :user="user" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import userQuery from '../graphql/user.gql'
import UserInfoCard from '../components/UserInfoCard'
import UserAccessTokens from '../components/UserAccessTokens'
import UserApps from '../components/UserApps'
import UserAuthorisedApps from '../components/UserAuthorisedApps'
import UserDeleteCard from '../components/UserDeleteCard'

export default {
  name: 'Profile',
  components: {
    UserInfoCard,
    UserAccessTokens,
    UserApps,
    UserAuthorisedApps,
    UserDeleteCard
  },
  data: () => ({}),
  apollo: {
    user: {
      query: userQuery
    }
  },
  computed: {},
  methods: {
    update() {
      this.$apollo.queries.user.refetch()
    }
  }
}
</script>
<style scoped>
.v-item-group {
  float: left;
}

.clear {
  clear: both;
}
</style>
