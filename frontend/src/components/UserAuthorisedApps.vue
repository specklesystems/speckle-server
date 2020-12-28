<template>
  <v-card xxxcolor="background2" class="elevation-0 mt-3 mb-5 transparent">
    <v-card-title>Your Apps</v-card-title>
    <v-card-text class="">
      Here you can review the apps that you have granted access to.
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
    <div v-if="authorizedApps && authorizedApps.length !== 0">
      <v-row>
        <v-col
          v-for="app in authorizedApps"
          :key="app.id"
          cols="12"
          sm="6"
          class="d-flex"
          style="flex-direction: column"
        >
          <v-card class="background2 flex-grow-1 d-flex flex-column">
            <v-card-text>
              <h3 class="mb-3">
                <v-icon v-if="app.trustByDefault" class="mr-1 primary--text" small>
                  mdi-shield
                </v-icon>
                {{ app.name }}
              </h3>
              <p>{{ app.description }}</p>
              <p v-show="app.id === 'spklwebapp'" class="caption">
                (This is the app your're currently using!)
              </p>
            </v-card-text>
            <v-spacer></v-spacer>
            <v-card-text class="caption my-0 py-0">
              Note: Revoking access will log you out of all instances of this app.
            </v-card-text>
            <v-card-actions>
              <v-btn plain small color="error" @click="revokeAccess(app)">Revoke access</v-btn>
              <v-btn plain small :href="app.redirectUrl" target="_blank">Open</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'

export default {
  components: {},
  data() {
    return {
      appDialog: false
    }
  },
  apollo: {
    authorizedApps: {
      query: gql`
        query {
          user {
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
      update: (data) => data.user.authorizedApps.reverse()
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
    async revokeAccess(app) {
      await this.$apollo.mutate({
        mutation: gql`
          mutation{ appRevokeAccess(appId: "${app.id}")}
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
