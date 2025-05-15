<template>
  <ProjectPageSettingsBlock background title="Access" :auth-check="canUpdate">
    <template #introduction>
      <p class="text-body-xs text-foreground">Choose who can access this project.</p>
    </template>
    <FormRadioGroup
      v-model="selectedOption"
      :options="radioOptions"
      size="sm"
      :disabled="!canUpdate.authorized"
      @update:model-value="emitUpdate"
    />
  </ProjectPageSettingsBlock>
</template>

<script setup lang="ts">
import {
  LockClosedIcon,
  GlobeAltIcon,
  BuildingOfficeIcon
} from '@heroicons/vue/24/outline'
import { FormRadioGroup } from '@speckle/ui-components'
import {
  castToSupportedVisibility,
  SupportedProjectVisibility
} from '~/lib/projects/helpers/visibility'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageSettingsGeneralBlockAccess_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageSettingsGeneralBlockAccess_Project on Project {
    id
    visibility
    workspaceId
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const props = defineProps<{
  project: ProjectPageSettingsGeneralBlockAccess_ProjectFragment
}>()

const emit = defineEmits<{
  (e: 'update-visibility', v: SupportedProjectVisibility): void
}>()

const selectedOption = ref(
  castToSupportedVisibility(props.project.visibility) ||
    SupportedProjectVisibility.Private
)

const radioOptions = computed(() => [
  {
    value: SupportedProjectVisibility.Public,
    title: 'Public',
    introduction: 'Anyone with the link can view',
    icon: GlobeAltIcon
  },
  ...(props.project.workspaceId
    ? [
        {
          value: SupportedProjectVisibility.Workspace,
          introduction: 'All workspace members can view',
          title: 'Workspace',
          icon: BuildingOfficeIcon
        }
      ]
    : []),
  {
    value: SupportedProjectVisibility.Private,
    title: 'Private',
    introduction: 'Only for project members and admins',
    icon: LockClosedIcon
  }
])
const canUpdate = computed(() => props.project.permissions.canUpdate)

watch(
  () => props.project.visibility,
  (newVal) => {
    selectedOption.value =
      castToSupportedVisibility(newVal) || SupportedProjectVisibility.Private
  }
)

const emitUpdate = (value: SupportedProjectVisibility) => {
  emit('update-visibility', value)
}
</script>
