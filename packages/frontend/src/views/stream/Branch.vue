<template>
  <div>
    <portal to="streamTitleBar">
      <div v-if="stream && stream.branch">
        <v-icon small class="mr-1">mdi-source-branch</v-icon>
        <span class="space-grotesk" style="max-width: 80%">{{ stream.branch.name }}</span>
        <span class="caption ml-2 mb-2 pb-2">{{ stream.branch.description }}</span>
        <v-chip
          v-tooltip="`Branch ${stream.branch.name} has ${stream.branch.commits.totalCount} commits`"
          class="ml-2 pl-2"
          small
        >
          <v-icon small>mdi-source-commit</v-icon>
          {{ stream.branch.commits.totalCount }}
        </v-chip>
      </div>
    </portal>
    <portal to="streamActionsBar">
      <v-btn
        v-if="
          loggedInUserId &&
          stream &&
          stream.role !== 'stream:reviewer' &&
          stream.branch &&
          stream.branch.name !== 'main'
        "
        v-tooltip="'Edit branch'"
        elevation="0"
        color="primary"
        small
        rounded
        :fab="$vuetify.breakpoint.mdAndDown"
        dark
        @click="editBranch()"
      >
        <v-icon small :class="`${$vuetify.breakpoint.mdAndDown ? '' : 'mr-2'}`">mdi-pencil</v-icon>
        <span class="hidden-md-and-down">Edit</span>
      </v-btn>
    </portal>
    <v-row no-gutters>
      <v-col v-if="stream && stream.branch" cols="12" class="pa-4">
        <v-row v-if="stream.branch.commits.items.length > 0">
          <v-col cols="12">
             <v-card>
              <router-link :to="`/streams/${streamId}/commits/${latestCommit.id}`">
                <preview-image
                  :height="320"
                  :url="`/preview/${$route.params.streamId}/commits/${latestCommit.id}`"
                ></preview-image>
              </router-link>
              <div style="position: absolute; top: 10px; right: 20px">
                <commit-received-receipts :stream-id="streamId" :commit-id="latestCommit.id" />
              </div>
              <div style="position: absolute; top: 10px; left: 12px">
                <source-app-avatar :application-name="latestCommit.sourceApplication" />
              </div>
              <v-list-item class="elevation-0">
                <v-list-item-icon class="">
                  <user-avatar
                    :id="latestCommit.authorId"
                    :avatar="latestCommit.authorAvatar"
                    :name="latestCommit.authorName"
                    :size="40"
                  />
                </v-list-item-icon>
                <v-list-item-content>
                  <router-link
                    class="text-decoration-none"
                    :to="`/streams/${streamId}/commits/${latestCommit.id}`"
                  >
                    <v-list-item-title class="mt-0 pt-0 py-1">
                      {{ latestCommit.message }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="caption">
                      <b>{{ latestCommit.authorName }}</b>
                      &nbsp;
                      <timeago :datetime="latestCommit.createdAt"></timeago>
                      <!-- ({{ commitDate }}) -->
                    </v-list-item-subtitle>
                  </router-link>
                </v-list-item-content>
              </v-list-item>
            </v-card>
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
            <v-card>
              <router-link :to="`/streams/${streamId}/commits/${commit.id}`">
                <preview-image
                  :height="180"
                  :url="`/preview/${$route.params.streamId}/commits/${commit.id}`"
                ></preview-image>
              </router-link>
              <div style="position: absolute; top: 10px; right: 20px">
                <commit-received-receipts :stream-id="streamId" :commit-id="commit.id" />
              </div>
              <div style="position: absolute; top: 10px; left: 12px">
                <source-app-avatar :application-name="commit.sourceApplication" />
              </div>
              <v-list-item class="elevation-0">
                <v-list-item-icon class="">
                  <user-avatar
                    :id="commit.authorId"
                    :avatar="commit.authorAvatar"
                    :name="commit.authorName"
                    :size="40"
                  />
                </v-list-item-icon>
                <v-list-item-content>
                  <router-link
                    class="text-decoration-none"
                    :to="`/streams/${streamId}/commits/${commit.id}`"
                  >
                    <v-list-item-title class="mt-0 pt-0 py-1">
                      {{ commit.message }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="caption">
                      <b>{{ commit.authorName }}</b>
                      &nbsp;
                      <timeago :datetime="commit.createdAt"></timeago>
                      <!-- ({{ commitDate }}) -->
                    </v-list-item-subtitle>
                  </router-link>
                </v-list-item-content>
              </v-list-item>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <v-col v-if="stream && stream.branch && listMode" cols="12" class="pa-0 ma-0">
        <v-list v-if="stream.branch.commits.items.length > 0" class="pa-0 ma-0">
          <list-item-commit
            v-for="item in allPreviousCommits"
            :key="item.id"
            :commit="item"
            :stream-id="streamId"
            show-received-receipts
          ></list-item-commit>
        </v-list>
      </v-col>

      <infinite-loading
        v-if="stream && stream.branch.commits.totalCount !== 0"
        spinner="waveDots"
        @infinite="infiniteHandler"
      >
        <div slot="no-more">
          <v-col>
            <v-toolbar flat class="transparent">
              <v-toolbar-title>
                You've reached the end - this branch has no more commits.
              </v-toolbar-title>
            </v-toolbar>
          </v-col>
        </div>
        <div slot="no-results">
          <v-col>
            <v-toolbar flat class="transparent">
              <v-toolbar-title>
                You've reached the end - this branch has no more commits.
              </v-toolbar-title>
            </v-toolbar>
          </v-col>
        </div>
      </infinite-loading>

      <!-- <v-col v-if="$apollo.loading">
        <v-skeleton-loader type="article, article"></v-skeleton-loader>
      </v-col> -->

      <branch-edit-dialog ref="editBranchDialog" />

      <no-data-placeholder
        v-if="!$apollo.loading && stream.branch && stream.branch.commits.totalCount === 0"
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
  name: 'Branch',
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    ListItemCommit: () => import('@/components/ListItemCommit'),
    BranchEditDialog: () => import('@/components/dialogs/BranchEditDialog'),
    NoDataPlaceholder: () => import('@/components/NoDataPlaceholder'),
    ErrorPlaceholder: () => import('@/components/ErrorPlaceholder'),
    PreviewImage: () => import('@/components/PreviewImage'),
    CommitReceivedReceipts: () => import('@/components/CommitReceivedReceipts'),
    UserAvatar: () => import('@/components/UserAvatar'),
    SourceAppAvatar: () => import('@/components/SourceAppAvatar'),
    Renderer: () => import('@/components/Renderer')
  },
  data() {
    return {
      dialogEdit: false,
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
        },
        error(err) {
          console.log(err)
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
  mounted() {
    if (this.$route.params.branchName === 'globals')
      this.$router.push(`/streams/${this.$route.params.streamId}/globals`)
  },
  methods: {
    editBranch() {
      this.$refs.editBranchDialog.open(this.stream.branch).then((dialog) => {
        if (!dialog.result) return
        else if (dialog.deleted) {
          this.$emit('refetch-branches')
          this.$router.push({ path: `/streams/${this.streamId}` })
        } else if (dialog.name !== this.$route.params.branchName) {
          //this.$router.push does not work, refresh entire window

          this.$router.push({
            path: `/streams/${this.streamId}/branches/${encodeURIComponent(dialog.name)}`
          })
        } else {
          this.$emit('refetch-branches')
          this.$apollo.queries.stream.refetch()
        }
      })
    },
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
                  items: [...previousResult.stream.branch.commits.items, ...newItems]
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
<style scoped>
.v-item-group {
  float: left;
}

.clear {
  clear: both;
}
</style>
