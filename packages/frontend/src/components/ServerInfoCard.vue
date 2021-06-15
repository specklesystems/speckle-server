<template>
  <v-card color="transparent" class="text-center elevation-0">
    <v-card-title v-if="user" class="text-center text-wrap justify-center">
      {{ serverInfo.name }}
    </v-card-title>
    <v-card-text>
      <p class="subtitle-1">{{ serverInfo.company }}</p>
      <p>{{ serverInfo.description }}</p>
      <p v-if="serverInfo.adminContact" class="caption">Contact: {{ serverInfo.adminContact }}</p>
    </v-card-text>
    <v-card-actions>
      <v-btn
        v-if="user && user.role === `server:admin`"
        v-tooltip="'Takes you to the admin page'"
        tag="router-link"
        small
        plain
        color="primary"
        text
        block
        to="/admin/settings"
      >
        <v-icon small class="mr-2">mdi-cog-outline</v-icon>
        Go to Admin panel
      </v-btn>
    </v-card-actions>

    <server-edit-dialog ref="editServerDialog"></server-edit-dialog>
  </v-card>
</template>
<script>
import gql from 'graphql-tag'
import serverQuery from '../graphql/server.gql'
import ServerEditDialog from '../components/dialogs/ServerEditDialog'

export default {
  components: { ServerEditDialog },
  props: {
    user: {
      type: Object,
      default: null
    }
  },
  data() {
    return { serverInfo: {} }
  },
  apollo: {
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
