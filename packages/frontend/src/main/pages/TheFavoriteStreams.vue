<template>
  <div>
    <portal to="toolbar">Favorite Streams</portal>
    <!-- No streams -->
    <favorite-streams-placeholder v-if="streams && streams.items.length === 0" />
    <!-- TODO: Streams to show -->
    <v-row v-if="streams && streams.items.length > 0">
      <v-col v-for="(stream, i) in filteredStreams" :key="i" cols="12" sm="6" md="6" lg="4" xl="3">
        <stream-preview-card :key="i + 'card'" :stream="stream"></stream-preview-card>
      </v-col>
      <v-col cols="12" sm="6" md="6" lg="4" xl="3">
        <infinite-loading :identifier="infiniteId" class="" @infinite="infiniteHandler">
          <div slot="no-more">
            The end - no more streams to display.
            {{ streamFilter !== 1 ? 'Remove filters to see more.' : '' }}
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
import FavoriteStreamsPlaceholder from '../components/stream/favorites/FavoriteStreamsPlaceholder.vue'

export default {
  name: 'TheFavoriteStreams',
  components: {
    FavoriteStreamsPlaceholder
  },
  props: {
    streams: {
      type: Object,
      default: () => ({ items: [] })
    },
    user: {
      type: Object,
      default: () => ({ name: 'Fabis Sons' })
    }
  }
}
</script>
