<template>
  <v-container :fluid="$vuetify.breakpoint.mdAndDown">
    <v-navigation-drawer app clipped left>
      <v-card-text v-if="stream">
        <!-- <div v-if="isHomeRoute">
          <v-btn
            v-if="userRole === 'owner'"
            small
            color="primary"
            text
            class="px-0"
            @click="editStreamDialog = true"
          >
            <v-icon small class="mr-2 float-left">mdi-pencil-outline</v-icon>
            Edit details
          </v-btn>
          <v-btn
            v-if="userRole === 'owner'"
            small
            color="primary"
            text
            class="px-0 d-block"
            @click="dialogShare = true"
          >
            <v-icon small class="mr-2">mdi-account-multiple</v-icon>
            Manage collaboratos
          </v-btn> -->

        <!-- <v-btn
          v-tooltip="'Edit stream global variables!'"
          small
          plain
          color="primary"
          text
          class="px-0 d-block justify-start"
          :to="`/streams/${stream.id}/globals`"
        >
          Manage Globals
        </v-btn> -->

        <!-- <v-btn
            v-if="userRole === 'owner'"
            small
            color="primary"
            text
            left
            class="px-0"
            :to="`/streams/${stream.id}/settings/general`"
            @click.prevent=""
          >
            <v-icon small class="mr-2">mdi-cog-outline</v-icon>
            Settings
          </v-btn>

          <v-btn
            v-if="userRole === 'owner'"
            small
            plain
            color="primary"
            text
            class="px-0 d-block"
            @click="showStreamInviteDialog"
          >
            <v-icon small class="mr-2">mdi-email-send-outline</v-icon>
            Invite to this stream
          </v-btn>

          <v-dialog v-model="editStreamDialog" max-width="500">
            <stream-edit-dialog
              :stream-id="stream.id"
              :name="stream.name"
              :description="stream.description"
              :is-public="stream.isPublic"
              :open="editStreamDialog"
              @close="editClosed"
            />
          </v-dialog>

          <v-card-title><h5>Collaborators</h5></v-card-title>

          <v-row no-gutters>
            <template v-for="(collab, i) in stream.collaborators">
              <v-col :key="i" cols="3" class="mb-2">
                <user-avatar
                  :id="collab.id"
                  :size="40"
                  :avatar="collab.avatar"
                  :name="collab.name"
                ></user-avatar>
              </v-col>
              <v-col :key="collab.id" cols="9" class="mb-2 hidden-sm-and-down">
                <span class="text-body-2">{{ collab.name }}</span>
                <br />
                <span class="caption">{{ collab.role.split(':')[1] }}</span>
              </v-col>
            </template>
          </v-row>

          <stream-invite-dialog ref="streamInviteDialog" :stream-id="stream.id" />
          <v-dialog v-if="userId" v-model="dialogShare" max-width="500">
            <stream-share-dialog
              :users="stream.collaborators"
              :stream-id="stream.id"
              :user-id="userId"
              @close="dialogShare = false"
            ></stream-share-dialog>
          </v-dialog> -->
        <!-- </div> -->
      </v-card-text>

      <v-list>
        <v-list-item
          v-for="menu in menues"
          :key="menu.name"
          :to="menu.to"
          exact
          @click="handleFunction(menu.click)"
        >
          <v-list-item-icon>
            <v-icon>{{ menu.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ menu.name }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-row v-if="stream">
      <!-- <v-col cols="12" sm="12" md="4" lg="3" xl="3">
        <sidebar-stream :user-role="userRole"></sidebar-stream>
      </v-col> -->

      <v-col cols="12" class="pt-10">
        <router-view :user-role="userRole"></router-view>
      </v-col>
    </v-row>
    <v-row v-else-if="error" justify="center">
      <v-col cols="12" class="pt-10">
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
    <v-dialog v-if="userId && stream" v-model="dialogShare" max-width="500">
      <stream-share-dialog
        :users="stream.collaborators"
        :stream-id="stream.id"
        :user-id="userId"
        @close="dialogShare = false"
      ></stream-share-dialog>
    </v-dialog>
    <v-dialog v-model="editStreamDialog" max-width="500">
      <stream-edit-dialog
        v-if="stream"
        :stream-id="stream.id"
        :name="stream.name"
        :description="stream.description"
        :is-public="stream.isPublic"
        :open="editStreamDialog"
        @close="editClosed"
      />
    </v-dialog>
  </v-container>
</template>

<script>
import ErrorBlock from '@/components/ErrorBlock'
import streamQuery from '@/graphql/stream.gql'
import gql from 'graphql-tag'
import StreamInviteDialog from '@/components/dialogs/StreamInviteDialog'
import StreamEditDialog from '@/components/dialogs/StreamEditDialog'
import StreamShareDialog from '@/components/dialogs/StreamShareDialog'

export default {
  name: 'Stream',
  components: {
    ErrorBlock,
    StreamInviteDialog,
    StreamShareDialog,
    StreamEditDialog
  },
  data() {
    return {
      error: '',
      commitSnackbar: false,
      commitSnackbarInfo: {},
      editStreamDialog: false,
      dialogShare: false,
      menues: [
        { name: 'Activity', icon: 'mdi-history', to: '/streams/' + this.$route.params.streamId },
        {
          name: 'Branches',
          icon: 'mdi-source-branch',
          to: '/streams/' + this.$route.params.streamId + '/branches'
        },
        {
          name: 'Collaborators',
          icon: 'mdi-account-group-outline',
          click: 'manageCollabrators'
        },
        {
          name: 'Globals',
          icon: 'mdi-earth',
          to: '/streams/' + this.$route.params.streamId + '/globals'
        },
        {
          name: 'Webhooks',
          icon: 'mdi-webhook',
          to: '/streams/' + this.$route.params.streamId + '/webhooks'
        },
        {
          name: 'Settings',
          icon: 'mdi-cog-outline',
          click: 'editStream'
        }
      ]
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
    userId() {
      return localStorage.getItem('uuid')
    },
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
  },
  methods: {
    handleFunction(f) {
      if (this[f]) this[f]()
    },
    editStream() {
      this.editStreamDialog = true
    },
    manageCollabrators() {
      this.dialogShare = true
    },
    showStreamInviteDialog() {
      this.$refs.streamInviteDialog.show()
    },
    editClosed() {
      this.editStreamDialog = false
      this.$apollo.queries.stream.refetch()
    }
  }
}
</script>
<style>
.v-breadcrumbs {
  padding: 0 !important;
  margin-bottom: 25px;
}
.v-breadcrumbs li {
  font-size: inherit !important;
  font-weight: inherit !important;
}
</style>
