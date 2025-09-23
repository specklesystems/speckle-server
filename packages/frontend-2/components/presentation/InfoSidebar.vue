<template>
  <aside
    class="bg-foundation h-48 lg:h-dvh w-full lg:w-64 xl:w-80 border-t lg:border-t-0 lg:border-l border-outline-3 py-5 px-4"
  >
    <div class="hidden lg:flex items-center justify-end space-x-0.5">
      <div
        v-tippy="
          canUpdateSlide ? undefined : 'You do not have permission to edit this slide'
        "
      >
        <FormButton
          v-if="canUpdate"
          :disabled="!canUpdateSlide"
          :icon-left="LucidePencilLine"
          color="subtle"
          hide-text
          @click="isSlideEditDialogOpen = true"
        />
      </div>
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
        <div class="lg:hidden flex items-center gap-x-1">
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
      :workspace-id="workspace?.id"
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
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const {
  ui: { slide: currentSlide },
  response: { presentation, workspace }
} = useInjectedPresentationState()

const isSlideEditDialogOpen = ref(false)

const canUpdate = computed(() => {
  return presentation.value?.permissions?.canUpdate?.authorized
})
const canUpdateSlide = computed(() => {
  return currentSlide.value?.permissions?.canUpdate.authorized
})
</script>
