<template>
  <v-btn v-if="user && canFavorite" small icon color="red darken-3" @click="onFavoriteClick">
    <v-icon>
      {{ isFavorited ? 'mdi-heart' : 'mdi-heart-outline' }}
    </v-icon>
  </v-btn>
</template>

<script>
import gql from 'graphql-tag'
import { canBeFavorited } from '@/helpers/streamHelpers'
import { UserFavoriteStreamsQuery } from '@/graphql/user'

export default {
  name: 'StreamFavoriteBtn',
  props: {
    stream: { type: Object, required: true },
    user: { type: Object, required: true }
  },
  computed: {
    isFavorited() {
      return !!this.stream.favoritedDate
    },
    canFavorite() {
      return canBeFavorited(this.stream)
    }
  },
  methods: {
    async onFavoriteClick(e) {
      e.preventDefault() // Preventing click on the parent link

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
                  totalCount: Math.min(data.user.favoriteStreams.totalCount - 1, 0)
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
