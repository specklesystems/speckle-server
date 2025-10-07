<template>
  <div>
    <div class="flex justify-between items-center mb-8 mt-3">
      <h1 class="block text-heading-lg">Discussions</h1>
      <div class="space-x-2 flex items-center">
        <FormCheckbox
          :id="checkboxId"
          v-model="finalIncludeArchived"
          name="includeArchived"
          :value="true"
          label="Include resolved"
          label-position="right"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectDiscussionsPageHeader_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectDiscussionsPageHeader_Project on Project {
    id
    name
  }
`)

const emit = defineEmits<{
  (e: 'update:include-archived', val: boolean): void
}>()

const props = defineProps<{
  project: ProjectDiscussionsPageHeader_ProjectFragment
  includeArchived: Optional<true>
}>()

const finalIncludeArchived = computed({
  get: () => props.includeArchived,
  set: (newVal) => emit('update:include-archived', newVal)
})

const checkboxId = useId()
</script>
