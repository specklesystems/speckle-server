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
        />
        <ProjectModelPageDialogMoveToNewTab
          v-else
          :project-id="projectId"
          :versions="versions"
        />
      </LayoutTabs>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectModelPageDialogMoveToVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { LayoutTabItem } from '~~/lib/layout/helpers/components'

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
}>()

const tabItems = ref<LayoutTabItem[]>([
  { title: 'Existing model', id: 'existing-model' },
  { title: 'New model', id: 'new-model' }
])

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
