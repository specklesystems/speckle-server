<template>
  <div class="bg-foundation p-4 rounded-lg group shadow hover:shadow-md transition">
    <div class="flex flex-col justify-between space-y-4">
      <div class="text-xs flex items-center space-x-2">
        <ShieldCheckIcon
          v-if="!tag.isCommunity"
          v-tippy="'Made by Speckle'"
          class="w-4 h-4 text-primary"
        />
        <GlobeEuropeAfricaIcon
          v-else
          v-tippy="`Contributed by ${tag.communityProvider}`"
          class="w-4 h-4 text-foreground-2"
        />
        <span
          v-if="lastUpdated"
          class="bg-primary-muted text-primary rounded-full px-2 py-1 -ml-1"
        >
          Updated
          <span v-tippy="lastUpdatedFormatted.full">
            {{ lastUpdatedFormatted.relative }}
          </span>
        </span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center space-x-1">
            <div class="font-medium truncate text-foreground">{{ tag.name }}</div>
            <span
              v-if="lastUpdated"
              class="text-xs bg-primary-muted text-primary rounded-full px-2 py-1 -ml-1 truncate"
            >
              {{ tag.stable ? tag.stable : tag.versions[0].Number }}
            </span>
          </div>
        </div>
        <div>
          <img :src="tag.feature_image" alt="featured image" class="w-12" />
        </div>
      </div>
      <div class="flex space-x-2 items-center justify-end">
        <div
          class="xxx-opacity-0 group-hover:opacity-100 transition flex items-center justify-between w-full"
        >
          <FormButton
            v-if="tag.directDownload"
            size="sm"
            text
            @click="dialogOpen = true"
          >
            Downloads
          </FormButton>
          <ConnectorsVersionsDownloadDialog v-model:open="dialogOpen" :tag="tag" />
          <FormButton :to="tag.url" target="_blank" external>Tutorials</FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ShieldCheckIcon, GlobeEuropeAfricaIcon } from '@heroicons/vue/24/solid'
import type { ConnectorTag } from '~~/lib/connectors'

const props = defineProps<{
  tag: ConnectorTag
}>()

const dialogOpen = ref(false)

const lastUpdated = computed(() =>
  props.tag.versions?.length > 0 ? props.tag.versions[0].Date : undefined
)

const lastUpdatedFormatted = computed(() => {
  return {
    full: lastUpdated.value ? formattedFullDate(lastUpdated.value) : '',
    relative: lastUpdated.value
      ? formattedRelativeDate(lastUpdated.value, { prefix: true })
      : ''
  }
})
</script>
