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
          updated {{ lastUpdated }}
        </span>
        <!-- <span v-else class="bg-primary-muted text-primary rounded-full px-2 py-1 -ml-1">
          No info
        </span> -->
      </div>
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center space-x-1">
            <div class="font-bold truncate text-foreground">{{ tag.name }}</div>
          </div>
          <!-- <div>{{ tag.versions?.length }}</div> -->
        </div>
        <div>
          <img :src="tag.feature_image" alt="featured image" class="w-12" />
        </div>
      </div>
      <!-- <div class="text-xs text-foreground-2 flex-grow line-clamp-2 overflow-hidden">
        {{ tag.description }}
      </div> -->
      <div class="flex space-x-2 items-center justify-between">
        <span
          v-if="lastUpdated"
          class="text-xs bg-primary-muted text-primary rounded-full px-2 py-1 -ml-1 truncate"
        >
          {{ tag.stable ? tag.stable : tag.versions[0].Number }}
        </span>
        <div
          class="opacity-0 group-hover:opacity-100 transition flex items-center space-x-1"
        >
          <FormButton v-if="tag.directDownload" size="xs" text>
            <CloudArrowDownIcon class="w-4 h-4" />
          </FormButton>
          <FormButton size="sm" :to="tag.url" target="_blank">
            Tutorials & Docs
          </FormButton>
        </div>
      </div>
      <!-- <div>{{ tag.communityProvider }}, {{ tag.isCommunity }}</div> -->
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'

import {
  ShieldCheckIcon,
  GlobeEuropeAfricaIcon,
  CloudArrowDownIcon
} from '@heroicons/vue/24/solid'
import { ConnectorTag, Tag } from '~~/lib/connectors'

const props = defineProps<{
  tag: ConnectorTag
}>()

const lastUpdated = computed(() =>
  props.tag.versions?.length > 0
    ? dayjs(props.tag.versions[0].Date).from(dayjs())
    : undefined
)
</script>
