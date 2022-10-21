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
import { computed, defineComponent } from 'vue'
import { STANDARD_PORTAL_KEYS, usePortalState } from '@/main/utils/portalStateManager'
import {
  UserFavoriteStreamsQuery,
  UserFavoriteStreamsDocument
} from '@/graphql/generated/graphql'
import type { StateChanger } from 'vue-infinite-loading'
import type { Get } from 'type-fest'
import { useQuery } from '@vue/apollo-composable'
import { Nullable } from '@/helpers/typeHelpers'

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

    const { result, fetchMore: userFetchMore } = useQuery(UserFavoriteStreamsDocument, {
      cursor: null as Nullable<string>
    })
    const user = computed(() => result.value?.activeUser)

    return { canRenderToolbarPortal, user, userFetchMore }
  },
  computed: {
    streams(): NonNullable<
      Get<UserFavoriteStreamsQuery, 'activeUser.favoriteStreams.items'>
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
    async infiniteHandler($state: StateChanger) {
      if (this.allStreamsLoaded) {
        $state.loaded()
        $state.complete()
        return
      }

      // Fetch more favorites
      const result = await this.userFetchMore({
        variables: {
          cursor: this.user?.favoriteStreams?.cursor || null
        }
      })

      const newItems = result?.data?.activeUser?.favoriteStreams?.items || []
      if (!newItems.length) {
        $state.complete()
      } else {
        $state.loaded()
      }
    }
  }
})
</script>
