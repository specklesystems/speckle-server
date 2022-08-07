<template>
  <div>
    <v-row v-if="commits.length != 0" dense>
      <v-col
        v-for="commit in commits"
        :key="commit.id + 'card'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card @click.stop="$emit('add-resource', commit.id)">
          <preview-image
            :height="180"
            :url="`/preview/${streamId}/commits/${commit.id}`"
          ></preview-image>
          <div style="position: absolute; top: 10px; right: 20px">
            <commit-received-receipts
              :stream-id="streamId"
              :commit-id="commit.id"
              shadow
            />
          </div>
          <div style="position: absolute; top: 10px; left: 12px">
            <source-app-avatar :application-name="commit.sourceApplication" />
          </div>
          <list-item-commit
            transparent
            :show-source-app="false"
            :show-branch="false"
            :links="false"
            :commit="commit"
            :stream-id="streamId"
          ></list-item-commit>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
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
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'
export default {
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    ListItemCommit: () => import('@/main/components/stream/ListItemCommit'),
    PreviewImage: () => import('@/main/components/common/PreviewImage'),
    CommitReceivedReceipts: () =>
      import('@/main/components/common/CommitReceivedReceipts'),
    SourceAppAvatar: () => import('@/main/components/common/SourceAppAvatar')
  },
  props: {
    streamId: {
      type: String,
      default: () => null
    },
    branchName: {
      type: String,
      default: () => null
    }
  },
  setup(props) {
    const { result: commitsResult, fetchMore: commitsFetchMore } = useQuery(
      gql`
        query BranchAllCommits($sid: String!, $branchName: String, $cursor: String) {
          stream(id: $sid) {
            id
            branch(name: $branchName) {
              name
              commits(cursor: $cursor, limit: 6) {
                totalCount
                cursor
                items {
                  sourceApplication
                  id
                  createdAt
                  authorId
                  branchName
                  message
                  referencedObject
                }
              }
            }
          }
        }
      `,
      () => ({
        sid: props.streamId,
        branchName: props.branchName,
        cursor: null
      })
    )
    const commits = computed(
      () => commitsResult.value?.stream?.branch?.commits?.items || []
    )

    const cursor = computed(
      () => commitsResult?.value?.stream?.branch?.commits?.cursor || null
    )

    return {
      commits,
      cursor,
      commitsFetchMore
    }
  },
  methods: {
    async infiniteHandler($state) {
      const result = await this.commitsFetchMore({
        variables: {
          sid: this.streamId,
          branchName: this.branchName,
          cursor: this.cursor
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
