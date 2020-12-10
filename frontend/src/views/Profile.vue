<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <user-info-card></user-info-card>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9">
        <user-access-tokens />
        <v-card class="elevation-0 mt-3" color="background2">
          <v-card-title>Your Apps</v-card-title>
          <v-card-text>TODO</v-card-text>
        </v-card>
        <v-card class="elevat ion-0 mt-3" color="background2">
          <v-card-title>Authorized Apps</v-card-title>
          <v-card-text>TODO</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import gql from "graphql-tag"
import userQuery from "../graphql/user.gql"
import UserInfoCard from "../components/UserInfoCard"
import UserAccessTokens from "../components/UserAccessTokens"

export default {
  name: "Profile",
  components: { UserInfoCard, UserAccessTokens },
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
