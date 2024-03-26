<template>
  <div class="flex group">
    <label class="max-w-full overflow-hidden">
      <div class="sr-only">Edit title</div>
      <div
        :class="titleInputClasses"
        class="grow-textarea"
        :data-replicated-value="visibleTitle"
      >
        <textarea
          name="Title"
          maxlength="512"
          :class="titleInputClasses"
          placeholder="Please enter a valid title"
          rows="1"
          spellcheck="false"
          :disabled="disabled"
          :cols="
            visibleTitle && visibleTitle.length < 20 ? visibleTitle.length : undefined
          "
          data-type="title"
          :value="visibleTitle"
          v-on="on"
        />
      </div>
    </label>
    <PencilIcon
      v-if="!disabled"
      class="shrink-0 ml-2 mt-3 w-4 h-4 opacity-0 group-hover:opacity-100 transition text-foreground-2"
    />
  </div>
</template>
<script setup lang="ts">
import { PencilIcon } from '@heroicons/vue/20/solid'
import { useDebouncedTextInput } from '@speckle/ui-components'

defineProps<{
  disabled?: boolean
}>()

const title = defineModel<string>({ required: true })
const { on, bind } = useDebouncedTextInput({
  model: title,
  debouncedBy: 2000,
  isBasicHtmlInput: true,
  submitOnEnter: true
})
const visibleTitle = computed(() => bind.modelValue.value)

const titleInputClasses = computed(() => [
  'h3 tracking-tight border-0 border-b-2 transition focus:border-outline-3 max-w-full',
  'p-0 pb-1 bg-transparent border-transparent focus:outline-none focus:ring-0'
])
</script>
