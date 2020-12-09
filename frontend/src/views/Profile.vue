<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="12" md="4" lg="3" xl="2">
        <user-info-card></user-info-card>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9">
        <v-card class="elevation-0 mt-3" color="background2" @click="editUser">
          <v-card-title>
            Edit Details
            <v-icon class="ml-3" small>mdi-pencil-outline</v-icon>
          </v-card-title>
        </v-card>
        <v-card class="elevation-0 mt-3" color="background2">
          <v-card-title>Access Tokens</v-card-title>
          <v-card-text>TODO</v-card-text>
        </v-card>
        <v-card class="elevation-0 mt-3" color="background2">
          <v-card-title>Your Apps</v-card-title>
          <v-card-text>TODO</v-card-text>
        </v-card>
        <v-card class="elevation-0 mt-3" color="background2">
          <v-card-title>Authorized Apps</v-card-title>
          <v-card-text>TODO</v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <user-dialog ref="editUserDialog"></user-dialog>
  </v-container>
</template>
<script>
import gql from "graphql-tag"
import userQuery from "../graphql/user.gql"
import UserInfoCard from "../components/UserInfoCard"
import UserDialog from "../components/dialogs/UserDialog"

export default {
  name: "Profile",
  components: { UserInfoCard, UserDialog },
  data: () => ({}),
  apollo: {
    user: {
      query: userQuery
    }
  },
  computed: {},
  methods: {
    editUser() {
      this.$refs.editUserDialog.open(this.user).then((dialog) => {
        if (!dialog.result) return

        this.$apollo
          .mutate({
            mutation: gql`
              mutation userUpdate($myUser: UserUpdateInput!) {
                userUpdate(user: $myUser)
              }
            `,
            variables: {
              myUser: { ...dialog.user }
            }
          })
          .then((data) => {
            // this.$apollo.queries.user.refetch()
          })
          .catch((error) => {
            // Error
            console.error(error)
          })
      })
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
