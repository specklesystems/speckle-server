<template>
  <v-card class="elevation-0 mt-3 mb-5 transparent">
    <v-card-text class="">
      Here you can review the apps that you have granted access to. If something looks
      suspcious, revoke the access!
      <v-btn
        v-if="!hasManager"
        plain
        small
        :href="`speckle://accounts?add_server_account=${rootUrl}`"
      >
        Add Account To Desktop Manager
      </v-btn>
    </v-card-text>
    <v-card-text v-if="$apollo.loading">Loading...</v-card-text>
    <v-card-text v-if="authorizedApps && authorizedApps.length !== 0">
      <v-row>
        <v-col
          v-for="app in authorizedApps"
          :key="app.id"
          cols="12"
          sm="6"
          class="d-flex"
          style="flex-direction: column"
        >
          <v-card flex-grow-1 d-flex flex-column outlined>
            <v-card-text>
              <h3 class="mb-3">
                <v-icon v-if="app.trustByDefault" class="mr-1 primary--text" small>
                  mdi-shield
                </v-icon>
                {{ app.name }}
              </h3>
              <p class="text-truncate">
                {{ app.description }}
                <span v-show="app.id === 'spklwebapp'" class="caption">
                  (This is the app your're currently using!)
                </span>
              </p>
            </v-card-text>
            <v-spacer></v-spacer>
            <v-card-actions>
              <v-btn plain small color="error" @click="showRevokeAccessDialog(app)">
                Revoke access
              </v-btn>
              <v-btn plain small :href="app.redirectUrl" target="_blank">Open</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      <v-dialog v-model="showRevokeDialog" max-width="500">
        <v-card>
          <v-card-title>Revoke Access</v-card-title>
          <v-card-text>
            Revoking access to your app will log you out of it on all devices. Are you
            sure you want to proceed?
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn plain small color="error" @click="revokeAccess()">
              Revoke access
            </v-btn>
            <v-btn plain small>Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card-text>
  </v-card>
</template>
<script>
import { gql } from '@apollo/client/core'

export default {
  components: {},
  data() {
    return {
      appDialog: false,
      showRevokeDialog: false,
      appToRevoke: null
    }
  },
  apollo: {
    authorizedApps: {
      query: gql`
        query {
          activeUser {
            id
            authorizedApps {
              id
              description
              name
              redirectUrl
              trustByDefault
            }
          }
        }
      `,
      update: (data) =>
        data.activeUser.authorizedApps.filter((app) => app.id !== 'spklwebapp')
    }
  },
  computed: {
    rootUrl() {
      return window.location.origin
    },
    hasManager() {
      if (!this.authorizedApps) return null
      return this.authorizedApps.findIndex((a) => a.id === 'sdm') !== -1
    }
  },
  methods: {
    showRevokeAccessDialog(app) {
      this.showRevokeDialog = true
      this.appToRevoke = app
    },
    async revokeAccess() {
      this.showRevokeDialog = false
      this.$mixpanel.track('App Action', { type: 'action', name: 'revoke' })
      await this.$apollo.mutate({
        mutation: gql`
          mutation{ appRevokeAccess(appId: "${this.appToRevoke.id}")}
        `
      })
      this.refreshList()
    },
    refreshList() {
      this.$apollo.queries.authorizedApps.refetch()
    }
  }
}
</script>
