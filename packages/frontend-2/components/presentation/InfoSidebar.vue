<template>
  <aside
    class="bg-foundation h-[196px] lg:h-dvh w-full lg:w-[260px] xl:w-[324px] border-t lg:border-t-0 lg:border-l border-outline-3 p-4"
  >
    <div class="hidden lg:flex items-center justify-end space-x-1">
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
    <section class="lg:pt-4 lg:px-1 flex flex-col gap-3">
      <div class="flex items-start justify-between gap-x-2">
        <h1
          v-if="currentSlide?.name"
          class="text-xl/7 xl:text-[26px]/8 tracking-[-0.399px] xl:tracking-[-0.494px] font-medium text-foreground px-1 lg:px-2 xl:px-3 py-0.5 lg:py-1.5"
        >
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
        </div>
      </div>

      <p
        v-if="currentSlide?.description"
        class="text-body-sm xl:text-body text-foreground whitespace-pre-wrap px-1 lg:px-2 xl:px-3 lg:py-1"
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
