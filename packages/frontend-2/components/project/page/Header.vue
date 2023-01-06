<template>
  <div>
    <div
      class="relative mb-3 mt-10 flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex group">
        <label class="max-w-full">
          <div class="sr-only">Edit title</div>
          <div
            class="grow-textarea"
            :data-replicated-value="titleState"
            :class="titleInputClasses"
          >
            <textarea
              v-model="titleState"
              :class="titleInputClasses"
              placeholder="Please enter a valid title"
              rows="1"
              :cols="titleState.length < 20 ? titleState.length : undefined"
            />
          </div>
        </label>
        <PencilIcon
          class="shrink-0 ml-2 mt-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition text-foreground-2"
        />
      </div>
      <Portal to="navigation">
        <HeaderNavLink
          :to="projectRoute(project.id)"
          :name="project.name"
        ></HeaderNavLink>
      </Portal>
      <Portal to="primary-actions">
        <div class="flex space-x-4">
          <FormButton :icon-left="ShareIcon">Share</FormButton>
        </div>
      </Portal>
    </div>
    <div class="mt-3 flex space-x-2 group">
      <div class="shrink-0 mt-0.5 text-foreground-2">
        <InformationCircleIcon class="w-5 h-5" />
      </div>
      <label>
        <div class="sr-only">Edit description</div>
        <div
          class="grow-textarea"
          :data-replicated-value="descriptionState"
          :class="descriptionInputClasses"
        >
          <textarea
            v-model="descriptionState"
            :class="[
              ...descriptionInputClasses,
              'min-w-[280px]',
              descriptionState ? 'focus:min-w-0' : ''
            ]"
            :placeholder="
              descriptionState ? undefined : 'Click here to add a project description.'
            "
            rows="1"
            :cols="descriptionState.length < 20 ? descriptionState.length : undefined"
          />
        </div>
      </label>
      <div class="shrink-0 ml-2 mt-0.5 text-foreground-2">
        <PencilIcon
          class="w-5 h-5 opacity-0 group-hover:opacity-100 transition text-foreground-2"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ShareIcon, PencilIcon } from '@heroicons/vue/20/solid'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import { ProjectPageProjectHeaderFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'

/**
 * TODO:
 * - On enter/unfocus: save
 * - Limit max width
 */

graphql(`
  fragment ProjectPageProjectHeader on Project {
    id
    name
    description
  }
`)

const props = defineProps<{
  project: ProjectPageProjectHeaderFragment
}>()

const descriptionState = ref('')
const titleState = ref('')

const inputResetClasses = computed(() => [
  'p-0 bg-transparent border-transparent focus:outline-none focus:ring-0'
])
const descriptionInputClasses = computed(() => [
  'normal placeholder:text-foreground-2 text-foreground-2 focus:text-foreground',
  'border-0 border-b-2 focus:border-outline-3',
  ...inputResetClasses.value
])
const titleInputClasses = computed(() => [
  'h3 tracking-tight border-0 border-b-2 transition focus:border-outline-3 max-w-full',
  ...inputResetClasses.value
])

watch(
  () => props.project.description,
  (newVal) => {
    descriptionState.value = newVal || ''
  },
  { immediate: true }
)

watch(
  () => props.project.name,
  (newVal) => {
    titleState.value = newVal || ''
  },
  { immediate: true }
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
