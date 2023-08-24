<template>
  <div>
    <commit-multi-select-toolbar
      v-if="hasSelectedCommits"
      :selected-commit-ids="selectedCommitIds"
      @clear="clearSelectedCommits"
      @finish="onBatchCommitActionFinish"
    />
    <prioritized-portal to="toolbar" identity="commits" :priority="0">
      <div class="font-weight-bold">
        Your Latest Commits
        <span v-if="user" class="caption">({{ totalCommitCount }})</span>
      </div>
    </prioritized-portal>

    <v-row v-if="commitItems.length">
      <v-col
        v-for="commit in commitItems"
        :key="commit.id"
        cols="12"
        sm="6"
        md="6"
        lg="4"
        xl="3"
      >
        <commit-preview-card
          :commit="commit"
          :preview-height="180"
          :shareable="true"
          :selectable="true"
          :select-disabled-message="disabledCheckboxMessage"
          :select-disabled="!isCommitOrStreamOwner(commit)"
          :selected.sync="selectedCommitsState[commit.id]"
          @share="shareDialogCommit = $event"
        />
      </v-col>
      <v-col cols="12" sm="6" md="6" lg="4" xl="3">
        <infinite-loading spinner="waveDots" @infinite="infiniteHandler">
          <div slot="no-more">
            <v-col>You've reached the end - no more commits.</v-col>
          </div>
          <div slot="no-results">
            <v-col>You've reached the end - no more commits.</v-col>
          </div>
        </infinite-loading>
      </v-col>
    </v-row>
    <no-data-placeholder v-if="user && user.commits.totalCount === 0">
      <h2>Welcome {{ user.name.split(' ')[0] }}!</h2>
      <p class="caption">
        Once you {{ isGuestUser ? 'join' : 'create' }} a stream and start sending some
        data, your activity will show up here.
      </p>
      <template #actions>
        <v-list rounded class="transparent">
          <v-list-item
            v-if="!isGuestUser"
            link
            class="primary mb-4"
            dark
            @click="$eventHub.$emit('show-new-stream-dialog')"
          >
            <v-list-item-icon>
              <v-icon>mdi-plus-box</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Create a new stream!</v-list-item-title>
              <v-list-item-subtitle class="caption">
                Streams are like folders, or data repositories.
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </template>
    </no-data-placeholder>
    <share-stream-dialog
      v-if="shareDialogStreamId"
      :show.sync="showShareDialog"
      :stream-id="shareDialogStreamId"
      :resource-id="shareDialogCommitId"
    />
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { computed, defineComponent, ref } from 'vue'
import PrioritizedPortal from '@/main/components/common/utility/PrioritizedPortal.vue'
import CommitMultiSelectToolbar from '@/main/components/stream/commit/CommitMultiSelectToolbar.vue'
import {
  BatchActionType,
  useCommitMultiActions
} from '@/main/lib/stream/composables/commitMultiActions'
import { Roles } from '@/helpers/mainConstants'
import { getCacheId } from '@/main/lib/common/apollo/helpers/apolloOperationHelper'
import {
  deleteCommitsFromCachedCommitsQuery,
  disabledCheckboxMessage
} from '@/main/lib/stream/services/commitMultiActions'
import { isGuest } from '@/main/lib/core/helpers/users'

export default defineComponent({
  name: 'TheCommits',
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    CommitPreviewCard: () => import('@/main/components/common/CommitPreviewCard'),
    NoDataPlaceholder: () => import('@/main/components/common/NoDataPlaceholder'),
    ShareStreamDialog: () => import('@/main/dialogs/ShareStreamDialog.vue'),
    PrioritizedPortal,
    CommitMultiSelectToolbar
  },
  setup() {
    const { result, fetchMore: userFetchMore } = useQuery(gql`
      query PaginatedUserCommits($cursor: String) {
        activeUser {
          id
          name
          role
          commits(limit: 10, cursor: $cursor) {
            totalCount
            cursor
            items {
              id
              referencedObject
              message
              authorId
              createdAt
              sourceApplication
              branchName
              commentCount
              stream {
                id
                role
                name
              }
            }
          }
        }
      }
    `)
    const user = computed(() => result.value?.activeUser)

    const commitItems = computed(() =>
      (user.value?.commits.items || []).filter((c) => c.branchName !== 'globals')
    )
    const totalCommitCount = computed(() => {
      const realTotalCount = user.value?.commits.totalCount || 0
      const globalCommitCount = (user.value?.commits.items || []).filter(
        (c) => c.branchName === 'globals'
      ).length
      return realTotalCount - globalCommitCount
    })

    const isCommitOrStreamOwner = (commit) => {
      const userId = user.value.id
      return commit.stream.role === Roles.Stream.Owner || commit.authorId === userId
    }

    const {
      selectedCommitIds,
      hasSelectedCommits,
      clearSelectedCommits,
      selectedCommitsState
    } = useCommitMultiActions()

    const apolloCache = useApolloClient().client.cache
    const onBatchCommitActionFinish = ({ type, variables }) => {
      const commitIds = variables.input?.commitIds || []
      if (!commitIds.length) return

      // Update cache
      if (type === BatchActionType.Delete) {
        deleteCommitsFromCachedCommitsQuery(
          apolloCache,
          getCacheId('User', user.value.id),
          commitIds
        )
      }
    }

    const shareDialogCommit = ref(null)
    const showShareDialog = computed({
      get: () => !!shareDialogCommit.value,
      set: (newVal) => {
        if (!newVal) {
          shareDialogCommit.value = null
        }
      }
    })
    const shareDialogCommitId = computed(() => shareDialogCommit.value?.id)
    const shareDialogStreamId = computed(() => shareDialogCommit.value?.stream.id)
    const isGuestUser = computed(() => isGuest(user.value))

    return {
      isGuestUser,
      user,
      commitItems,
      totalCommitCount,
      userFetchMore,
      selectedCommitIds,
      hasSelectedCommits,
      clearSelectedCommits,
      selectedCommitsState,
      onBatchCommitActionFinish,
      isCommitOrStreamOwner,
      disabledCheckboxMessage,
      shareDialogCommitId,
      shareDialogStreamId,
      shareDialogCommit,
      showShareDialog
    }
  },
  methods: {
    async infiniteHandler($state) {
      const result = await this.userFetchMore({
        variables: {
          cursor: this.user.commits.cursor
        }
      })

      const newItems = result.data?.activeUser?.commits?.items || []
      if (!newItems.length) {
        $state.complete()
      } else {
        $state.loaded()
      }
    }
  }
})
</script>
