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
      @update:model-value="handleVisibilityChange"
    />

    <ProjectPageSettingsGeneralBlockAccessDialog
      v-model:open="showConfirmDialog"
      :current-visibility="currentVisibility"
      :new-visibility="pendingVisibility"
      :project-id="project.id"
      @confirm="confirmVisibilityChange"
      @cancel="cancelVisibilityChange"
    />
  </ProjectPageSettingsBlock>
</template>

<script setup lang="ts">
import { Lock, Globe, Building } from 'lucide-vue-next'
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

const currentVisibility = computed(
  () =>
    castToSupportedVisibility(props.project.visibility) ||
    SupportedProjectVisibility.Private
)
const selectedOption = ref(currentVisibility.value)
const showConfirmDialog = ref(false)
const pendingVisibility = ref<SupportedProjectVisibility | null>(null)

const radioOptions = computed(() => [
  {
    value: SupportedProjectVisibility.Public,
    title: 'Public',
    introduction: 'Anyone with the link can view',
    icon: Globe
  },
  ...(props.project.workspaceId
    ? [
        {
          value: SupportedProjectVisibility.Workspace,
          introduction: 'All workspace members can view',
          title: 'Workspace',
          icon: Building
        }
      ]
    : []),
  {
    value: SupportedProjectVisibility.Private,
    title: 'Private',
    introduction: 'Only for project members and admins',
    icon: Lock
  }
])

const canUpdate = computed(() => props.project.permissions.canUpdate)

const handleVisibilityChange = (newVisibility: SupportedProjectVisibility) => {
  const current = currentVisibility.value
  const shouldShowConfirmDialog =
    current === SupportedProjectVisibility.Public &&
    (newVisibility === SupportedProjectVisibility.Workspace ||
      newVisibility === SupportedProjectVisibility.Private)

  if (shouldShowConfirmDialog) {
    pendingVisibility.value = newVisibility
    showConfirmDialog.value = true
    selectedOption.value = current
  } else {
    emit('update-visibility', newVisibility)
  }
}

const confirmVisibilityChange = () => {
  if (pendingVisibility.value) {
    selectedOption.value = pendingVisibility.value
    emit('update-visibility', pendingVisibility.value)
    pendingVisibility.value = null
  }
  showConfirmDialog.value = false
}

const cancelVisibilityChange = () => {
  selectedOption.value = currentVisibility.value
  pendingVisibility.value = null
  showConfirmDialog.value = false
}

watch(
  () => props.project.visibility,
  (newVal) => {
    selectedOption.value =
      castToSupportedVisibility(newVal) || SupportedProjectVisibility.Private
  }
)
</script>
