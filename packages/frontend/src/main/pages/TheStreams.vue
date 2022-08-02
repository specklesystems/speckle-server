<template>
  <div>
    <portal v-if="canRenderToolbarPortal" to="toolbar">
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
    <!-- Stream invites -->
    <user-stream-invite-banners @invite-used="onInviteUsed" />
    <!-- No streams -->
    <v-row v-if="streams && streams.items.length === 0">
      <no-data-placeholder v-if="user">
        <h2>Welcome {{ user.name.split(' ')[0] }}!</h2>
        <p class="caption">
          Once you create a stream and start sending some data, your activity will show
          up here.
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
      <v-col
        v-for="(stream, i) in filteredStreams"
        :key="i"
        cols="12"
        sm="6"
        md="6"
        lg="4"
        xl="3"
      >
        <stream-preview-card
          :key="i + 'card'"
          :stream="stream"
          :user="user"
        ></stream-preview-card>
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
import { mainUserDataQuery } from '@/graphql/user'
import {
  STANDARD_PORTAL_KEYS,
  buildPortalStateMixin
} from '@/main/utils/portalStateManager'
import UserStreamInviteBanners from '@/main/components/stream/UserStreamInviteBanners.vue'
import InfiniteLoading from 'vue-infinite-loading'
import StreamPreviewCard from '@/main/components/common/StreamPreviewCard.vue'
import NoDataPlaceholder from '@/main/components/common/NoDataPlaceholder.vue'
import { useQuery } from '@vue/apollo-composable'
import { computed } from 'vue'

export default {
  name: 'TheStreams',
  components: {
    InfiniteLoading,
    StreamPreviewCard,
    NoDataPlaceholder,
    UserStreamInviteBanners
  },
  mixins: [buildPortalStateMixin([STANDARD_PORTAL_KEYS.Toolbar], 'streams', 0)],
  apollo: {
    user: {
      query: mainUserDataQuery
    }
  },
  setup() {
    const {
      result,
      fetchMore: streamsFetchMore,
      refetch: streamsRefetch
    } = useQuery(streamsQuery, {
      cursor: null
    })
    const streams = computed(() => result.value?.streams)

    return {
      streams,
      streamsFetchMore,
      streamsRefetch
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
      this.streamsRefetch()
      this.$router.replace({ path: this.$route.path, query: null })
    }
  },
  methods: {
    onInviteUsed() {
      // Refetch streams
      this.streamsRefetch()
    },
    checkFilter(role) {
      if (this.streamFilter === 1) return true
      if (this.streamFilter === 2 && role === 'stream:owner') return true
      if (this.streamFilter === 3 && role === 'stream:contributor') return true
      if (this.streamFilter === 4 && role === 'stream:reviewer') return true
      return false
    },
    async infiniteHandler($state) {
      if (this.allStreamsLoaded) {
        $state.loaded()
        $state.complete()
        return
      }

      const result = await this.streamsFetchMore({
        variables: {
          cursor: this.streams?.cursor
        }
      })

      const newItems = result?.data?.streams?.items || []
      if (!newItems.length) {
        $state.complete()
      } else {
        $state.loaded()
      }
    }
  }
}
</script>
