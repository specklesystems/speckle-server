<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :buttons="dialogButtons">
    <template #header>Delete project</template>
    <div class="flex flex-col gap-6 text-body-xs text-foreground">
      <p>
        Are you sure you want to
        <span class="font-medium">permanently delete</span>
        the selected project?
      </p>
      <div
        v-if="project"
        class="rounded border bg-foundation-2 border-outline-3 text-body-2xs py-3 px-4"
      >
        <p class="font-medium">{{ project.name }}</p>
        <p>
          {{ project.models.totalCount }} models,
          {{ project.versions.totalCount }} versions,
        </p>
      </div>
      <p>
        This action
        <span class="font-medium">cannot</span>
        be undone.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'
import type { ProjectItem } from '~~/lib/server-management/helpers/types'
import { adminDeleteProjectMutation } from '~~/lib/server-management/graphql/mutations'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import {
  ROOT_QUERY,
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import type { ProjectCollection } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  open: boolean
  project: ProjectItem | null
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: adminDeleteMutation } = useMutation(adminDeleteProjectMutation)

const isOpen = defineModel<boolean>('open', { required: true })

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
        if (data?.projectMutations.batchDelete) {
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

                newVal[field] = {
                  ...value[field],
                  ...(value[field]?.items ? { items: newItems } : {}),
                  totalCount: Math.max(0, (value[field]?.totalCount || 0) - 1)
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

  if (result?.data?.projectMutations.batchDelete) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Project deleted',
      description: 'The project has been successfully deleted'
    })
    isOpen.value = false
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to delete project',
      description: errorMessage
    })
  }
}

const dialogButtons: LayoutDialogButton[] = [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (isOpen.value = false)
  },
  {
    text: 'Delete',
    props: { color: 'danger' },
    onClick: deleteConfirmed
  }
]
</script>
