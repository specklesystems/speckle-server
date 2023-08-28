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
import { LayoutDialog } from '@speckle/ui-components'
import { ProjectItem } from '~~/lib/server-management/helpers/types'
import { useMutation } from '@vue/apollo-composable'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage,
  updateCacheByFilter
} from '~~/lib/common/helpers/graphql'
import { useGlobalToast, ToastNotificationType } from '~~/lib/common/composables/toast'
import { adminDeleteProject } from '~~/lib/server-management/graphql/mutations'
import { getProjects } from '~~/lib/server-management/graphql/queries'
import { Exact, InputMaybe } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  title: string
  open: boolean
  project: ProjectItem | null
  resultVariables:
    | Exact<{
        limit: number
        cursor?: InputMaybe<string> | undefined
        query?: InputMaybe<string> | undefined
      }>
    | undefined
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
          // Remove invite from cache
          cache.evict({
            id: getCacheId('AdminUserListItem', projectId)
          })
          // Update list in cache
          updateCacheByFilter(
            cache,
            { query: { query: getProjects, variables: props.resultVariables } },
            (data) => {
              const newItems = data.admin.projectList.items.filter(
                (item) => item.id !== projectId
              )
              return {
                ...data,
                admin: {
                  ...data.admin,
                  projectList: {
                    ...data.admin.projectList,
                    items: newItems,
                    totalCount: Math.max(0, data.admin.projectList.totalCount - 1)
                  }
                }
              }
            }
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
