<template>
  <v-card rounded="lg" class="pa-4" elevation="0" color="transparent" :loading="$apollo.loading">
    <template slot="progress">
      <v-progress-linear indeterminate></v-progress-linear>
    </template>
    <v-card-title class="mr-8 display-1">
      <router-link
        v-show="!isHomeRoute"
        :to="'/streams/' + stream.id"
        class="text-decoration-none"
        style="width: 100%"
      >
        {{ stream.name }}
      </router-link>
      <span v-show="isHomeRoute" style="width: 100%">
        {{ stream.name }}
      </span>
      <v-btn v-show="!isHomeRoute" plain small class="mt-3 pa-0" :to="'/streams/' + stream.id">
        <v-icon small>mdi-chevron-left</v-icon>
        back to stream
      </v-btn>
    </v-card-title>
    <v-divider class="mx-4"></v-divider>
    <v-card-text v-if="isHomeRoute && stream.commits.items.length !== 0">
      <p class="mb-2">
        Latest update:
        <timeago :datetime="stream.commits.items[0].createdAt"></timeago>
      </p>
      <v-chip
        small
        color="primary"
        class="pa-2"
        :to="
          stream.commits.items[0].branchName.startsWith('globals')
            ? `/streams/${stream.id}/${stream.commits.items[0].branchName}/${stream.commits.items[0].id}`
            : `/streams/${stream.id}/commits/${stream.commits.items[0].id}`
        "
      >
        <v-icon small class="mr-1">mdi-source-commit</v-icon>
        {{ stream.commits.items[0].id }}
      </v-chip>
      on
      <router-link
        class="text-decoration-none"
        :to="
          stream.commits.items[0].branchName.startsWith('globals')
            ? `/streams/${stream.id}/${stream.commits.items[0].branchName}`
            : `/streams/${stream.id}/branches/${stream.commits.items[0].branchName}`
        "
      >
        <v-icon small color="primary">mdi-source-branch</v-icon>
        {{ stream.commits.items[0].branchName }}
      </router-link>
    </v-card-text>
    <v-divider class="mx-4"></v-divider>
    <v-card-text>
      <p>
        Created
        <timeago v-tooltip="formatDate(stream.createdAt)" :datetime="stream.createdAt"></timeago>
      </p>

      <p>
        <v-icon small>mdi-source-branch</v-icon>
        &nbsp;
        <span>
          {{ stream.branches.totalCount }}
          branch{{ stream.branches.totalCount === 1 ? '' : 'es' }}
        </span>
      </p>
      <p>
        <v-icon small>mdi-source-commit</v-icon>
        &nbsp;
        <span>
          {{ stream.commits.totalCount }}
          commit{{ stream.commits.totalCount === 1 ? '' : 's' }}
        </span>
      </p>
      <p class="font-weight-bold">
        <span
          v-if="stream.isPublic"
          v-tooltip="`Anyone can view this stream. Only you and collaborators can edit it.`"
        >
          <v-icon small>mdi-lock-open-variant-outline</v-icon>
          &nbsp; public
        </span>
        <span v-else v-tooltip="`Only collaborators can access this stream.`">
          <v-icon small>mdi-lock-outline</v-icon>
          &nbsp; private
        </span>
      </p>
      <v-divider class="pb-2"></v-divider>
      <v-btn
        v-if="userRole === 'owner' && isHomeRoute"
        small
        plain
        color="primary"
        text
        class="px-0"
        @click="editStreamDialog = true"
      >
        <v-icon small class="mr-2 float-left">mdi-cog-outline</v-icon>
        Edit
      </v-btn>

      <v-dialog v-model="editStreamDialog" max-width="500">
        <stream-edit-dialog
          :stream-id="stream.id"
          :name="stream.name"
          :is-public="stream.isPublic"
          :open="editStreamDialog"
          @close="editClosed"
        />
      </v-dialog>
    </v-card-text>

    <v-card-text v-show="isHomeRoute">
      <v-btn
        v-tooltip="'Edit stream global variables!'"
        block
        small
        elevation="0"
        :to="`/streams/${stream.id}/globals`"
      >
        Globals
      </v-btn>
    </v-card-text>

    <v-card-title v-show="isHomeRoute"><h5>Collaborators</h5></v-card-title>
    <v-card-text v-show="isHomeRoute">
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
      <v-divider class="pb-2 mt-2"></v-divider>

      <v-btn
        v-if="userRole === 'owner'"
        small
        plain
        color="primary"
        text
        class="px-0 d-block"
        @click="dialogShare = true"
      >
        <v-icon small class="mr-2">mdi-account-multiple</v-icon>
        Manage
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
        Send an invite
      </v-btn>
      <stream-invite-dialog ref="streamInviteDialog" :stream-id="stream.id" />
      <v-dialog v-if="userId" v-model="dialogShare" max-width="500">
        <stream-share-dialog
          :users="stream.collaborators"
          :stream-id="stream.id"
          :user-id="userId"
          @close="dialogShare = false"
        ></stream-share-dialog>
      </v-dialog>
    </v-card-text>
  </v-card>
</template>
<script>
import streamQuery from '../graphql/stream.gql'
import StreamEditDialog from '../components/dialogs/StreamEditDialog'
import StreamShareDialog from '../components/dialogs/StreamShareDialog'
import UserAvatar from '../components/UserAvatar'
import StreamInviteDialog from '../components/dialogs/StreamInviteDialog'

export default {
  components: {
    StreamEditDialog,
    StreamShareDialog,
    UserAvatar,
    StreamInviteDialog
  },
  props: {
    userRole: {
      type: String,
      default: null
    }
  },
  apollo: {
    stream: {
      query: streamQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      }
    }
  },
  data: () => ({
    editStreamDialog: false,
    dialogShare: false
  }),
  computed: {
    isHomeRoute() {
      return this.$route.name === 'stream'
    },
    userId() {
      return localStorage.getItem('uuid')
    }
  },
  methods: {
    editClosed() {
      this.editStreamDialog = false
      this.$apollo.queries.stream.refetch()
    },
    formatDate(d) {
      if (!this.stream) return null
      let date = new Date(d)
      let options = { year: 'numeric', month: 'short', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    },
    showStreamInviteDialog() {
      this.$refs.streamInviteDialog.show()
    }
  }
}
</script>
