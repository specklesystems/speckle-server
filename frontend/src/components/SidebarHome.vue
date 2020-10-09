<template>
  <div>
    <v-sheet rounded="lg" class="pa-4 text-center" style="position: relative">
      <v-avatar class="mb-4" color="grey lighten-3" size="64">
        <v-img v-if="user.avatar" :src="user.avatar" />
        <v-img
          v-else
          :src="`https://robohash.org/` + user.id + `.png?size=64x64`"
        />
      </v-avatar>
      <div>
        <strong>{{ user.name }}</strong>
      </div>
      <div>{{ user.company }}</div>
      <div class="pt-2 pb-2">
        <i>{{ user.bio }}</i>
      </div>
      <code>{{ user.id }}</code>

      <v-btn
        small
        icon
        style="position: absolute; right: 20px; top: 20px"
        @click="editUser"
      >
        <v-icon small>mdi-pencil-outline</v-icon>
      </v-btn>

      <user-dialog ref="editUserDialog"></user-dialog>
    </v-sheet>

    <v-sheet rounded="lg" class="mt-5 pa-4 text-center">
      <div>
        <strong>{{ serverInfo.name }}</strong>
      </div>
      <div>{{ serverInfo.company }}</div>
      <div>{{ serverInfo.description }}</div>
      <div v-if="serverInfo.adminContact">
        {{ serverInfo.adminContact }}
      </div>
      <code v-if="serverInfo.canonicalUrl">
        {{ serverInfo.canonicalUrl }}
      </code>
    </v-sheet>
  </div>
</template>
<script>
import userQuery from "../graphql/user.gql"
import serverQuery from "../graphql/server.gql"
import gql from "graphql-tag"
import UserDialog from "../components/dialogs/UserDialog"

export default {
  components: { UserDialog },
  data: () => ({ user: {}, serverInfo: {} }),
  apollo: {
    user: {
      prefetch: true,
      query: userQuery
    },
    serverInfo: {
      prefetch: true,
      query: serverQuery
    }
  },
  methods: {
    editUser() {
      this.$refs.editUserDialog.open(this.user).then((dialog) => {
        if (!dialog.result) return
        console.log(dialog)
        this.$apollo
          .mutate({
            mutation: gql`
              mutation userEdit($myUser: UserEditInput!) {
                userEdit(user: $myUser)
              }
            `,
            variables: {
              myUser: {
                name: dialog.user.name,
                company: dialog.user.company,
                bio: dialog.user.bio //TODO: this is not working https://github.com/specklesystems/Server/issues/30
              }
            }
          })
          .then((data) => {
            this.$apollo.queries.user.refetch()
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
