<template>
  <div>
    <portal to="toolbar">
      <span class="font-weight-bold mr-2">Your Streams</span>
      <span class="caption">({{ streams ? streams.totalCount : '...' }})</span>
      <div class="d-none d-md-inline-block">
        <v-btn-toggle v-model="streamFilter" tile color="primary" group mandatory>
          <v-btn small icon disabled><v-icon small>mdi-filter</v-icon></v-btn>
          <v-btn small text>All</v-btn>
          <v-btn small text>Owner</v-btn>
          <v-btn small text>Contributor</v-btn>
          <v-btn small text>Reviewer</v-btn>
        </v-btn-toggle>
      </div>
    </portal>
    <!-- No streams -->
    <v-row v-if="streams && streams.items.length === 0">
      <no-data-placeholder v-if="user">
        <h2>Welcome {{ user.name.split(' ')[0] }}!</h2>
        <p class="caption">
          Once you will create a stream and start sending some data, your activity will show up
          here.
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
    </v-row>
    <!-- Streams display -->
    <v-row v-if="streams && streams.items.length > 0">
      <v-col v-for="(stream, i) in filteredStreams" :key="i" cols="12" sm="6" md="6" lg="4" xl="3">
        <stream-preview-card :key="i + 'card'" :stream="stream" :user="user"></stream-preview-card>
      </v-col>
      <v-col cols="12" sm="6" md="6" lg="4" xl="3">
        <infinite-loading :identifier="infiniteId" class="" @infinite="infiniteHandler">
          <div slot="no-more">
            <v-card class="pa-4">
              The end - no more streams to display.
              {{ streamFilter !== 1 ? 'Remove filters to see more.' : '' }}
            </v-card>
          </div>
          <div slot="no-results">
            <v-card class="pa-4">
              The end - no more streams to display.
              {{ streamFilter !== 1 ? 'Remove filters to see more.' : '' }}
            </v-card>
          </div>
        </infinite-loading>
      </v-col>
    </v-row>
  </div>
</template>
<script>
import streamsQuery from '@/graphql/streams.gql'
import { MainUserDataQuery } from '@/graphql/user'

export default {
  name: 'TheStreams',
  components: {
    InfiniteLoading: () => import('vue-infinite-loading'),
    StreamPreviewCard: () => import('@/main/components/common/StreamPreviewCard.vue'),
    NoDataPlaceholder: () => import('@/main/components/common/NoDataPlaceholder')
  },
  apollo: {
    streams: {
      query: streamsQuery
    },
    user: {
      query: MainUserDataQuery
    }
  },
  data() {
    return {
      streamFilter: 1,
      infiniteId: 0
    }
  },
  computed: {
    filteredStreams() {
      if (!this.streams) return []
      if (this.streamFilter === 1) return this.streams.items
      if (this.streamFilter === 2)
        return this.streams.items.filter((s) => s.role === 'stream:owner')
      if (this.streamFilter === 3)
        return this.streams.items.filter((s) => s.role === 'stream:contributor')
      if (this.streamFilter === 4)
        return this.streams.items.filter((s) => s.role === 'stream:reviewer')
      return this.streams.items
    },
    /**
     * Whether or not there are more streams to load
     */
    allStreamsLoaded() {
      return this.streams && this.streams.items.length >= this.streams.totalCount
    }
  },
  watch: {
    streamFilter() {
      this.infiniteId++
    }
  },
  mounted() {
    if (this.$route.query.refresh) {
      this.$apollo.queries.streams.refetch()
      this.$router.replace({ path: this.$route.path, query: null })
    }
  },
  methods: {
    checkFilter(role) {
      if (this.streamFilter === 1) return true
      if (this.streamFilter === 2 && role === 'stream:owner') return true
      if (this.streamFilter === 3 && role === 'stream:contributor') return true
      if (this.streamFilter === 4 && role === 'stream:reviewer') return true
      return false
    },
    // TODO: Prevent extra load if we've hit all items
    infiniteHandler($state) {
      if (this.allStreamsLoaded) {
        $state.loaded()
        $state.complete()
        return
      }

      this.$apollo.queries.streams.fetchMore({
        variables: {
          cursor: this.streams?.cursor
        },
        // Transform the previous result with new data
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newItems = fetchMoreResult.streams.items
          const allItems = [...previousResult.streams.items]
          const newTotalCount = fetchMoreResult.streams.totalCount

          for (const stream of newItems) {
            if (allItems.findIndex((s) => s.id === stream.id) === -1) allItems.push(stream)
          }

          // Update infinite loader state
          if (newItems.length === 0) {
            $state.complete()
          } else {
            $state.loaded()
          }

          return {
            streams: {
              __typename: previousResult.streams.__typename,
              totalCount: newTotalCount,
              cursor: fetchMoreResult.streams.cursor,
              // Merging the new streams
              items: allItems
            }
          }
        }
      })
    }
  }
}
</script>
