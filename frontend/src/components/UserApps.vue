<template>
  <v-card color="background2" class="elevation-0 mt-3">
    <v-card-title>Applications</v-card-title>
    <v-card-text>
      Register and manage third-party Speckle Applications. TODO: Blurb
    </v-card-text>
    <v-card-text v-if="$apollo.loading">Loading...</v-card-text>
    <v-card-text v-if="apps">
      <v-list three-line>
        <list-item-user-app
          v-for="app in apps"
          :key="app.id"
          :app="app"
          @deleted="refreshList"
        />
      </v-list>
    </v-card-text>
    <v-card-text>
      <v-btn @click="tokenDialog = true">new app</v-btn>
      <v-dialog v-model="tokenDialog" persistent width="500">
        <token-dialog @token-added="refreshList" @close="tokenDialog = false" />
      </v-dialog>
    </v-card-text>
  </v-card>
</template>
<script>
import gql from "graphql-tag"
import ListItemUserApp from "./ListItemUserApp"
import TokenDialog from "./dialogs/TokenDialog"

export default {
  components: { ListItemUserApp, TokenDialog },
  data() {
    return {
      tokenDialog: false
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
