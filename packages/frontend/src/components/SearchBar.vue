<template>
  <div>
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
              <span class="streamId">{{ item.id }}</span>
            </v-row>
          </v-list-item-title>
          <v-list-item-subtitle class="caption">
            Updated
            <timeago :datetime="item.updatedAt"></timeago>
          </v-list-item-subtitle>
        </v-list-item-content>
      </template>
    </v-autocomplete>
    <v-dialog v-model="liff" max-width="400" :fullscreen="$vuetify.breakpoint.xsOnly">
      <v-card>
        <v-toolbar>
          <v-toolbar-title>
            thanks for all the fish
            <v-icon>mdi-fish</v-icon>
            <v-icon>mdi-arrow-up</v-icon>
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="liff = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import gql from 'graphql-tag'

export default {
  props: {
    gotostreamonclick: {
      type: Boolean,
      default: true
    }
  },
  data: () => ({
    search: '',
    liff: false,
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
      let myStream = this.streams.items.find((s) => s.id === val.id)
      this.$emit('select', myStream)

      this.streams.items = []
      this.search = ''

      if (val && this.gotostreamonclick) this.$router.push(`/streams/${val.id}`)
    },
    search(val) {
      if (val === '42') this.liff = true
    }
  },
  methods: {}
}
</script>
