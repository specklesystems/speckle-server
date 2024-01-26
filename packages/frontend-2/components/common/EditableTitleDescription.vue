<template>
  <div class="my-8">
    <!-- Editable Title -->
    <div class="flex group">
      <label class="max-w-full overflow-hidden">
        <div class="sr-only">Edit title</div>
        <div
          :class="titleInputClasses"
          class="grow-textarea"
          :data-replicated-value="title"
        >
          <textarea
            v-model="title"
            maxlength="512"
            :class="titleInputClasses"
            placeholder="Please enter a valid title"
            rows="1"
            spellcheck="false"
            :disabled="isDisabled"
            :cols="title && title.length < 20 ? title.length : undefined"
            data-type="title"
            @keydown="onInputKeydown"
            @blur="onBlur('title')"
            @input="onTitleInput"
          />
        </div>
      </label>
      <PencilIcon
        v-if="canEdit"
        class="shrink-0 ml-2 mt-3 w-4 h-4 opacity-0 group-hover:opacity-100 transition text-foreground-2"
      />
    </div>

    <!-- Editable Description -->
    <div class="mt-3 flex gap-x-2 group">
      <div class="hidden md:inline-block shrink-0 text-foreground-2 mt-0.5">
        <InformationCircleIcon class="w-5 h-5" />
      </div>
      <label>
        <div class="sr-only">Edit description</div>
        <div
          class="grow-textarea"
          :data-replicated-value="description"
          :class="descriptionInputClasses"
        >
          <textarea
            v-model="description"
            :class="[
              ...descriptionInputClasses,
              description ? 'focus:min-w-0' : 'min-w-[260px]'
            ]"
            :placeholder="description ? undefined : 'Click here to add a description.'"
            :disabled="isDisabled"
            rows="1"
            spellcheck="false"
            maxlength="1000"
            :cols="
              description && description?.length < 20 ? description.length : undefined
            "
            data-type="description"
            @keydown="onInputKeydown"
            @blur="onBlur('description')"
            @input="onDescriptionInput"
          />
        </div>
      </label>
      <div class="shrink-0 ml-2 mt-1 text-foreground-2">
        <PencilIcon
          v-if="canEdit"
          class="w-4 h-4 opacity-0 group-hover:opacity-100 transition text-foreground-2"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PencilIcon } from '@heroicons/vue/20/solid'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import { debounce } from 'lodash-es'

const props = defineProps({
  title: String,
  description: String,
  canEdit: Boolean,
  isDisabled: Boolean
})

const emit = defineEmits(['update:title', 'update:description'])

const title = ref(props.title)
const description = ref(props.description)

const lastTitleValue = ref(props.title)
const lastDescriptionValue = ref(props.description)

const titleDebounceSaved = ref(false)
const descriptionDebounceSaved = ref(false)

const emitTitle = () => {
  lastTitleValue.value = title.value
  titleDebounceSaved.value = true
  emit('update:title', title.value)
}

const emitDescription = () => {
  lastDescriptionValue.value = description.value
  descriptionDebounceSaved.value = true
  emit('update:description', description.value)
}

const debouncedEmitTitle = debounce(emitTitle, 2000)
const debouncedEmitDescription = debounce(emitDescription, 2000)

const titleInputClasses = computed(() => [
  'h3 tracking-tight border-0 border-b-2 transition focus:border-outline-3 max-w-full',
  'p-0 bg-transparent border-transparent focus:outline-none focus:ring-0'
])

const descriptionInputClasses = computed(() => [
  'normal placeholder:text-foreground-2 text-foreground-2 focus:text-foreground',
  'border-0 border-b-2 focus:border-outline-3',
  'p-0 bg-transparent border-transparent focus:outline-none focus:ring-0'
])

const onInputKeydown = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLElement) {
    if (e.target.dataset.type === 'title' && e.code === 'Enter') {
      e.preventDefault()
      e.target.blur()
    }
  }
}

const onBlur = (inputType: string) => {
  debouncedEmitTitle.cancel()
  debouncedEmitDescription.cancel()

  if (inputType === 'title' && !titleDebounceSaved.value) {
    if (lastTitleValue.value !== title.value) {
      lastTitleValue.value = title.value
      emitTitle()
    }
  } else if (inputType === 'description' && !descriptionDebounceSaved.value) {
    if (lastDescriptionValue.value !== description.value) {
      lastDescriptionValue.value = description.value
      emitDescription()
    }
  }
}

const onTitleInput = () => {
  titleDebounceSaved.value = false
  debouncedEmitTitle()
}

const onDescriptionInput = () => {
  descriptionDebounceSaved.value = false
  debouncedEmitDescription()
}

watch(
  () => props.title,
  (newVal) => {
    title.value = newVal
  }
)
watch(
  () => props.description,
  (newVal) => {
    description.value = newVal
  }
)
</script>

<style scoped>
/** more info: https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/ */
.grow-textarea {
  /* easy way to plop the elements on top of each other and have them both sized based on the tallest one's height */
  display: grid;
}

.grow-textarea::after {
  /* Note the weird space! Needed to preventy jumpy behavior */
  content: attr(data-replicated-value) ' ';

  /* This is how textarea text behaves */
  white-space: pre-wrap;

  /* Hidden from view, clicks, and screen readers */
  visibility: hidden;
}

.grow-textarea > textarea {
  /* You could leave this, but after a user resizes, then it ruins the auto sizing */
  resize: none;

  /* Firefox shows scrollbar on growth, you can hide like this. */
  overflow: hidden;
}

.grow-textarea > textarea,
.grow-textarea::after {
  /* Place on top of each other - has to have the same styling as the textarea! */
  grid-area: 1 / 1 / 2 / 2;
}
</style>
