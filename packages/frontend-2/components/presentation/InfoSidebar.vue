<template>
  <aside
    class="bg-foundation h-48 md:h-screen w-full md:w-80 border-t md:border-t-0 md:border-l border-outline-3 py-5 px-4"
  >
    <section class="pt-2 flex flex-col gap-4">
      <div class="px-2">
        <h1 v-if="isPresentMode && title" class="text-xl font-medium text-foreground">
          {{ title }}
        </h1>
        <FormTextInput
          v-else
          v-model="editableTitle"
          name="presentation-title"
          label="Title"
          placeholder="Presentation title"
          color="foundation"
          label-position="top"
          class="w-full !text-xl"
        />
      </div>

      <div v-if="isPresentMode" class="px-2">
        <p v-if="description" class="text-body-sm text-foreground whitespace-pre-wrap">
          {{ description }}
        </p>
      </div>
      <div v-else class="px-2">
        <FormTextArea
          v-model="editableDescription"
          name="slide-description"
          label="Description"
          placeholder="Description"
          color="foundation"
          label-position="top"
          class="w-full !text-foreground-2 !h-28"
        />
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'

const props = defineProps<{
  title: MaybeNullOrUndefined<string>
  description: MaybeNullOrUndefined<string>
}>()

const editableTitle = ref(props.title || '')
const editableDescription = ref(props.description || '')
const isPresentMode = ref(false)

watch(
  () => props.title,
  (newTitle) => {
    editableTitle.value = newTitle || ''
  }
)

watch(
  () => props.description,
  (newDescription) => {
    editableDescription.value = newDescription || ''
  }
)
</script>
