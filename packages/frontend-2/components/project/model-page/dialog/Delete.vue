<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="xs"
    :buttons="[
      {
        text: 'Delete',
        props: { color: 'danger', disabled: loading },
        onClick: () => {
          onDelete()
        }
      }
    ]"
    @fully-closed="$emit('fully-closed')"
  >
    <template #header>
      Delete {{ `${versions.length} version${versions.length > 1 ? 's' : ''}` }}
    </template>
    <div class="flex flex-col text-foreground">
      <p>
        Are you sure you want to delete
        <template v-if="versions.length > 1">the selected versions,</template>
        <template v-else-if="versions.length">
          the selected version
          <span v-if="versions[0].message" class="inline font-medium">
            "{{ versions[0].message }}"
          </span>
        </template>
        ?
      </p>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectModelPageDialogDeleteVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useDeleteVersions } from '~~/lib/projects/composables/versionManagement'

graphql(`
  fragment ProjectModelPageDialogDeleteVersion on Version {
    id
    message
  }
`)

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'deleted'): void
  (e: 'fully-closed'): void
}>()

const props = defineProps<{
  versions: ProjectModelPageDialogDeleteVersionFragment[]
  open: boolean
  projectId: string
  modelId?: string
}>()

const deleteVersions = useDeleteVersions()

const loading = ref(false)

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const mp = useMixpanel()
const onDelete = async () => {
  loading.value = true
  const success = await deleteVersions(
    {
      projectId: props.projectId,
      versionIds: props.versions.map((v) => v.id)
    },
    {
      modelId: props.modelId
    }
  )
  mp.track('Commit Action', {
    type: 'action',
    name: 'delete',
    bulk: props.versions.length !== 1
  })

  loading.value = false

  if (success) isOpen.value = false
}
</script>
