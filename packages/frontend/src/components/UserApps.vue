<template>
  <v-card rounded="lg" :class="`${!$vuetify.theme.dark ? 'grey lighten-5' : ''}`">
    <v-toolbar flat>
      <v-toolbar-title>Applications</v-toolbar-title>
    </v-toolbar>

    <v-card-text>
      Register and manage third-party Speckle Apps that, once authorised by a user on this server,
      can act on their behalf.
    </v-card-text>
    <v-card-text v-if="$apollo.loading">Loading...</v-card-text>
    <v-card-text v-if="apps && apps.length !== 0">
      <v-list two-line class="transparent">
        <list-item-user-app v-for="app in apps" :key="app.id" :app="app" @deleted="refreshList" />
      </v-list>
    </v-card-text>
    <v-card-text v-else>You have no apps.</v-card-text>
    <v-card-text>
      <v-btn class="mb-5" @click="appDialog = true">new app</v-btn>
      <v-dialog v-model="appDialog" width="500">
        <app-new-dialog @app-added="refreshList" @close="appDialog = false" />
      </v-dialog>
    </v-card-text>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'
import ListItemUserApp from './ListItemUserApp'
import AppNewDialog from './dialogs/AppNewDialog'

export default {
  components: { ListItemUserApp, AppNewDialog },
  data() {
    return {
      appDialog: false
    }
  },
  apollo: {
    apps: {
      query: gql`
        query {
          user {
            id
            createdApps {
              id
              secret
              name
              description
              redirectUrl
            }
          }
        }
      `,
      update: (data) => data.user.createdApps
    }
  },
  methods: {
    refreshList() {
      this.$apollo.queries.apps.refetch()
    }
  }
}
</script>
