<template>
  <aside
    class="bg-foundation h-48 md:h-screen w-full md:w-64 xl:w-80 border-t md:border-t-0 md:border-l border-outline-3 py-5 px-4"
  >
    <div class="hidden md:flex items-center justify-end space-x-0.5">
      <FormButton
        v-if="canUpdate"
        :icon-left="LucidePencilLine"
        color="subtle"
        hide-text
        @click="isSlideEditDialogOpen = true"
      />
      <FormButton
        :icon-left="LucideX"
        color="subtle"
        hide-text
        @click="$emit('close')"
      />
    </div>
    <section class="pt-2 flex flex-col gap-4">
      <div class="flex items-center justify-between gap-x-2">
        <h1 v-if="currentSlide?.name" class="text-xl font-medium text-foreground px-2">
          {{ currentSlide?.name }}
        </h1>
        <FormButton
          v-if="canUpdate"
          :icon-left="LucidePencilLine"
          color="subtle"
          hide-text
          class="md:hidden"
          @click="isSlideEditDialogOpen = true"
        />
      </div>

      <p
        v-if="currentSlide?.description"
        class="text-body-sm text-foreground whitespace-pre-wrap px-2"
      >
        {{ currentSlide?.description }}
      </p>
    </section>

    <PresentationSlideEditDialog
      v-model:open="isSlideEditDialogOpen"
      :slide="currentSlide"
    />
  </aside>
</template>

<script setup lang="ts">
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { graphql } from '~~/lib/common/generated/gql'
import { LucideX, LucidePencilLine } from 'lucide-vue-next'

defineEmits<{
  (e: 'close'): void
}>()

graphql(`
  fragment PresentationInfoSidebar_SavedViewGroup on SavedViewGroup {
    id
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
    }
  }

  fragment PresentationInfoSidebar_SavedView on SavedView {
    id
    ...PresentationSlideEditDialog_SavedView
    name
    description
  }
`)

const {
  ui: { slide: currentSlide },
  response: { presentation }
} = useInjectedPresentationState()

const isSlideEditDialogOpen = ref(false)

const canUpdate = computed(() => {
  return presentation.value?.permissions?.canUpdate
})
</script>
