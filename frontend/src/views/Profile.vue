<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <user-info-card :user="user"></user-info-card>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="7" class="pt-10">
        <v-card v-if="user" class="mb-3">
          <v-card-text class="body-1">
            <span>
              You have
              <v-icon small>mdi-compare-vertical</v-icon>
              <b>{{ user.streams.totalCount }}</b>
              streams and
              <v-icon small>mdi-source-commit</v-icon>
              <b>{{ user.commits.totalCount }}</b>
              commits.
            </span>
            <v-btn icon to="/streams"><v-icon>mdi-arrow-right</v-icon></v-btn>
          </v-card-text>
        </v-card>
        <user-authorised-apps />
        <v-alert type="info" class="my-5 mt-10">
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
        <user-access-tokens />
        <user-apps />
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

export default {
  name: 'Profile',
  components: { UserInfoCard, UserAccessTokens, UserApps, UserAuthorisedApps },
  data: () => ({}),
  apollo: {
    user: {
      query: userQuery
    }
  },
  computed: {}
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
