<template>
  <v-row>
    <v-col sm="12">
      <v-card class="mb-4 transparent" rounded="lg" elevation="0">
        <div v-if="latestCommit" style="height: 50vh">
          <renderer :object-url="latestCommitObjectUrl" />
        </div>
        <v-sheet v-if="latestCommit">
          <list-item-commit
            :commit="latestCommit"
            :stream-id="$route.params.streamId"
          ></list-item-commit>
        </v-sheet>
        <v-sheet v-else>
          <v-card-title>This stream does not have any data yet.</v-card-title>
        </v-sheet>
      </v-card>
      <v-card v-if="$apollo.queries.description.loading">
        <v-skeleton-loader type="article"></v-skeleton-loader>
      </v-card>
      <v-card v-else rounded="lg" class="pa-4 mb-4" elevation="0" color="background2">
        <v-card-title v-if="!description">Description</v-card-title>
        <v-card-text v-if="!description">No description provided.</v-card-text>
        <v-card-text
          v-if="description"
          class="marked-preview"
          v-html="compiledStreamDescription"
        ></v-card-text>
        <v-card-actions v-if="userRole === 'owner'">
          <v-btn small @click="dialogDescription = true">Edit Description</v-btn>
          <v-dialog v-model="dialogDescription">
            <stream-description-dialog
              :id="$route.params.streamId"
              :description="description"
              @close="closeDescription"
            />
          </v-dialog>
        </v-card-actions>
      </v-card>
      <v-card v-if="$apollo.queries.branches.loading">
        <v-skeleton-loader type="article"></v-skeleton-loader>
      </v-card>
      <v-card v-else rounded="lg" class="pa-4 mb-4" elevation="0" color="background2">
        <v-card-title>
          <v-icon class="mr-2">mdi-source-branch</v-icon>
          Branches
        </v-card-title>
        <v-card-text>
          A branch represents an independent line of data. You can think of them as an independent
          directory, staging area and project history.
        </v-card-text>
        <v-card-text>
          <v-list two-line color="transparent">
            <template v-for="item in branches.items">
              <v-list-item
                :key="item.id"
                :to="`/streams/${$route.params.streamId}/branches/${encodeURIComponent(item.name)}`"
              >
                <v-list-item-content>
                  <v-list-item-title>
                    <b>{{ item.name }}</b>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ item.description ? item.description : 'no description provided' }}
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-chip small>
                    {{ item.commits.totalCount }}
                    commits
                  </v-chip>
                </v-list-item-action>
              </v-list-item>
            </template>
          </v-list>
          <v-btn
            v-if="userRole === 'contributor' || userRole === 'owner'"
            small
            @click="dialogBranch = true"
          >
            new branch
          </v-btn>
          <v-dialog v-model="dialogBranch" max-width="500">
            <new-branch-dialog
              :branch-names="branches.items.map((b) => b.name)"
              :stream-id="$route.params.streamId"
              @close="closeBranchDialog"
            />
          </v-dialog>
        </v-card-text>
      </v-card>

      <v-card v-if="$apollo.queries.commits.loading">
        <v-skeleton-loader type="article"></v-skeleton-loader>
      </v-card>

      <v-card v-else rounded="lg" class="pa-4 mb-4" elevation="0" color="background2">
        <v-card-title>
          Latest activity &nbsp;&nbsp;&nbsp;
          <span class="font-weight-light ml-2 body-1">({{ commits.totalCount }} total)</span>
        </v-card-title>
        <v-card-text>All the commits from this stream are below.</v-card-text>
        <v-card-text v-if="commits">
          <v-list two-line color="transparent">
            <list-item-commit
              v-for="item in commits.items"
              :key="item.id"
              :commit="item"
              :stream-id="$route.params.streamId"
            ></list-item-commit>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
<script>
import marked from 'marked'
import DOMPurify from 'dompurify'
import gql from 'graphql-tag'
import NewBranchDialog from '../components/dialogs/BranchNewDialog'
import StreamDescriptionDialog from '../components/dialogs/StreamDescriptionDialog'
import ListItemCommit from '../components/ListItemCommit'
import streamCommitsQuery from '../graphql/streamCommits.gql'
import streamBranchesQuery from '../graphql/streamBranches.gql'
import Renderer from '../components/Renderer'

export default {
  name: 'StreamMain',
  components: {
    NewBranchDialog,
    ListItemCommit,
    StreamDescriptionDialog,
    Renderer
  },
  props: {
    stream: {
      type: Object,
      default: () => null
    },
    userRole: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      dialogDescription: false,
      dialogBranch: false,
      selectedBranch: 0
    }
  },
  apollo: {
    commits: {
      query: streamCommitsQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      update: (data) => data.stream.commits
    },
    branches: {
      query: streamBranchesQuery,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      update(data) {
        data.stream.branches.items = data.stream.branches.items.reverse()
        return data.stream.branches
      }
    },
    description: {
      query: gql`
        query($id: String!) {
          stream(id: $id) {
            id
            description
          }
        }
      `,
      variables() {
        return {
          id: this.$route.params.streamId
        }
      },
      update: (data) => data.stream.description
    }
  },
  computed: {
    branchNames() {
      if (!this.branches) return []
      return this.branches.items.map((b) => b.name)
    },
    compiledStreamDescription() {
      if (!this.description) return ''
      let md = marked(this.description)
      return DOMPurify.sanitize(md)
    },
    latestCommit() {
      if (!this.commits) return null
      return this.commits.items[0]
    },
    latestCommitObjectUrl() {
      if (!this.latestCommit) return null
      return `${window.location.origin}/streams/${this.$route.params.streamId}/objects/${this.latestCommit.referencedObject}`
    }
  },
  mounted() {
    this.$apollo.queries.branches.refetch()
    this.$apollo.queries.description.refetch()
    this.$apollo.queries.commits.refetch()
  },
  methods: {
    closeDescription() {
      this.dialogDescription = false
      this.$apollo.queries.description.refetch()
    },
    closeBranchDialog() {
      this.dialogBranch = false
      this.$apollo.queries.branches.refetch()
    }
  }
}
</script>
