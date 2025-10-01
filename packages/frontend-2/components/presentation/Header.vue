<template>
  <PresentationFloatingPanel>
    <div class="flex items-center justify-between space-x-2">
      <PresentationFloatingPanelButton
        :active="isSidebarOpen"
        @click="emit('toggleSidebar')"
      >
        <LucideArrowLeftToLine
          v-if="isSidebarOpen"
          :size="16"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
        />
        <LucidePanelLeft
          v-else
          :size="16"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
        />
      </PresentationFloatingPanelButton>
      <h1
        v-if="presentation?.title"
        class="hidden sm:block text-body-xs font-medium text-foreground leading-none sm:pr-3 max-w-64 truncate"
      >
        {{ presentation?.title }}
      </h1>
    </div>
  </PresentationFloatingPanel>
</template>

<script setup lang="ts">
import { LucideArrowLeftToLine, LucidePanelLeft } from 'lucide-vue-next'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment PresentationHeader_SavedViewGroup on SavedViewGroup {
    id
    title
  }
`)

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

const isSidebarOpen = defineModel<boolean>('is-sidebar-open')

const {
  response: { presentation }
} = useInjectedPresentationState()
</script>
