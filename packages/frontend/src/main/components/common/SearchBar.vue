<template>
  <div>
    <div class="d-flex align-center">
      <v-autocomplete
        v-model="selectedSearchResult"
        :loading="$apollo.loading"
        :items="items"
        :search-input.sync="search"
        no-filter
        counter="3"
        rounded
        filled
        flat
        hide-details
        hide-no-data
        placeholder="Search for a stream"
        item-text="name"
        item-value="id"
        return-object
        prepend-inner-icon="mdi-magnify"
        append-icon=""
        clearable
        :menu-props="{
          zIndex: 200,
          maxHeight: '400px',
          minWidth: '400px',
          rounded: 'xl'
        }"
      >
        <template #no-data>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>
                <div class="text-subtitle-1 text-truncate">
                  Nothing found. Please search again (your query has to be longer than 3
                  charact)
                </div>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
        <template #item="{ item }">
          <v-list-item link @click="selectedSearchResult = item">
            <v-list-item-action
              style="width: 50px; border-radius: 50px !important"
              class="overflow-hidden"
            >
              <preview-image :url="`/preview/${item.id}`" :height="50"></preview-image>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                <div class="text-subtitle-1 text-truncate">
                  {{ item.name }}
                </div>
                <div class="text-caption">
                  Updated
                  <timeago :datetime="item.updatedAt"></timeago>
                </div>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
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
  </div>
</template>
<script>
import { gql } from '@apollo/client/core'

export default {
  components: {
    PreviewImage: () => import('@/main/components/common/PreviewImage')
  },
  props: {
    gotostreamonclick: { type: Boolean, default: true }
  },
  data: () => ({
    search: '',
    hasSearched: false,
    liff: false,
    items: [],
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
      result({ data }) {
        this.items = [...data.streams.items]
      },
      debounce: 300
    }
  },
  watch: {
    selectedSearchResult(val) {
      const myStream = this.items.find((s) => s.id === val.id)
      this.$emit('select', myStream)

      this.items = []
      this.search = ''

      if (val && this.gotostreamonclick) this.$router.push(`/streams/${val.id}`)
    },
    search(val) {
      this.hasSearched = true
      if (val === '42') this.liff = true
      if (!val || val === '') this.items = []
    }
  },
  methods: {}
}
</script>
<style scoped>
.results {
  position: fixed;
  top: 0px;
  right: 0px;
  width: 100%;
  z-index: 10000;
}
</style>
