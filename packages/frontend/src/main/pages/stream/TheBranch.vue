<template>
  <div>
    <branch-toolbar
      v-if="canRenderToolbarPortal && stream && stream.branch"
      :stream="stream"
      @edit-branch="branchEditDialog = true"
    />
    <v-row no-gutters>
      <v-col v-if="stream && stream.branch" cols="12">
        <v-row v-if="stream.branch.commits.items.length > 0">
          <v-col cols="12">
            <v-toolbar flat dense class="transparent">
              <v-toolbar-title>Branch Commits</v-toolbar-title>
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
            v-for="(commit, index) in allCommits"
            :key="commit.id + 'card'"
            cols="12"
            sm="6"
            md="4"
            xl="3"
          >
            <commit-preview-card
              :commit="commit"
              :show-stream-and-branch="false"
              :highlight="index === 0"
            />
          </v-col>
        </v-row>
        <v-row v-if="listMode">
          <v-col v-if="stream && stream.branch && listMode" cols="12" class="px-4">
            <v-list v-if="stream.branch.commits.items.length > 0" class="transparent">
              <list-item-commit
                v-for="(item, index) in allCommits"
                :key="item.id + 'list'"
                :commit="item"
                :stream-id="streamId"
                show-received-receipts
                class="mb-1 rounded"
                :highlight="index === 0"
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
          !isApolloLoading && stream.branch && stream.branch.commits.totalCount === 0
        "
      >
        <h2 class="space-grotesk">Branch "{{ stream.branch.name }}" has no commits.</h2>
      </no-data-placeholder>
    </v-row>
    <error-placeholder
      v-if="!isApolloLoading && (error || stream.branch === null)"
      error-type="404"
    >
      <h2>{{ error || `Branch "${$route.params.branchName}" does not exist.` }}</h2>
    </error-placeholder>
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'
import branchQuery from '@/graphql/branch.gql'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'
import { useRoute } from '@/main/lib/core/composables/router'

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
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'stream-branch', 1)],
  setup() {
    const route = useRoute()
    const {
      result,
      fetchMore: streamFetchMore,
      refetch: streamRefetch,
      loading: streamLoading
    } = useQuery(
      branchQuery,
      () => ({
        streamId: route.params.streamId,
        branchName: (route.params.branchName || '').toLowerCase(),
        cursor: null
      }),
      { fetchPolicy: 'network-only' }
    )
    const stream = computed(() => result.value?.stream)

    return {
      stream,
      streamFetchMore,
      streamRefetch,
      streamLoading
    }
  },
  data() {
    return {
      branchEditDialog: false,
      error: null,
      listMode: false
    }
  },
  apollo: {
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
          this.streamRefetch()
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
          this.streamRefetch()
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
    isApolloLoading() {
      return this.$apollo.loading || this.streamLoading
    },
    loggedInUserId() {
      return localStorage.getItem('uuid')
    },
    streamId() {
      return this.$route.params.streamId
    },
    latestCommitObjectUrl() {
      if ((this.stream?.branch?.commits?.items || []).length > 0)
        return `${window.location.origin}/streams/${this.stream.id}/objects/${this.stream.branch.commits.items[0].referencedObject}`
      else return null
    },
    latestCommit() {
      if ((this.stream?.branch?.commits?.items || []).length > 0)
        return this.stream.branch.commits.items[0]
      else return null
    },
    allPreviousCommits() {
      if ((this.stream?.branch?.commits?.items || []).length > 0)
        return this.stream.branch.commits.items.slice(1)
      else return null
    },
    allCommits() {
      if ((this.stream?.branch?.commits?.items || []).length > 0)
        return this.stream.branch.commits.items
      else return []
    }
  },
  mounted() {
    if (this.$route.params.branchName === 'globals')
      this.$router.push(`/streams/${this.$route.params.streamId}/globals`)
  },
  methods: {
    async infiniteHandler($state) {
      const result = await this.streamFetchMore({
        variables: {
          streamId: this.streamId,
          branchName: this.$route.params.branchName.toLowerCase(),
          cursor: this.stream?.branch?.commits?.cursor
        }
      })

      const newItems = result?.data?.stream?.branch?.commits?.items || []
      if (!newItems.length) {
        $state.complete()
      } else {
        $state.loaded()
      }
    }
  }
}
</script>
<style scoped></style>
