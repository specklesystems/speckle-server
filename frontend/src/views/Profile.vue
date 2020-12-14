<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <user-info-card></user-info-card>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9">
        <v-alert type="info">
          Heads up! Currently this section is intended mostly for developers.
        </v-alert>
        <user-access-tokens />
        <user-apps />
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import gql from "graphql-tag"
import userQuery from "../graphql/user.gql"
import UserInfoCard from "../components/UserInfoCard"
import UserAccessTokens from "../components/UserAccessTokens"
import UserApps from "../components/UserApps"

export default {
  name: "Profile",
  components: { UserInfoCard, UserAccessTokens, UserApps },
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
