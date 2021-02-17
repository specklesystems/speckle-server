<template>
  <v-row v-if="stream">
    <v-col cols="12">
      <v-card class="pa-0 mb-3" elevation="0" rounded="lg" color="transparent" style="height: 50vh">
        <renderer :object-url="commitObjectUrl" />
      </v-card>
      <v-card class="pa-4" elevation="0" rounded="lg" color="background2">
        <v-card-title class="mr-8">
          <v-icon class="mr-2">mdi-source-commit</v-icon>
          {{ stream.commit.message }}
        </v-card-title>
        <v-card-text>
          on
          <b>{{ commitDate }}</b>
          by
          <b>{{ stream.commit.authorName }}</b>
          <user-avatar
            :id="stream.commit.authorId"
            :name="stream.commit.authorName"
            :avatar="stream.commit.authorAvatar"
            :size="25"
            class="ml-1"
          ></user-avatar>
        </v-card-text>
        <v-card-text>
          Branch:
          <v-chip
            small
            :to="`/streams/${$route.params.streamId}/branches/${encodeURIComponent(
              stream.commit.branchName
            )}`"
          >
            <v-icon small class="mr-2">mdi-source-branch</v-icon>
            {{ stream.commit.branchName }}
          </v-chip>
          <br />
          Source Application:
          <source-app-avatar :application-name="stream.commit.sourceApplication" />
        </v-card-text>
        <commit-dialog ref="commitDialog"></commit-dialog>
        <v-btn
          v-tooltip="'Edit commit details'"
          small
          icon
          style="position: absolute; right: 15px; top: 15px"
          @click="editCommit"
        >
          <v-icon small>mdi-pencil-outline</v-icon>
        </v-btn>
      </v-card>
      <v-card>
        <v-expansion-panels flat focusable>
          <v-expansion-panel>
            <v-expansion-panel-header>
              <span>How to get the data from this commit</span>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <p class="caption mt-4">
                <b>Grasshopper & Dynamo:</b>
                Copy and paste this page's url into a text panel and connect that to the "Stream"
                input of a receiver component.
              </p>
              <p class="caption">
                <b>Other clients:</b>
                Switch to this commit's branch, and then select it from commits the dropdown.
              </p>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
      <v-card class="pa-4 mt-4" elevation="0" rounded="lg" color="background2">
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
      </v-card>
    </v-col>
  </v-row>
</template>
<script>
import gql from 'graphql-tag'
import UserAvatar from '../components/UserAvatar'
import ObjectSpeckleViewer from '../components/ObjectSpeckleViewer'
import Renderer from '../components/Renderer'
import streamCommitQuery from '../graphql/commit.gql'
import CommitDialog from '../components/dialogs/CommitDialog'
import SourceAppAvatar from '../components/SourceAppAvatar'

export default {
  name: 'Commit',
  components: { CommitDialog, UserAvatar, ObjectSpeckleViewer, Renderer, SourceAppAvatar },
  data: () => ({
    loadedModel: false
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
          .then((data) => {
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
<style scoped>
.v-item-group {
  float: left;
}

.clear {
  clear: both;
}
</style>
