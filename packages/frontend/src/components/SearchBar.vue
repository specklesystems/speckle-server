<template>
  <v-autocomplete
    v-model="selectedSearchResult"
    :loading="$apollo.loading"
    :items="streams.items"
    :search-input.sync="search"
    no-filter
    counter="3"
    rounded
    filled
    dense
    flat
    hide-no-data
    hide-details
    placeholder="Search Streams"
    item-text="name"
    item-value="id"
    return-object
    clearable
    append-icon=""
  >
    <template #item="{ item }" color="background">
      <v-list-item-content>
        <v-list-item-title>
          <v-row class="pa-0 ma-0">
            {{ item.name }}
            <v-spacer></v-spacer>
            <span class="streamid">{{ item.id }}</span>
          </v-row>
        </v-list-item-title>
        <v-list-item-subtitle class="caption">
          Updated
          <timeago :datetime="item.updatedAt"></timeago>
        </v-list-item-subtitle>
      </v-list-item-content>
    </template>
  </v-autocomplete>
</template>
<script>
import gql from 'graphql-tag'

export default {
  data: () => ({
    search: '',
    streams: { items: [] },
    selectedSearchResult: null
  }),
  apollo: {
    streams: {
      query: gql`
        query Streams($query: String) {
          streams(query: $query) {
            totalCount
            cursor
            items {
              id
              name
              updatedAt
            }
          }
        }
      `,
      variables() {
        return {
          query: this.search
        }
      },
      skip() {
        return !this.search || this.search.length < 3
      },
      debounce: 300
    }
  },
  watch: {
    selectedSearchResult(val) {
      this.search = ''
      this.streams.items = []
      if (val) this.$router.push({ name: 'stream', params: { streamId: val.id } })
    }
  },
  methods: {}
}
</script>
