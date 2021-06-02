<template>
  <div>
    <div v-if="!user">
      <v-skeleton-loader type="card"></v-skeleton-loader>
    </div>
    <div v-else>
      <v-alert type="error" class="my-5 mt-10 mx-4">Danger zone</v-alert>
      <v-card color="transparent" flat>
        <v-card-title>
          Delete account and all associated streams
          <v-spacer />
          <v-btn text color="error" @click="deleteUser">Delete account</v-btn>
        </v-card-title>
      </v-card>
      <user-delete-dialog ref="userDeleteDialog"></user-delete-dialog>
    </div>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import UserDeleteDialog from '../components/dialogs/UserDeleteDialog'
import { signOut } from '@/auth-helpers'

export default {
  components: { UserDeleteDialog },
  props: {
    user: {
      type: Object,
      default: null
    }
  },
  data() {
    return {}
  },
  computed: {},
  methods: {
    deleteUser() {
      this.$refs.userDeleteDialog.open(this.user).then((dialog) => {
        if (!dialog.result) return

        this.$matomo && this.$matomo.trackPageView('user/delete')

        this.isLoading = true
        this.$apollo
          .mutate({
            mutation: gql`
              mutation userDelete($myUserConfirmation: UserDeleteInput!) {
                userDelete(userConfirmation: $myUserConfirmation)
              }
            `,
            variables: {
              myUserConfirmation: {
                email: dialog.email
              }
            }
          })
          .then(() => {
            this.isLoading = false
            signOut()
          })
      })
    }
  }
}
</script>
