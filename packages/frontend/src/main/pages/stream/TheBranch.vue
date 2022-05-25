<template>
  <div class="">
    <branch-toolbar
      v-if="stream && stream.branch"
      :stream="stream"
      @edit-branch="branchEditDialog = true"
    />
    <v-row no-gutters>
      <v-col v-if="stream && stream.branch" cols="12">
        <v-row v-if="stream.branch.commits.items.length > 0">
          <v-col cols="12">
            <commit-preview-card
              :commit="latestCommit"
              :preview-height="320"
              :show-stream-and-branch="false"
            />
          </v-col>
          <v-col cols="12">
            <v-toolbar flat class="transparent">
              <v-toolbar-title>Older Commits</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn
                v-tooltip="`View as a ${listMode ? 'gallery' : 'list'}`"
                icon
                @click="listMode = !listMode"
              >
                <v-icon v-if="listMode">mdi-view-dashboard</v-icon>
                <v-icon v-else>mdi-view-list</v-icon>
              </v-btn>
            </v-toolbar>
          </v-col>
        </v-row>
        <v-row v-if="!listMode">
          <v-col
            v-for="commit in allPreviousCommits"
            :key="commit.id + 'card'"
            cols="12"
            sm="6"
            md="4"
            xl="3"
          >
            <commit-preview-card :commit="commit" :show-stream-and-branch="false" />
          </v-col>
        </v-row>
        <v-row v-if="listMode">
          <v-col v-if="stream && stream.branch && listMode" cols="12" class="px-4">
            <v-list v-if="stream.branch.commits.items.length > 0" class="transparent">
              <list-item-commit
                v-for="item in allPreviousCommits"
                :key="item.id + 'list'"
                :commit="item"
                :stream-id="streamId"
                show-received-receipts
                class="mb-1 rounded"
              ></list-item-commit>
            </v-list>
          </v-col>
        </v-row>
      </v-col>
      <infinite-loading
        v-if="stream && stream.branch && stream.branch.commits.totalCount !== 0"
        spinner="waveDots"
        @infinite="infiniteHandler"
      >
        <div slot="no-more">
          <v-col class="caption py-3 text-center">
            You've reached the end - this branch has no more commits.
          </v-col>
        </div>
        <div slot="no-results">
          <v-col class="caption py-3 text-center">
            You've reached the end - this branch has no more commits.
          </v-col>
        </div>
      </infinite-loading>

      <v-dialog
        v-if="stream"
        v-model="branchEditDialog"
        max-width="500"
        :fullscreen="$vuetify.breakpoint.xsOnly"
      >
        <branch-edit-dialog :stream="stream" @close="branchEditDialog = false" />
      </v-dialog>

      <no-data-placeholder
        v-if="
          !$apollo.loading && stream.branch && stream.branch.commits.totalCount === 0
        "
      >
        <h2 class="space-grotesk">Branch "{{ stream.branch.name }}" has no commits.</h2>
      </no-data-placeholder>
    </v-row>
    <error-placeholder
      v-if="!$apollo.loading && (error || stream.branch === null)"
      error-type="404"
    >
      <h2>{{ error || `Branch "${$route.params.branchName}" does not exist.` }}</h2>
    </error-placeholder>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import branchQuery from '@/graphql/branch.gql'

export default {
  name: 'TheBranch',
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    NoDataPlaceholder: () => import('@/main/components/common/NoDataPlaceholder'),
    ErrorPlaceholder: () => import('@/main/components/common/ErrorPlaceholder'),
    ListItemCommit: () => import('@/main/components/stream/ListItemCommit'),
    BranchEditDialog: () => import('@/main/dialogs/BranchEditDialog'),
    BranchToolbar: () => import('@/main/toolbars/BranchToolbar'),
    CommitPreviewCard: () => import('@/main/components/common/CommitPreviewCard')
  },
  data() {
    return {
      branchEditDialog: false,
      error: null,
      listMode: false
    }
  },
  apollo: {
    stream: {
      query: branchQuery,
      variables() {
        return {
          streamId: this.streamId,
          branchName: this.$route.params.branchName.toLowerCase()
        }
      },
      fetchPolicy: 'network-only'
    },
    $subscribe: {
      commitCreated: {
        query: gql`
          subscription ($streamId: String!) {
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
        },
        error(err) {
          this.$eventHub.$emit('notification', {
            text: err.message
          })
        },
        skip() {
          return !this.$loggedIn()
        }
      },
      commitDeleted: {
        query: gql`
          subscription ($streamId: String!) {
            commitDeleted(streamId: $streamId)
          }
        `,
        variables() {
          return {
            streamId: this.streamId
          }
        },
        result() {
          this.$apollo.queries.stream.refetch()
        },
        error(err) {
          this.$eventHub.$emit('notification', {
            text: err.message
          })
        },
        skip() {
          return !this.$loggedIn()
        }
      }
    }
  },
  computed: {
    loggedInUserId() {
      return localStorage.getItem('uuid')
    },
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
      if (
        this.stream.branch.commits.items &&
        this.stream.branch.commits.items.length > 0
      )
        return this.stream.branch.commits.items[0]
      else return null
    },
    allPreviousCommits() {
      if (
        this.stream.branch.commits.items &&
        this.stream.branch.commits.items.length > 0
      )
        return this.stream.branch.commits.items.slice(1)
      else return null
    }
  },
  mounted() {
    if (this.$route.params.branchName === 'globals')
      this.$router.push(`/streams/${this.$route.params.streamId}/globals`)
  },
  methods: {
    infiniteHandler($state) {
      this.$apollo.queries.stream.fetchMore({
        variables: {
          cursor: this.stream.branch.commits.cursor
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newItems = fetchMoreResult.stream.branch.commits.items
          if (newItems.length === 0) $state.complete()
          else $state.loaded()

          const allItems = [...previousResult.stream.branch.commits.items]
          for (const commit of newItems) {
            if (allItems.findIndex((c) => c.id === commit.id) === -1)
              allItems.push(commit)
          }

          return {
            stream: {
              __typename: previousResult.stream.__typename,
              name: previousResult.stream.name,
              id: previousResult.stream.id,
              branch: {
                id: fetchMoreResult.stream.branch.id,
                name: fetchMoreResult.stream.branch.name,
                description: fetchMoreResult.stream.branch.description,
                __typename: previousResult.stream.branch.__typename,
                commits: {
                  __typename: previousResult.stream.branch.commits.__typename,
                  cursor: fetchMoreResult.stream.branch.commits.cursor,
                  totalCount: fetchMoreResult.stream.branch.commits.totalCount,
                  items: allItems
                }
              }
            }
          }
        }
      })
    }
  }
}
</script>
<style scoped></style>
