<template>
  <v-container :fluid="$vuetify.breakpoint.mdAndDown">
    <v-row v-if="stream">
      <v-col cols="12" sm="12" md="4" lg="3" xl="3">
        <sidebar-stream :user-role="userRole"></sidebar-stream>
      </v-col>
      <v-col cols="12" sm="12" md="8" lg="9" xl="9" class="pt-10">
        <router-view :user-role="userRole"></router-view>
      </v-col>
    </v-row>
    <v-row v-else-if="error" justify="center">
      <v-col cols="12" sm="12" md="8" lg="9" xl="8" class="pt-10">
        <error-block :message="error" />
      </v-col>
    </v-row>
    <v-snackbar
      v-if="commitSnackbarInfo"
      v-model="commitSnackbar"
      :timeout="5000"
      color="primary"
      absolute
      right
      top
    >
      New commit
      <i>{{ commitSnackbarInfo.message }}</i>
      on
      <i>{{ commitSnackbarInfo.branchName }}</i>
      <template #action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          :to="'/streams/' + $route.params.streamId + '/commits/' + commitSnackbarInfo.id"
          @click="commitSnackbar = false"
        >
          see
        </v-btn>
        <v-btn icon v-bind="attrs" @click="commitSnackbar = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
    <stream-invite-dialog v-if="stream" ref="streamInviteDialog" :stream-id="stream.id" />
  </v-container>
</template>

<script>
import SidebarStream from '../components/SidebarStream'
import ErrorBlock from '../components/ErrorBlock'
import streamQuery from '../graphql/stream.gql'
import gql from 'graphql-tag'
import StreamInviteDialog from '../components/dialogs/StreamInviteDialog'

export default {
  name: 'Stream',
  components: {
    SidebarStream,
    ErrorBlock,
    StreamInviteDialog
  },
  data() {
    return {
      error: '',
      commitSnackbar: false,
      commitSnackbarInfo: {}
    }
  },
  apollo: {
    stream: {
      query: streamQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      error(err) {
        if (err.message) this.error = err.message.replace('GraphQL error: ', '')
        else this.error = err
      }
    },
    $subscribe: {
      streamUpdated: {
        query: gql`
          subscription($id: String!) {
            streamUpdated(streamId: $id)
          }
        `,
        variables() {
          return {
            id: this.$route.params.streamId
          }
        },
        result(info) {
          this.$apollo.queries.stream.refetch()
        },
        skip() {
          return !this.loggedIn
        }
      },
      commitCreated: {
        query: gql`
          subscription($streamId: String!) {
            commitCreated(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.$route.params.streamId
          }
        },
        result(commitInfo) {
          if (!commitInfo.data.commitCreated) return
          this.commitSnackbar = true
          this.commitSnackbarInfo = commitInfo.data.commitCreated
        },
        skip() {
          return !this.loggedIn
        }
      }
    }
  },
  computed: {
    userRole() {
      let uuid = localStorage.getItem('uuid')
      if (!uuid) return null
      if (this.$apollo.loading) return null
      let contrib = this.stream.collaborators.find((u) => u.id === uuid)
      if (contrib) return contrib.role.split(':')[1]
      else return null
    }
  },
  mounted() {
    //open stream invite dialog if ?invite=true
    //used by desktop connectors
    if (this.$route.query.invite && this.$route.query.invite === 'true') {
      setTimeout(() => {
        this.$refs.streamInviteDialog.show()
      }, 500)
    }
  },
  loggedIn() {
    return localStorage.getItem('uuid') !== null
  }
}
</script>
