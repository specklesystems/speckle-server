<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="xs"
    @fully-closed="$emit('fully-closed')"
  >
    <template #header>
      Move {{ versions.length }} version{{ versions.length > 1 ? 's' : '' }}
    </template>
    <div class="flex flex-col space-y-4">
      <LayoutTabsHorizontal v-model:active-item="activeTab" :items="tabItems">
        <template #default="{ activeItem }">
          <div class="min-h-40">
            <ProjectModelPageDialogMoveToExistingTab
              v-if="activeItem.id === 'existing-model'"
              :versions="versions"
              :project-id="projectId"
              :disabled="loading"
              :model-id="modelId"
              @model-selected="onMove"
            />
            <ProjectModelPageDialogMoveToNewTab
              v-else-if="activeItem.id === 'new-model'"
              :project-id="projectId"
              :versions="versions"
              :disabled="loading"
              @model-selected="onMove($event, true)"
            />
          </div>
        </template>
      </LayoutTabsHorizontal>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectModelPageDialogMoveToVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useMoveVersions } from '~~/lib/projects/composables/versionManagement'
import type { LayoutPageTabItem } from '@speckle/ui-components'

graphql(`
  fragment ProjectModelPageDialogMoveToVersion on Version {
    id
    message
  }
`)

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'fully-closed'): void
}>()

const props = defineProps<{
  projectId: string
  versions: ProjectModelPageDialogMoveToVersionFragment[]
  open: boolean
  modelId?: string
}>()

const moveVersions = useMoveVersions()
const mp = useMixpanel()
const loading = ref(false)

// Define tab items
const tabItems = ref<LayoutPageTabItem[]>([
  { title: 'Existing model', id: 'existing-model' },
  { title: 'New model', id: 'new-model' }
])

// Manage active tab state
const activeTab = ref(tabItems.value[0])

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const onMove = async (targetModelName: string, newModelCreated?: boolean) => {
  loading.value = true
  const success = await moveVersions(
    {
      projectId: props.projectId,
      versionIds: props.versions.map((v) => v.id),
      targetModelName
    },
    {
      previousModelId: props.modelId,
      newModelCreated
    }
  )
  loading.value = false
  mp.track('Commit Action', {
    type: 'action',
    name: 'move',
    model: newModelCreated ? 'new model' : 'existing model',
    bulk: props.versions.length !== 1
  })
  if (success) isOpen.value = false
}
</script>
