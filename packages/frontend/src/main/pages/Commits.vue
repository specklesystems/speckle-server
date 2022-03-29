<template>
  <div>
    <portal to="toolbar">
      <div class="font-weight-bold">
        Your Latest Commits
        <span v-if="user" class="caption">({{ user.commits.totalCount }})</span>
      </div>
    </portal>

    <v-row v-if="user && user.commits.totalCount !== 0">
      <v-col
        v-for="commit in user.commits.items.filter((c) => c.branchName !== 'globals')"
        :key="commit.id"
        cols="12"
        sm="6"
        md="6"
        lg="4"
        xl="3"
      >
        <commit-preview-card :commit="commit" :preview-height="180" />
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
        Once you create a stream and start sending some data, your activity will show up here.
      </p>
      <template #actions>
        <v-list rounded class="transparent">
          <v-list-item
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
  </div>
</template>
<script>
import gql from 'graphql-tag'
export default {
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    CommitPreviewCard: () => import('@/main/components/common/CommitPreviewCard'),
    NoDataPlaceholder: () => import('@/main/components/common/NoDataPlaceholder')
  },
  apollo: {
    user: {
      query: gql`
        query($cursor: String) {
          user {
            id
            name
            commits(limit: 3, cursor: $cursor) {
              totalCount
              cursor
              items {
                id
                referencedObject
                message
                streamName
                streamId
                createdAt
                sourceApplication
                branchName
                commentCount
              }
            }
          }
        }
      `
    }
  },
  methods: {
    infiniteHandler($state) {
      this.$apollo.queries.user.fetchMore({
        variables: {
          cursor: this.user.commits.cursor
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newItems = fetchMoreResult.user.commits.items
          if (newItems.length === 0) $state.complete()
          else $state.loaded()

          let allItems = [...previousResult.user.commits.items]
          for (const commit of newItems) {
            if (allItems.findIndex((c) => c.id === commit.id) === -1) allItems.push(commit)
          }

          return {
            user: {
              __typename: previousResult.user.__typename,
              name: previousResult.user.name,
              id: previousResult.user.id,
              commits: {
                __typename: previousResult.user.commits.__typename,
                cursor: fetchMoreResult.user.commits.cursor,
                totalCount: fetchMoreResult.user.commits.totalCount,
                items: allItems
              }
            }
          }
        }
      })
    }
  }
}
</script>
