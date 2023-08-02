<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="md"
    @fully-closed="$emit('fully-closed')"
  >
    <div class="flex flex-col space-y-4">
      <div class="h4 font-bold text-foreground">
        Move {{ `${versions.length} version${versions.length > 1 ? 's' : ''}` }}
      </div>
      <LayoutTabs v-slot="{ activeItem }" :items="tabItems">
        <ProjectModelPageDialogMoveToExistingTab
          v-if="activeItem.id === 'existing-model'"
          :versions="versions"
          :project-id="projectId"
          :disabled="loading"
          :model-id="modelId"
          @model-selected="onMove"
        />
        <ProjectModelPageDialogMoveToNewTab
          v-else
          :project-id="projectId"
          :versions="versions"
          :disabled="loading"
          @model-selected="onMove($event, true)"
        />
      </LayoutTabs>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectModelPageDialogMoveToVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { LayoutTabItem } from '~~/lib/layout/helpers/components'
import { useMoveVersions } from '~~/lib/projects/composables/versionManagement'

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

const loading = ref(false)
const tabItems = ref<LayoutTabItem[]>([
  { title: 'Existing model', id: 'existing-model' },
  { title: 'New model', id: 'new-model' }
])

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const mp = useMixpanel()

const onMove = async (targetModelName: string, newModelCreated?: boolean) => {
  loading.value = true
  const success = await moveVersions(
    {
      versionIds: props.versions.map((v) => v.id),
      targetModelName
    },
    { previousModelId: props.modelId, newModelCreated, projectId: props.projectId }
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
