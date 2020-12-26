<template>
  <v-card rounded="lg" class="pa-4" elevation="0" color="transparent" :loading="$apollo.loading">
    <template slot="progress">
      <v-progress-linear indeterminate></v-progress-linear>
    </template>
    <v-card-title class="mr-8 display-1">
      <router-link v-show="!isHomeRoute" :to="'/streams/' + stream.id" class="text-decoration-none">
        {{ stream.name }}
      </router-link>
      <div v-show="isHomeRoute">
        {{ stream.name }}
      </div>
    </v-card-title>
    <v-divider class="mx-4"></v-divider>
    <v-card-text>
      <p class="caption grey--text mt-0 pb-0">
        Created
        <timeago :datetime="stream.createdAt"></timeago>
        ({{ streamDate }})
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
        <v-icon small>mdi-history</v-icon>
        &nbsp;
        <span>
          {{ stream.commits.totalCount }}
          commit{{ stream.commits.totalCount === 1 ? '' : 's' }}
        </span>
      </p>
      <p>
        <span v-if="stream.isPublic">
          <v-icon small>mdi-link</v-icon>
          &nbsp; link sharing on
        </span>
        <span v-else>
          <v-icon small>mdi-shield-lock</v-icon>
          &nbsp; link sharing off
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
        <edit-stream-dialog
          :stream-id="stream.id"
          :name="stream.name"
          :is-public="stream.isPublic"
          :open="editStreamDialog"
          @close="editClosed"
        />
      </v-dialog>
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
        @click="dialogShare = true"
      >
        <v-icon small class="mr-2">mdi-account-multiple</v-icon>
        Manage
      </v-btn>
      <v-dialog v-model="dialogShare" max-width="500">
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
import EditStreamDialog from '../components/dialogs/EditStreamDialog'
import StreamShareDialog from '../components/dialogs/StreamShareDialog'
import UserAvatar from '../components/UserAvatar'

export default {
  components: {
    EditStreamDialog,
    StreamShareDialog,
    UserAvatar
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
    },
    streamDate() {
      if (!this.stream) return null
      let date = new Date(this.stream.createdAt)
      let options = { year: 'numeric', month: 'short', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    }
  },
  methods: {
    editClosed() {
      this.editStreamDialog = false
      this.$apollo.queries.stream.refetch()
    }
  }
}
</script>
