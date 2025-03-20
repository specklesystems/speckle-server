<template>
  <ProjectPageSettingsBlock
    background
    title="Access"
    :disabled-message="disabled ? 'You must be a project owner' : undefined"
  >
    <template #introduction>
      <p class="text-body-xs text-foreground">
        Choose how you want to share this project with others.
      </p>
    </template>
    <FormRadioGroup
      v-model="selectedOption"
      :options="radioOptions"
      :disabled="disabled"
      @update:model-value="emitUpdate"
    />
  </ProjectPageSettingsBlock>
</template>

<script setup lang="ts">
import { LockClosedIcon, LinkIcon } from '@heroicons/vue/24/outline'
import { FormRadioGroup } from '@speckle/ui-components'
import { SimpleProjectVisibility } from '~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageSettingsGeneralBlockAccess_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageSettingsGeneralBlockAccess_Project on Project {
    id
    visibility
  }
`)

const props = defineProps<{
  project: ProjectPageSettingsGeneralBlockAccess_ProjectFragment
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update-visibility', v: SimpleProjectVisibility): void
}>()

const selectedOption = ref(props.project.visibility || SimpleProjectVisibility.Private)

const radioOptions = computed(() => [
  {
    value: SimpleProjectVisibility.Unlisted,
    title: 'Link shareable',
    introduction: 'Anyone with the link can view',
    icon: LinkIcon
  },
  {
    value: SimpleProjectVisibility.Private,
    title: 'Private',
    introduction: 'Only collaborators can access',
    icon: LockClosedIcon
  }
])

watch(
  () => props.project.visibility,
  (newVal) => {
    selectedOption.value = newVal ?? SimpleProjectVisibility.Private
  }
)

const emitUpdate = (value: SimpleProjectVisibility) => {
  emit('update-visibility', value)
}
</script>
