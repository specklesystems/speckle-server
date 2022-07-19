<template>
  <div>
    <v-row v-if="stream" dense>
      <v-col
        v-for="commit in stream.commits.items"
        :key="commit.id + 'card'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card @click="$emit('add-resource', commit.id)">
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
    }
  },
  setup(props) {
    const { result: streamResult, fetchMore: streamFetchMore } = useQuery(
      gql`
        query ($streamId: String!, $cursor: String) {
          stream(id: $streamId) {
            id
            commits(cursor: $cursor, limit: 2) {
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
      `,
      () => ({ streamId: props.streamId }),
      () => ({ enabled: !!props.streamId })
    )
    const stream = computed(() => streamResult.value?.stream)

    return {
      stream,
      streamFetchMore
    }
  },
  methods: {
    async infiniteHandler($state) {
      const result = await this.streamFetchMore({
        variables: {
          cursor: this.stream.commits.cursor,
          streamId: this.streamId
        }
      })

      const newItems = result.data?.stream?.commits?.items || []
      if (!newItems.length) {
        $state.complete()
      } else {
        $state.loaded()
      }
    }
  }
}
</script>
