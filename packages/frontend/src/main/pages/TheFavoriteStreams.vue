usePortalState
<template>
  <div>
    <portal v-if="canRenderToolbarPortal" to="toolbar">
      Favorite Streams
      <span v-if="streams.length" class="caption">
        ({{ user && user.favoriteStreams && user.favoriteStreams.totalCount }})
      </span>
    </portal>
    <!-- No streams -->
    <favorite-streams-placeholder v-if="!streams.length" />
    <!-- Streams found -->
    <v-row v-else>
      <v-col
        v-for="stream in streams"
        :key="stream.id"
        cols="12"
        sm="6"
        md="6"
        lg="4"
        xl="3"
      >
        <stream-preview-card :stream="stream" :user="user" />
      </v-col>
      <v-col cols="12" sm="6" md="6" lg="4" xl="3">
        <infinite-loading class="" @infinite="infiniteHandler">
          <div slot="no-more">
            <v-card class="pa-4">The end - no more streams to display.</v-card>
          </div>
          <div slot="no-results">
            <v-card class="pa-4">The end - no more streams to display.</v-card>
          </div>
        </infinite-loading>
      </v-col>
    </v-row>
  </div>
</template>
<script lang="ts">
import Vue, { defineComponent } from 'vue'
import { STANDARD_PORTAL_KEYS, usePortalState } from '@/main/utils/portalStateManager'
import {
  UserFavoriteStreamsQuery,
  UserFavoriteStreamsQueryVariables,
  useUserFavoriteStreamsQuery
} from '@/graphql/generated/graphql'
import type { StateChanger } from 'vue-infinite-loading'
import type { Get } from 'type-fest'
import type { SmartQuery } from 'vue-apollo/types/vue-apollo'

export default defineComponent({
  name: 'TheFavoriteStreams',
  components: {
    FavoriteStreamsPlaceholder: () =>
      import('@/main/components/stream/favorites/FavoriteStreamsPlaceholder.vue'),
    InfiniteLoading: () => import('vue-infinite-loading'),
    StreamPreviewCard: () => import('@/main/components/common/StreamPreviewCard.vue')
  },
  setup() {
    const { canRenderToolbarPortal } = usePortalState(
      [STANDARD_PORTAL_KEYS.Toolbar],
      'favorite-streams',
      0
    )
    return { canRenderToolbarPortal }
  },
  data() {
    return {
      user: undefined as UserFavoriteStreamsQuery['user']
    }
  },
  apollo: {
    user: useUserFavoriteStreamsQuery()
  },
  computed: {
    streams(): NonNullable<
      Get<UserFavoriteStreamsQuery, 'user.favoriteStreams.items'>
    > {
      return this.user?.favoriteStreams?.items || []
    },
    /**
     * Whether or not there are more streams to load
     */
    allStreamsLoaded(): boolean {
      return !!(
        this.streams.length &&
        this.streams.length >= (this.user?.favoriteStreams?.totalCount || 0)
      )
    }
  },
  methods: {
    infiniteHandler($state: StateChanger) {
      if (this.allStreamsLoaded) {
        $state.loaded()
        $state.complete()
        return
      }

      // Fetch more favorites
      const userQuery: SmartQuery<
        Vue,
        UserFavoriteStreamsQuery,
        UserFavoriteStreamsQueryVariables
      > = this.$apollo.queries.user
      userQuery.fetchMore({
        variables: {
          cursor: this.user?.favoriteStreams?.cursor || null
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const newFavorites = fetchMoreResult?.user?.favoriteStreams
          const oldFavorites = previousResult.user?.favoriteStreams

          let { items: newItems } = newFavorites || {}
          let { items: allItems } = oldFavorites || {}
          newItems ||= []
          allItems ||= []

          for (const stream of newItems) {
            if (allItems.findIndex((s) => s.id === stream.id) === -1)
              allItems.push(stream)
          }

          // set vue-infinite state
          newItems.length === 0 ? $state.complete() : $state.loaded()

          return {
            ...previousResult,
            user: {
              ...previousResult.user,
              favoriteStreams: {
                ...(fetchMoreResult?.user?.favoriteStreams || {}),
                items: allItems
              }
            }
          } as UserFavoriteStreamsQuery
        }
      })
    }
  }
})
</script>
