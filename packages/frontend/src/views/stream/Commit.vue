<template>
  <div>
    <v-row>
      <v-col v-if="$apollo.queries.stream.loading" cols="12" class="ma-0 pa-0">
        <v-card>
          <v-skeleton-loader type="list-item-avatar, card-avatar, article"></v-skeleton-loader>
        </v-card>
      </v-col>

      <v-col v-else-if="stream.commit" cols="12" class="ma-0 pa-0">
        <portal to="streamActionsBar">
          <v-btn
            elevation="0"
            color="primary"
            small
            rounded
            v-tooltip="'Edit commit'"
            v-if="
              stream && stream.role!== 'stream:reviewer' && stream.commit.authorId === loggedInUserId
            "
            @click="editCommit"
          >
            <v-icon small class="mr-2">mdi-pencil</v-icon>
            <span class="hidden-md-and-down">Edit</span>
          </v-btn>
        </portal>
        <portal to="streamTitleBar">
          <div>
            <router-link
              :to="`/streams/${stream.id}/branches/${stream.commit.branchName}`"
              class="text-decoration-none space-grotesk"
              v-tooltip="'Go to branch ' + stream.commit.branchName"
            >
              <v-icon small class="primary--text mr-1 mb-1">mdi-source-branch</v-icon>
              <b>{{ stream.commit.branchName }}</b>
            </router-link>
            /
            <v-icon small class="mr-1">mdi-source-commit</v-icon>
            <span class="space-grotesk mr-2" v-tooltip="'Commit message'">
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
          <v-sheet class="pa-4" color="transparent">
            <v-card-title class="mr-8">
              <v-icon class="mr-2">mdi-database</v-icon>
              Data
            </v-card-title>
            <v-card-text class="pa-0">
              <object-speckle-viewer
                class="mt-4"
                :stream-id="stream.id"
                :object-id="stream.commit.referencedObject"
                :value="commitObject"
                :expand="true"
              ></object-speckle-viewer>
            </v-card-text>
          </v-sheet>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="!$apollo.queries.stream.loading && !stream.commit" justify="center">
      <v-col cols="12" class="pt-10">
        <error-block :message="'Commit not found'" />
      </v-col>
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
    ErrorBlock: () => import('@/components/ErrorBlock')
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
        // Use vue reactive properties here
        return {
          streamid: this.$route.params.streamId,
          id: this.$route.params.commitId
        }
      }
    }
  },
  computed: {
    loggedInUserId(){
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
