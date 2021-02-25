<template>
  <v-card color="transparent" class="elevation-0">
    <v-card-title v-if="user" class="text-wrap">
      {{ serverInfo.name }}
      <v-btn
        v-if="user.role === `server:admin`"
        v-tooltip="'Edit server information'"
        small
        icon
        @click="editServer"
      >
        <v-icon small>mdi-pencil-outline</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <p class="subtitle-1">{{ serverInfo.company }}</p>
      <p>{{ serverInfo.description }}</p>
      <p v-if="serverInfo.adminContact" class="caption">Contact: {{ serverInfo.adminContact }}</p>
    </v-card-text>
    <server-dialog ref="editServerDialog"></server-dialog>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'
import serverQuery from '../graphql/server.gql'
import ServerDialog from '../components/dialogs/ServerDialog'

export default {
  components: { ServerDialog },
  data() {
    return { serverInfo: {} }
  },
  apollo: {
    user: {
      query: gql`
        query {
          user {
            id
            role
          }
        }
      `
    },
    serverInfo: {
      prefetch: true,
      query: serverQuery
    }
  },
  methods: {
    editServer() {
      this.$refs.editServerDialog.open(this.serverInfo).then((dialog) => {
        if (!dialog.result) return
        console.log(dialog)
        this.$matomo && this.$matomo.trackPageView('server/update')
        this.$apollo
          .mutate({
            mutation: gql`
              mutation serverInfoUpdate($myServerInfo: ServerInfoUpdateInput!) {
                serverInfoUpdate(info: $myServerInfo)
              }
            `,
            variables: {
              myServerInfo: { ...dialog.server }
            }
          })
          .then((data) => {
            this.$apollo.queries.serverInfo.refetch()
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
