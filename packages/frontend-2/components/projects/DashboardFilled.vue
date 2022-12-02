<template>
  <div class="flex flex-col space-y-4">
    <LayoutPanel v-for="project in items" :key="project.id">
      <div class="flex justify-between">
        <div>
          <FormButton type="link" :to="projectRoute(project.id)">
            {{ project.name }}
          </FormButton>
        </div>
        <div>
          {{ project.createdAt }}
        </div>
        <div>
          <FormButton @click="() => deleteProject(project.id)">Delete</FormButton>
        </div>
      </div>
    </LayoutPanel>
  </div>
</template>
<script setup lang="ts">
import { useApolloClient } from '@vue/apollo-composable'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectsDashboardFilledFragment } from '~~/lib/common/generated/gql/graphql'
import {
  convertThrowIntoFetchResult,
  getCacheId,
  getFirstErrorMessage
} from '~~/lib/common/helpers/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'

const props = defineProps<{
  projects: ProjectsDashboardFilledFragment
}>()

graphql(`
  fragment ProjectsDashboardFilled on ProjectCollection {
    items {
      id
      name
      createdAt
    }
  }
`)

const deleteProjectMutation = graphql(`
  mutation DeleteSingleProject($id: String!) {
    projectMutations {
      delete(id: $id)
    }
  }
`)

const apollo = useApolloClient().client
const { triggerNotification } = useGlobalToast()

const items = computed(() => props.projects.items)

const deleteProject = async (id: string) => {
  const { data, errors } = await apollo
    .mutate({
      mutation: deleteProjectMutation,
      variables: { id },
      update: (cache, { data }) => {
        if (!data?.projectMutations.delete) return

        cache.evict({
          id: getCacheId('Project', id)
        })
      }
    })
    .catch(convertThrowIntoFetchResult)

  if (data?.projectMutations?.delete) {
    triggerNotification({
      type: ToastNotificationType.Info,
      title: 'Project successfully deleted'
    })
  } else {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Project deletion failed',
      description: getFirstErrorMessage(errors)
    })
  }
}
</script>
