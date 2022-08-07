<template>
  <v-btn
    v-if="user && canFavorite"
    icon
    small
    color="red darken-3"
    @click="onFavoriteClick"
  >
    <v-icon>
      {{ isFavorited ? 'mdi-heart' : 'mdi-heart-outline' }}
    </v-icon>
  </v-btn>
</template>

<script>
import { gql } from '@apollo/client/core'
import { canBeFavorited } from '@/helpers/streamHelpers'
import { userFavoriteStreamsQuery } from '@/graphql/user'
import { commonStreamFieldsFragment } from '@/graphql/streams'

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
          const isNowFavorited = !!favoritedDate

          // Check favoriteStreams cache
          let data
          try {
            data = cache.readQuery({ query: userFavoriteStreamsQuery })
          } catch (e) {
            // Cache isn't filled probably (sucks that this throws)
            return
          }

          // Doesn't exist, no need to update anything
          if (!data) return

          const streams = data?.user?.favoriteStreams?.items || []
          let newStreams, newTotalCount

          if (isNowFavorited) {
            // Add to favorite streams query
            // Stream should be in the cache (how else are you favoriting it?)
            const stream = cache.readFragment({
              id: `Stream:${id}`,
              fragment: commonStreamFieldsFragment
            })

            newStreams = streams.slice()
            newStreams.unshift(stream)
            newTotalCount = data.user.favoriteStreams.totalCount + 1
          } else {
            // Drop from favorite streams query
            if (streams.length < 1) return

            newStreams = streams.filter((s) => s.id !== id)
            newTotalCount = data.user.favoriteStreams.totalCount - 1
          }

          cache.writeQuery({
            query: userFavoriteStreamsQuery,
            data: {
              user: {
                ...data.user,
                favoriteStreams: {
                  ...data.user.favoriteStreams,
                  items: newStreams,
                  totalCount: Math.min(newTotalCount - 1, 0)
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
