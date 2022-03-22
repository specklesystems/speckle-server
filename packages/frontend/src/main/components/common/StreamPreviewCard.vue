<template>
  <v-hover v-slot="{ hover }">
    <v-card class="rounded-lg" :elevation="hover ? 10 : 1" style="transition: all 0.2s ease-in-out">
      <router-link :to="`/streams/${stream.id}`">
        <preview-image
          :url="`/preview/${stream.id}`"
          :color="hover"
          :height="previewHeight"
        ></preview-image>
        <v-btn
          v-if="user"
          icon
          color="red darken-3"
          class="favorite-button"
          @click="onFavoriteClick"
        >
          <v-icon>
            {{ isFavorited ? 'mdi-heart' : 'mdi-heart-outline' }}
          </v-icon>
        </v-btn>
      </router-link>
      <v-toolbar class="transparent elevation-0" dense>
        <v-toolbar-title>
          <router-link :to="`/streams/${stream.id}`" class="text-decoration-none">
            <!-- <v-icon small class="primary--text">mdi-folder</v-icon> -->
            {{ stream.name }}
          </router-link>
        </v-toolbar-title>
        <v-spacer />
      </v-toolbar>
      <v-card-text class="mt-0 pt-0">
        <div class="d-flex align-center justify-between caption">
          <div class="mr-2">
            Updated
            <timeago :datetime="stream.updatedAt"></timeago>
          </div>
          <div class="mr-1 text-right flex-grow-1">
            <v-icon x-small class="">mdi-source-branch</v-icon>
            {{ stream.branches.totalCount }}
            <v-icon x-small class="">mdi-source-commit</v-icon>
            {{ stream.commits.totalCount }}
            <v-icon x-small class="">mdi-heart-multiple</v-icon>
            {{ stream.favoritesCount }}
          </div>
        </div>
      </v-card-text>
      <v-divider />
      <div class="px-5 py-2 d-flex align-center">
        <collaborators-display
          v-if="stream.collaborators"
          :stream="stream"
          :link-to-collabs="false"
        />
        <div
          v-if="stream.role"
          :class="`caption text-right flex-grow-1 ${
            stream.role.split(':')[1] === 'owner' ? 'primary--text' : ''
          }`"
        >
          <v-icon
            small
            :class="`mr-1 ${stream.role.split(':')[1] === 'owner' ? 'primary--text' : ''}`"
          >
            mdi-account-key-outline
          </v-icon>
          {{ stream.role.split(':')[1] }}
        </div>
      </div>
    </v-card>
  </v-hover>
</template>
<script>
import gql from 'graphql-tag'
import { UserFavoriteStreamsQuery } from '@/graphql/user'

export default {
  components: {
    PreviewImage: () => import('@/main/components/common/PreviewImage.vue'),
    CollaboratorsDisplay: () => import('@/main/components/stream/CollaboratorsDisplay')
  },
  props: {
    stream: { type: Object, default: () => null },
    previewHeight: { type: Number, default: () => 180 },
    showCollabs: { type: Boolean, default: true },
    showDescription: { type: Boolean, default: true },
    user: { type: Object, default: () => null }
  },
  computed: {
    isFavorited() {
      return !!this.stream.favoritedDate
    }
  },
  methods: {
    async onFavoriteClick(e) {
      e.preventDefault() // Preventing click on the parent <router-link>

      const newIsFavorited = !this.isFavorited
      const { id, favoritesCount } = this.stream

      // Pre-generate optimistic results
      const newFavoritedDate = newIsFavorited ? new Date().toISOString() : null
      const newFavoritesCount = favoritesCount + (newIsFavorited ? 1 : -1)

      // Toggle favorited status
      await this.$apollo.mutate({
        mutation: gql`
          mutation ($sid: String!, $favorited: Boolean!) {
            streamFavorite(streamId: $sid, favorited: $favorited) {
              id
              favoritedDate
              favoritesCount
            }
          }
        `,
        variables: {
          sid: this.stream.id,
          favorited: newIsFavorited
        },
        optimisticResponse: {
          __typename: 'Mutation',
          streamFavorite: {
            __typename: 'Stream',
            id,
            favoritedDate: newFavoritedDate,
            favoritesCount: newFavoritesCount
          }
        },
        update: (cache, { data: { streamFavorite } }) => {
          const { id, favoritedDate } = streamFavorite || {}

          // Need to adjust cache only if unfavorited
          if (favoritedDate) return

          // Remove from user.favoritedStreams, if cached
          const data = cache.readQuery({ query: UserFavoriteStreamsQuery })
          if ((data?.user?.favoriteStreams?.items || []).length < 1) return

          const streams = data.user.favoriteStreams.items
          const newStreams = streams.filter((s) => s.id !== id)

          cache.writeQuery({
            query: UserFavoriteStreamsQuery,
            data: {
              user: {
                ...data.user,
                favoriteStreams: {
                  ...data.user.favoriteStreams,
                  items: newStreams,
                  totalCount: data.user.favoriteStreams.totalCount - 1
                }
              }
            }
          })
        }
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.favorite-button {
  $margin: 10px;

  position: absolute;
  top: $margin;
  right: $margin;
}
</style>
