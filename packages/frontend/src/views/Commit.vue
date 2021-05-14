<template>
  <div>
    <v-row>
      <v-col v-if="$apollo.queries.stream.loading" cols="12">
        <v-card>
          <v-skeleton-loader type="list-item-avatar, card-avatar, article"></v-skeleton-loader>
        </v-card>
      </v-col>
      <v-col v-else-if="stream.commit" cols="12">
        <v-card elevation="0" rounded="lg">
          <v-sheet class="pa-4" color="transparent">
            <commit-edit-dialog ref="commitDialog"></commit-edit-dialog>
            <v-card-title>
              <v-icon class="mr-2">mdi-source-commit</v-icon>
              {{ stream.commit.message }}
              <v-spacer />
              <v-btn
                v-if="userRole === 'contributor' || userRole === 'owner'"
                v-tooltip="'Edit commit details'"
                small
                plain
                color="primary"
                text
                class="px-0"
                @click="editCommit"
              >
                <v-icon small class="mr-2 float-left">mdi-cog-outline</v-icon>
                Edit
              </v-btn>
            </v-card-title>
            <v-breadcrumbs :items="breadcrumbs" divider="/"></v-breadcrumbs>
            <v-list-item dense>
              <v-list-item-icon class="mr-2 mt-1">
                <user-avatar
                  :id="stream.commit.authorId"
                  :avatar="stream.commit.authorAvatar"
                  :name="stream.commit.authorName"
                  :size="25"
                />
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-subtitle class="caption">
                  <b>{{ stream.commit.authorName }}</b>
                  &nbsp;
                  <timeago :datetime="stream.commit.createdAt"></timeago>
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-row align="center" justify="center">
                  <v-chip small class="mr-2">
                    <v-icon small class="mr-2">mdi-source-branch</v-icon>
                    {{ stream.commit.branchName }}
                  </v-chip>
                  <source-app-avatar :application-name="stream.commit.sourceApplication" />
                </v-row>
              </v-list-item-action>
            </v-list-item>
          </v-sheet>
          <div style="height: 50vh">
            <renderer :object-url="commitObjectUrl" @selection="handleSelection" />
          </div>
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
  </div>
</template>
<script>
import gql from 'graphql-tag'
import UserAvatar from '../components/UserAvatar'
import ObjectSpeckleViewer from '../components/ObjectSpeckleViewer'
import ObjectSimpleViewer from '../components/ObjectSimpleViewer'
import Renderer from '../components/Renderer'
import streamCommitQuery from '../graphql/commit.gql'
import CommitEditDialog from '../components/dialogs/CommitEditDialog'
import SourceAppAvatar from '../components/SourceAppAvatar'
import ErrorBlock from '../components/ErrorBlock'

export default {
  name: 'Commit',
  components: {
    CommitEditDialog,
    UserAvatar,
    ObjectSpeckleViewer,
    ObjectSimpleViewer,
    Renderer,
    SourceAppAvatar,
    ErrorBlock
  },
  props: {
    userRole: {
      type: String,
      default: null
    }
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
    },
    breadcrumbs() {
      return [
        {
          text: this.stream.name,
          disabled: false,
          exact: true,
          to: '/streams/' + this.stream.id
        },
        {
          text: 'branches',
          disabled: false,
          exact: true,
          to: '/streams/' + this.stream.id + '/branches/'
        },
        {
          text: this.stream.commit.branchName,
          disabled: false,
          exact: true,
          to:
            '/streams/' +
            this.stream.id +
            '/branches/' +
            encodeURIComponent(this.stream.commit.branchName) +
            '/commits'
        },
        {
          text: this.stream.commit.message,
          disabled: true
        }
      ]
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
<style scoped>
.v-item-group {
  float: left;
}

.clear {
  clear: both;
}
</style>
