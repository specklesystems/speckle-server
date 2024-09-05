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
    <PencilIcon v-if="!disabled" :class="pencilClasses" />
  </div>
</template>
<script setup lang="ts">
import { PencilIcon } from '@heroicons/vue/20/solid'
import { useDebouncedTextInput } from '@speckle/ui-components'

const props = defineProps<{
  disabled?: boolean
  customClasses?: {
    input?: string
    pencil?: string
  }
}>()

const title = defineModel<string>({ required: true })
const { on, bind } = useDebouncedTextInput({
  model: title,
  debouncedBy: 2000,
  isBasicHtmlInput: true,
  submitOnEnter: true
})
const visibleTitle = computed(() => bind.value.modelValue)

const titleInputClasses = computed(() => {
  const classParts = [
    'border-0 border-b-2 transition focus:border-outline-3 max-w-full',
    'p-0 pb-1 bg-transparent border-transparent focus:outline-none focus:ring-0'
  ]

  if (props.customClasses?.input) {
    classParts.push(props.customClasses.input)
  } else {
    classParts.push('h3 tracking-tight')
  }

  return classParts.join(' ')
})

const pencilClasses = computed(() => {
  const classParts = [
    'shrink-0 opacity-0 group-hover:opacity-100 transition text-foreground-2'
  ]

  if (props.customClasses?.pencil) {
    classParts.push(props.customClasses.pencil)
  } else {
    classParts.push('ml-2 mt-3 w-4 h-4')
  }

  return classParts.join(' ')
})
</script>
