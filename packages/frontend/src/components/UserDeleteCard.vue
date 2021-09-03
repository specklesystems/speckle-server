<template>
  <div>
    <div v-if="!user">
      <v-skeleton-loader type="card"></v-skeleton-loader>
    </div>
    <div v-else>
      <v-card rounded="lg" :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''} mt-5`" style="overflow: hidden;">
        <v-toolbar flat color="red" dark>
          <v-toolbar-title>Delete Account</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showDelete = !showDelete"><v-icon>mdi-chevron-down</v-icon></v-btn>
        </v-toolbar>
        <div v-show="showDelete">
          <v-card-text>
            This action cannot be undone. We will delete all streams where you are the sole owner,
            and any associated data.
          </v-card-text>
          <v-card-actions>
            <v-btn block @click="deleteUser">Delete account</v-btn>
          </v-card-actions>
        </div>
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
    return {
      showDelete: false
    }
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
