<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="md"
    @fully-closed="$emit('fully-closed')"
  >
    <div class="flex flex-col text-foreground">
      <div class="h4 font-bold mb-4">
        Delete {{ `${versions.length} version${versions.length > 1 ? 's' : ''}` }}
      </div>
      <p class="mb-6">
        Deleting versions is an irrevocable action! If you are sure about wanting to
        delete
        <template v-if="versions.length > 1">the selected versions,</template>
        <template v-else-if="versions.length">
          the selected version
          <span class="inline font-bold">"{{ versions[0].message }}",</span>
        </template>
        please click on the button below!
      </p>
      <div class="flex justify-end">
        <FormButton :disabled="loading" color="danger" @click="onDelete">
          Delete
        </FormButton>
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectModelPageDialogDeleteVersionFragment } from '~~/lib/common/generated/gql/graphql'
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
  projectId?: string
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
      versionIds: props.versions.map((v) => v.id)
    },
    {
      projectId: props.projectId,
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
