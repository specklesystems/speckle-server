<template>
  <section-card expandable :elevation="2" dense>
    <template #header>Applications</template>
    <template #actions>
      <v-spacer />
      <v-btn small color="primary" @click="appDialog = true">new app</v-btn>
    </template>
    <v-card-text>
      Register and manage third-party Speckle Apps that, once authorised by a user on
      this server, can act on their behalf.
    </v-card-text>
    <v-card-text v-if="$apollo.loading">Loading...</v-card-text>
    <v-card-text v-if="apps && apps.length !== 0">
      <list-item-user-app
        v-for="app in apps"
        :key="app.id"
        :app="app"
        @app-edited="refreshList"
        @deleted="refreshList"
      />
    </v-card-text>
    <v-card-text v-else>You have no apps.</v-card-text>

    <v-dialog v-model="appDialog" width="500">
      <app-new-dialog @app-added="refreshList" @close="appDialog = false" />
    </v-dialog>
  </section-card>
</template>
<script>
import { gql } from '@apollo/client/core'
export default {
  components: {
    SectionCard: () => import('@/main/components/common/SectionCard'),
    ListItemUserApp: () => import('@/main/components/user/ListItemUserApp'),
    AppNewDialog: () => import('@/main/components/user/AppNewDialog')
  },
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
