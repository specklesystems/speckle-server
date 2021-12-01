<template>
  <div>
    <v-row no-gutters>
      <v-col v-if="$apollo.queries.stream.loading" cols="12" class="ma-0 pa-0">
        <v-card>
          <v-skeleton-loader type="list-item-avatar, card-avatar, article"></v-skeleton-loader>
        </v-card>
      </v-col>

      <v-col v-else-if="stream.commit" cols="12" class="ma-0 pa-0">
        <portal to="streamActionsBar">
          <v-btn
            v-if="
              stream &&
              stream.role !== 'stream:reviewer' &&
              stream.commit.authorId === loggedInUserId
            "
            v-tooltip="'Edit commit'"
            elevation="0"
            color="primary"
            small
            rounded
            :fab="$vuetify.breakpoint.mdAndDown"
            dark
            @click="editCommit"
          >
            <v-icon small :class="`${$vuetify.breakpoint.mdAndDown ? '' : 'mr-2'}`">
              mdi-pencil
            </v-icon>
            <span class="hidden-md-and-down">Edit</span>
          </v-btn>
        </portal>
        <portal to="streamTitleBar">
          <div>
            <router-link
              v-tooltip="'Go to branch ' + stream.commit.branchName"
              :to="`/streams/${stream.id}/branches/${stream.commit.branchName}`"
              class="text-decoration-none space-grotesk"
            >
              <v-icon small class="primary--text mr-1 mb-1">mdi-source-branch</v-icon>
              <b>{{ stream.commit.branchName }}</b>
            </router-link>
            /
            <v-icon small class="mr-1">mdi-source-commit</v-icon>
            <span v-tooltip="'Commit message'" class="space-grotesk mr-2">
              {{ stream.commit.message }}
            </span>
            <user-avatar
              :id="stream.commit.authorId"
              :avatar="stream.commit.authorAvatar"
              :name="stream.commit.authorName"
              :size="22"
              class="hidden-sm-and-down"
            />
            <v-chip small class="mx-1">
              <timeago :datetime="stream.commit.createdAt"></timeago>
            </v-chip>
            <source-app-avatar
              :application-name="stream.commit.sourceApplication"
              class="hidden-sm-and-down"
            />
          </div>
        </portal>

        <div style="height: 60vh">
          <renderer :object-url="commitObjectUrl" @selection="handleSelection" />
        </div>

        <v-card elevation="0" rounded="lg">
          <!-- Selected object -->
          <v-expand-transition>
            <v-sheet v-show="selectionData.length !== 0" class="pa-4" color="transparent">
              <v-card-title class="mr-8">
                <v-badge inline :content="selectionData.length">
                  <v-icon class="mr-2">mdi-cube</v-icon>
                  Selection
                </v-badge>
              </v-card-title>
              <div v-if="selectionData.length !== 0">
                <object-simple-viewer
                  v-for="(obj, ind) in selectionData"
                  :key="obj.id + ind"
                  :value="obj"
                  :stream-id="stream.id"
                  :key-name="`Selected Object ${ind + 1}`"
                  force-show-open-in-new
                  force-expand
                />
              </div>
            </v-sheet>
          </v-expand-transition>
          <!-- Object explorer -->
          <v-card class="pa-4" rounded="lg" color="transparent">
            <v-toolbar flat class="transparent">
              <v-app-bar-nav-icon style="pointer-events: none">
                <v-icon>mdi-database</v-icon>
              </v-app-bar-nav-icon>
              <v-toolbar-title>Data</v-toolbar-title>
              <v-spacer />
              <commit-received-receipts
                :stream-id="$route.params.streamId"
                :commit-id="stream.commit.id"
              />
            </v-toolbar>
            <v-card-text class="pa-0">
              <object-speckle-viewer
                class="mt-4"
                :stream-id="stream.id"
                :object-id="stream.commit.referencedObject"
                :value="commitObject"
                :expand="true"
              ></object-speckle-viewer>
            </v-card-text>
          </v-card>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="!$apollo.queries.stream.loading && !stream.commit" justify="center">
      <error-placeholder error-type="404">
        <h2>Commit {{ $route.params.commitId }} not found.</h2>
      </error-placeholder>
    </v-row>
    <commit-edit-dialog ref="commitDialog"></commit-edit-dialog>
  </div>
</template>
<script>
import gql from 'graphql-tag'

import streamCommitQuery from '@/graphql/commit.gql'

export default {
  name: 'Branch',
  components: {
    CommitEditDialog: () => import('@/components/dialogs/CommitEditDialog'),
    UserAvatar: () => import('@/components/UserAvatar'),
    ObjectSpeckleViewer: () => import('@/components/ObjectSpeckleViewer'),
    ObjectSimpleViewer: () => import('@/components/ObjectSimpleViewer'),
    Renderer: () => import('@/components/Renderer'),
    SourceAppAvatar: () => import('@/components/SourceAppAvatar'),
    ErrorPlaceholder: () => import('@/components/ErrorPlaceholder'),
    CommitReceivedReceipts: () => import('@/components/CommitReceivedReceipts')
  },
  data: () => ({
    loadedModel: false,
    selectionData: []
  }),
  apollo: {
    stream: {
      prefetch: true,
      query: streamCommitQuery,
      variables() {
        return {
          streamId: this.$route.params.streamId,
          id: this.$route.params.commitId
        }
      }
    },
    // commitActivitiy: {
    //   query: `
    //   query CommitActivity($streamid: String!, $id: String!) {
    //     stream(id: $streamid) {
    //       id
    //       commit(id: $id) {
    //         id
    //         activity(actionType: "commit_receive", limit: 200) {
    //           items {
    //             info
    //             time
    //             userId
    //             message
    //           }
    //         }
    //       }
    //     }
    //   }
    //   `,
    //   variables() {
    //     return {
    //       streamid: this.$route.params.streamId,
    //       id: this.$route.params.commitId
    //     }
    //   },
    //   update:(data) => data.stream.commit.activity
    // }
  },
  computed: {
    loggedInUserId() {
      return localStorage.getItem('uuid')
    },
    commitDate() {
      if (!this.stream.commit) return null
      let date = new Date(this.stream.commit.createdAt)
      let options = { year: 'numeric', month: 'long', day: 'numeric' }

      return date.toLocaleString(undefined, options)
    },
    commitObject() {
      return {
        speckle_type: 'reference',
        referencedId: this.stream.commit.referencedObject
      }
    },
    commitObjectUrl() {
      return `${window.location.origin}/streams/${this.stream.id}/objects/${this.commitObject.referencedId}`
    }
  },
  watch: {
    stream(val) {
      if (!val) return
      if (val.commit.branchName === 'globals')
        this.$router.push(`/streams/${this.$route.params.streamId}/globals/${val.commit.id}`)
    }
  },
  methods: {
    handleSelection(selectionData) {
      this.selectionData.splice(0, this.selectionData.length)
      this.selectionData.push(...selectionData)
    },
    editCommit() {
      this.$refs.commitDialog.open(this.stream.commit, this.stream.id).then((dialog) => {
        if (!dialog.result) return

        this.$matomo && this.$matomo.trackPageView('commit/update')
        this.$apollo
          .mutate({
            mutation: gql`
              mutation commitUpdate($myCommit: CommitUpdateInput!) {
                commitUpdate(commit: $myCommit)
              }
            `,
            variables: {
              myCommit: { ...dialog.commit }
            }
          })
          .then(() => {
            this.$apollo.queries.stream.refetch()
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
<style scoped></style>
