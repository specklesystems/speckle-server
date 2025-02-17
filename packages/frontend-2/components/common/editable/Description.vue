<template>
  <div class="flex gap-x-2 group">
    <label>
      <div class="sr-only">Edit description</div>
      <div
        class="grow-textarea"
        :data-replicated-value="visibleDescription"
        :class="descriptionInputClasses"
      >
        <textarea
          name="Description"
          :class="[
            ...descriptionInputClasses,
            visibleDescription ? 'focus:min-w-0' : 'min-w-[260px]'
          ]"
          :placeholder="
            visibleDescription ? undefined : 'Click here to add a description.'
          "
          :disabled="disabled"
          rows="1"
          spellcheck="false"
          maxlength="1000"
          :cols="
            visibleDescription && visibleDescription?.length < 20
              ? visibleDescription.length
              : undefined
          "
          data-type="description"
          :value="visibleDescription"
          v-on="on"
        />
      </div>
    </label>
    <div class="shrink-0 ml-2 mt-1 text-foreground-2">
      <PencilIcon
        v-if="!disabled"
        class="w-4 h-4 opacity-0 group-hover:opacity-100 transition text-foreground-2"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { PencilIcon } from '@heroicons/vue/20/solid'
import { useDebouncedTextInput } from '@speckle/ui-components'

defineProps<{
  disabled?: boolean
}>()

const description = defineModel<string>({ required: true })
const { on, bind } = useDebouncedTextInput({
  model: description,
  submitOnEnter: false,
  debouncedBy: 2000,
  isBasicHtmlInput: true
})
const visibleDescription = computed(() => bind.value.modelValue)

const descriptionInputClasses = computed(() => [
  'normal placeholder:text-foreground-2 text-foreground-2 focus:text-foreground',
  'border-0 border-b-2 focus:border-outline-3',
  'p-0 bg-transparent border-transparent focus:outline-none focus:ring-0'
])
</script>
