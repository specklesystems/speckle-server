<template>
  <div>
    <v-row v-if="stream" dense>
      <v-col
        v-for="commit in stream.branch.commits.items"
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
            <commit-received-receipts :stream-id="streamId" :commit-id="commit.id" shadow />
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
import gql from 'graphql-tag'
export default {
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    ListItemCommit: () => import('@/cleanup/components/stream/ListItemCommit'),
    PreviewImage: () => import('@/cleanup/components/common/PreviewImage'),
    CommitReceivedReceipts: () => import('@/cleanup/components/common/CommitReceivedReceipts'),
    SourceAppAvatar: () => import('@/cleanup/components/common/SourceAppAvatar')
  },
  props: ['streamId', 'branchName'],
  apollo: {
    stream: {
      query: gql`
        query($streamId: String!, $branchName: String!, $cursor: String) {
          stream(id: $streamId) {
            id
            branch(name: $branchName) {
              name
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
        }
      `,
      variables() {
        return { streamId: this.streamId, branchName: this.branchName }
      },
      skip() {
        return !this.streamId
      }
    }
  },
  data() {
    return {}
  },
  async mounted() {},
  methods: {
    infiniteHandler($state) {
      this.$apollo.queries.stream.fetchMore({
        variables: {
          cursor: this.stream.branch.commits.cursor,
          streamId: this.streamId,
          branchName: this.branchName
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newItems = fetchMoreResult.stream.branch.commits.items
          if (newItems.length === 0) $state.complete()
          else $state.loaded()

          let allItems = [...previousResult.stream.branch.commits.items]
          for (const commit of newItems) {
            if (allItems.findIndex((c) => c.id === commit.id) === -1) allItems.push(commit)
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
