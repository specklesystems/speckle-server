<template>
  <ClientOnly>
    <div
      v-if="isEmbedEnabled"
      class="select-none fixed bottom-0 left-0 w-full z-20 flex gap-3 px-4 h-14 items-center bg-foundation"
    >
      <template v-if="!hideSpeckleBranding">
        <HeaderLogoBlock
          large-icon
          to="https://speckle.systems/"
          target="_blank"
          show-text-on-mobile
          :active="false"
        />
        <div class="h-6 w-px bg-outline-3"></div>
      </template>
      <div class="flex flex-col">
        <component
          :is="disableModelLink ? 'div' : 'NuxtLink'"
          :to="url"
          target="_blank"
          class="leading-3"
          :class="disableModelLink ? 'cursor-default' : 'cursor-pointer'"
        >
          <div class="flex items-center gap-1 w-full">
            <h2 class="text-heading-sm truncate text-foreground">
              {{ name }}
            </h2>
            <template v-if="!disableModelLink">
              <ArrowTopRightOnSquareIcon class="h-3 w-3" />
            </template>
          </div>
          <span v-if="date" class="text-body-2xs text-foreground-2">
            {{ date }}
          </span>
        </component>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import type { MaybeNullOrUndefined } from '@speckle/shared'

defineProps<{
  date?: string
  name?: string
  url?: string
  hideSpeckleBranding?: MaybeNullOrUndefined<boolean>
  disableModelLink?: MaybeNullOrUndefined<boolean>
}>()

const { isEmbedEnabled } = useEmbed()
</script>
