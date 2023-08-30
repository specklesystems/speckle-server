<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :title="title"
    :buttons="dialogButtons"
  >
    <div class="flex flex-col gap-6">
      <p>
        Are you sure you want to
        <strong>permanently delete</strong>
        the selected project?
      </p>
      <div v-if="project">
        <strong>{{ project.name }}</strong>
        <p>
          {{ project.models.totalCount }} models,
          {{ project.versions.totalCount }} versions,
        </p>
      </div>
      <p>
        This action
        <strong>cannot</strong>
        be undone.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { LayoutDialog } from '@speckle/ui-components'
import { ProjectItem } from '~~/lib/server-management/helpers/types'
import { adminDeleteProject } from '~~/lib/server-management/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  ROOT_QUERY,
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { ProjectCollection } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  open: boolean
  title: string
  project: ProjectItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: adminDeleteMutation } = useMutation(adminDeleteProject)

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const deleteConfirmed = async () => {
  const projectId = props.project?.id
  if (!projectId) {
    return
  }

  const result = await adminDeleteMutation(
    {
      ids: [projectId]
    },
    {
      update: (cache, { data }) => {
        if (data?.streamsDelete) {
          // Remove project from cache
          const cacheId = getCacheId('Project', projectId)
          cache.evict({
            id: cacheId
          })

          // Modify 'admin' field of ROOT_QUERY so that we can modify all `projectList` instances
          modifyObjectFields<undefined, { [key: string]: ProjectCollection }>(
            cache,
            ROOT_QUERY,
            (_fieldName, _variables, value, details) => {
              // Find all `projectList` fields (there can be multiple due to differing variables)
              const projectListFields = Object.keys(value).filter(
                (k) =>
                  details.revolveFieldNameAndVariables(k).fieldName === 'projectList'
              )

              // Being careful not to mutate original `value`
              const newVal: typeof value = { ...value }

              // Iterate over each and adjust `items` and `totalCount`
              for (const field of projectListFields) {
                const oldItems = value[field]?.items || []
                const newItems = oldItems.filter((i) => i.__ref !== cacheId)
                const removedCount = oldItems.length - newItems.length

                newVal[field] = {
                  ...value[field],
                  items: newItems,
                  totalCount: Math.max(
                    0,
                    (value[field]?.totalCount || 0) - removedCount
                  )
                }
              }

              return newVal
            },
            { fieldNameWhitelist: ['admin'] }
          )
        }
      }
    }
  ).catch(convertThrowIntoFetchResult)

  if (result?.data?.streamsDelete) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Project deleted',
      description: 'The project has been successfully deleted'
    })
    emit('update:open', false)
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete project',
      description: errorMessage
    })
  }
}

const dialogButtons = [
  {
    text: 'Delete',
    props: { color: 'danger', fullWidth: true },
    onClick: deleteConfirmed
  },
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => emit('update:open', false)
  }
]
</script>
