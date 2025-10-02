<template>
  <aside
    class="absolute lg:relative bottom-0 right-0 bg-foundation w-full lg:w-[16.25rem] xl:w-[20.25rem] lg:h-dvh border-t lg:border-t-0 lg:border-l border-outline-3 p-4"
    :class="[isExpanded ? 'h-[27.625rem]' : 'h-[11rem]']"
  >
    <div class="hidden lg:flex items-center justify-end space-x-1">
      <FormButton
        v-if="canUpdateSlide"
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
    <section class="lg:pt-4 lg:px-1 flex flex-col gap-3 relative h-full pb-4 lg:pb-24">
      <div class="flex items-start justify-between gap-x-2">
        <h1
          v-if="currentSlide?.name"
          class="text-xl/7 xl:text-[26px]/8 tracking-[-0.399px] xl:tracking-[-0.494px] font-medium text-foreground px-1 lg:px-2 xl:px-3 py-0.5 lg:py-1.5 line-clamp-1 lg:line-clamp-none break-all"
        >
          {{ currentSlide?.name }}
        </h1>
        <div class="lg:hidden flex items-center gap-x-1">
          <FormButton
            v-if="canUpdateSlide"
            :icon-left="LucidePencilLine"
            color="subtle"
            hide-text
            @click="isSlideEditDialogOpen = true"
          />

          <FormButton
            :icon-left="isExpanded ? LucideMinimize2 : LucideMaximize2"
            color="subtle"
            hide-text
            @click="isExpanded = !isExpanded"
          />
        </div>
      </div>

      <p
        v-if="currentSlide?.description"
        ref="descriptionRef"
        class="simple-scrollbar text-body-sm xl:text-body text-foreground whitespace-pre-wrap px-1 lg:px-2 xl:px-3 lg:py-1 lg:flex-1 lg:overflow-y-auto lg:line-clamp-none"
        :class="{
          'line-clamp-4 overflow-hidden': !isExpanded,
          'flex-1 overflow-y-auto': isExpanded
        }"
      >
        {{ currentSlide?.description }}
      </p>
    </section>

    <div
      v-if="!isExpanded"
      class="lg:hidden absolute bottom-0 left-0 w-full h-16 bg-red z-20 flex justify-center items-center bg-[linear-gradient(0deg,#FFFFFF_0%,rgba(255,255,255,0)_100%)] dark:bg-[linear-gradient(0deg,#15161c_0%,rgba(255,255,255,0)_100%)]"
    />

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
import {
  LucideX,
  LucidePencilLine,
  LucideMaximize2,
  LucideMinimize2
} from 'lucide-vue-next'

defineEmits<{
  (e: 'close'): void
}>()

graphql(`
  fragment PresentationInfoSidebar_SavedView on SavedView {
    id
    ...PresentationSlideEditDialog_SavedView
    name
    description
    permissions {
      canEditTitle {
        ...FullPermissionCheckResult
      }
      canEditDescription {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const {
  ui: { slide: currentSlide },
  response: { workspace }
} = useInjectedPresentationState()

const isSlideEditDialogOpen = ref(false)
const descriptionRef = ref<HTMLElement>()
const isExpanded = ref(false)

const canUpdateSlide = computed(() => {
  return (
    currentSlide.value?.permissions?.canEditTitle.authorized ||
    currentSlide.value?.permissions?.canEditDescription.authorized
  )
})
</script>
