<template>
  <v-card color="transparent" class="elevation-0">
    <v-card-title v-if="user" class="text-center">
      <v-avatar color="background" size="124">
        <v-img v-if="user.avatar" :src="user.avatar" />
        <v-img
          v-else
          :src="`https://robohash.org/` + user.id + `.png?size=64x64`"
        />
      </v-avatar>
    </v-card-title>
    <v-card-title v-if="user" class="zzz-justify-center">
      {{ user.name }}
    </v-card-title>
    <v-card-text v-if="user">
      <p class="subtitle-1">{{ user.company }}</p>
      <p>
        <b>Bio:</b>
        {{ user.bio }}
      </p>
      <p v-if="user.email">
        <b>Email:</b>
        {{ user.email }}
      </p>
      <span class="caption" v-if="isSelf">Your user id: {{ user.id }}</span>
    </v-card-text>
    <v-card-actions>
      <v-btn v-if="isSelf" block @click="editUser">
        Edit
        <v-icon small class="ml-3">mdi-pencil-outline</v-icon>
      </v-btn>
    </v-card-actions>
    <user-dialog ref="editUserDialog"></user-dialog>
  </v-card>
</template>
<script>
import gql from "graphql-tag"
import userQuery from "../graphql/user.gql"
import UserDialog from "../components/dialogs/UserDialog"

export default {
  components: { UserDialog },
  props: {
    userId: {
      type: String,
      default: null
    }
  },
  data() {
    return {}
  },
  apollo: {
    user: {
      query: userQuery
    }
  },
  computed: {
    isSelf() {
      if (!this.user) return false
      return this.user.id === localStorage.getItem("uuid")
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
              mutation userUpdate($myUser: UserUpdateInput!) {
                userUpdate(user: $myUser)
              }
            `,
            variables: {
              myUser: { ...dialog.user }
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
