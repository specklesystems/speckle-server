<template>
  <no-data-placeholder>
    <h2>Nothing favorited yet!</h2>
    <p class="caption">
      Once you mark any streams as favorite, they're going to appear here.
    </p>
    <template #actions>
      <v-list rounded class="transparent" dark>
        <v-list-item link class="primary mb-4" to="/streams">
          <v-list-item-icon>
            <v-icon>mdi-folder-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Go to your streams</v-list-item-title>
            <v-list-item-subtitle class="caption">
              Favorite streams to make them appear here!
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </template>
  </no-data-placeholder>
</template>

<script>
import NoDataPlaceholder from '@/main/components/common/NoDataPlaceholder.vue'

export default {
  name: 'FavoriteStreamsPlaceholder',
  components: {
    NoDataPlaceholder
  }
}
</script>
