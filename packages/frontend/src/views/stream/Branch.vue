<template>
  <div>
    <v-row>
      <v-col v-if="$apollo.loading">
        <v-skeleton-loader type="article, article"></v-skeleton-loader>
      </v-col>
      <v-col v-else-if="stream && stream.branch" cols="12" class="pa-0 ma-0">
        <portal to="streamTitleBar">
          <div>
            <v-icon small class="mr-1">mdi-source-branch</v-icon>
            <span class="space-grotesk" style="max-width: 80%">{{ stream.branch.name }}</span>
            <span class="caption ml-2 mb-2 pb-2">{{ stream.branch.description }}</span>
          </div>
        </portal>
        <portal to="streamActionsBar">
          <v-btn
            elevation="0"
            v-if="stream"
            color="primary"
            small
            v-tooltip="'Edit branch'"
            @click="editBranch()"
          >
            <v-icon small class="mr-2">mdi-pencil</v-icon>
            <span class="hidden-md-and-down">Edit</span>
          </v-btn>
        </portal>
        <branch-edit-dialog ref="editBranchDialog" />

        <div style="height: 60vh" v-if="latestCommitObjectUrl">
          <renderer :object-url="latestCommitObjectUrl" />
        </div>

        <v-list class="pa-0 ma-0" v-if="stream.branch.commits.items.length > 0">
          <list-item-commit
            :commit="latestCommit"
            :stream-id="streamId"
            class="elevation-3"
          ></list-item-commit>
          <v-divider></v-divider>
          <v-subheader class="ml-5">
            {{ stream.branch.commits.items.length > 1 ? 'Older commits:' : 'No other commits.' }}
          </v-subheader>
          <list-item-commit
            v-for="item in allPreviousCommits"
            :key="item.id"
            :commit="item"
            :stream-id="streamId"
          ></list-item-commit>

          <!-- TODO: pagination -->

          <v-list-item v-if="stream">
            <v-list-item-icon class="pl-4" style="width: 40px">
              <v-avatar
                :color="`grey ${this.$vuetify.theme.dark ? 'darken-4' : 'lighten-4'}`"
                outline
                size="50"
              >
                <v-icon>mdi-source-branch-plus</v-icon>
              </v-avatar>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="mt-0 pt-0 py-1 pl-5 ml-1">
                Branch "{{ stream.branch.name }}" created
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-if="stream">
            <v-list-item-icon class="pl-4" style="width: 40px">
              <v-avatar
                :color="`grey ${this.$vuetify.theme.dark ? 'darken-4' : 'lighten-4'}`"
                outline
                size="50"
              >
                <v-icon>mdi-source-branch-plus</v-icon>
              </v-avatar>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="mt-0 pt-0 py-1 pl-5 ml-1">
                TODO: PAGINATION YO
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-col>

      <no-data-placeholder
        v-if="stream && stream.branch.commits.totalCount === 0"
      >
      <h2 class="space-grotesk">This branch has no commits.</h2>
    </no-data-placeholder>
    </v-row>
    <v-row v-if="!$apollo.loading && !stream.branch" justify="center">
      <v-col cols="12" class="pt-10">
        <error-block :message="'Branch ' + $route.params.branchName + ' does not exist'" />
      </v-col>
    </v-row>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import branchQuery from '@/graphql/branch.gql'

export default {
  name: 'Branch',
  components: {
    ListItemCommit: () => import('@/components/ListItemCommit'),
    BranchEditDialog: () => import('@/components/dialogs/BranchEditDialog'),
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder'),
    ErrorBlock: () => import('@/components/ErrorBlock'),
    Renderer: () => import('@/components/Renderer')
  },
  data() {
    return {
      dialogEdit: false
    }
  },
  apollo: {
    stream: {
      query: branchQuery,
      variables() {
        return {
          streamId: this.streamId,
          branchName: this.$route.params.branchName
        }
      }
    },
    $subscribe: {
      commitCreated: {
        query: gql`
          subscription($streamId: String!) {
            commitCreated(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.streamId
          }
        },
        result() {
          this.$apollo.queries.stream.refetch()
        }
      }
    }
  },
  computed: {
    streamId() {
      return this.$route.params.streamId
    },
    latestCommitObjectUrl() {
      if (
        this.stream &&
        this.stream.branch &&
        this.stream.branch.commits.items &&
        this.stream.branch.commits.items.length > 0
      )
        return `${window.location.origin}/streams/${this.stream.id}/objects/${this.stream.branch.commits.items[0].referencedObject}`
      else return null
    },
    latestCommit() {
      if (this.stream.branch.commits.items && this.stream.branch.commits.items.length > 0)
        return this.stream.branch.commits.items[0]
      else return null
    },
    allPreviousCommits() {
      if (this.stream.branch.commits.items && this.stream.branch.commits.items.length > 0)
        return this.stream.branch.commits.items.slice(1)
      else return null
    }
  },
  methods: {
    editBranch() {
      this.$refs.editBranchDialog.open(this.stream.branch).then((dialog) => {
        if (!dialog.result) return
        else if (dialog.deleted) {
          this.$router.push({ path: `/streams/${this.streamId}` })
        } else if (dialog.name !== this.$route.params.branchName) {
          //this.$router.push does not work, refresh entire window

          this.$router.push({
            path: `/streams/${this.streamId}/branches/${encodeURIComponent(dialog.name)}`
          })
        } else {
          this.$apollo.queries.stream.refetch()
        }
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
