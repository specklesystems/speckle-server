<template>
  <div>
    <div class="d-flex align-center">
      <v-autocomplete
        v-model="selectedSearchResult"
        :loading="isSearchLoading"
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
    </div>
  </div>
</template>
<script lang="ts">
import { SearchStreamsDocument, SearchStreamsQuery } from '@/graphql/generated/graphql'
import { Nullable } from '@/helpers/typeHelpers'
import { useQuery } from '@vue/apollo-composable'
import type { Get } from 'type-fest'
import { defineComponent, ref, watch } from 'vue'

type SearchItemType = NonNullable<Get<SearchStreamsQuery, 'streams.items.0'>>

export default defineComponent({
  components: {
    PreviewImage: () => import('@/main/components/common/PreviewImage.vue')
  },
  props: {
    gotostreamonclick: { type: Boolean, default: true }
  },
  setup() {
    const search = ref('')
    const items = ref([] as SearchItemType[])

    const { onResult: onSearchResult, loading: isSearchLoading } = useQuery(
      SearchStreamsDocument,
      () => {
        return { query: search.value }
      },
      () => ({
        enabled: search.value?.length >= 3,
        debounce: 300
      })
    )
    onSearchResult((result) => {
      const newItems = result.data?.streams?.items || []
      items.value = newItems.slice()
    })

    watch(search, (newSearch) => {
      if (!newSearch?.length) {
        items.value = []
      }
    })

    return { search, items, isSearchLoading }
  },
  data: () => ({
    selectedSearchResult: null as Nullable<SearchItemType>
  }),
  watch: {
    selectedSearchResult(val: SearchItemType) {
      const myStream = this.items.find((s) => s.id === val.id)
      this.$emit('select', myStream)

      this.items = []
      this.search = ''

      if (val && this.gotostreamonclick) this.$router.push(`/streams/${val.id}`)
    }
  }
})
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
